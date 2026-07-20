/**
 * GET /api/youtube/oauth/callback
 *
 * Google redirects here after the user grants (or denies) consent. We:
 *  1. Verify the CSRF `state` matches the cookie.
 *  2. Exchange the `code` for access + refresh tokens.
 *  3. Use the access token once to call /youtube/v3/channels?part=id&mine=true
 *     so we know which YouTube channel the user connected.
 *  4. Upsert the tokens into youtube_oauth_tokens keyed by user_id.
 *  5. Redirect back to /youtube with a success flag.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { exchangeCodeForTokens } from '@/lib/youtube-oauth';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const stateCookie = request.cookies.get(STATE_COOKIE)?.value;

  const redirectBack = (qs: Record<string, string>) => {
    const dest = new URL('/youtube', request.url);
    for (const [k, v] of Object.entries(qs)) dest.searchParams.set(k, v);
    const res = NextResponse.redirect(dest);
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete('yt_oauth_handle');
    return res;
  };

  if (errorParam) {
    return redirectBack({ yt_oauth: 'denied', reason: errorParam });
  }
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirectBack({ yt_oauth: 'error', reason: 'state_mismatch' });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirectBack({ yt_oauth: 'error', reason: 'no_session' });

  let tokens;
  try {
    tokens = await exchangeCodeForTokens(code);
  } catch (err) {
    return redirectBack({
      yt_oauth: 'error',
      reason: (err as Error).message.slice(0, 120),
    });
  }

  if (!tokens.refresh_token) {
    // Google only sends refresh_token on first consent (or when prompt=consent
    // forces a new one). If we still didn't get one, something is off.
    return redirectBack({ yt_oauth: 'error', reason: 'no_refresh_token' });
  }

  // Figure out which YouTube channel the user wants to connect.
  //
  // The user can have:
  //   - A personal channel owned by their Google account (returned by mine=true)
  //   - A Brand Account they manage (NOT returned by mine=true unless it's
  //     the same Google account — Brand Accounts are separate identities)
  //
  // To get the Brand Account reliably, we look it up by its public @handle
  // using the server-side API key. This is a public lookup, no scope needed.
  // The handle is passed via a cookie set by the start route, or defaults
  // to the YOUTUBE_DEFAULT_HANDLE env var, or falls back to "aaghaz_ai".
  let channelId = '';
  let channelTitle: string | null = null;

  // (1) Try the explicit handle from the cookie (set by /start if the user
  //     was prompted to pick a channel).
  const handleCookie = request.cookies.get('yt_oauth_handle')?.value;
  const defaultHandle =
    handleCookie || process.env.YOUTUBE_DEFAULT_HANDLE || 'aaghaz_ai';

  if (process.env.YOUTUBE_API_KEY) {
    const params = new URLSearchParams({
      part: 'id,snippet',
      forHandle: '@' + defaultHandle.replace(/^@/, ''),
      key: process.env.YOUTUBE_API_KEY,
      maxResults: '1',
    });
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
      );
      if (res.ok) {
        const data = (await res.json()) as {
          items?: Array<{ id: string; snippet: { title: string } }>;
        };
        const item = data.items?.[0];
        if (item) {
          channelId = item.id;
          channelTitle = item.snippet.title;
        }
      } else {
        console.error('forHandle lookup failed:', res.status, await res.text().catch(() => ''));
      }
    } catch (err) {
      console.error('forHandle lookup threw:', err);
    }
  }

  // (2) Fallback: ask the user's account directly (works when their channel
  //     IS the one they want to connect).
  if (!channelId) {
    try {
      const chRes = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true&maxResults=1',
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );
      if (chRes.ok) {
        const data = (await chRes.json()) as {
          items?: Array<{ id: string; snippet: { title: string } }>;
        };
        const item = data.items?.[0];
        if (item) {
          channelId = item.id;
          channelTitle = item.snippet.title;
        }
      }
    } catch (err) {
      console.error('Failed to fetch connected channel:', err);
    }
  }

  if (!channelId) {
    return redirectBack({ yt_oauth: 'error', reason: 'no_channel' });
  }

  // Upsert the tokens (admin client — RLS would block us writing for self).
  const admin = createAdminClient();
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  const { error: upErr } = await admin
    .from('youtube_oauth_tokens')
    .upsert(
      {
        user_id: user.id,
        channel_id: channelId,
        channel_title: channelTitle,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope ?? null,
      },
      { onConflict: 'user_id' },
    );

  if (upErr) {
    return redirectBack({ yt_oauth: 'error', reason: upErr.message.slice(0, 120) });
  }

  return redirectBack({ yt_oauth: 'connected' });
}
