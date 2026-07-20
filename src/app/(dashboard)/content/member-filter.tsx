'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { User } from '@/types/database';

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
    <div className="flex items-center gap-2">
      <label
        htmlFor="member-filter"
        className="text-xs text-muted-foreground whitespace-nowrap"
      >
        Filter by:
      </label>
      <select
        id="member-filter"
        value={current}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
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
