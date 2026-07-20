'use client';

/**
 * Features section — three large colorful "course-style" cards, one per module.
 * Each card uses a different accent color (matching the screenshot aesthetic).
 * Cards have a cursor-tracking radial glow + scroll-reveal entrance.
 */
import { ClockIcon, PlayIcon, KanbanIcon, ArrowRightIcon } from '@/components/icons';
import { useReveal, useMouseGlow } from '@/lib/animations';
import type { SVGProps } from 'react';

type Icon = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

interface Feature {
  color: string;
  colorSoft: string;
  icon: Icon;
  title: string;
  blurb: string;
  bullets: string[];
  metric: string;
  metricLabel: string;
}

const features: Feature[] = [
  {
    color: '#3b82f6',
    colorSoft: '#dbeafe',
    icon: ClockIcon,
    title: 'Attendance',
    blurb:
      'One-tap clock in/out with auto-close for forgotten sessions. Admins get a live team view.',
    bullets: [
      'Auto-close stale sessions at 23:59',
      'Personal 30-day log + CSV export',
      'Admin: who is live, today, this week',
    ],
    metric: '~12 sec',
    metricLabel: 'to clock in',
  },
  {
    color: '#ec4899',
    colorSoft: '#fce7f3',
    icon: PlayIcon,
    title: 'YouTube analytics',
    blurb:
      'OAuth-connected analytics, growth deltas, top videos, and per-channel tracking for the brands you operate.',
    bullets: [
      'Analytics API + Data API fallback',
      'Views, watch time, revenue, CTR',
      'Track any public or owned channel',
    ],
    metric: '24/7',
    metricLabel: 'live sync',
  },
  {
    color: '#f59e0b',
    colorSoft: '#fef3c7',
    icon: KanbanIcon,
    title: 'Content pipeline',
    blurb:
      'Five-stage kanban from idea to posted. Drag-and-drop, member filter, due dates, and audit trail.',
    bullets: [
      '5 stages: Idea → Posted',
      'Drag-and-drop, edit in place',
      'Per-member filtering',
    ],
    metric: '5 stages',
    metricLabel: 'end to end',
  },
];

export function LandingFeatures() {
  const headerRef = useReveal<HTMLDivElement>(0.2);

  return (
    <section id="features" className="px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div ref={headerRef} className="mx-auto max-w-2xl text-center opacity-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Features
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Three modules. One calm workspace.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Every tool the team needs to log hours, track growth, and ship content
            — designed to fade into the background so the work stays front and center.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <FeatureCard key={f.title} feature={f} Icon={Icon} delay={i * 80} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  Icon,
  delay,
}: {
  feature: Feature;
  Icon: Icon;
  delay: number;
}) {
  const revealRef = useReveal<HTMLDivElement>(0.15);
  const glowRef = useMouseGlow<HTMLDivElement>();
  return (
    <div
      ref={revealRef}
      className="opacity-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <article
        ref={glowRef}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        {/* Cursor-tracking radial glow — appears on hover, follows the mouse. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(360px circle at var(--x, 50%) var(--y, 50%), ${feature.color}1F, transparent 60%)`,
          }}
        />
        {/* Soft accent glow on hover (top-right) */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ background: feature.color }}
        />

        <div
          className="grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: feature.colorSoft, color: feature.color }}
        >
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="mt-5 text-lg font-bold tracking-tight">{feature.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {feature.blurb}
        </p>

        <ul className="mt-4 space-y-1.5">
          {feature.bullets.map((b: string) => (
            <li
              key={b}
              className="flex items-start gap-2 text-sm text-foreground/80"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: feature.color }}
              />
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-end justify-between border-t border-border pt-4">
          <div>
            <div
              className="text-2xl font-bold leading-none tabular"
              style={{ color: feature.color, fontFamily: 'var(--font-varela-round)' }}
            >
              {feature.metric}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {feature.metricLabel}
            </div>
          </div>
          <a
            href="#workflow"
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground transition-colors hover:text-primary"
          >
            Learn more
            <ArrowRightIcon className="h-3 w-3" />
          </a>
        </div>
      </article>
    </div>
  );
}
