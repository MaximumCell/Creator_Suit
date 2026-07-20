import { createClient } from '@/lib/supabase/server';
import { KanbanBoard, type IdeaView } from './kanban-board';
import { MemberFilter } from './member-filter';
import { EmptyState } from '@/components/empty-state';
import { KanbanIcon } from '@/components/icons';
import type { ContentIdea, User } from '@/types/database';
import { Suspense } from 'react';
import { NewIdeaButton } from './new-idea-button';
import { ContentPageHeader } from './page-header';
import { ContentStats } from './content-stats';

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

  // Compute overdue count for the page subtitle.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = allIdeas.filter((i) => {
    if (!i.due_date || i.stage === 'posted') return false;
    return new Date(i.due_date) < today;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ContentPageHeader
          displayName={profile.full_name ?? 'there'}
          members={members}
          overdueCount={overdueCount}
          totalCount={allIdeas.length}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <MemberFilter members={members} />
          </Suspense>
          <NewIdeaButton
            members={members}
            currentUserId={profile.id}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {allIdeas.length > 0 ? <ContentStats ideas={allIdeas} /> : null}

      {filteredIdeas.length === 0 && allIdeas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface shadow-sm">
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
            className="font-medium text-primary hover:underline"
          >
            Clear filter
          </a>
        </p>
      ) : null}
    </div>
  );
}
