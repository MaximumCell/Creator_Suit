/**
 * Minimal YouTube Data API v3 client.
 * Uses fetch directly so we don't pull in the full googleapis package.
 *
 * API docs: https://developers.google.com/youtube/v3/docs/channels/list
 * Quota:   1 unit per channels.list call. Free tier: 10,000 units/day.
 */

const CHANNELS_API = 'https://www.googleapis.com/youtube/v3/channels';
const PLAYLIST_ITEMS_API = 'https://www.googleapis.com/youtube/v3/playlistItems';
const VIDEOS_API = 'https://www.googleapis.com/youtube/v3/videos';

export interface YouTubeChannelInfo {
  /** YouTube's stable channel ID, e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw (always starts with UC) */
  channelId: string;
  title: string;
  description: string;
  /** URL to the channel's avatar (default size). */
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  /** ISO 8601 timestamp from the channel's `publishedAt` field. */
  publishedAt: string;
  /** Canonical channel URL. */
  url: string;
}

export class YouTubeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'missing_api_key'
      | 'not_found'
      | 'quota_exceeded'
      | 'invalid_url'
      | 'api_error'
      | 'network',
  ) {
    super(message);
    this.name = 'YouTubeError';
  }
}

/**
 * Accept any of:
 *   • Raw channel ID: "UC_x5XG1OV2P6uZZ5FSM9Ttw"
 *   • Channel URL:    "https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw"
 *   • Handle URL:     "https://www.youtube.com/@mkbhd" or "https://www.youtube.com/@mkbhd/featured"
 *   • User URL:       "https://www.youtube.com/user/PewDiePie"
 *   • Custom URL:     "https://www.youtube.com/c/SomeName"
 *
 * Returns an object describing which API parameter to use.
 */
export function parseChannelInput(
  raw: string,
):
  | { kind: 'id'; id: string }
  | { kind: 'handle'; forHandle: string }
  | { kind: 'username'; forUsername: string } {
  const input = raw.trim();
  if (!input) throw new YouTubeError('Channel URL or ID is required.', 'invalid_url');

  // Bare ID (UC + 22 alphanumerics)
  if (/^UC[A-Za-z0-9_-]{22}$/.test(input)) {
    return { kind: 'id', id: input };
  }

  let url: URL;
  try {
    url = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    throw new YouTubeError(`Couldn't parse "${raw}" as a YouTube URL or ID.`, 'invalid_url');
  }

  // Must be a youtube.com URL
  const host = url.hostname.replace(/^www\./, '');
  if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'youtu.be') {
    throw new YouTubeError(
      'Expected a youtube.com URL or a channel ID starting with "UC".',
      'invalid_url',
    );
  }

  // youtu.be/<id> isn't a channel form, but be lenient
  if (host === 'youtu.be') {
    const seg = url.pathname.replace(/^\//, '').split('/')[0];
    if (seg && /^UC[A-Za-z0-9_-]{22}$/.test(seg)) return { kind: 'id', id: seg };
    throw new YouTubeError(
      'Short youtu.be links need a channel URL, not a video link.',
      'invalid_url',
    );
  }

  // /channel/UCxxx
  const channelMatch = url.pathname.match(/\/channel\/(UC[A-Za-z0-9_-]{22})/);
  if (channelMatch) return { kind: 'id', id: channelMatch[1]! };

  // /@handle
  const handleMatch = url.pathname.match(/^\/@([A-Za-z0-9._-]+)/);
  if (handleMatch) return { kind: 'handle', forHandle: '@' + handleMatch[1] };

  // /user/username
  const userMatch = url.pathname.match(/^\/user\/([A-Za-z0-9._-]+)/);
  if (userMatch) return { kind: 'username', forUsername: userMatch[1]! };

  // /c/customname
  const customMatch = url.pathname.match(/^\/c\/([A-Za-z0-9._-]+)/);
  if (customMatch) return { kind: 'handle', forHandle: '@' + customMatch[1] };

  throw new YouTubeError(
    `Couldn't find a channel ID or handle in that URL. Try the full /channel/UC… form.`,
    'invalid_url',
  );
}

interface ChannelsListResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl?: string;
      publishedAt: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
    };
    statistics: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
  }>;
  pageInfo?: { totalResults: number };
}

function pickThumbnail(thumbs: {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
}): string {
  return thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url ?? '';
}

