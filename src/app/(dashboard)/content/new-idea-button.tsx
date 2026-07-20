'use client';

import { useState } from 'react';
import { IdeaModal } from './idea-modal';
import { PlusIcon } from '@/components/icons';
import type { User } from '@/types/database';

/**
 * "+ New idea" button used in the page header. The per-column + buttons
 * are rendered inside KanbanBoard itself (they know the column's stage).
 */
export function NewIdeaButton({
  members,
  currentUserId,
  isAdmin,
  primary = false,
}: {
  members?: User[];
  currentUserId?: string;
  isAdmin?: boolean;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-blue transition-all hover:-translate-y-0.5 hover:bg-primary-hover ${
          primary ? 'h-11' : 'h-10'
        }`}
      >
        <span className="grid h-5 w-5 place-items-center rounded-md bg-white/20 transition-transform group-hover:rotate-90">
          <PlusIcon className="h-3.5 w-3.5" />
        </span>
        <span>New idea</span>
      </button>

      {open && members && currentUserId ? (
        <IdeaModal
          mode="create"
          defaultStage="idea"
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin ?? false}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
