'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { refreshAllChannels } from './actions';

export function RefreshButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const result = await refreshAllChannels();
      if (result.error) {
        setError(result.error);
      } else {
        const r = result.refreshed ?? 0;
        const f = result.failed ?? 0;
        setSummary(
          f > 0
            ? `Refreshed ${r} channel${r === 1 ? '' : 's'}, ${f} failed`
            : `Refreshed ${r} channel${r === 1 ? '' : 's'}`,
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending || disabled}
        title="Fetch latest stats from YouTube for every tracked channel"
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-card text-sm font-medium hover:bg-subtle disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? <Spinner /> : <RefreshIcon className="w-4 h-4" />}
        {pending ? 'Refreshing…' : 'Refresh all'}
      </button>
      {error ? (
        <p className="text-xs text-danger max-w-xs text-right">{error}</p>
      ) : null}
      {summary ? (
        <p className="text-xs text-muted-foreground">{summary}</p>
      ) : null}
    </div>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
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
