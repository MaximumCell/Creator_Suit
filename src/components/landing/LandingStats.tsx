'use client';

/**
 * Stats strip — 4 numbers in soft cards. Numbers count up once the strip
 * scrolls into view (useCountUp). Soft card reveals as a whole.
 */
import { useReveal, useCountUp, formatBig } from '@/lib/animations';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  accent: string;
}

const stats: Stat[] = [
  { label: 'Hours logged', value: 1200, suffix: '+', accent: '#3b82f6' },
  { label: 'YouTube data points', value: 50000, suffix: '', accent: '#ec4899' },
  { label: 'Ideas shipped', value: 180, suffix: '+', accent: '#f59e0b' },
  { label: 'Team satisfaction', value: 49, suffix: '/50', accent: '#10b981' },
];

export function LandingStats() {
  const ref = useReveal<HTMLDivElement>(0.2);
  return (
    <section id="modules" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div
          ref={ref}
          className="rounded-2xl border border-border bg-surface p-6 opacity-0 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCell key={s.label} stat={s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCell({ stat }: { stat: Stat }) {
  // For small integers (like 49/50) we display raw; for big ones we use formatBig.
  const useFormatBig = stat.value >= 1000;
  const { n, ref } = useCountUp<HTMLDivElement>(stat.value);
  const display = useFormatBig ? formatBig(n) : n.toString();

  return (
    <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-1">
      <div
        ref={ref}
        className="text-3xl font-bold leading-none tabular sm:text-4xl"
        style={{ color: stat.accent, fontFamily: 'var(--font-varela-round)' }}
      >
        {display}
        {stat.suffix ? (
          <span className="ml-0.5 text-xl sm:text-2xl">{stat.suffix}</span>
        ) : null}
      </div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground sm:mt-1">
        {stat.label}
      </div>
    </div>
  );
}