export async function fetchChannel(
  raw: string | { kind: 'id'; id: string } | { kind: 'handle'; forHandle: string } | { kind: 'username'; forUsername: string },
  apiKey = process.env.YOUTUBE_API_KEY,
): Promise<YouTubeChannelInfo> {
  if (!apiKey) {
    throw new YouTubeError(
      'YOUTUBE_API_KEY is not set. Add it to .env.local — see the README.',
      'missing_api_key',
    );
  }

  const parsed = typeof raw === 'string' ? parseChannelInput(raw) : raw;
  const params = new URLSearchParams({ part: 'snippet,statistics', key: apiKey });
  if (parsed.kind === 'id') params.set('id', parsed.id);
  else if (parsed.kind === 'handle') params.set('forHandle', parsed.forHandle);
  else params.set('forUsername', parsed.forUsername);
  params.set('maxResults', '1');

  let res: Response;
  try {
    res = await fetch(`${CHANNELS_API}?${params.toString()}`, { cache: 'no-store' });
  } catch (err) {
    throw new YouTubeError(
      `Couldn't reach YouTube: ${(err as Error).message}`,
      'network',
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403 && /quota/i.test(body)) {
      throw new YouTubeError(
        'YouTube API quota exceeded for today. Try again tomorrow or raise the quota in Google Cloud Console.',
        'quota_exceeded',
      );
    }
    if (res.status === 404 || res.status === 400) {
      throw new YouTubeError(
        'YouTube rejected the request. Check that the API is enabled and the key is valid.',
        'api_error',
      );
    }
    throw new YouTubeError(
      `YouTube API error (${res.status}): ${body.slice(0, 200)}`,
      'api_error',
    );
  }

  const data = (await res.json()) as ChannelsListResponse;
  const item = data.items?.[0];
  if (!item) {
    throw new YouTubeError(
      "No channel found for that URL/ID. Double-check it — channel handles and usernames are case-sensitive.",
      'not_found',
    );
  }

  return {
    channelId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    subscriberCount: Number(item.statistics.subscriberCount ?? 0),
    viewCount: Number(item.statistics.viewCount ?? 0),
    videoCount: Number(item.statistics.videoCount ?? 0),
    publishedAt: item.snippet.publishedAt,
    url: item.snippet.customUrl
      ? `https://www.youtube.com/${item.snippet.customUrl}`
      : `https://www.youtube.com/channel/${item.id}`,
  };
}

// ---------------------------------------------------------------------------
// Channel details + per-video stats
// ---------------------------------------------------------------------------

export interface YouTubeChannelDetails extends YouTubeChannelInfo {
  /** ID of the channel's "uploads" playlist — used to list its videos cheaply
   *  (1 quota unit vs 100 for search.list). */
  uploadsPlaylistId: string;
}

/**
 * Same as fetchChannel but also returns the channel's uploads playlist id,
 * which is what we need to enumerate its videos without paying the
 * search.list quota cost.
 */
export async function fetchChannelDetails(
  raw: string | { kind: 'id'; id: string } | { kind: 'handle'; forHandle: string } | { kind: 'username'; forUsername: string },
  apiKey = process.env.YOUTUBE_API_KEY,
): Promise<YouTubeChannelDetails> {
  if (!apiKey) {
    throw new YouTubeError(
      'YOUTUBE_API_KEY is not set. Add it to .env.local — see the README.',
      'missing_api_key',
    );
  }

  const parsed = typeof raw === 'string' ? parseChannelInput(raw) : raw;
  const params = new URLSearchParams({
    // +contentDetails so we get contentDetails.relatedPlaylists.uploads
    part: 'snippet,statistics,contentDetails',
    key: apiKey,
  });
  if (parsed.kind === 'id') params.set('id', parsed.id);
  else if (parsed.kind === 'handle') params.set('forHandle', parsed.forHandle);
  else params.set('forUsername', parsed.forUsername);
  params.set('maxResults', '1');

  let res: Response;
  try {
    res = await fetch(`${CHANNELS_API}?${params.toString()}`, { cache: 'no-store' });
  } catch (err) {
    throw new YouTubeError(
      `Couldn't reach YouTube: ${(err as Error).message}`,
      'network',
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 403 && /quota/i.test(body)) {
      throw new YouTubeError(
        'YouTube API quota exceeded for today. Try again tomorrow or raise the quota in Google Cloud Console.',
        'quota_exceeded',
      );
    }
    if (res.status === 404 || res.status === 400) {
      throw new YouTubeError(
        'YouTube rejected the request. Check that the API is enabled and the key is valid.',
        'api_error',
      );
    }
    throw new YouTubeError(
      `YouTube API error (${res.status}): ${body.slice(0, 200)}`,
      'api_error',
    );
  }

  const data = (await res.json()) as ChannelsListResponse & {
    items?: Array<{
      contentDetails?: {
        relatedPlaylists?: { uploads?: string };
      };
    }>;
  };
  const item = data.items?.[0];
  if (!item) {
    throw new YouTubeError(
      "No channel found for that URL/ID. Double-check it — channel handles and usernames are case-sensitive.",
      'not_found',
    );
  }

  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new YouTubeError(
      "YouTube didn't return an uploads playlist for this channel. The channel may be too new or restricted.",
      'api_error',
    );
  }

  return {
    channelId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    subscriberCount: Number(item.statistics.subscriberCount ?? 0),
    viewCount: Number(item.statistics.viewCount ?? 0),
    videoCount: Number(item.statistics.videoCount ?? 0),
    publishedAt: item.snippet.publishedAt,
    url: item.snippet.customUrl
      ? `https://www.youtube.com/${item.snippet.customUrl}`
      : `https://www.youtube.com/channel/${item.id}`,
    uploadsPlaylistId,
  };
}

