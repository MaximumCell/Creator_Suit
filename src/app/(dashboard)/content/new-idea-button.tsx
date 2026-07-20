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
        className={
          primary
            ? 'inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors'
            : 'inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors'
        }
      >
        <PlusIcon className="w-4 h-4" />
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
