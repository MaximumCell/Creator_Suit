'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clockIn, clockOut } from '@/app/(dashboard)/attendance/actions';
import { formatDuration, formatElapsed, formatTime } from '@/lib/time';

export function ClockWidget({
  isAdmin,
  openLog,
}: {
  isAdmin: boolean;
  openLog: { id: string; clock_in: string } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Initialise lazily so the first paint already shows a real timestamp.
  const [now, setNow] = useState<number>(() => Date.now());

  // Tick once per second on the client so the running duration stays current.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isClockedIn = openLog != null;
  const elapsed = isClockedIn ? formatElapsed(openLog.clock_in, now) : '—';

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = isClockedIn ? await clockOut() : await clockIn();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="clock-heading"
      className="bg-card border rounded-xl p-5 sm:p-6 shadow-sm"
    >
      <h2 id="clock-heading" className="text-sm font-medium text-muted">
        Today
      </h2>

      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl sm:text-4xl font-semibold tabular-nums">
          {isClockedIn ? elapsed : 'Off the clock'}
        </span>
        {isClockedIn ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-success">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live
          </span>
        ) : null}
      </div>

      <p className="text-sm text-muted mt-1">
        {isClockedIn ? (
          <>
            Clocked in at{' '}
            <span className="text-foreground font-medium">
              {formatTime(openLog!.clock_in)}
            </span>
            {isAdmin ? ' (showing your own clock-in)' : ''}
          </>
        ) : (
          'Tap below when you start your day.'
        )}
      </p>

      <button
        onClick={handleClick}
        disabled={pending}
        className={`mt-5 w-full sm:w-auto sm:min-w-48 py-2.5 px-5 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isClockedIn
            ? 'bg-danger text-white hover:bg-red-700'
            : 'bg-primary text-white hover:bg-primary-hover'
        }`}
      >
        {pending
          ? 'Saving…'
          : isClockedIn
          ? 'Clock out'
          : 'Clock in'}
      </button>

      {isClockedIn ? (
        <p className="text-xs text-muted mt-2">
          {formatDuration(
            Math.floor((now - new Date(openLog!.clock_in).getTime()) / 60_000),
          )}{' '}
          so far
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
