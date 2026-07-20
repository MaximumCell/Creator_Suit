'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AttendanceLog, User } from '@/types/database';
import {
  formatDate,
  formatDuration,
  formatTime,
  sumMinutes,
} from '@/lib/time';
import { EmptyState } from '@/components/empty-state';
import {
  ClockIcon,
  TrendUpIcon,
  UsersIcon,
} from '@/components/icons';
import { Avatar } from '@/components/avatar';

type RangeKey = 'last7' | 'last30' | 'thismonth' | 'custom';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thismonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

/** YYYY-MM-DD in UTC — matches what the DB trigger stores in attendance_logs.date. */
function todayUtcIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function AdminTeamView({
  users,
  logs,
  from,
  to,
  range,
}: {
  users: User[];
  logs: AttendanceLog[];
  from: string;
  to: string;
  range: string;
}) {
  const today = todayUtcIso();
  // Hydration-safe "now" for relative timestamps — set on the client.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  // Group logs by user
  const byUser = new Map<string, AttendanceLog[]>();
  for (const log of logs) {
    const list = byUser.get(log.user_id) ?? [];
    list.push(log);
    byUser.set(log.user_id, list);
  }

  const rows = users.map((u) => {
    const userLogs = byUser.get(u.id) ?? [];
    const total = sumMinutes(userLogs);
    const closed = userLogs.filter((l) => l.clock_out != null).length;
    const todayLog = userLogs.find((l) => l.date === today) ?? null;
    const open = todayLog && todayLog.clock_out == null ? todayLog : null;
    const weekly = buildWeeklyHours(userLogs, 7);
    return { user: u, logs: userLogs, total, closed, todayLog, open, weekly };
  });

  const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const activeCount = rows.filter((r) => r.total > 0).length;
  const clockedInNow = rows.filter((r) => r.open).length;
  const totalOpenMinutes = rows.reduce(
    (acc, r) => acc + (r.open ? Math.max(0, Math.floor((Date.now() - new Date(r.open.clock_in).getTime()) / 60_000)) : 0),
    0,
  );

  // Recent activity — most recent 10 entries across the team, regardless of range.
  const recent = [...logs]
    .sort((a, b) => (a.clock_in < b.clock_in ? 1 : -1))
    .slice(0, 10);

  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      {/* Top stats strip — count-up on each value */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<ClockIcon className="h-4 w-4" />}
          label="Clocked in now"
          value={clockedInNow}
          tone="success"
          accent="var(--success)"
        />
        <StatCard
          icon={<UsersIcon className="h-4 w-4" />}
          label="Active in range"
          value={`${activeCount} / ${users.length}`}
          tone="primary"
          accent="var(--primary)"
        />
        <StatCard
          icon={<TrendUpIcon className="h-4 w-4" />}
          label="Live total"
          value={totalOpenMinutes}
          format="duration"
          tone="accent"
          accent="var(--accent)"
        />
        <StatCard
          icon={<TrendUpIcon className="h-4 w-4" />}
          label="Total team hours"
          value={grandTotal}
          format="duration"
          tone="primary"
          accent="var(--primary)"
        />
      </div>

      <section
        aria-labelledby="admin-team-heading"
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      >
        <header className="space-y-4 border-b border-border p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="admin-team-heading"
                className="text-base font-semibold tracking-tight"
              >
                Team hours
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground tabular">
                {formatDate(from)} → {formatDate(to)}
              </p>
            </div>
          </div>

          {/* Range filter — uses GET params, no client JS needed. */}
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="min-w-40 flex-1">
              <label htmlFor="range" className="text-xs text-muted-foreground">
                Range
              </label>
              <select
                id="range"
                name="range"
                defaultValue={range}
                className="mt-1 h-9 w-full rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="from" className="text-xs text-muted-foreground">
                From
              </label>
              <input
                id="from"
                type="date"
                name="from"
                defaultValue={from}
                className="mt-1 h-9 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="to" className="text-xs text-muted-foreground">
                To
              </label>
              <input
                id="to"
                type="date"
                name="to"
                defaultValue={to}
                className="mt-1 h-9 rounded-xl border border-border bg-surface-2 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="h-9 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-blue transition-all hover:-translate-y-0.5 hover:bg-primary-hover"
            >
              Apply
            </button>
            <Link
              href="/attendance"
              className="inline-flex h-9 items-center rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              Reset
            </Link>
          </form>
        </header>

        {users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-6 h-6" />}
            title="No team members yet"
            description="Invite users from the Supabase dashboard."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border bg-surface-2/50">
                    <th className="px-5 py-2.5 text-left font-medium">Member</th>
                    <th className="px-5 py-2.5 text-left font-medium">Today</th>
                    <th className="px-5 py-2.5 text-left font-medium">Status</th>
                    <th className="px-5 py-2.5 text-left font-medium">This week</th>
                    <th className="px-5 py-2.5 text-right font-medium">Days</th>
                    <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ user, total, closed, todayLog, open, weekly }, i) => (
                    <tr
                      key={user.id}
                      className={`fade-up group border-b border-border last:border-0 transition-colors ${
                        open
                          ? 'bg-success-soft/40 hover:bg-success-soft/70'
                          : 'hover:bg-surface-2/60'
                      }`}
                      style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                    >
                      <td className="relative px-5 py-3">
                        {/* Left accent bar — animates in on hover, always present for open */}
                        <span
                          aria-hidden
                          className={`absolute left-0 top-0 h-full w-0.5 transition-all duration-300 ${
                            open
                              ? 'bg-success opacity-100'
                              : 'bg-primary opacity-0 group-hover:opacity-100'
                          }`}
                        />
                        <div className="flex items-center gap-3">
                          <Avatar
                            fullName={user.full_name}
                            id={user.id}
                            url={user.avatar_url}
                            size={32}
                          />
                          <div>
                            <div className="font-medium">
                              {user.full_name || '—'}
                            </div>
                            <div className="text-xs capitalize text-muted-foreground">
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <TodayCell log={todayLog ?? null} />
                      </td>
                      <td className="px-5 py-3">
                        {open ? (
                          <InProgressPill />
                        ) : todayLog ? (
                          <span className="text-xs text-muted-foreground">Done</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <WeeklyBars data={weekly} live={!!open} />
                      </td>
                      <td className="px-5 py-3 text-right tabular text-foreground/90">
                        {closed}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <TotalWithBar total={total} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-border md:hidden">
              {rows.map(({ user, total, closed, todayLog, open, weekly }, i) => (
                <li
                  key={user.id}
                  className={`fade-up p-4 ${open ? 'bg-success-soft/40' : ''}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        fullName={user.full_name}
                        id={user.id}
                        url={user.avatar_url}
                        size={36}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {user.full_name || '—'}
                        </div>
                        <div className="text-xs capitalize text-muted-foreground">
                          {user.role} · {closed} {closed === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold tabular">
                        {formatDuration(total)}
                      </div>
                      <div className="mt-0.5">
                        {open ? (
                          <InProgressPill />
                        ) : todayLog ? (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(todayLog.clock_in)} →{' '}
                            {formatTime(todayLog.clock_out)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No entry today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <WeeklyBars data={weekly} live={!!open} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Recent activity feed — relative timestamps + stagger fade-in */}
      <section
        aria-labelledby="recent-activity-heading"
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      >
        <header className="border-b border-border p-5">
          <h2
            id="recent-activity-heading"
            className="text-base font-semibold tracking-tight"
          >
            Recent activity
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Last 10 clock-in events across the team
          </p>
        </header>

        {recent.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-6 h-6" />}
            title="No activity yet"
            description="Once your team starts clocking in, the latest events will show up here."
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((log, i) => {
              const u = userById.get(log.user_id);
              return (
                <li
                  key={log.id}
                  className="fade-up group flex items-center gap-3 p-4 transition-colors hover:bg-surface-2/60"
                  style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
                >
                  <Avatar
                    fullName={u?.full_name ?? '—'}
                    id={log.user_id}
                    url={u?.avatar_url ?? null}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {u?.full_name ?? 'Unknown user'}
                    </div>
                    <div className="text-xs text-muted-foreground tabular">
                      {formatDate(log.clock_in)} · {formatTime(log.clock_in)}
                      {log.clock_out ? ` → ${formatTime(log.clock_out)}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-muted-foreground tabular">
                      {now ? <RelativeTime iso={log.clock_in} now={now} /> : '—'}
                    </div>
                    <div className="text-sm font-semibold tabular">
                      {formatDuration(log.duration_minutes)}
                    </div>
                  </div>
                  {!log.clock_out ? (
                    <span
                      className="ml-1 h-2 w-2 shrink-0 rounded-full bg-success"
                      aria-hidden
                    >
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-success opacity-60" />
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function TodayCell({ log }: { log: AttendanceLog | null }) {
  if (!log) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="text-xs tabular text-foreground/90">
      <div>
        <span className="text-muted-foreground">in</span>{' '}
        {formatTime(log.clock_in)}
      </div>
      <div className="text-muted-foreground">
        out {log.clock_out ? formatTime(log.clock_out) : '—'}
      </div>
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

/** Stat card with count-up + accent dot + soft tinted bg. */
function StatCard({
  icon,
  label,
  value,
  format = 'raw',
  tone,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  format?: 'raw' | 'duration';
  tone: 'primary' | 'success' | 'accent';
  accent: string;
}) {
  const { display, ref } = useCountUp(value, format);

  const toneBg = {
    primary: 'bg-primary-soft',
    success: 'bg-success-soft',
    accent: 'bg-accent-soft',
  }[tone];
  const toneFg = {
    primary: 'text-primary',
    success: 'text-success',
    accent: 'text-accent',
  }[tone];

  return (
    <div className="fade-up group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {/* Soft accent corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <div
          className={`grid h-8 w-8 place-items-center rounded-xl ${toneBg} ${toneFg}`}
        >
          {icon}
        </div>
        <div
          ref={ref}
          className={`text-2xl font-semibold tabular tracking-tight ${toneFg}`}
          style={{ fontFamily: 'var(--font-varela-round)' }}
        >
          {display}
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/** Count up from 0 (or raw value if string) when the card scrolls in. */
function useCountUp(
  target: number | string,
  format: 'raw' | 'duration' = 'raw',
  durationMs = 900,
) {
  const [n, setN] = useState<number | string>(format === 'raw' && typeof target === 'number' ? 0 : target);
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof target === 'string') {
      setN(target);
      return;
    }
    if (!el || typeof IntersectionObserver === 'undefined') {
      setN(target);
      return;
    }
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
    io.observe(el);
    return () => io.disconnect();
  }, [el, target, durationMs]);

  const display =
    typeof n === 'string'
      ? n
      : format === 'duration'
        ? formatDuration(n)
        : n.toString();

  return { display, ref: setEl };
}

/** Right-aligned total with a thin progress bar (relative to 40h week cap). */
function TotalWithBar({ total }: { total: number }) {
  const pct = Math.min(100, (total / (40 * 60)) * 100);
  return (
    <div className="inline-flex flex-col items-end gap-1">
      <span className="font-semibold tabular">{formatDuration(total)}</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** 7 tiny vertical bars showing per-day minutes, today on the right. */
function WeeklyBars({ data, live }: { data: number[]; live: boolean }) {
  const max = Math.max(...data, 1);
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex items-end gap-1">
      {data.map((v, i) => {
        const h = v === 0 ? 2 : Math.max(6, (v / max) * 24);
        const isToday = i === data.length - 1;
        const fill = v === 0
          ? 'var(--border)'
          : live && isToday
            ? 'var(--success)'
            : isToday
              ? 'var(--primary)'
              : 'var(--primary)';
        const opacity = v === 0 ? 1 : live && isToday ? 1 : 0.65;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="w-2 rounded-sm transition-all duration-500"
              style={{
                height: `${h}px`,
                background: fill,
                opacity,
              }}
              title={`${dayLabels[i]}: ${formatDuration(v)}`}
            />
            <span className="text-[8px] font-medium uppercase text-muted-foreground/60">
              {dayLabels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Last 7 days of minutes, oldest → newest. */
function buildWeeklyHours(logs: AttendanceLog[], days: number) {
  const arr: number[] = new Array(days).fill(0);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const log of logs) {
    if (log.duration_minutes == null) continue;
    const d = new Date(log.clock_in);
    d.setUTCHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    if (diff >= 0 && diff < days) {
      arr[days - 1 - diff] += log.duration_minutes;
    }
  }
  return arr;
}

function RelativeTime({ iso, now }: { iso: string; now: number }) {
  const t = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - t) / 1000));
  if (diffSec < 60) return 'just now';
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}
