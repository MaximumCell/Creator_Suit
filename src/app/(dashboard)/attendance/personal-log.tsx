import type { AttendanceLog } from '@/types/database';
import {
  formatDate,
  formatDuration,
  formatTime,
  sumMinutes,
} from '@/lib/time';

export function PersonalLog({ logs }: { logs: AttendanceLog[] }) {
  const totalMinutes = sumMinutes(logs);
  const closed = logs.filter((l) => l.clock_out != null).length;
  const open = logs.length - closed;

  return (
    <section
      aria-labelledby="personal-log-heading"
      className="bg-card border rounded-xl shadow-sm"
    >
      <header className="p-5 border-b flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="personal-log-heading"
            className="text-base font-semibold"
          >
            Your working hours
          </h2>
          <p className="text-xs text-muted">
            Last 30 days
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-muted text-xs">Total</div>
          <div className="font-semibold tabular-nums">
            {formatDuration(totalMinutes)}
          </div>
        </div>
      </header>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted">
          No entries yet. Clock in to start tracking your hours.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted">
                <tr className="border-b">
                  <th className="text-left font-medium px-5 py-2.5">Date</th>
                  <th className="text-left font-medium px-5 py-2.5">Clock in</th>
                  <th className="text-left font-medium px-5 py-2.5">Clock out</th>
                  <th className="text-right font-medium px-5 py-2.5">Hours</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-2.5">{formatDate(l.clock_in)}</td>
                    <td className="px-5 py-2.5 tabular-nums">
                      {formatTime(l.clock_in)}
                    </td>
                    <td className="px-5 py-2.5 tabular-nums">
                      {l.clock_out ? formatTime(l.clock_out) : (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                          In progress
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums">
                      {formatDuration(l.duration_minutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="sm:hidden divide-y">
            {logs.map((l) => (
              <li key={l.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {formatDate(l.clock_in)}
                  </div>
                  <div className="text-xs text-muted tabular-nums mt-0.5">
                    {formatTime(l.clock_in)} →{' '}
                    {l.clock_out ? formatTime(l.clock_out) : 'in progress'}
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">
                  {formatDuration(l.duration_minutes)}
                </div>
              </li>
            ))}
          </ul>

          <footer className="px-5 py-3 border-t text-xs text-muted flex justify-between">
            <span>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              {open > 0 ? ` · ${open} open` : ''}
            </span>
            <span className="hidden sm:inline">
              {closed} completed
            </span>
          </footer>
        </>
      )}
    </section>
  );
}
