import type { AttendanceLog } from '@/types/database';
import {
  formatDate,
  formatDuration,
  formatTime,
  sumMinutes,
} from '@/lib/time';
import { EmptyState } from '@/components/empty-state';
import { ClockIcon } from '@/components/icons';

export function PersonalLog({ logs }: { logs: AttendanceLog[] }) {
  const totalMinutes = sumMinutes(logs);
  const closed = logs.filter((l) => l.clock_out != null).length;
  const open = logs.length - closed;

  return (
    <section
      aria-labelledby="personal-log-heading"
      className="bg-card border rounded-xl shadow-sm overflow-hidden"
    >
      <header className="p-5 border-b flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="personal-log-heading"
            className="text-base font-semibold tracking-tight"
          >
            Your working hours
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-lg font-semibold tabular tracking-tight">
            {formatDuration(totalMinutes)}
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
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b bg-subtle/50">
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
                    className="border-b last:border-0 transition-colors hover:bg-subtle/50"
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
                    <td className="px-5 py-3 text-right tabular font-medium">
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
              <li
                key={l.id}
                className="p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {formatDate(l.clock_in)}
                  </div>
                  <div className="text-xs text-muted-foreground tabular mt-0.5">
                    {formatTime(l.clock_in)} →{' '}
                    {l.clock_out ? formatTime(l.clock_out) : 'in progress'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular">
                    {formatDuration(l.duration_minutes)}
                  </div>
                  {!l.clock_out ? <InProgressPill /> : null}
                </div>
              </li>
            ))}
          </ul>

          <footer className="px-5 py-2.5 border-t bg-subtle/30 text-xs text-muted-foreground flex justify-between">
            <span>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
              {open > 0 ? ` · ${open} open` : ''}
            </span>
            <span className="hidden sm:inline">{closed} completed</span>
          </footer>
        </>
      )}
    </section>
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
