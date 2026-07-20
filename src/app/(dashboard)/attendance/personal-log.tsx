'use client';

import { useEffect, useState } from 'react';
import type { AttendanceLog } from '@/types/database';
import {
  formatDate,
  formatDuration,
  formatTime,
  sumMinutes,
} from '@/lib/time';
import { EmptyState } from '@/components/empty-state';
import { ClockIcon } from '@/components/icons';
import { useReveal } from '@/lib/animations';

export function PersonalLog({ logs }: { logs: AttendanceLog[] }) {
  const totalMinutes = sumMinutes(logs);
  const closed = logs.filter((l) => l.clock_out != null).length;
  const open = logs.length - closed;

  // Animated total that ticks up from 0 when the card scrolls into view.
  const totalRef = useReveal<HTMLDivElement>(0.2);
  const { display: totalDisplay } = useCountUp(totalMinutes);

  // 7-day sparkline (last 7 days of closed minutes).
  const spark = build7DaySparkline(logs);

  return (
    <section
      aria-labelledby="personal-log-heading"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-5">
        <div>
          <h2
            id="personal-log-heading"
            className="text-base font-semibold tracking-tight"
          >
            Your working hours
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex items-end gap-4">
          {/* 7-day sparkline */}
          <div className="hidden sm:block">
            <Sparkline data={spark} />
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Total
            </div>
            <div
              ref={totalRef}
              className="text-2xl font-semibold tabular tracking-tight"
              style={{ fontFamily: 'var(--font-varela-round)' }}
            >
              {totalDisplay}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground tabular">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              {open > 0 ? ` · ${open} open` : ''}
            </div>
          </div>
        </div>
      </header>

      {logs.length === 0 ? (
        <EmptyState
          icon={<ClockIcon className="w-6 h-6" />}
          title="No entries yet"
          description="Clock in to start tracking your hours."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border bg-surface-2/50">
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-left font-medium">Clock in</th>
                  <th className="px-5 py-2.5 text-left font-medium">Clock out</th>
                  <th className="px-5 py-2.5 text-right font-medium">Hours</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, i) => (
                  <tr
                    key={l.id}
                    className="group fade-up border-b border-border last:border-0 transition-colors hover:bg-surface-2/60"
                    style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
                  >
                    <td className="px-5 py-3">{formatDate(l.clock_in)}</td>
                    <td className="px-5 py-3 tabular text-foreground/90">
                      {formatTime(l.clock_in)}
                    </td>
                    <td className="px-5 py-3 tabular text-foreground/90">
                      {l.clock_out ? (
                        formatTime(l.clock_out)
                      ) : (
                        <InProgressPill />
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <HoursCell minutes={l.duration_minutes} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-border sm:hidden">
            {logs.map((l, i) => (
              <li
                key={l.id}
                className="fade-up flex items-center justify-between gap-3 p-4"
                style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {formatDate(l.clock_in)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground tabular">
                    {formatTime(l.clock_in)} →{' '}
                    {l.clock_out ? formatTime(l.clock_out) : 'in progress'}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold tabular">
                    {formatDuration(l.duration_minutes)}
                  </div>
                  {!l.clock_out ? <InProgressPill /> : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Hours cell — shows a tiny progress bar relative to an 8h day. */
function HoursCell({ minutes }: { minutes: number | null }) {
  const m = minutes ?? 0;
  const pct = Math.min(100, (m / 480) * 100);
  const tone = pct >= 100 ? 'var(--success)' : pct >= 60 ? 'var(--primary)' : 'var(--muted-foreground)';
  return (
    <div className="inline-flex items-center gap-2">
      <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-3 sm:block">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: tone }}
        />
      </div>
      <span className="font-medium tabular">{formatDuration(m)}</span>
    </div>
  );
}

function InProgressPill() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
      </span>
      In progress
    </span>
  );
}

/** Animated total that counts up from 0 once the header scrolls in. */
function useCountUp(target: number, durationMs = 900) {
  const [n, setN] = useState(0);
  const [ref, setRef] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!ref || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(ref);
    return () => io.disconnect();
  }, [ref, target, durationMs]);
  return { display: formatDuration(n), ref: setRef };
}

/** Last 7 days of total minutes (most recent on the right). */
function build7DaySparkline(logs: AttendanceLog[]) {
  const days: number[] = new Array(7).fill(0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const log of logs) {
    if (log.duration_minutes == null) continue;
    const d = new Date(log.clock_in);
    d.setUTCHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    if (diff >= 0 && diff < 7) {
      days[6 - diff] += log.duration_minutes;
    }
  }
  return days;
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 32;
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  const fill = `${path} L${w} ${h} L0 ${h} Z`;
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Last 7 days
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-8 w-32"
        preserveAspectRatio="none"
        role="img"
        aria-label="Last 7 days of work hours"
      >
        <defs>
          <linearGradient id="pspark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#pspark)" />
        <path
          d={path}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Today's dot */}
        {data.length > 0 ? (
          <circle
            cx={w}
            cy={h - (data[data.length - 1]! / max) * (h - 4) - 2}
            r="2.5"
            fill="var(--primary)"
          />
        ) : null}
      </svg>
    </div>
  );
}
