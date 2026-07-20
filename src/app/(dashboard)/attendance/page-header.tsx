'use client';

import { ClockIcon } from '@/components/icons';
import { useReveal } from '@/lib/animations';

interface Props {
  displayName: string;
  isAdmin: boolean;
  /** Number of team members currently clocked in (admin only). */
  clockedInNow?: number;
  /** Total team size (admin only). */
  teamSize?: number;
}

export function PageGreeting({
  displayName,
  isAdmin,
  clockedInNow,
  teamSize,
}: Props) {
  const ref = useReveal<HTMLDivElement>(0.2);

  const greeting = timeOfDayGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header
      ref={ref}
      className="fade-up flex flex-wrap items-center justify-between gap-3 opacity-0"
    >
      <div className="flex items-center gap-3">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-blue">
          <ClockIcon className="h-5 w-5" />
          <span
            aria-hidden
            className="absolute -inset-0.5 rounded-2xl bg-primary/20 blur-md"
          />
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-varela-round)' }}
          >
            {greeting}, {displayName.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAdmin
              ? `Here's how the team is doing today — ${today}.`
              : `Here's where you stand today — ${today}.`}
          </p>
        </div>
      </div>

      {isAdmin && typeof clockedInNow === 'number' && typeof teamSize === 'number' ? (
        <TeamLiveBadge live={clockedInNow} total={teamSize} />
      ) : null}
    </header>
  );
}

function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function TeamLiveBadge({ live, total }: { live: number; total: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            live > 0 ? 'bg-success' : 'bg-muted-foreground'
          }`}
        />
      </span>
      <span className="font-medium text-foreground tabular">
        {live} of {total} clocked in
      </span>
    </div>
  );
}
