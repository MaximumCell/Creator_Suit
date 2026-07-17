import { EmptyState } from '@/components/empty-state';
import { HourglassIcon, KanbanIcon } from '@/components/icons';

export default function ContentPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-foreground">
          <KanbanIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kanban board: idea → final → shooting → posted.
          </p>
        </div>
      </header>

      <div className="mt-8 bg-card border rounded-xl shadow-sm">
        <EmptyState
          icon={<HourglassIcon className="w-6 h-6" />}
          title="Coming in Step 3"
          description="The content_ideas table is already in place. The kanban board, card creation, and drag-and-drop will land in the next build."
        />
      </div>
    </div>
  );
}
