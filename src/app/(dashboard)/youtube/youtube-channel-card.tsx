'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeChannel, type YouTubeActionState } from './actions';
import { Avatar } from '@/components/avatar';
import { Sparkline } from '@/components/sparkline';
import {
  ExternalIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
} from '@/components/icons';

export interface ChannelView {
  id: string;
  channelId: string;
  channelName: string;
  channelUrl: string;
  thumbnailUrl: string | null;
  /** Latest snapshot. Null if the channel was just added and the first
   *  snapshot insert failed (shouldn't happen but be defensive). */
  latest: {
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    fetchedAt: string;
  } | null;
  /** Previous snapshot — used to compute growth. */
  previous: {
    subscriberCount: number;
    viewCount: number;
    fetchedAt: string;
  } | null;
  /** Subscriber counts in chronological order (oldest → newest).
   *  Used for the sparkline trend. */
  history: number[];
  /** Top videos by view count (already pre-sorted, max 5). */
  topVideos: Array<{
    videoId: string;
    title: string;
    thumbnailUrl: string | null;
    publishedAt: string;
    viewCount: number;
    likeCount: number | null;
    commentCount: number | null;
    url: string;
  }>;
}

function formatBig(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function formatDelta(delta: number): string {
  const abs = Math.abs(delta);
  const sign = delta >= 0 ? '+' : '−';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`;
  return `${sign}${abs}`;
}

function formatRelative(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diffMs = Math.max(0, now - t);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function YouTubeChannelCard({
  channel,
  isAdmin,
}: {
  channel: ChannelView;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRemove() {
    if (!confirm(`Remove "${channel.channelName}" from tracking? Its snapshot history will be deleted.`)) {
      return;
    }
    const fd = new FormData();
    fd.set('channel_id', channel.id);
    startTransition(async () => {
      await removeChannel({} as YouTubeActionState, fd);
      router.refresh();
    });
  }

  const subsDelta =
    channel.latest && channel.previous
      ? channel.latest.subscriberCount - channel.previous.subscriberCount
      : null;
  const viewsDelta =
    channel.latest && channel.previous
      ? channel.latest.viewCount - channel.previous.viewCount
      : null;

  return (
    <article className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex items-start gap-4">
        <Avatar
          fullName={channel.channelName}
          url={channel.thumbnailUrl}
          size={64}
          style="shapes"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <a
              href={channel.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold tracking-tight hover:underline truncate inline-flex items-center gap-1.5"
            >
              {channel.channelName}
              <ExternalIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </a>
            {isAdmin ? (
              <button
                onClick={handleRemove}
                disabled={pending}
                title="Remove from tracking"
                className="text-muted-foreground hover:text-danger p-1.5 rounded-md hover:bg-danger-soft transition-colors disabled:opacity-50"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground tabular mt-0.5">
            {channel.latest
              ? `Updated ${formatRelative(channel.latest.fetchedAt)}`
              : 'No snapshot yet'}
          </p>
        </div>
      </div>

      {channel.history.length >= 2 ? (
        <div className="px-5 pb-4 -mt-1">
          <div className="flex items-end justify-between gap-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              7-day trend
            </span>
            <Sparkline
              data={channel.history}
              width={140}
              height={32}
              className={`shrink-0 ${
                subsDelta != null && subsDelta >= 0
                  ? 'text-success'
                  : 'text-danger'
              }`}
            />
          </div>
        </div>
      ) : null}

      {channel.latest ? (
        <div className="grid grid-cols-3 border-t divide-x">
          <StatCell
            label="Subscribers"
            value={formatBig(channel.latest.subscriberCount)}
            delta={subsDelta}
            deltaFormatter={formatDelta}
          />
          <StatCell
            label="Views"
            value={formatBig(channel.latest.viewCount)}
            delta={viewsDelta}
            deltaFormatter={formatDelta}
          />
          <StatCell
            label="Videos"
            value={String(channel.latest.videoCount)}
          />
        </div>
      ) : (
        <div className="border-t p-5 text-center text-sm text-muted-foreground">
          Stats will appear after the first refresh.
        </div>
      )}

      {channel.topVideos.length > 0 ? <TopVideosList videos={channel.topVideos} /> : null}
    </article>
  );
}

function formatPublishedAgo(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffMs = Math.max(0, now - t);
  const days = Math.floor(diffMs / 86_400_000);
  if (days < 1) return 'today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function TopVideosList({
  videos,
}: {
  videos: ChannelView['topVideos'];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium hover:bg-subtle/50 transition-colors"
        aria-expanded={open}
      >
        <span>
          Top videos{' '}
          <span className="text-muted-foreground font-normal">
            · {videos.length} by views
          </span>
        </span>
        <span
          className={`text-muted-foreground transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>
      {open ? (
        <ul className="divide-y border-t">
          {videos.map((v, i) => (
            <li key={v.videoId}>
              <a
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 hover:bg-subtle/50 transition-colors"
              >
                <span className="text-xs font-mono text-muted-foreground tabular w-5 text-right shrink-0 pt-1">
                  {i + 1}
                </span>
                {v.thumbnailUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={v.thumbnailUrl}
                    alt=""
                    className="w-24 h-14 object-cover rounded border bg-subtle shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-24 h-14 rounded border bg-subtle shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {v.title}
                  </p>
                  <p className="text-xs text-muted-foreground tabular mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground/90">
                      {formatBig(v.viewCount)} views
                    </span>
                    {v.likeCount != null ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{formatBig(v.likeCount)} likes</span>
                      </>
                    ) : null}
                    {v.commentCount != null ? (
                      <>
                        <span aria-hidden>·</span>
                        <span>{formatBig(v.commentCount)} comments</span>
                      </>
                    ) : null}
                    <span aria-hidden>·</span>
                    <span>{formatPublishedAgo(v.publishedAt)}</span>
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatCell({
  label,
  value,
  delta,
  deltaFormatter,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaFormatter?: (n: number) => string;
}) {
  const hasDelta = delta != null && delta !== 0;
  const isPositive = delta != null && delta > 0;
  const isNegative = delta != null && delta < 0;
  return (
    <div className="p-4 text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="text-xl font-semibold tabular tracking-tight mt-1">
        {value}
      </div>
      {hasDelta && deltaFormatter ? (
        <div
          className={`text-xs font-medium inline-flex items-center gap-1 mt-1 ${
            isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-muted-foreground'
          }`}
        >
          {isPositive ? (
            <TrendUpIcon className="w-3 h-3" />
          ) : isNegative ? (
            <TrendDownIcon className="w-3 h-3" />
          ) : null}
          {deltaFormatter(delta!)}
        </div>
      ) : null}
    </div>
  );
}
