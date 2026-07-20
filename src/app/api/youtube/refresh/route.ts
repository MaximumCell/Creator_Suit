/**
 * GET /api/youtube/refresh
 *
 * Refreshes the latest YouTube stats for every tracked channel.
 * Hit this from a cron job (Vercel Cron, GitHub Action, Supabase Edge
 * Function cron, etc.) once a day.
 *
 * Authenticate by setting CRON_SECRET in .env.local and passing it as
 *   Authorization: Bearer <CRON_SECRET>
 * (Vercel Cron does this automatically when you set the secret in the
 * cron config.)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchChannel, YouTubeError } from '@/lib/youtube';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel hobby max for cron; bump on pro.

export async function GET(request: NextRequest) {
  // Auth: bearer token matching CRON_SECRET.
  const auth = request.headers.get('authorization') ?? '';
  const expected = process.env.CRON_SECRET;
  if (expected) {
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Don't allow unauthenticated calls in production.
    return NextResponse.json(
      { error: 'CRON_SECRET is not set' },
      { status: 500 },
    );
  }
  // In dev with no secret, allow it for local testing.

  const admin = createAdminClient();
  const { data: channels, error } = await admin
    .from('youtube_channels')
    .select('id, channel_id')
    .returns<{ id: string; channel_id: string }[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!channels || channels.length === 0) {
    return NextResponse.json({ refreshed: 0, failed: 0, results: [] });
  }

  const results: Array<
    | { channelId: string; ok: true }
    | { channelId: string; ok: false; error: string }
  > = [];

  for (const ch of channels) {
    try {
      const info = await fetchChannel({ kind: 'id', id: ch.channel_id });
      const { error: snapErr } = await admin.from('youtube_stats_snapshots').insert({
        channel_id: ch.id,
        subscriber_count: info.subscriberCount,
        view_count: info.viewCount,
        video_count: info.videoCount,
      });
      if (snapErr) {
        results.push({
          channelId: ch.channel_id,
          ok: false,
          error: snapErr.message,
        });
      } else {
        results.push({ channelId: ch.channel_id, ok: true });
      }
    } catch (err) {
      const msg =
        err instanceof YouTubeError ? err.message : (err as Error).message;
      results.push({ channelId: ch.channel_id, ok: false, error: msg });
    }
  }

  const refreshed = results.filter((r) => r.ok).length;
  const failed = results.length - refreshed;

  return NextResponse.json({ refreshed, failed, results });
}
