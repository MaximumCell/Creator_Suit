'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { clockIn, clockOut } from '@/app/(dashboard)/attendance/actions';
import { formatDate, formatDuration, formatElapsed, formatTime } from '@/lib/time';
import { CheckIcon, ClockIcon } from './icons';

type TodayLog = {
  id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
} | null;

type AutoClosed = {
  id: string;
  date: string;
  clock_out: string;
} | null;

export function ClockWidget({
  isAdmin,
  todayLog,
  autoClosed,
  serverNow,
}: {
  isAdmin: boolean;
  todayLog: TodayLog;
  autoClosed: AutoClosed;
  /** Unix ms at SSR time. Used so the very first client render matches
   *  the server HTML and avoids a hydration mismatch on the ticking clock. */
  serverNow: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<AutoClosed>(autoClosed);
  // Seed from the server timestamp so SSR and the first client render agree.
  // The effect below immediately overwrites this with the client's clock.
  const [now, setNow] = useState<number>(serverNow);

  // Tick once per second on the client so the running duration stays current.
  useEffect(() => {
    setNow(Date.now());
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
        else {
          if (result.autoClosed) setBanner(result.autoClosed);
          router.refresh();
        }
      });
      return;
    }
    if (!isFresh) return; // done state — button is disabled, but be defensive
    startTransition(async () => {
      const result = await clockIn();
      if (result.error) setError(result.error);
      else {
        if (result.autoClosed) setBanner(result.autoClosed);
        router.refresh();
      }
    });
  }

  return (
    <section
      aria-labelledby="clock-heading"
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <h2
          id="clock-heading"
          className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
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
        <span
          className="text-4xl font-semibold tabular tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-varela-round)' }}
        >
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
        className={`mt-5 inline-flex w-full sm:w-auto sm:min-w-48 items-center justify-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 ${
          isOpen
            ? 'bg-danger text-danger-foreground shadow-md hover:bg-danger-hover'
            : isDone
            ? 'bg-success-soft text-success'
            : 'bg-primary text-primary-foreground shadow-blue hover:bg-primary-hover'
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

      {banner ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2.5 text-xs text-muted-foreground rounded-xl border border-border bg-surface-2 px-3 py-2.5"
        >
          <ClockIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            Forgot to clock out on{' '}
            <span className="text-foreground font-medium">
              {formatDate(banner.clock_out)}
            </span>
            ? Auto-closed that session at{' '}
            <span className="text-foreground font-medium tabular">
              {formatTime(banner.clock_out)}
            </span>{' '}
            so you could start fresh today.
          </p>
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm text-danger bg-danger-soft border border-danger/30 rounded-xl px-3 py-2"
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
