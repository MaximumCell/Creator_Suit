/**
 * YouTube OAuth 2.0 + Analytics helpers.
 *
 * Flow:
 *  1. buildAuthUrl()        → user clicks "Connect YouTube" → redirect to Google
 *  2. Google consent screen → user allows scopes
 *  3. /api/youtube/oauth/callback → exchange code for tokens → store in DB
 *  4. fetchAnalytics()      → uses stored tokens, auto-refreshes if expired
 *
 * Required env:
 *   YOUTUBE_OAUTH_CLIENT_ID
 *   YOUTUBE_OAUTH_CLIENT_SECRET
 *   NEXT_PUBLIC_APP_URL   (used to build the redirect URI)
 */

const AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** Scopes we need. yt-analytics-monetary is gated by Google's review; we
 *  request it for revenue data but the app degrades gracefully if the user
 *  only grants the non-monetary one. */
export const SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
] as const;

export function getRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/+$/, '')}/api/youtube/oauth/callback`;
}

export function getClientId(): string {
  const id = process.env.YOUTUBE_OAUTH_CLIENT_ID;
  if (!id) throw new Error('YOUTUBE_OAUTH_CLIENT_ID is not set in .env.local');
  return id;
}

export function getClientSecret(): string {
  const secret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET;
  if (!secret)
    throw new Error('YOUTUBE_OAUTH_CLIENT_SECRET is not set in .env.local');
  return secret;
}

/** Generates the Google consent-screen URL with the right scopes + state. */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: SCOPES.join(' '),
    access_type: 'offline',           // → we get a refresh_token
    prompt: 'consent',                // force a new refresh_token every time
    include_granted_scopes: 'true',
    state,
  });
  return `${AUTH_BASE}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  scope?: string;
  token_type: string;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`token exchange failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`token refresh failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as TokenResponse;
}

/** A small CSRF nonce — passed to Google and verified on callback. */
export function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
