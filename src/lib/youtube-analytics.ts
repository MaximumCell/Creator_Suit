/**
 * YouTube Analytics API client.
 *
 * Uses the per-user OAuth access token stored in `youtube_oauth_tokens`.
 * Automatically refreshes the access token when expired (and persists the
 * new one), so callers don't need to worry about it.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { refreshAccessToken, type TokenResponse } from '@/lib/youtube-oauth';
import type { YoutubeOauthToken } from '@/types/database';

const ANALYTICS_BASE = 'https://youtubeanalytics.googleapis.com/v2/reports';
const DATA_API = 'https://www.googleapis.com/youtube/v3/videos';

/** Date in YYYY-MM-DD (matches the API's startDate / endDate format). */
export type DateString = string;

export interface AnalyticsRow {
  /** YYYY-MM-DD */
  date: DateString;
  views?: number;
  estimatedMinutesWatched?: number;
  averageViewDuration?: number;
  subscribersGained?: number;
  subscribersLost?: number;
  estimatedRevenue?: number;
  estimatedAdRevenue?: number;
  estimatedRedPartnerRevenue?: number;
  cpm?: number;
  adImpressions?: number;
}

export interface ChannelOverview {
  totals: {
    views: number;
    watchTimeMinutes: number;
    subscribersGained: number;
    subscribersLost: number;
    estimatedRevenue: number;
  };
  daily: AnalyticsRow[];
  /** Same totals but for the previous window of the same length, for % delta. */
  previous: ChannelOverview['totals'];
}

export interface TopVideoRow {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  estimatedRevenue: number;
  url: string;
}

/** Look up the current user's stored OAuth tokens (admin client, bypasses RLS). */
async function loadTokenRow(userId: string): Promise<YoutubeOauthToken | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('youtube_oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.error('loadTokenRow:', error.message);
    return null;
  }
  return data as YoutubeOauthToken | null;
}

/** Persist a refreshed access token (and expiry). Refresh token is unchanged. */
async function saveRefreshedTokens(
  userId: string,
  accessToken: string,
  expiresAt: number,
  scope: string | null,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('youtube_oauth_tokens')
    .update({ access_token: accessToken, expires_at: expiresAt, scope })
    .eq('user_id', userId);
  if (error) console.error('saveRefreshedTokens:', error.message);
}

/**
 * Returns a valid access token, refreshing it if expired.
 * Throws if the user hasn't connected their YouTube account.
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const row = await loadTokenRow(userId);
  if (!row) {
    throw new NoOAuthConnectionError(
      'YouTube account not connected. Click "Connect YouTube" first.',
    );
  }
  // 60s buffer so we don't use a token that expires mid-request.
  if (row.expires_at > Date.now() + 60_000) {
    return row.access_token;
  }
  // Refresh.
  let tokens: TokenResponse;
  try {
    tokens = await refreshAccessToken(row.refresh_token);
  } catch (err) {
    throw new Error(
      `Token refresh failed: ${(err as Error).message}. Try reconnecting.`,
    );
  }
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  await saveRefreshedTokens(userId, tokens.access_token, expiresAt, tokens.scope ?? null);
  return tokens.access_token;
}

export class NoOAuthConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoOAuthConnectionError';
  }
}

interface AnalyticsApiResponse {
  columnHeaders: Array<{ name: string; columnType: string; dataType: string }>;
  rows?: Array<Array<string | number>>;
}

async function runAnalyticsQuery(
  accessToken: string,
  params: URLSearchParams,
): Promise<AnalyticsApiResponse> {
  const res = await fetch(`${ANALYTICS_BASE}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `YouTube Analytics API ${res.status}: ${body.slice(0, 300)}`,
    );
  }
  return (await res.json()) as AnalyticsApiResponse;
}

/** Build YYYY-MM-DD for `days` ago (UTC). days=0 → today. */
function offsetDate(days: number): DateString {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetches the daily metrics for a channel over [startDate, endDate] inclusive,
 * plus totals for the same-length window immediately before (for % deltas).
 */
export async function fetchChannelOverview(
  userId: string,
  channelId: string,
  startDate: DateString,
  endDate: DateString,
): Promise<ChannelOverview> {
  const accessToken = await getValidAccessToken(userId);

  const metrics = [
    'views',
    'estimatedMinutesWatched',
    'subscribersGained',
    'subscribersLost',
    'estimatedRevenue',
  ];

  // Build the previous-period dates: same length, ending day before startDate.
  const startMs = Date.parse(startDate + 'T00:00:00Z');
  const endMs = Date.parse(endDate + 'T00:00:00Z');
  const days = Math.round((endMs - startMs) / 86_400_000) + 1;
  const prevEnd = new Date(startMs - 86_400_000).toISOString().slice(0, 10);
  const prevStart = new Date(startMs - days * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const dailyParams = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: metrics.join(','),
    dimensions: 'day',
    sort: 'day',
  });
  const prevParams = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate: prevStart,
    endDate: prevEnd,
    metrics: metrics.join(','),
  });

  const [daily, prev] = await Promise.all([
    runAnalyticsQuery(accessToken, dailyParams),
    runAnalyticsQuery(accessToken, prevParams),
  ]);

  const idx = (name: string) =>
    daily.columnHeaders.findIndex((h) => h.name === name);

  const viewIdx = idx('views');
  const watchIdx = idx('estimatedMinutesWatched');
  const gainedIdx = idx('subscribersGained');
  const lostIdx = idx('subscribersLost');
  const revIdx = idx('estimatedRevenue');

  const dailyRows: AnalyticsRow[] = (daily.rows ?? []).map((row) => ({
    date: String(row[0] ?? ''),
    views: viewIdx >= 0 ? Number(row[viewIdx] ?? 0) : undefined,
    estimatedMinutesWatched:
      watchIdx >= 0 ? Number(row[watchIdx] ?? 0) : undefined,
    subscribersGained: gainedIdx >= 0 ? Number(row[gainedIdx] ?? 0) : undefined,
    subscribersLost: lostIdx >= 0 ? Number(row[lostIdx] ?? 0) : undefined,
    estimatedRevenue: revIdx >= 0 ? Number(row[revIdx] ?? 0) : undefined,
  }));

  const sumRows = (rows: AnalyticsApiResponse): ChannelOverview['totals'] => {
    let views = 0,
      watch = 0,
      gained = 0,
      lost = 0,
      revenue = 0;
    const find = (name: string) =>
      rows.columnHeaders.findIndex((h) => h.name === name);
    for (const r of rows.rows ?? []) {
      views += Number(r[find('views')] ?? 0);
      watch += Number(r[find('estimatedMinutesWatched')] ?? 0);
      gained += Number(r[find('subscribersGained')] ?? 0);
      lost += Number(r[find('subscribersLost')] ?? 0);
      revenue += Number(r[find('estimatedRevenue')] ?? 0);
    }
    return {
      views,
      watchTimeMinutes: watch,
      subscribersGained: gained,
      subscribersLost: lost,
      estimatedRevenue: revenue,
    };
  };

  return {
    totals: sumRows(daily),
    daily: dailyRows,
    previous: sumRows(prev),
  };
}