export interface YouTubeVideoInfo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string | null;
  viewCount: number;
  likeCount: number | null;
  commentCount: number | null;
  url: string;
}

interface PlaylistItemListResponse {
  items?: Array<{
    contentDetails: {
      videoId: string;
      videoPublishedAt?: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
    };
  }>;
  nextPageToken?: string;
}

interface VideoListResponse {
  items?: Array<{
    id: string;
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails: {
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
        maxres?: { url: string };
      };
    };
    contentDetails: { duration?: string };
    statistics: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
}

/**
 * Fetches up to `maxResults` recent videos from a channel via its uploads
 * playlist. Uses 2 quota units (playlistItems.list + videos.list) per call.
 */
export async function fetchChannelVideos(
  uploadsPlaylistId: string,
  maxResults = 10,
  apiKey = process.env.YOUTUBE_API_KEY,
): Promise<YouTubeVideoInfo[]> {
  if (!apiKey) {
    throw new YouTubeError(
      'YOUTUBE_API_KEY is not set. Add it to .env.local — see the README.',
      'missing_api_key',
    );
  }

  // 1) Get the recent video IDs from the uploads playlist.
  const listParams = new URLSearchParams({
    part: 'contentDetails,snippet',
    playlistId: uploadsPlaylistId,
    maxResults: String(Math.min(maxResults, 50)),
    key: apiKey,
  });

  let listRes: Response;
  try {
    listRes = await fetch(`${PLAYLIST_ITEMS_API}?${listParams.toString()}`, {
      cache: 'no-store',
    });
  } catch (err) {
    throw new YouTubeError(
      `Couldn't reach YouTube: ${(err as Error).message}`,
      'network',
    );
  }

  if (!listRes.ok) {
    const body = await listRes.text().catch(() => '');
    if (listRes.status === 403 && /quota/i.test(body)) {
      throw new YouTubeError(
        'YouTube API quota exceeded for today.',
        'quota_exceeded',
      );
    }
    throw new YouTubeError(
      `YouTube API error (${listRes.status}): ${body.slice(0, 200)}`,
      'api_error',
    );
  }

  const listData = (await listRes.json()) as PlaylistItemListResponse;
  const items = listData.items ?? [];
  if (items.length === 0) return [];

  const videoIds = items.map((i) => i.contentDetails.videoId);
  const titleById = new Map(
    items.map((i) => [i.contentDetails.videoId, i.snippet.title] as const),
  );

  // 2) Batch-fetch the per-video stats.
  const statsParams = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    key: apiKey,
  });

  let statsRes: Response;
  try {
    statsRes = await fetch(`${VIDEOS_API}?${statsParams.toString()}`, {
      cache: 'no-store',
    });
  } catch (err) {
    throw new YouTubeError(
      `Couldn't reach YouTube: ${(err as Error).message}`,
      'network',
    );
  }

  if (!statsRes.ok) {
    const body = await statsRes.text().catch(() => '');
    if (statsRes.status === 403 && /quota/i.test(body)) {
      throw new YouTubeError(
        'YouTube API quota exceeded for today.',
        'quota_exceeded',
      );
    }
    throw new YouTubeError(
      `YouTube API error (${statsRes.status}): ${body.slice(0, 200)}`,
      'api_error',
    );
  }

  const statsData = (await statsRes.json()) as VideoListResponse;

  return (statsData.items ?? []).map((v) => ({
    videoId: v.id,
    title: titleById.get(v.id) ?? v.snippet.title,
    thumbnailUrl:
      v.snippet.thumbnails.medium?.url ??
      v.snippet.thumbnails.high?.url ??
      v.snippet.thumbnails.default?.url ??
      '',
    publishedAt: v.snippet.publishedAt,
    duration: v.contentDetails.duration ?? null,
    viewCount: Number(v.statistics.viewCount ?? 0),
    likeCount: v.statistics.likeCount != null ? Number(v.statistics.likeCount) : null,
    commentCount:
      v.statistics.commentCount != null ? Number(v.statistics.commentCount) : null,
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }));
}
