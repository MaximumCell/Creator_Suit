'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clockIn, clockOut } from '@/app/(dashboard)/attendance/actions';
import { formatDuration, formatElapsed, formatTime } from '@/lib/time';
import { CheckIcon, ClockIcon } from './icons';

type TodayLog = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
} | null;

export function ClockWidget({
  isAdmin,
  todayLog,
}: {
  isAdmin: boolean;
  todayLog: TodayLog;
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

  // Three states:
  //   open   = user has an open session right now
  //   done   = user clocked in and out already today
  //   fresh  = no session today at all
  const isOpen = todayLog != null && todayLog.clock_out == null;
  const isDone = todayLog != null && todayLog.clock_out != null;
  const isFresh = todayLog == null;

  const displayTime = isOpen
    ? formatElapsed(todayLog!.clock_in, now)
    : isDone
    ? formatDuration(todayLog!.duration_minutes)
    : '—';

  function handleClick() {
    setError(null);
    if (isOpen) {
      startTransition(async () => {
        const result = await clockOut();
        if (result.error) setError(result.error);
        else router.refresh();
      });
      return;
    }
    if (!isFresh) return; // done state — button is disabled, but be defensive
    startTransition(async () => {
      const result = await clockIn();
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <section
      aria-labelledby="clock-heading"
      className="bg-card border rounded-xl p-5 sm:p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="clock-heading"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Today
        </h2>
        {isOpen ? (
          <StatusPill tone="success" dot>
            Live
          </StatusPill>
        ) : isDone ? (
          <StatusPill tone="success" icon={<CheckIcon className="w-3 h-3" />}>
            Done
          </StatusPill>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-3 flex-wrap">
        <span className="text-4xl sm:text-5xl font-semibold tabular tracking-tight">
          {isOpen || isDone ? displayTime : 'Off the clock'}
        </span>
      </div>

      <p className="text-sm text-muted-foreground mt-1.5">
        {isOpen ? (
          <>
            Clocked in at{' '}
            <span className="text-foreground font-medium tabular">
              {formatTime(todayLog!.clock_in)}
            </span>
            {isAdmin ? ' (your own clock-in)' : ''}
          </>
        ) : isDone ? (
          <>
            Clocked in at{' '}
            <span className="text-foreground font-medium tabular">
              {formatTime(todayLog!.clock_in)}
            </span>{' '}
            →{' '}
            <span className="text-foreground font-medium tabular">
              {formatTime(todayLog!.clock_out)}
            </span>
          </>
        ) : (
          'Tap below when you start your day.'
        )}
      </p>

      <button
        onClick={handleClick}
        disabled={pending || isDone}
        className={`mt-5 w-full sm:w-auto sm:min-w-48 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isOpen
            ? 'bg-danger text-danger-foreground hover:bg-danger-hover'
            : isDone
            ? 'bg-success-soft text-success'
            : 'bg-accent text-accent-foreground hover:bg-accent-hover'
        }`}
      >
        {pending ? (
          <Spinner />
        ) : isDone ? (
          <CheckIcon className="w-4 h-4" />
        ) : (
          <ClockIcon className="w-4 h-4" />
        )}
        <span>
          {pending
            ? 'Saving…'
            : isOpen
            ? 'Clock out'
            : isDone
            ? 'Clocked in for today'
            : 'Clock in'}
        </span>
      </button>

      {isOpen ? (
        <p className="text-xs text-muted-foreground mt-3 tabular">
          {formatDuration(
            Math.floor((now - new Date(todayLog!.clock_in).getTime()) / 60_000),
          )}{' '}
          so far
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

function StatusPill({
  tone,
  children,
  dot,
  icon,
}: {
  tone: 'success' | 'muted';
  children: React.ReactNode;
  dot?: boolean;
  icon?: React.ReactNode;
}) {
  const cls =
    tone === 'success' ? 'text-success' : 'text-muted-foreground';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${cls}`}
    >
      {dot ? <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" /> : null}
      {icon}
      {children}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="4"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}
