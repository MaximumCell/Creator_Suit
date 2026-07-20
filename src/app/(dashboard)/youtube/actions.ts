'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  fetchChannel,
  YouTubeError,
  type YouTubeChannelInfo,
} from '@/lib/youtube';

export interface YouTubeActionState {
  error?: string;
  ok?: boolean;
  /** New channel id, returned on successful add so the UI can scroll to it. */
  addedChannelId?: string;
}

type AdminGuard =
  | { ok: true; userId: string }
  | { ok: false; error: string };

async function requireAdmin(): Promise<AdminGuard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: 'admin' | 'member' }>();

  if (!profile || profile.role !== 'admin') {
    return { ok: false, error: 'Only admins can manage YouTube channels.' };
  }
  return { ok: true, userId: user.id };
}

function friendlyError(err: unknown): string {
  if (err instanceof YouTubeError) {
    switch (err.code) {
      case 'missing_api_key':
        return 'YOUTUBE_API_KEY is not set in .env.local. See the README.';
      case 'not_found':
        return err.message;
      case 'quota_exceeded':
        return 'YouTube API quota exceeded. Try again tomorrow.';
      case 'invalid_url':
        return err.message;
      case 'api_error':
        return err.message;
      case 'network':
        return "Couldn't reach YouTube. Check the network and try again.";
    }
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Try again.';
}

export async function addChannel(
  _prev: YouTubeActionState,
  formData: FormData,
): Promise<YouTubeActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const input = String(formData.get('channel') ?? '').trim();
  if (!input) return { error: 'Paste a YouTube channel URL or ID.' };

  let info: YouTubeChannelInfo;
  try {
    info = await fetchChannel(input);
  } catch (err) {
    return { error: friendlyError(err) };
  }

  // Use the admin client so we bypass RLS for the insert — RLS already
  // requires admin role for write, but a service-role write keeps this
  // simple and avoids any session/cookie edge cases.
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('youtube_channels')
    .select('id')
    .eq('channel_id', info.channelId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    return { error: `"${info.title}" is already in your list.` };
  }

  const { data: channel, error: insertErr } = await admin
    .from('youtube_channels')
    .insert({
      channel_id: info.channelId,
      channel_name: info.title,
      channel_url: info.url,
      added_by: guard.userId,
      thumbnail_url: info.thumbnailUrl || null,
    })
    .select('id')
    .single<{ id: string }>();

  if (insertErr || !channel) {
    return { error: insertErr?.message ?? 'Failed to save channel.' };
  }

  // First snapshot so the channel shows up with stats immediately.
  const { error: snapErr } = await admin.from('youtube_stats_snapshots').insert({
    channel_id: channel.id,
    subscriber_count: info.subscriberCount,
    view_count: info.viewCount,
    video_count: info.videoCount,
  });

  if (snapErr) {
    return { error: `Channel saved but first snapshot failed: ${snapErr.message}` };
  }

  revalidatePath('/youtube');
  return { ok: true, addedChannelId: channel.id };
}

export async function removeChannel(
  _prev: YouTubeActionState,
  formData: FormData,
): Promise<YouTubeActionState> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const channelId = String(formData.get('channel_id') ?? '');
  if (!channelId) return { error: 'Missing channel id.' };

  const admin = createAdminClient();
  // FK on youtube_stats_snapshots.channel_id has on delete cascade, so the
  // snapshots go with the channel. (See 0001_init.sql.)
  const { error } = await admin
    .from('youtube_channels')
    .delete()
    .eq('id', channelId);

  if (error) return { error: error.message };

  revalidatePath('/youtube');
  return { ok: true };
}

/**
 * Refreshes the latest stats for every tracked channel. Appends a new
 * snapshot row per channel. Returns a count of how many were refreshed.
 */
export async function refreshAllChannels(): Promise<
  YouTubeActionState & { refreshed?: number; failed?: number }
> {
  const guard = await requireAdmin();
  if (!guard.ok) return { error: guard.error };

  const admin = createAdminClient();
  const { data: channels, error } = await admin
    .from('youtube_channels')
    .select('id, channel_id')
    .returns<{ id: string; channel_id: string }[]>();

  if (error) return { error: error.message };
  if (!channels || channels.length === 0) {
    return { ok: true, refreshed: 0, failed: 0 };
  }

  let refreshed = 0;
  let failed = 0;
  // Refresh sequentially to stay under quota and avoid hammering the API.
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
        failed += 1;
      } else {
        refreshed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  revalidatePath('/youtube');
  return { ok: true, refreshed, failed };
}
