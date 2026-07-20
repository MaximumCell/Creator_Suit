'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Avatar } from '@/components/avatar';
import { PencilIcon, PlusIcon } from '@/components/icons';
import { changeStage, type IdeaActionState } from './actions';
import { STAGES, STAGE_LABELS } from './stages';
import { IdeaModal } from './idea-modal';
import type { ContentIdea, ContentStage, User } from '@/types/database';

export type IdeaView = ContentIdea;



export function KanbanBoard({
  ideas,
  members,
  currentUserId,
  isAdmin,
}: {
  ideas: IdeaView[];
  members: User[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<
    { mode: 'create'; stage: ContentStage } | { mode: 'edit'; idea: IdeaView } | null
  >(null);

  // Optimistic state — mirrors `ideas` but lets us re-order/move instantly
  // before the server action returns.
  type OptimisticAction = {
    type: 'move';
    ideaId: string;
    toStage: ContentStage;
  };
  const [optimisticIdeas, applyOptimistic] = useOptimistic<
    IdeaView[],
    OptimisticAction
  >(ideas, (state, action) => {
    if (action.type === 'move') {
      return state.map((i) =>
        i.id === action.ideaId ? { ...i, stage: action.toStage } : i,
      );
    }
    return state;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const ideaId = String(active.id);
    const toStage = String(over.id) as ContentStage;
    if (!STAGES.includes(toStage)) return;

    const current = optimisticIdeas.find((i) => i.id === ideaId);
    if (!current || current.stage === toStage) return;

    startTransition(async () => {
      applyOptimistic({ type: 'move', ideaId, toStage });
      const fd = new FormData();
      fd.set('id', ideaId);
      fd.set('stage', toStage);
      const result: IdeaActionState = await changeStage(fd);
      if (result.error) {
        // Revert by refreshing from server.
        router.refresh();
      }
    });
  }

  // Group ideas by stage.
  const byStage = Object.fromEntries(
    STAGES.map((s) => [s, [] as IdeaView[]]),
  ) as Record<ContentStage, IdeaView[]>;
  for (const idea of optimisticIdeas) {
    if (byStage[idea.stage]) byStage[idea.stage].push(idea);
  }

  const activeIdea = activeId
    ? optimisticIdeas.find((i) => i.id === activeId) ?? null
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              ideas={byStage[stage]}
              onAdd={() => setEditing({ mode: 'create', stage })}
              onEdit={(idea) => setEditing({ mode: 'edit', idea })}
              members={members}
            />
          ))}
        </div>

        <DragOverlay>
          {activeIdea ? (
            <div className="rotate-1 opacity-90 shadow-xl">
              <KanbanCard idea={activeIdea} members={members} dragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editing ? (
        <IdeaModal
          mode={editing.mode}
          idea={editing.mode === 'edit' ? editing.idea : undefined}
          defaultStage={editing.mode === 'create' ? editing.stage : undefined}
          members={members}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function Column({
  stage,
  ideas,
  onAdd,
  onEdit,
  members,
}: {
  stage: ContentStage;
  ideas: IdeaView[];
  onAdd: () => void;
  onEdit: (idea: IdeaView) => void;
  members: User[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`bg-subtle/50 rounded-xl p-3 min-h-[400px] flex flex-col transition-colors ${
        isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''
      }`}
    >
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight">
            {STAGE_LABELS[stage]}
          </h3>
          <span className="text-xs text-muted-foreground tabular bg-card px-1.5 py-0.5 rounded">
            {ideas.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-card transition-colors"
          title={`Add idea to ${STAGE_LABELS[stage]}`}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 min-h-[60px]">
        {ideas.map((idea) => (
          <DraggableCard
            key={idea.id}
            idea={idea}
            onEdit={() => onEdit(idea)}
            members={members}
          />
        ))}
        {ideas.length === 0 ? (
          <button
            onClick={onAdd}
            className="w-full text-xs text-muted-foreground hover:text-foreground border border-dashed rounded-lg py-6 hover:bg-card transition-colors"
          >
            + Add an idea
          </button>
        ) : null}
      </div>
    </div>
  );
}

function DraggableCard({
  idea,
  onEdit,
  members,
}: {
  idea: IdeaView;
  onEdit: () => void;
  members: User[];
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: idea.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      {...listeners}
    >
      <KanbanCard
        idea={idea}
        members={members}
        onClick={onEdit}
      />
    </div>
  );
}

function KanbanCard({
  idea,
  members,
  onClick,
  dragging = false,
}: {
  idea: IdeaView;
  members: User[];
  onClick?: () => void;
  dragging?: boolean;
}) {
  const assignee = idea.assigned_to
    ? members.find((m) => m.id === idea.assigned_to)
    : null;

  const dueDate = idea.due_date ? new Date(idea.due_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = dueDate && dueDate < today;
  const isDueSoon =
    dueDate &&
    !isOverdue &&
    dueDate.getTime() - today.getTime() < 3 * 86400_000; // 3 days

  const dueLabel = dueDate
    ? dueDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      onClick={onClick}
      className={`relative bg-card border rounded-lg p-3 group cursor-pointer hover:border-accent/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition-all ${
        dragging ? 'shadow-xl cursor-grabbing' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      aria-label={`Edit idea: ${idea.title}`}
    >
      <div className="flex items-start gap-2">
        <h4 className="text-sm font-medium leading-snug flex-1 min-w-0">
          {idea.title}
        </h4>
        {assignee ? (
          <Avatar
            fullName={assignee.full_name}
            id={assignee.id}
            url={assignee.avatar_url}
            size={24}
            className="shrink-0"
          />
        ) : null}
      </div>

      {idea.description ? (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
          {idea.description}
        </p>
      ) : null}

      <div className="flex items-center justify-between mt-2.5 gap-2">
        {dueLabel ? (
          <span
            className={`text-xs font-medium tabular inline-flex items-center gap-1 ${
              isOverdue
                ? 'text-danger'
                : isDueSoon
                ? 'text-amber-600'
                : 'text-muted-foreground'
            }`}
          >
            {isOverdue ? '⚠ ' : ''}
            {dueLabel}
          </span>
        ) : (
          <span />
        )}
        {/* Always-visible edit affordance — works on touch (no :hover) too. */}
        <span
          aria-hidden
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-foreground/80 transition-colors"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </span>
      </div>
    </div>
  );
}
