'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  /** When true: shows the "Connect YouTube" CTA. Otherwise: shows the
   *  connected state with a "Disconnect" button. */
  connected: boolean;
  channelTitle: string | null;
}

export function ConnectButton({ connected, channelTitle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDisconnect() {
    if (!confirm(`Disconnect YouTube analytics for ${channelTitle ?? 'this channel'}? You'll need to reconnect to see analytics.`)) {
      return;
    }
    startTransition(async () => {
      await fetch('/api/youtube/oauth/disconnect', { method: 'POST' });
      router.refresh();
    });
  }

  if (connected) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-success-soft text-success text-sm font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-success live-dot" />
          Connected
          {channelTitle ? (
            <span className="text-muted-foreground font-normal hidden sm:inline">
              · {channelTitle}
            </span>
          ) : null}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={pending}
          className="inline-flex items-center h-9 px-3 rounded-md text-sm text-muted-foreground hover:bg-subtle disabled:opacity-60 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/youtube/oauth/start"
      className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-4 h-4"
        aria-hidden
      >
        <path d="M21.6 7.2s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C15.9 4 12 4 12 4s-3.9 0-6.8.3c-.4.1-1.3.1-2 .9-.6.6-.8 2-.8 2S2 8.8 2 10.4v1.4c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.3.9 1.6.2 6.7.3 6.7.3s3.9 0 6.8-.3c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.4c0-1.6-.2-3.2-.2-3.2zM9.9 13.6V8.2l5.2 2.7-5.2 2.7z" />
      </svg>
      Connect YouTube
    </a>
  );
}
