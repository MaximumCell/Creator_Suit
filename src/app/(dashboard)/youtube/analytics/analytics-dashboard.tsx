'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ChannelOverview, AnalyticsRow, TopVideoRow } from '@/lib/youtube-analytics';

interface Props {
  channelTitle: string | null;
  range: string;
  start: string;
  end: string;
  overview: ChannelOverview;
  topVideos: TopVideoRow[];
}

const RANGES: Array<{ value: string; label: string; days: number }> = [
  { value: '7', label: 'Last 7 days', days: 7 },
  { value: '28', label: 'Last 28 days', days: 28 },
  { value: '90', label: 'Last 90 days', days: 90 },
];

type Metric = 'views' | 'watchTime' | 'subscribers' | 'revenue';

const METRICS: Record<
  Metric,
  {
    label: string;
    /** Pull the per-day value out of an AnalyticsRow. */
    getValue: (r: AnalyticsRow) => number;
    /** Format the peak label (single number). */
    fmtPeak: (n: number) => string;
    /** Format a y-axis tick. */
    fmtTick: (n: number) => string;
  }
> = {
  views: {
    label: 'Views',
    getValue: (r) => r.views ?? 0,
    fmtPeak: formatBig,
    fmtTick: formatBig,
  },
  watchTime: {
    label: 'Watch time',
    getValue: (r) => r.estimatedMinutesWatched ?? 0,
    fmtPeak: formatHours,
    fmtTick: formatHours,
  },
  subscribers: {
    // Net = gained - lost. Can be negative on a bad day.
    label: 'Subscribers (net)',
    getValue: (r) => (r.subscribersGained ?? 0) - (r.subscribersLost ?? 0),
    fmtPeak: (n) => `${n >= 0 ? '+' : '−'}${formatBig(Math.abs(n))}`,
    fmtTick: (n) => (n >= 0 ? '+' : '−') + formatBig(Math.abs(n)),
  },
  revenue: {
    label: 'Est. revenue',
    getValue: (r) => r.estimatedRevenue ?? 0,
    fmtPeak: formatCurrency,
    fmtTick: formatCurrency,
  },
};

