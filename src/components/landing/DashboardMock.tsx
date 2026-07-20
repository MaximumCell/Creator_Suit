/**
 * Static product mockup used in the hero. Mirrors the actual app's three-pane
 * layout (sidebar + main + right rail) so visitors see exactly what the tool
 * looks like, with colorful "course-style" feature cards in the center column.
 *
 * Accepts an optional `tiltRef` so the parent can give it a 3D mouse-tilt.
 */
import {
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  KanbanIcon,
  PlayIcon,
  TrendUpIcon,
} from '@/components/icons';
import type { RefObject } from 'react';

export function DashboardMock({
  tiltRef,
}: {
  tiltRef?: RefObject<HTMLDivElement | null>;
} = {}) {
  return (
    <div
      ref={tiltRef}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-xl will-change-transform"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#fb7185]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#facc15]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#4ade80]/70" />
        <div className="mx-auto rounded-md border border-border bg-surface px-3 py-1 font-mono text-[10px] text-muted-foreground">
          app.creatorsuit.internal / attendance
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 p-4 sm:p-5">
        {/* Sidebar */}
        <aside className="col-span-3 hidden flex-col rounded-2xl bg-surface-2 p-3 lg:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h7a3 3 0 0 1 0 6h-3a3 3 0 0 0 0 6h7" />
              </svg>
            </span>
            <span
              className="text-xs font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-varela-round)' }}
            >
              CreatorSuit
            </span>
          </div>

          <div className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {[
            { Icon: ChartIcon, label: 'Dashboard', active: true },
            { Icon: ClockIcon, label: 'Attendance' },
            { Icon: PlayIcon, label: 'YouTube' },
            { Icon: KanbanIcon, label: 'Content' },
            { Icon: CalendarIcon, label: 'Team' },
          ].map(({ Icon, label, active }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium ${
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
          ))}

          <div className="mt-3 rounded-xl bg-[#0f172a] p-3 text-white">
            <div className="text-[9px] font-medium uppercase tracking-wider text-white/60">
              Clocked in
            </div>
            <div
              className="mt-0.5 font-mono text-lg font-bold tabular text-white"
              style={{ fontFamily: 'var(--font-varela-round)' }}
            >
              04:32
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full w-[68%] rounded-full"
                style={{ background: 'linear-gradient(90deg, #38bdf8, #a78bfa)' }}
              />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="col-span-12 space-y-3 lg:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </div>
              <h3 className="text-lg font-bold leading-tight tracking-tight">
                Workspace activity
              </h3>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white shadow-blue">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>

          {/* Module cards (the "course" style — colored full-bleed) */}
          <div className="space-y-2.5">
            <ModuleCard
              color="cat-blue"
              icon={<ClockIcon className="h-4 w-4" />}
              title="Attendance"
              subtitle="Auto-close stale sessions"
              metric="4h 32m"
              metricLabel="logged today"
            />
            <ModuleCard
              color="cat-pink"
              icon={<PlayIcon className="h-4 w-4" />}
              title="YouTube analytics"
              subtitle="1.6K views · 33.9h watch time"
              metric="+143"
              metricLabel="subs this week"
            />
            <ModuleCard
              color="cat-yellow"
              icon={<KanbanIcon className="h-4 w-4" />}
              title="Content pipeline"
              subtitle="5 ideas · 2 shooting · 1 posted"
              metric="8"
              metricLabel="in progress"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-12 space-y-2.5 lg:col-span-3">
          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Channel growth
              </span>
              <span className="inline-flex items-center gap-0.5 font-semibold text-success">
                <TrendUpIcon className="h-2.5 w-2.5" /> 12%
              </span>
            </div>
            <Sparkline />
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Team · this week
            </div>
            <div className="space-y-1.5">
              {[
                { name: 'AR', hours: '32h', color: '#7c3aed' },
                { name: 'BM', hours: '28h', color: '#2563eb' },
                { name: 'SA', hours: '24h', color: '#ec4899' },
              ].map((m) => (
                <div key={m.name} className="flex items-center gap-2 text-[10px]">
                  <span
                    className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: m.color }}
                  >
                    {m.name}
                  </span>
                  <span className="flex-1 font-medium text-foreground">{m.name}</span>
                  <span className="font-mono font-semibold tabular">{m.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-primary to-secondary p-3 text-white">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-white/80">
              AI insight
            </div>
            <div className="mt-1 text-[11px] font-medium leading-snug">
              Shorts outperforming long-form by 3.2× this week.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleCard({
  color,
  icon,
  title,
  subtitle,
  metric,
  metricLabel,
}: {
  color: 'cat-blue' | 'cat-pink' | 'cat-yellow' | 'cat-red' | 'cat-green';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
}) {
  // Map accent name → solid color (no tailwind dynamic classes — keep stable).
  const colorMap = {
    'cat-blue': '#3b82f6',
    'cat-pink': '#ec4899',
    'cat-yellow': '#f59e0b',
    'cat-red': '#ef4444',
    'cat-green': '#10b981',
  } as const;
  const bg = colorMap[color];
  return (
    <div
      className="relative overflow-hidden rounded-xl p-3 text-white"
      style={{ background: bg }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/20">
            {icon}
          </div>
          <div>
            <div className="text-[12px] font-bold leading-tight">{title}</div>
            <div className="mt-0.5 text-[10px] leading-snug text-white/80">
              {subtitle}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="text-base font-bold leading-none tabular"
            style={{ fontFamily: 'var(--font-varela-round)' }}
          >
            {metric}
          </div>
          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-white/70">
            {metricLabel}
          </div>
        </div>
      </div>
      {/* progress bar at bottom */}
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/20">
        <div className="h-full w-[64%] rounded-full bg-white/85" />
      </div>
    </div>
  );
}

function Sparkline() {
  // Small inline SVG, hard-coded mockup.
  const points = [12, 18, 15, 24, 22, 30, 28, 38, 34, 42, 48, 45, 56];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const w = 200;
  const h = 36;
  const path = points
    .map(
      (p, i) =>
        `${(i / (points.length - 1)) * w},${h - ((p - min) / range) * h}`,
    )
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-12 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hero-spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${path} ${w},${h}`} fill="url(#hero-spark)" />
      <polyline
        points={path}
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
