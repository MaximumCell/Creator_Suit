'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addChannel, type YouTubeActionState } from './actions';
import { FilmIcon, PlusIcon } from '@/components/icons';

const initialState: YouTubeActionState = {};

export function AddChannelForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(addChannel, initialState);
  const [open, setOpen] = useState(false);
  // Controlled input so we can disable Cancel while the user has typed
  // something — avoids silently throwing away their work.
  const [value, setValue] = useState('');
  // Track the last server response we already reacted to, so we only close
  // the form once per success (the action returns a new object each time).
  const [lastSeen, setLastSeen] = useState<YouTubeActionState>(initialState);

  // Derived close: when the action reports a new success, close + clear the
  // input during render. React allows setState in render as long as the
  // condition is bounded — `state !== lastSeen` guarantees this only runs
  // once per response.
  if (state !== lastSeen) {
    setLastSeen(state);
    if (state.ok) {
      setOpen(false);
      setValue('');
    }
  }

  // Side effect: refresh server data after a successful add. This must be
  // in an effect — router.refresh() can't run during render (it would update
  // a different component while we're rendering).
  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
    // We only want to refresh on a fresh success, but `state` is a stable
    // reference per response so this fires exactly once per add.
  }, [state, router]);

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

  const hasText = value.trim().length > 0;

  return (
    <form action={formAction} className="bg-card border rounded-xl p-4 space-y-3">
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://www.youtube.com/@mkbhd or UC…"
          className="flex-1 h-9 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={hasText || isPending}
            title={
              hasText
                ? 'Clear the input first to cancel'
                : isPending
                ? 'Adding…'
                : 'Close'
            }
            className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-subtle disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
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
