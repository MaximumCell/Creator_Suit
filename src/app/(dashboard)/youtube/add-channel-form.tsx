'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addChannel, type YouTubeActionState } from './actions';
import { FilmIcon, PlusIcon } from '@/components/icons';

const initialState: YouTubeActionState = {};

export function AddChannelForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(addChannel, initialState);
  const [open, setOpen] = useState(false);
  // Keep the input across submits by using a key trick after success.
  const [resetKey, setResetKey] = useState(0);

  // Close the form + clear input on successful add.
  if (state.ok && open) {
    setOpen(false);
    setResetKey((k) => k + 1);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        <span>Add channel</span>
      </button>
    );
  }

  return (
    <form
      key={resetKey}
      action={formAction}
      className="bg-card border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <FilmIcon className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Add a YouTube channel</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a channel URL, handle, or raw ID. We&apos;ll fetch the latest stats
        from YouTube immediately.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          name="channel"
          type="text"
          required
          autoFocus
          placeholder="https://www.youtube.com/@mkbhd or UC…"
          className="flex-1 h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-subtle transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover disabled:opacity-60 transition-colors"
          >
            {isPending ? <Spinner /> : null}
            {isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>
      {state.error ? (
        <p
          role="alert"
          className="text-sm text-danger bg-danger-soft border border-danger/30 rounded-md px-3 py-2"
        >
          {state.error}
        </p>
      ) : null}
    </form>
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
