import { createClient } from '@/lib/supabase/server';
import { AddChannelForm } from './add-channel-form';
import {
  YouTubeChannelCard,
  type ChannelView,
} from './youtube-channel-card';
import { EmptyState } from '@/components/empty-state';
import { FilmIcon } from '@/components/icons';
import { RefreshButton } from './refresh-button';
import type { YoutubeChannel, YoutubeStatsSnapshot } from '@/types/database';

export const metadata = { title: 'YouTube Stats · CreatorSuit' };

export default async function YoutubePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Middleware would have redirected already; keep TS happy.
  if (!authUser) return null;

  // Profile → role determines whether to show admin actions.
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single<{ role: 'admin' | 'member' }>();
  const isAdmin = profile?.role === 'admin';

  // Fetch all channels + every snapshot (we'll compute "latest" and "previous"
  // client-side below — small dataset for an internal tool).
  const [{ data: channels }, { data: snapshots }] = await Promise.all([
    supabase
      .from('youtube_channels')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<YoutubeChannel[]>(),
    supabase
      .from('youtube_stats_snapshots')
      .select('*')
      .order('fetched_at', { ascending: false })
      .returns<YoutubeStatsSnapshot[]>(),
  ]);

  // Group snapshots by channel, then pick latest + previous.
  const byChannel = new Map<string, YoutubeStatsSnapshot[]>();
  for (const s of snapshots ?? []) {
    const list = byChannel.get(s.channel_id) ?? [];
    list.push(s);
    byChannel.set(s.channel_id, list);
  }

  const channelViews: ChannelView[] = (channels ?? []).map((c) => {
    const list = byChannel.get(c.id) ?? [];
    const latest = list[0] ?? null;
    const previous = list[1] ?? null;
    return {
      id: c.id,
      channelId: c.channel_id,
      channelName: c.channel_name,
      channelUrl: c.channel_url,
      thumbnailUrl: c.thumbnail_url,
      latest: latest
        ? {
            subscriberCount: latest.subscriber_count,
            viewCount: latest.view_count,
            videoCount: latest.video_count,
            fetchedAt: latest.fetched_at,
          }
        : null,
      previous: previous
        ? {
            subscriberCount: previous.subscriber_count,
            viewCount: previous.view_count,
            fetchedAt: previous.fetched_at,
          }
        : null,
    };
  });

  const totalSubs = channelViews.reduce(
    (acc, c) => acc + (c.latest?.subscriberCount ?? 0),
    0,
  );
  const totalViews = channelViews.reduce(
    (acc, c) => acc + (c.latest?.viewCount ?? 0),
    0,
  );

  const apiKeyMissing = !process.env.YOUTUBE_API_KEY;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-foreground">
          <FilmIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">YouTube Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track subscribers, views, and growth across channels.
          </p>
        </div>
      </header>

      {apiKeyMissing ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <p className="font-medium text-amber-900">YOUTUBE_API_KEY is not set.</p>
          <p className="text-amber-800 mt-1">
            Add a YouTube Data API v3 key to your{' '}
            <code className="px-1 py-0.5 rounded bg-amber-100 text-amber-900 text-xs">
              .env.local
            </code>{' '}
            and restart the dev server. See the README for setup steps.
          </p>
        </div>
      ) : null}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryStat
          label="Channels"
          value={String(channelViews.length)}
        />
        <SummaryStat
          label="Total subscribers"
          value={formatBig(totalSubs)}
        />
        <SummaryStat
          label="Total views"
          value={formatBig(totalViews)}
        />
      </div>

      {/* Admin actions */}
      {isAdmin ? (
        <div className="flex flex-col sm:flex-row gap-3 sm:items-start sm:justify-between">
          <div className="flex-1">
            <AddChannelForm />
          </div>
          {channelViews.length > 0 ? (
            <RefreshButton disabled={apiKeyMissing} />
          ) : null}
        </div>
      ) : null}

      {/* Channels grid */}
      {channelViews.length === 0 ? (
        <div className="bg-card border rounded-xl shadow-sm">
          <EmptyState
            icon={<FilmIcon className="w-6 h-6" />}
            title="No channels yet"
            description={
              isAdmin
                ? 'Add a YouTube channel above to start tracking its stats.'
                : 'An admin needs to add channels before you can see stats here.'
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelViews.map((c) => (
            <YouTubeChannelCard key={c.id} channel={c} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border rounded-xl px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular tracking-tight">{value}</div>
    </div>
  );
}

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