/** Top videos for a channel in a date range (Analytics API). */
export async function fetchTopVideos(
  userId: string,
  channelId: string,
  startDate: DateString,
  endDate: DateString,
  maxResults = 10,
): Promise<TopVideoRow[]> {
  const accessToken = await getValidAccessToken(userId);

  const params = new URLSearchParams({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: 'views,estimatedMinutesWatched,averageViewDuration,estimatedRevenue',
    dimensions: 'video',
    sort: '-views',
    maxResults: String(maxResults),
  });
  const res = await runAnalyticsQuery(accessToken, params);

  const idx = (name: string) => res.columnHeaders.findIndex((h) => h.name === name);
  const videoIdx = idx('video');
  const viewsIdx = idx('views');
  const watchIdx = idx('estimatedMinutesWatched');
  const avgDurIdx = idx('averageViewDuration');
  const revIdx = idx('estimatedRevenue');

  const videoIds = (res.rows ?? [])
    .map((r) => String(r[videoIdx] ?? ''))
    .filter(Boolean);
  if (videoIds.length === 0) return [];

  // Batch-fetch titles + thumbnails via the Data API. We try the OAuth access
  // token first (in case the channel is private / unlisted and the API key
  // can't see it), then fall back to the server-side API key if that fails
  // — public videos are visible either way.
  const titleById = new Map<string, { title: string; thumbnail: string; publishedAt: string }>();
  const vParams = new URLSearchParams({
    part: 'snippet',
    id: videoIds.join(','),
  });

  async function tryDataApi(authHeader: Record<string, string> | null): Promise<boolean> {
    const url = authHeader
      ? `${DATA_API}?${vParams.toString()}`
      : `${DATA_API}?${vParams.toString()}${process.env.YOUTUBE_API_KEY ? `&key=${process.env.YOUTUBE_API_KEY}` : ''}`;
    const res = await fetch(url, { headers: authHeader ?? {} });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(
        `videos.list failed (auth=${authHeader ? 'oauth' : 'apikey'}): ${res.status} ${body.slice(0, 200)}`,
      );
      return false;
    }
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: {
            medium?: { url: string };
            high?: { url: string };
            default?: { url: string };
          };
        };
      }>;
    };
    for (const item of data.items ?? []) {
      titleById.set(item.id, {
        title: item.snippet.title,
        thumbnail:
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.default?.url ??
          '',
        publishedAt: item.snippet.publishedAt,
      });
    }
    return (data.items?.length ?? 0) > 0;
  }

  // (1) Try the user's access token first.
  console.log(`[fetchTopVideos] fetching metadata for ${videoIds.length} videos via OAuth`);
  const okWithToken = await tryDataApi({ Authorization: `Bearer ${accessToken}` });
  // (2) If that returned zero items (or failed), try the API key as fallback.
  if (!okWithToken) {
    console.log('[fetchTopVideos] OAuth attempt returned 0 items, trying API key fallback');
    const okWithKey = await tryDataApi(null);
    if (okWithKey) {
      console.log('[fetchTopVideos] API key fallback succeeded');
    } else {
      console.log('[fetchTopVideos] API key fallback FAILED — videos will show "(video)"');
    }
  } else {
    console.log('[fetchTopVideos] OAuth attempt succeeded');
  }

  return (res.rows ?? []).map((r) => {
    const id = String(r[videoIdx] ?? '');
    const meta = titleById.get(id);
    return {
      videoId: id,
      title: meta?.title ?? '(video)',
      thumbnailUrl: meta?.thumbnail ?? '',
      publishedAt: meta?.publishedAt ?? '',
      views: Number(r[viewsIdx] ?? 0),
      estimatedMinutesWatched: Number(r[watchIdx] ?? 0),
      averageViewDuration: Number(r[avgDurIdx] ?? 0),
      estimatedRevenue: Number(r[revIdx] ?? 0),
      url: `https://www.youtube.com/watch?v=${id}`,
    };
  });
}

export { offsetDate };
