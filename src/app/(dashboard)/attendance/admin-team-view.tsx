import Link from 'next/link';
import type { AttendanceLog, User } from '@/types/database';
import { formatDate, formatDuration, sumMinutes } from '@/lib/time';

type RangeKey = 'last7' | 'last30' | 'thismonth' | 'custom';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thismonth', label: 'This month' },
  { value: 'custom', label: 'Custom range' },
];

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
    const open = userLogs.find((l) => l.clock_out == null) ?? null;
    return { user: u, logs: userLogs, total, closed, open };
  });

  const grandTotal = rows.reduce((acc, r) => acc + r.total, 0);
  const activeCount = rows.filter((r) => r.total > 0).length;

  return (
    <section
      aria-labelledby="admin-team-heading"
      className="bg-card border rounded-xl shadow-sm"
    >
      <header className="p-5 border-b space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="admin-team-heading"
              className="text-base font-semibold"
            >
              Team hours
            </h2>
            <p className="text-xs text-muted">
              {formatDate(from)} → {formatDate(to)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted text-xs">Total team hours:</span>
            <span className="font-semibold tabular-nums">
              {formatDuration(grandTotal)}
            </span>
            <span className="text-muted text-xs ml-2">
              · {activeCount} active
            </span>
          </div>
        </div>

        {/* Range filter — uses GET params, no client JS needed. */}
        <form
          method="get"
          className="flex flex-wrap items-end gap-2"
        >
          <div className="flex-1 min-w-40">
            <label htmlFor="range" className="text-xs text-muted">
              Range
            </label>
            <select
              id="range"
              name="range"
              defaultValue={range}
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="from" className="text-xs text-muted">
              From
            </label>
            <input
              id="from"
              type="date"
              name="from"
              defaultValue={from}
              className="mt-1 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="to" className="text-xs text-muted">
              To
            </label>
            <input
              id="to"
              type="date"
              name="to"
              defaultValue={to}
              className="mt-1 rounded-md border bg-background px-3 py-1.5 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-primary text-white px-4 py-1.5 text-sm font-medium hover:bg-primary-hover"
          >
            Apply
          </button>
          <Link
            href="/attendance"
            className="text-sm text-muted hover:text-foreground px-2 py-1.5"
          >
            Reset
          </Link>
        </form>
      </header>

      {users.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted">
          No team members yet. Invite users from the Supabase dashboard.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr className="border-b">
                  <th className="text-left font-medium px-5 py-2.5">Member</th>
                  <th className="text-left font-medium px-5 py-2.5">Role</th>
                  <th className="text-right font-medium px-5 py-2.5">Days worked</th>
                  <th className="text-right font-medium px-5 py-2.5">Total hours</th>
                  <th className="text-left font-medium px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ user, total, closed, open }) => (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium uppercase">
                          {(user.full_name || user.id).slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.full_name || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs uppercase tracking-wide text-muted">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {closed}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-medium">
                      {formatDuration(total)}
                    </td>
                    <td className="px-5 py-3">
                      {open ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                          In progress
                        </span>
                      ) : total > 0 ? (
                        <span className="text-xs text-muted">Done</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="md:hidden divide-y">
            {rows.map(({ user, total, closed, open }) => (
              <li key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">
                      {user.full_name || '—'}
                    </div>
                    <div className="text-xs text-muted capitalize">
                      {user.role} · {closed}{' '}
                      {closed === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums text-sm">
                      {formatDuration(total)}
                    </div>
                    {open ? (
                      <div className="text-xs text-success">In progress</div>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
