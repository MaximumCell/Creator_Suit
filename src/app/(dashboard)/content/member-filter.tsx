'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { User } from '@/types/database';
import { FilterIcon } from '@/components/icons';

/**
 * Filter dropdown that pushes ?member=<id|all> into the URL.
 * Server page reads the param and filters the kanban data.
 */
export function MemberFilter({ members }: { members: User[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const current = params.get('member') ?? 'all';

  function onChange(value: string) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('member');
    else next.set('member', value);
    const qs = next.toString();
    startTransition(() => {
      router.push(`/content${qs ? `?${qs}` : ''}`);
    });
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5 py-1 shadow-sm">
      <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
      <label htmlFor="member-filter" className="sr-only">
        Filter by member
      </label>
      <select
        id="member-filter"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="h-8 border-0 bg-transparent pr-7 text-sm font-medium text-foreground outline-none transition-opacity disabled:opacity-50 [background-image:none] focus:ring-0"
      >
        <option value="all">All members</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name || m.id}
          </option>
        ))}
      </select>
    </div>
  );
}
