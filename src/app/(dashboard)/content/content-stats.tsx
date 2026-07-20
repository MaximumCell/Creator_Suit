'use client';

import { useEffect, useState } from 'react';
import {
  ClockIcon,
  FlameIcon,
  KanbanIcon,
  TrendUpIcon,
} from '@/components/icons';
import type { ContentIdea } from '@/types/database';

interface Props {
  ideas: ContentIdea[];
}

export function ContentStats({ ideas }: Props) {
  const total = ideas.length;
  const inProgress = ideas.filter(
    (i) => i.stage === 'shoot_edit' || i.stage === 'final',
  ).length;
  const posted = ideas.filter((i) => i.stage === 'posted').length;
  const overdue = ideas.filter((i) => {
    if (!i.due_date || i.stage === 'posted') return false;
    const d = new Date(i.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={<KanbanIcon className="h-4 w-4" />}
        label="In pipeline"
        value={total}
        tone="primary"
        accent="#3b82f6"
      />
      <StatCard
        icon={<FlameIcon className="h-4 w-4" />}
        label="In progress"
        value={inProgress}
        tone="warning"
        accent="#f59e0b"
      />
      <StatCard
        icon={<TrendUpIcon className="h-4 w-4" />}
        label="Posted"
        value={posted}
        tone="success"
        accent="#10b981"
      />
      <StatCard
        icon={<ClockIcon className="h-4 w-4" />}
        label="Overdue"
        value={overdue}
        tone="danger"
        accent="#ef4444"
        pulse={overdue > 0}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: 'primary' | 'warning' | 'success' | 'danger';
  accent: string;
  pulse?: boolean;
}

function StatCard({ icon, label, value, tone, accent, pulse }: StatCardProps) {
  const { display, ref } = useCountUp(value);
  const toneBg = {
    primary: 'bg-primary-soft',
    warning: 'bg-warning-soft',
    success: 'bg-success-soft',
    danger: 'bg-danger-soft',
  }[tone];
  const toneFg = {
    primary: 'text-primary',
    warning: 'text-warning',
    success: 'text-success',
    danger: 'text-danger',
  }[tone];
  return (
    <div className="fade-up group relative overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between">
        <div className={`grid h-8 w-8 place-items-center rounded-xl ${toneBg} ${toneFg}`}>
          {icon}
        </div>
        <div
          ref={ref}
          className={`flex items-baseline gap-1.5 text-2xl font-semibold tabular tracking-tight ${toneFg}`}
          style={{ fontFamily: 'var(--font-varela-round)' }}
        >
          {display}
          {pulse ? (
            <span
              className="relative inline-flex h-1.5 w-1.5"
              aria-label="Action needed"
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function useCountUp(target: number, durationMs = 800) {
  const [n, setN] = useState(0);
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el || typeof IntersectionObserver === 'undefined') {
      setN(target);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, target, durationMs]);
  return { display: n.toString(), ref: setEl };
}
