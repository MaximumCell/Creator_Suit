import { EmptyState } from '@/components/empty-state';
import { FilmIcon, HourglassIcon } from '@/components/icons';

export default function YoutubePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-foreground">
          <FilmIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">YouTube Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track subscribers, views, and growth across channels.
          </p>
        </div>
      </header>

      <div className="mt-8 bg-card border rounded-xl shadow-sm">
        <EmptyState
          icon={<HourglassIcon className="w-6 h-6" />}
          title="Coming in Step 2"
          description="The youtube_channels and youtube_stats_snapshots tables are already in place. The dashboard, add-channel flow, and growth indicators will land in the next build."
        />
      </div>
    </div>
  );
}
