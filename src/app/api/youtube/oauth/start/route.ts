/**
 * GET /api/youtube/oauth/start
 *
 * Generates a CSRF state, stores it in a short-lived cookie, and redirects
 * the user to Google's consent screen.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthUrl, generateState } from '@/lib/youtube-oauth';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'yt_oauth_state';
const STATE_MAX_AGE = 60 * 10; // 10 minutes is plenty for the round-trip

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const state = generateState();
  const url = buildAuthUrl(state);

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: STATE_MAX_AGE,
    path: '/api/youtube/oauth',
  });
  return response;
}
