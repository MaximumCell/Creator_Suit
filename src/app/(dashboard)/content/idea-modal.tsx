'use client';

import { useActionState, useEffect, useRef, useTransition } from 'react';
import {
  createIdea,
  deleteIdea,
  updateIdea,
  type IdeaActionState,
} from './actions';
import { STAGES, STAGE_LABELS } from './stages';
import type { ContentIdea, ContentStage, User } from '@/types/database';
import { TrashIcon, CloseIcon } from '@/components/icons';

const initialState: IdeaActionState = {};

export function IdeaModal({
  mode,
  idea,
  defaultStage,
  members,
  currentUserId,
  isAdmin,
  onClose,
}: {
  mode: 'create' | 'edit';
  idea?: ContentIdea;
  defaultStage?: ContentStage;
  members: User[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
}) {
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    // Focus the first input on open.
    firstFieldRef.current?.focus();
    // Lock body scroll while modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const isEdit = mode === 'edit';
  const canDelete = isEdit && idea && (isAdmin || idea.created_by === currentUserId);

  const [saveState, saveAction, savePending] = useActionState(
    isEdit ? updateIdea : createIdea,
    initialState,
  );

  // Success → close the modal.
  useEffect(() => {
    if (saveState.ok) onClose();
  }, [saveState, onClose]);

  function handleDelete() {
    if (!idea) return;
    if (!confirm(`Delete "${idea.title}"? This can't be undone.`)) return;
    const fd = new FormData();
    fd.set('id', idea.id);
    startDeleteTransition(async () => {
      const r = await deleteIdea(fd);
      if (!r.error) onClose();
      else alert(r.error);
    });
  }

  const [, startDeleteTransition] = useTransition();

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="idea-modal-title"
    >
      <div
        ref={panelRef}
        className="modal-panel w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form action={saveAction} className="flex flex-col">
          {isEdit && idea ? <input type="hidden" name="id" value={idea.id} /> : null}

          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2
                id="idea-modal-title"
                className="text-base font-semibold tracking-tight"
              >
                {isEdit ? 'Edit idea' : 'New idea'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-subtle transition-colors"
                aria-label="Close"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label htmlFor="title" className="text-sm font-medium block mb-1.5">
                Title
              </label>
              <input
                ref={firstFieldRef}
                id="title"
                name="title"
                required
                defaultValue={idea?.title}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="e.g. Behind the scenes of our latest shoot"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium block mb-1.5"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={idea?.description ?? ''}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="What is this video about?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="stage"
                  className="text-sm font-medium block mb-1.5"
                >
                  Stage
                </label>
                <select
                  id="stage"
                  name="stage"
                  defaultValue={idea?.stage ?? defaultStage ?? 'idea'}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="due_date"
                  className="text-sm font-medium block mb-1.5"
                >
                  Due date
                </label>
                <input
                  id="due_date"
                  type="date"
                  name="due_date"
                  defaultValue={idea?.due_date ?? ''}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="assigned_to"
                className="text-sm font-medium block mb-1.5"
              >
                Assigned to
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={idea?.assigned_to ?? ''}
                className="w-full h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.id}
                  </option>
                ))}
              </select>
            </div>

            {saveState.error ? (
              <p
                role="alert"
                className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2"
              >
                {saveState.error}
              </p>
            ) : null}
          </div>

          <footer className="border-t bg-subtle/30 px-5 py-3 flex items-center justify-between gap-2">
            {canDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={savePending}
                className="inline-flex items-center gap-1.5 text-sm text-danger hover:bg-danger-soft disabled:opacity-50 px-2.5 h-8 rounded-md transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savePending}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
              >
                {savePending ? <Spinner /> : null}
                {savePending
                  ? isEdit
                    ? 'Saving…'
                    : 'Creating…'
                  : isEdit
                  ? 'Save changes'
                  : 'Create idea'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="4"
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}
