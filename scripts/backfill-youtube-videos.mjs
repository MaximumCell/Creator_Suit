/**
 * One-off backfill: for every tracked channel that doesn't have its
 * uploads_playlist_id populated yet (or has no videos), fetch the playlist
 * id from the YouTube Data API, store it, and pull the most recent 10
 * videos.
 *
 * Idempotent. Safe to re-run.
 *
 * Run:   npm run seed:youtube-videos
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.YOUTUBE_API_KEY;

if (!url || !serviceKey || !apiKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / YOUTUBE_API_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CHANNELS_API = 'https://www.googleapis.com/youtube/v3/channels';
const PLAYLIST_ITEMS_API = 'https://www.googleapis.com/youtube/v3/playlistItems';
const VIDEOS_API = 'https://www.googleapis.com/youtube/v3/videos';

async function fetchUploadsPlaylistId(channelId) {
  const params = new URLSearchParams({
    part: 'contentDetails',
    id: channelId,
    key: apiKey,
  });
  const res = await fetch(`${CHANNELS_API}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`channels.list ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

async function fetchChannelVideos(playlistId, max = 10) {
  const listParams = new URLSearchParams({
    part: 'contentDetails',
    playlistId,
    maxResults: String(max),
    key: apiKey,
  });
  const listRes = await fetch(`${PLAYLIST_ITEMS_API}?${listParams.toString()}`);
  if (!listRes.ok) {
    const body = await listRes.text().catch(() => '');
    throw new Error(`playlistItems.list ${listRes.status}: ${body.slice(0, 200)}`);
  }
  const list = await listRes.json();
  const videoIds = (list.items ?? []).map((i) => i.contentDetails.videoId);
  if (videoIds.length === 0) return [];

  const statsParams = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    key: apiKey,
  });
  const statsRes = await fetch(`${VIDEOS_API}?${statsParams.toString()}`);
  if (!statsRes.ok) {
    const body = await statsRes.text().catch(() => '');
    throw new Error(`videos.list ${statsRes.status}: ${body.slice(0, 200)}`);
  }
  const stats = await statsRes.json();
  return (stats.items ?? []).map((v) => ({
    video_id: v.id,
    title: v.snippet.title,
    thumbnail_url:
      v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.high?.url ?? null,
    published_at: v.snippet.publishedAt,
    duration: v.contentDetails.duration ?? null,
    view_count: Number(v.statistics.viewCount ?? 0),
    like_count: v.statistics.likeCount != null ? Number(v.statistics.likeCount) : null,
    comment_count:
      v.statistics.commentCount != null ? Number(v.statistics.commentCount) : null,
  }));
}

async function main() {
  console.log('\n┌─ YouTube videos backfill ───────────────────────────');
  const { data: channels, error } = await supabase
    .from('youtube_channels')
    .select('id, channel_id, channel_name, uploads_playlist_id')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Failed to read youtube_channels:', error.message);
    process.exit(1);
  }
  if (!channels || channels.length === 0) {
    console.log('│  No channels found. Run `npm run seed:youtube` first.');
    console.log('└─────────────────────────────────────────────────────────\n');
    return;
  }

  console.log(`│  Found ${channels.length} channel(s).`);
  let totalVideos = 0;
  for (const ch of channels) {
    process.stdout.write(`│  ${ch.channel_name.padEnd(28)}…`);
    let playlistId = ch.uploads_playlist_id;
    if (!playlistId) {
      try {
        playlistId = await fetchUploadsPlaylistId(ch.channel_id);
      } catch (err) {
        console.log(` ✗ playlist fetch: ${err.message}`);
        continue;
      }
      if (!playlistId) {
        console.log(' ✗ no uploads playlist returned');
        continue;
      }
      await supabase
        .from('youtube_channels')
        .update({ uploads_playlist_id: playlistId })
        .eq('id', ch.id);
    }

    let videos;
    try {
      videos = await fetchChannelVideos(playlistId, 10);
    } catch (err) {
      console.log(` ✗ ${err.message}`);
      continue;
    }
    if (videos.length === 0) {
      console.log(' ✓ (no videos)');
      continue;
    }

    const rows = videos.map((v) => ({ channel_id: ch.id, ...v }));
    const { error: upErr } = await supabase
      .from('youtube_videos')
      .upsert(rows, { onConflict: 'channel_id,video_id' });
    if (upErr) {
      console.log(` ✗ upsert: ${upErr.message}`);
      continue;
    }
    totalVideos += videos.length;
    console.log(` ✓ ${videos.length} videos`);
  }

  console.log(`│  Inserted/updated ${totalVideos} video(s) total.`);
  console.log('└─────────────────────────────────────────────────────────\n');
  console.log('Refresh /youtube to see the Top Videos list per channel.\n');
}

main().catch((err) => {
  console.error('\n✗ Backfill failed:', err);
  process.exit(1);
});
