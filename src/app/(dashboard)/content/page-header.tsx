'use client';

import { KanbanIcon } from '@/components/icons';
import { useReveal } from '@/lib/animations';
import type { User } from '@/types/database';

interface Props {
  displayName: string;
  members: User[];
  overdueCount: number;
  totalCount: number;
}

export function ContentPageHeader({
  displayName,
  overdueCount,
  totalCount,
}: Props) {
  const ref = useReveal<HTMLDivElement>(0.2);
  return (
    <header
      ref={ref}
      className="fade-up flex flex-col gap-4 opacity-0 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-accent text-white shadow-md">
          <KanbanIcon className="h-5 w-5" />
          <span
            aria-hidden
            className="absolute -inset-0.5 rounded-2xl bg-secondary/30 blur-md"
          />
        </div>
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-varela-round)' }}
          >
            Content pipeline
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {totalCount === 0
              ? 'No ideas yet — drag to add your first one.'
              : `Drag ideas between stages, or click one to edit.${
                  overdueCount > 0
                    ? ` ${overdueCount} ${overdueCount === 1 ? 'idea is' : 'ideas are'} overdue.`
                    : ''
                }`}
          </p>
        </div>
      </div>
    </header>
  );
}
