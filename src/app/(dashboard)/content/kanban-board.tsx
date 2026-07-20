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
import { STAGES, STAGE_LABELS, STAGE_COLORS } from './stages';
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage, idx) => (
            <Column
              key={stage}
              stage={stage}
              ideas={byStage[stage]}
              onAdd={() => setEditing({ mode: 'create', stage })}
              onEdit={(idea) => setEditing({ mode: 'edit', idea })}
              members={members}
              index={idx}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeIdea ? (
            <div className="rotate-2 scale-105 cursor-grabbing shadow-2xl">
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
  index,
}: {
  stage: ContentStage;
  ideas: IdeaView[];
  onAdd: () => void;
  onEdit: (idea: IdeaView) => void;
  members: User[];
  index: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const color = STAGE_COLORS[stage];

  return (
    <div
      ref={setNodeRef}
      className={`fade-up relative flex min-h-[420px] flex-col rounded-2xl border bg-surface-2/50 p-3 transition-all ${
        isOver
          ? 'scale-[1.01] border-dashed bg-surface ring-2'
          : 'border-border'
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        // Drop zone accent when an item is hovering
        ...(isOver
          ? { boxShadow: `0 0 0 2px ${color.hex}33`, borderColor: color.hex }
          : {}),
      }}
    >
      {/* Top color bar — gradient, brand color of the stage */}
      <div
        aria-hidden
        className="absolute inset-x-3 top-0 h-1 rounded-b-full"
        style={{ background: color.hex }}
      />

      <div className="flex items-center justify-between px-1 pb-3 pt-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: color.hex }}
          />
          <h3 className="text-sm font-semibold tracking-tight">
            {STAGE_LABELS[stage]}
          </h3>
          <span
            className="rounded-md px-1.5 py-0.5 text-xs tabular"
            style={{
              background: color.soft,
              color: color.hex,
            }}
          >
            {ideas.length}
          </span>
        </div>
        <button
          onClick={onAdd}
          className="p-1 text-muted-foreground rounded-md transition-colors hover:bg-surface hover:text-foreground"
          title={`Add idea to ${STAGE_LABELS[stage]}`}
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 space-y-2 min-h-[60px]">
        {ideas.map((idea, i) => (
          <DraggableCard
            key={idea.id}
            idea={idea}
            onEdit={() => onEdit(idea)}
            members={members}
            index={i}
          />
        ))}
        {ideas.length === 0 ? (
          <button
            onClick={onAdd}
            className="w-full rounded-xl border border-dashed py-6 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-surface hover:text-foreground"
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
  index,
}: {
  idea: IdeaView;
  onEdit: () => void;
  members: User[];
  index: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: idea.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0 : 1 }}
      {...attributes}
      {...listeners}
    >
      <KanbanCard
        idea={idea}
        members={members}
        onClick={onEdit}
        index={index}
      />
    </div>
  );
}

function KanbanCard({
  idea,
  members,
  onClick,
  dragging = false,
  index = 0,
}: {
  idea: IdeaView;
  members: User[];
  onClick?: () => void;
  dragging?: boolean;
  index?: number;
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

  const color = STAGE_COLORS[idea.stage];

  return (
    <div
      onClick={onClick}
      className={`fade-up group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        dragging ? 'shadow-xl cursor-grabbing' : ''
      }`}
      style={{ animationDelay: `${index * 40}ms` }}
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
      {/* Left stage accent bar */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1 transition-all duration-300"
        style={{ background: color.hex }}
      />

      <div className="flex items-start gap-2 pl-1.5">
        <h4 className="min-w-0 flex-1 text-sm font-medium leading-snug">
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
        <p className="mt-1.5 line-clamp-2 pl-1.5 text-xs text-muted-foreground">
          {idea.description}
        </p>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between gap-2 pl-1.5">
        {dueLabel ? (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium tabular ${
              isOverdue
                ? 'text-danger'
                : isDueSoon
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
            }`}
          >
            {isOverdue ? (
              <span
                aria-hidden
                className="relative inline-flex h-1.5 w-1.5"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
              </span>
            ) : null}
            {dueLabel}
          </span>
        ) : (
          <span />
        )}
        {/* Always-visible edit affordance — works on touch (no :hover) too. */}
        <span
          aria-hidden
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors group-hover:text-foreground/80"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </span>
      </div>
    </div>
  );
}
