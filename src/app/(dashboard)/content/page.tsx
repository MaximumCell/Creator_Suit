import { createClient } from '@/lib/supabase/server';
import { KanbanBoard, type IdeaView } from './kanban-board';
import { MemberFilter } from './member-filter';
import { EmptyState } from '@/components/empty-state';
import { KanbanIcon } from '@/components/icons';
import type { ContentIdea, User } from '@/types/database';
import { Suspense } from 'react';
import { NewIdeaButton } from './new-idea-button';

export const metadata = { title: 'Content Pipeline · CreatorSuit' };

interface SearchParams {
  member?: string;
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, role, avatar_url, created_at')
    .eq('id', authUser.id)
    .single<User>();
  if (!profile) return null;
  const isAdmin = profile.role === 'admin';

  // Pull all ideas + all team members in parallel.
  const [ideasRes, membersRes] = await Promise.all([
    supabase
      .from('content_ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<ContentIdea[]>(),
    supabase
      .from('users')
      .select('id, full_name, role, avatar_url, created_at')
      .order('full_name')
      .returns<User[]>(),
  ]);

  const allIdeas: IdeaView[] = ideasRes.data ?? [];
  const members: User[] = membersRes.data ?? [];

  // Apply member filter if present.
  const filteredIdeas: IdeaView[] = sp.member
    ? allIdeas.filter((i) => i.assigned_to === sp.member)
    : allIdeas;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-subtle flex items-center justify-center text-foreground">
            <KanbanIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Content Pipeline
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Drag ideas between stages, or click one to edit.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense fallback={null}>
            <MemberFilter members={members} />
          </Suspense>
          <NewIdeaButton
            members={members}
            currentUserId={profile.id}
            isAdmin={isAdmin}
          />
        </div>
      </header>

      {filteredIdeas.length === 0 && allIdeas.length === 0 ? (
        <div className="bg-card border rounded-xl shadow-sm">
          <EmptyState
            icon={<KanbanIcon className="w-6 h-6" />}
            title="No ideas yet"
            description="Click the + button above (or any column) to add your first content idea."
            action={
              <NewIdeaButton
                primary
                members={members}
                currentUserId={profile.id}
                isAdmin={isAdmin}
              />
            }
          />
        </div>
      ) : (
        <KanbanBoard
          ideas={filteredIdeas}
          members={members}
          currentUserId={profile.id}
          isAdmin={isAdmin}
        />
      )}

      {filteredIdeas.length === 0 && allIdeas.length > 0 ? (
        <p className="text-sm text-muted-foreground text-center">
          No ideas match this filter.{' '}
          <a
            href="/content"
            className="text-accent hover:underline font-medium"
          >
            Clear filter
          </a>
        </p>
      ) : null}
    </div>
  );
}
