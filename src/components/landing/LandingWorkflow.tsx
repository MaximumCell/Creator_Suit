'use client';

/**
 * How it works — 3-step workflow section. Reveals on scroll. The step
 * cards have a small "glow" indicator that pulses on hover.
 */
import { useReveal } from '@/lib/animations';

interface Step {
  n: number;
  color: string;
  colorSoft: string;
  title: string;
  body: string;
}

const steps: Step[] = [
  {
    n: 1,
    color: '#3b82f6',
    colorSoft: '#dbeafe',
    title: 'Sign in with your Aaghaz email',
    body: 'Supabase auth with email + password. Admins unlock the team view automatically.',
  },
  {
    n: 2,
    color: '#ec4899',
    colorSoft: '#fce7f3',
    title: 'Connect your work',
    body: 'Clock in to start your day. Connect your YouTube brand channel to pull analytics.',
  },
  {
    n: 3,
    color: '#10b981',
    colorSoft: '#d1fae5',
    title: 'Ship, track, repeat',
    body: 'Move ideas through the pipeline. Watch growth deltas land in real time. Stay in flow.',
  },
];

export function LandingWorkflow() {
  const headerRef = useReveal<HTMLDivElement>(0.2);

  return (
    <section id="workflow" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div ref={headerRef} className="mx-auto max-w-2xl text-center opacity-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            From zero to insight in under a minute.
          </h2>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          {/* Dashed connector on desktop */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-border md:block"
          />
          {steps.map((s, i) => (
            <StepCard key={s.n} step={s} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, delay }: { step: Step; delay: number }) {
  const ref = useReveal<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className="relative flex flex-col rounded-2xl border border-border bg-surface p-6 opacity-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="grid h-14 w-14 place-items-center rounded-2xl text-base font-bold"
        style={{ background: step.colorSoft, color: step.color }}
      >
        {step.n}
      </div>
      <h3 className="mt-5 text-base font-bold tracking-tight">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>
      <span
        aria-hidden
        className="absolute right-5 top-5 h-2 w-2 rounded-full pulse-glow"
        style={{ background: step.color }}
      />
    </div>
  );
}
