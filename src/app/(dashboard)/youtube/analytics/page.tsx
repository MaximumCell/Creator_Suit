import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  fetchChannelOverview,
  fetchTopVideos,
  NoOAuthConnectionError,
  type DateString,
  type TopVideoRow,
} from '@/lib/youtube-analytics';
import { AnalyticsDashboard } from './analytics-dashboard';
import type { YoutubeOauthToken } from '@/types/database';

export const metadata = { title: 'YouTube Analytics · CreatorSuit' };

interface SearchParams {
  range?: string;     // "7" | "28" | "90" | "custom"
  from?: string;      // YYYY-MM-DD
  to?: string;        // YYYY-MM-DD
  tz?: string;        // IANA timezone, e.g. "Asia/Karachi"
}

/** `days` ago in the given IANA timezone (defaults to UTC), as YYYY-MM-DD. */
function offsetInTz(days: number, tz?: string): DateString {
  const now = new Date();
  // Use Intl to get the local YYYY-MM-DD in the target timezone.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const today = fmt.format(now); // YYYY-MM-DD
  // Parse today as noon in that tz, subtract days, re-format.
  // Using noon avoids any DST boundary edge cases.
  const [y, m, d] = today.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  t.setUTCDate(t.getUTCDate() - days);
  return fmt.format(t);
}

function parseRange(range: string | undefined, from: string | undefined, to: string | undefined, tz?: string) {
  if (range === 'custom' && from && to) {
    return { start: from, end: to };
  }
  if (range === '7') return { start: offsetInTz(6, tz), end: offsetInTz(0, tz) };
  if (range === '90') return { start: offsetInTz(89, tz), end: offsetInTz(0, tz) };
  // default = 28 days (matches YouTube Studio's "Last 28 days")
  return { start: offsetInTz(27, tz), end: offsetInTz(0, tz) };
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sp = await searchParams;
  const range = sp.range ?? '28';
  const { start, end } = parseRange(range, sp.from, sp.to, sp.tz);

  // Look up the user's stored OAuth token.
  const { data: token } = await supabase
    .from('youtube_oauth_tokens')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<YoutubeOauthToken>();

  if (!token) {
    return <NotConnected />;
  }

  // Fetch the overview + top videos in parallel.
  let overview, topVideos: TopVideoRow[], errorMsg: string | null = null;
  try {
    [overview, topVideos] = await Promise.all([
      fetchChannelOverview(user.id, token.channel_id, start, end),
      fetchTopVideos(user.id, token.channel_id, start, end, 10),
    ]);
  } catch (err) {
    if (err instanceof NoOAuthConnectionError) {
      return <NotConnected />;
    }
    errorMsg = (err as Error).message;
    overview = undefined;
    topVideos = [];
  }

  if (errorMsg) {
    return <ErrorState message={errorMsg} />;
  }

  return (
    <AnalyticsDashboard
      channelTitle={token.channel_title}
      range={range}
      start={start}
      end={end}
      overview={overview!}
      topVideos={topVideos}
    />
  );
}

function NotConnected() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Channel Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          YouTube account is not connected.
        </p>
      </header>
      <div className="bg-card border rounded-xl p-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your YouTube account to see the Studio-style dashboard:
          daily views, watch time, subscriber growth, and revenue.
        </p>
        <a
          href="/api/youtube/oauth/start"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          Connect YouTube
        </a>
        <p className="text-xs text-muted-foreground">
          Or go back to{' '}
          <Link href="/youtube" className="text-accent hover:underline">
            YouTube Stats
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Channel Analytics</h1>
      </header>
      <div className="bg-danger-soft border border-danger/30 rounded-xl p-4 text-sm">
        <p className="font-medium text-danger">Failed to load analytics.</p>
        <p className="text-muted-foreground mt-1 text-xs">{message}</p>
        <div className="mt-3 flex gap-2">
          <Link
            href="/youtube"
            className="inline-flex items-center h-8 px-3 rounded-md border bg-card text-sm hover:bg-subtle transition-colors"
          >
            Back
          </Link>
          <a
            href="/api/youtube/oauth/start"
            className="inline-flex items-center h-8 px-3 rounded-md border bg-card text-sm hover:bg-subtle transition-colors"
          >
            Reconnect
          </a>
        </div>
      </div>
    </div>
  );
}
