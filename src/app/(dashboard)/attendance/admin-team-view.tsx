import Link from 'next/link';
import type { AttendanceLog, User } from '@/types/database';
import {
  formatDate,
  formatDuration,
  formatTime,
  sumMinutes,
} from '@/lib/time';
import { EmptyState } from '@/components/empty-state';
import { UserIcon } from '@/components/icons';
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
    // Today's session (we may have already clocked out, or still be in)
    const todayLog = userLogs.find((l) => l.date === today) ?? null;
    const open = todayLog && todayLog.clock_out == null ? todayLog : null;
    return { user: u, logs: userLogs, total, closed, todayLog, open };
  });

  const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const activeCount = rows.filter((r) => r.total > 0).length;
  const clockedInNow = rows.filter((r) => r.open).length;

  // Recent activity — most recent 10 entries across the team, regardless of range.
  const recent = [...logs]
    .sort((a, b) => (a.clock_in < b.clock_in ? 1 : -1))
    .slice(0, 10);

  const userById = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      {/* Top stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Clocked in now"
          value={String(clockedInNow)}
          accent={clockedInNow > 0 ? 'success' : 'muted'}
        />
        <StatCard
          label="Active in range"
          value={`${activeCount} / ${users.length}`}
          accent="muted"
        />
        <StatCard
          label="Total team hours"
          value={formatDuration(grandTotal)}
          accent="muted"
        />
      </div>

      <section
        aria-labelledby="admin-team-heading"
        className="bg-card border rounded-xl shadow-sm overflow-hidden"
      >
        <header className="p-5 border-b space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="admin-team-heading"
                className="text-base font-semibold tracking-tight"
              >
                Team hours
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 tabular">
                {formatDate(from)} → {formatDate(to)}
              </p>
            </div>
          </div>

          {/* Range filter — uses GET params, no client JS needed. */}
          <form method="get" className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-40">
              <label htmlFor="range" className="text-xs text-muted-foreground">
                Range
              </label>
              <select
                id="range"
                name="range"
                defaultValue={range}
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                className="mt-1 h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
                className="mt-1 h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <button
              type="submit"
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              Apply
            </button>
            <Link
              href="/attendance"
              className="h-9 inline-flex items-center px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
            >
              Reset
            </Link>
          </form>
        </header>

        {users.length === 0 ? (
          <EmptyState
            icon={<UserIcon className="w-6 h-6" />}
            title="No team members yet"
            description="Invite users from the Supabase dashboard."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b bg-subtle/50">
                    <th className="text-left font-medium px-5 py-2.5">Member</th>
                    <th className="text-left font-medium px-5 py-2.5">Today</th>
                    <th className="text-left font-medium px-5 py-2.5">Status</th>
                    <th className="text-right font-medium px-5 py-2.5">Days worked</th>
                    <th className="text-right font-medium px-5 py-2.5">Total hours</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ user, total, closed, todayLog, open }) => (
                    <tr
                      key={user.id}
                      className="border-b last:border-0 transition-colors hover:bg-subtle/50"
                    >
                      <td className="px-5 py-3">
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
                            <div className="text-xs text-muted-foreground capitalize">
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
                      <td className="px-5 py-3 text-right tabular text-foreground/90">
                        {closed}
                      </td>
                      <td className="px-5 py-3 text-right tabular font-semibold">
                        {formatDuration(total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="md:hidden divide-y">
              {rows.map(({ user, total, closed, todayLog, open }) => (
                <li key={user.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        fullName={user.full_name}
                        id={user.id}
                        url={user.avatar_url}
                        size={36}
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.full_name || '—'}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {user.role} · {closed}{' '}
                          {closed === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold tabular text-sm">
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
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Recent activity feed */}
      <section
        aria-labelledby="recent-activity-heading"
        className="bg-card border rounded-xl shadow-sm overflow-hidden"
      >
        <header className="p-5 border-b">
          <h2
            id="recent-activity-heading"
            className="text-base font-semibold tracking-tight"
          >
            Recent activity
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 10 clock-in events across the team
          </p>
        </header>

        {recent.length === 0 ? (
          <EmptyState
            icon={<UserIcon className="w-6 h-6" />}
            title="No activity yet"
            description="Once your team starts clocking in, the latest events will show up here."
          />
        ) : (
          <ul className="divide-y">
            {recent.map((log) => {
              const u = userById.get(log.user_id);
              return (
                <li
                  key={log.id}
                  className="p-4 flex items-center gap-3 transition-colors hover:bg-subtle/50"
                >
                  <Avatar
                    fullName={u?.full_name ?? '—'}
                    id={log.user_id}
                    url={u?.avatar_url ?? null}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {u?.full_name ?? 'Unknown user'}
                    </div>
                    <div className="text-xs text-muted-foreground tabular">
                      {formatDate(log.clock_in)} · {formatTime(log.clock_in)}
                      {log.clock_out
                        ? ` → ${formatTime(log.clock_out)}`
                        : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold tabular">
                      {formatDuration(log.duration_minutes)}
                    </div>
                    {!log.clock_out ? <InProgressPill /> : null}
                  </div>
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

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'success' | 'muted';
}) {
  return (
    <div className="bg-card border rounded-xl px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`text-2xl font-semibold tabular tracking-tight ${
          accent === 'success' ? 'text-success' : 'text-foreground'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function InProgressPill() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
      <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />
      In progress
    </span>
  );
}