export function AnalyticsDashboard({
  channelTitle,
  range,
  start,
  end,
  overview,
  topVideos,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [metric, setMetric] = useState<Metric>('views');

  function setRange(value: string) {
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set('range', value);
      url.searchParams.delete('from');
      url.searchParams.delete('to');
      router.push(url.pathname + '?' + url.searchParams.toString());
    });
  }

  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? `${start} → ${end}`;

  // Compute % vs previous for KPI cards.
  const viewsPct = pct(overview.totals.views, overview.previous.views);
  const watchPct = pct(overview.totals.watchTimeMinutes, overview.previous.watchTimeMinutes);
  const revenuePct = pct(overview.totals.estimatedRevenue, overview.previous.estimatedRevenue);

  const activeMetric = METRICS[metric];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Channel Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {channelTitle ? `${channelTitle} · ` : ''}
            {formatDateRange(start, end)}
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-card p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              disabled={pending}
              className={`px-3 h-8 text-xs font-medium rounded-sm transition-colors disabled:opacity-50 ${
                range === r.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label.replace('Last ', '')}
            </button>
          ))}
        </div>
      </header>

      {/* 4 KPI cards — click to switch the chart metric */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Views"
          value={formatBig(overview.totals.views)}
          pct={viewsPct}
          active={metric === 'views'}
          onSelect={() => setMetric('views')}
        />
        <KpiCard
          label="Watch time"
          value={formatHours(overview.totals.watchTimeMinutes)}
          pct={watchPct}
          active={metric === 'watchTime'}
          onSelect={() => setMetric('watchTime')}
        />
        <KpiCard
          label="Subscribers"
          value={formatNetSubs(
            overview.totals.subscribersGained,
            overview.totals.subscribersLost,
          )}
          pct={null}
          subline={
            <>
              +{formatBig(overview.totals.subscribersGained)} gained · −
              {formatBig(overview.totals.subscribersLost)} lost
            </>
          }
          active={metric === 'subscribers'}
          onSelect={() => setMetric('subscribers')}
        />
        <KpiCard
          label="Est. revenue"
          value={formatCurrency(overview.totals.estimatedRevenue)}
          pct={revenuePct}
          active={metric === 'revenue'}
          onSelect={() => setMetric('revenue')}
        />
      </div>

      {/* Line chart — switches with the active KPI */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">{activeMetric.label}</h2>
          <span className="text-xs text-muted-foreground">{rangeLabel}</span>
        </div>
        <MetricChart data={overview.daily} metric={activeMetric} />
      </div>

      {/* Top videos */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <header className="p-5 border-b">
          <h2 className="text-sm font-semibold">Top content</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by views in the selected range
          </p>
        </header>
        {topVideos.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No video data for this range.
          </div>
        ) : (
          <ul className="divide-y">
            {topVideos.map((v, i) => (
              <li key={v.videoId}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 hover:bg-subtle/50 transition-colors"
                >
                  <span className="text-xs font-mono text-muted-foreground tabular w-5 text-right shrink-0 pt-1">
                    {i + 1}
                  </span>
                  {v.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="w-32 h-18 object-cover rounded border bg-subtle shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-32 h-18 rounded border bg-subtle shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2">
                      {v.title === '(video)' ? (
                        <span className="text-muted-foreground italic">
                          (video — id: {v.videoId})
                        </span>
                      ) : (
                        v.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground tabular mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground/90">
                        {formatBig(v.views)} views
                      </span>
                      <span aria-hidden>·</span>
                      <span>
                        {formatDurationFromSeconds(v.averageViewDuration)} avg
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatHours(v.estimatedMinutesWatched)} watch time</span>
                      {v.estimatedRevenue > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="text-success">
                            {formatCurrency(v.estimatedRevenue)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Data from YouTube Analytics API · {rangeLabel}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  pct,
  subline,
  active,
  onSelect,
}: {
  label: string;
  value: string;
  pct: number | null;
  subline?: React.ReactNode;
  active?: boolean;
  onSelect?: () => void;
}) {
  const isUp = pct != null && pct > 0;
  const isDown = pct != null && pct < 0;
  const interactive = !!onSelect;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={interactive ? active : undefined}
      className={`text-left bg-card border rounded-xl p-4 transition-all w-full ${
        active
          ? 'border-accent ring-1 ring-accent/40 shadow-sm'
          : interactive
            ? 'hover:border-muted-foreground/30 cursor-pointer'
            : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        {active ? (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-accent">
            shown
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-semibold tabular tracking-tight mt-1">{value}</div>
      {pct != null ? (
        <div
          className={`text-xs mt-1.5 inline-flex items-center gap-1.5 ${
            isUp ? 'text-success' : isDown ? 'text-danger' : 'text-muted-foreground'
          }`}
        >
          {isUp ? <ArrowUp className="w-3 h-3" /> : null}
          {isDown ? <ArrowDown className="w-3 h-3" /> : null}
          <span className="tabular font-medium">
            {Math.abs(pct).toFixed(1)}% {isUp ? 'more' : isDown ? 'less' : ''} than
            previous period
          </span>
        </div>
      ) : subline ? (
        <div className="text-xs mt-1.5 text-muted-foreground tabular">{subline}</div>
      ) : null}
    </button>
  );
}

interface MetricConfig {
  label: string;
  getValue: (r: AnalyticsRow) => number;
  fmtPeak: (n: number) => string;
  fmtTick: (n: number) => string;
}

function MetricChart({
  data,
  metric,
}: {
  data: AnalyticsRow[];
  metric: MetricConfig;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        No data in this range.
      </div>
    );
  }
  const values = data.map((d) => metric.getValue(d));
  const maxV = Math.max(...values, 0);
  const minV = Math.min(...values, 0);
  // Use abs of extremes for scale so negative net-subscriber days are visible.
  const scaleMax = Math.max(Math.abs(maxV), Math.abs(minV), 1);
  const W = 800;
  const H = 180;
  const PAD_X = 8;
  const PAD_Y = 16;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const points = values.map((v, i) => {
    const x = PAD_X + i * xStep;
    // Map to [0..1] from -scaleMax..+scaleMax, with 0 at the vertical middle.
    const t = (v + scaleMax) / (2 * scaleMax);
    const y = PAD_Y + innerH - t * innerH;
    return { x, y, v, d: data[i]! };
  });
  const linePath = points
    .map((p, i) =>
      i === 0
        ? `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`
        : `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    )
    .join(' ');
  const fillPath = `${linePath} L${(PAD_X + innerW).toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} L${PAD_X} ${(PAD_Y + innerH).toFixed(1)} Z`;

  // Zero line (for metrics that can go negative, i.e. net subscribers).
  const showZeroLine = minV < 0;
  const zeroY = PAD_Y + innerH - ((0 + scaleMax) / (2 * scaleMax)) * innerH;

  // Peak value: the largest |value| in the window.
  const peakIdx = values.reduce(
    (best, v, i) => (Math.abs(v) > Math.abs(values[best] ?? 0) ? i : best),
    0,
  );
  const peakVal = values[peakIdx] ?? 0;

  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null;
  const xPercent = hoverPoint ? (hoverPoint.x / W) * 100 : 0;
  // Clamp tooltip horizontally so it doesn't overflow card edges.
  const tooltipLeftPct = Math.max(12, Math.min(88, xPercent));

  function onChartMove(e: React.MouseEvent<HTMLDivElement>) {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const xSvg = xPct * W;
    // Snap to nearest point.
    let nearest = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i]!.x - xSvg);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    setHoverIdx(nearest);
  }

  return (
    <div
      className="w-full relative"
      onMouseMove={onChartMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-48"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Daily ${metric.label.toLowerCase()} over time`}
      >
        <defs>
          <linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {showZeroLine ? (
          <line
            x1={PAD_X}
            y1={zeroY}
            x2={PAD_X + innerW}
            y2={zeroY}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity="0.25"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
        <path d={fillPath} fill="url(#metric-fill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.length > 0 ? (
          <circle
            cx={points[points.length - 1]!.x}
            cy={points[points.length - 1]!.y}
            r="3.5"
            fill="hsl(var(--accent))"
          />
        ) : null}
        {hoverPoint ? (
          <line
            x1={hoverPoint.x}
            y1={PAD_Y}
            x2={hoverPoint.x}
            y2={PAD_Y + innerH}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        ) : null}
        {hoverPoint ? (
          <circle
            cx={hoverPoint.x}
            cy={hoverPoint.y}
            r="5"
            fill="hsl(var(--accent))"
            stroke="hsl(var(--background))"
            strokeWidth="2"
          />
        ) : null}
      </svg>
      {hoverPoint ? (
        <div
          className="absolute -top-1 pointer-events-none bg-popover text-popover-foreground border rounded-md shadow-md px-2.5 py-1.5 text-xs whitespace-nowrap z-10"
          style={{ left: `${tooltipLeftPct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="text-[10px] text-muted-foreground">
            {formatPrettyDate(hoverPoint.d.date)}
          </div>
          <div className="font-semibold tabular">
            {metric.fmtPeak(hoverPoint.v)} {metric.label.toLowerCase()}
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1 px-1 tabular">
        <span>{data[0]?.date}</span>
        <span>
          peak {metric.fmtPeak(peakVal)} {metric.label.toLowerCase()}
        </span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function formatPrettyDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD. Parse as UTC to avoid TZ shift.
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function ArrowUp({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function ArrowDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

function pct(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}
function formatBig(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}
function formatHours(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 1000) return `${hours.toFixed(1)}h`;
  return `${(hours / 1000).toFixed(1)}Kh`;
}
function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}
function formatNetSubs(gained: number, lost: number): string {
  const net = gained - lost;
  return `${net >= 0 ? '+' : '−'}${formatBig(Math.abs(net))}`;
}
function formatDateRange(start: string, end: string): string {
  return `${start} – ${end}`;
}
function formatDurationFromSeconds(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}
