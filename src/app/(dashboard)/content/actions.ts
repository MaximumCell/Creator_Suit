'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAGES } from './stages';
import type { ContentStage } from '@/types/database';

export interface IdeaActionState {
  error?: string;
  ok?: boolean;
  ideaId?: string;
}

type ActorResult =
  | { ok: true; userId: string; isAdmin: boolean }
  | { ok: false; error: string };

async function getActor(): Promise<ActorResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in.' };

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: 'admin' | 'member' }>();

  return {
    ok: true,
    userId: user.id,
    isAdmin: profile?.role === 'admin',
  };
}

function isStage(s: string): s is ContentStage {
  return (STAGES as readonly string[]).includes(s);
}

function parseDateInput(s: FormDataEntryValue | null): string | null {
  if (typeof s !== 'string' || s.trim() === '') return null;
  return s;
}

export async function createIdea(
  _prev: IdeaActionState,
  formData: FormData,
): Promise<IdeaActionState> {
  const actor = await getActor();
  if (!actor.ok) return actor;

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const stage = String(formData.get('stage') ?? 'idea');
  const assignedTo = String(formData.get('assigned_to') ?? '').trim() || null;
  const dueDate = parseDateInput(formData.get('due_date'));

  if (!title) return { error: 'Title is required.' };
  if (!isStage(stage)) return { error: 'Invalid stage.' };
  if (title.length > 200) return { error: 'Title is too long (max 200).' };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('content_ideas')
    .insert({
      title,
      description,
      stage,
      assigned_to: assignedTo,
      due_date: dueDate,
      created_by: actor.userId,
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) return { error: error?.message ?? 'Failed to create idea.' };

  revalidatePath('/content');
  return { ok: true, ideaId: data.id };
}

export async function updateIdea(
  _prev: IdeaActionState,
  formData: FormData,
): Promise<IdeaActionState> {
  const actor = await getActor();
  if (!actor.ok) return actor;

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing idea id.' };

  // Permission: members can edit their own; admins can edit anyone's.
  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('created_by')
    .eq('id', id)
    .single<{ created_by: string }>();
  if (fetchErr || !existing) return { error: 'Idea not found.' };

  if (!actor.isAdmin && existing.created_by !== actor.userId) {
    return { error: 'You can only edit your own ideas.' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const stage = String(formData.get('stage') ?? 'idea');
  const assignedTo = String(formData.get('assigned_to') ?? '').trim() || null;
  const dueDate = parseDateInput(formData.get('due_date'));

  if (!title) return { error: 'Title is required.' };
  if (!isStage(stage)) return { error: 'Invalid stage.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('content_ideas')
    .update({
      title,
      description,
      stage,
      assigned_to: assignedTo,
      due_date: dueDate,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/content');
  return { ok: true, ideaId: id };
}

/** Optimistic-friendly stage change. Called by drag-and-drop on drop. */
export async function changeStage(formData: FormData): Promise<IdeaActionState> {
  const actor = await getActor();
  if (!actor.ok) return actor;

  const id = String(formData.get('id') ?? '');
  const stage = String(formData.get('stage') ?? '');
  if (!id || !isStage(stage)) return { error: 'Invalid request.' };

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('created_by')
    .eq('id', id)
    .single<{ created_by: string }>();
  if (fetchErr || !existing) return { error: 'Idea not found.' };

  if (!actor.isAdmin && existing.created_by !== actor.userId) {
    return { error: 'You can only move your own ideas.' };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('content_ideas')
    .update({ stage })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/content');
  return { ok: true, ideaId: id };
}

export async function deleteIdea(formData: FormData): Promise<IdeaActionState> {
  const actor = await getActor();
  if (!actor.ok) return actor;

  const id = String(formData.get('id') ?? '');
  if (!id) return { error: 'Missing idea id.' };

  const supabase = await createClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('content_ideas')
    .select('created_by')
    .eq('id', id)
    .single<{ created_by: string }>();
  if (fetchErr || !existing) return { error: 'Idea not found.' };

  if (!actor.isAdmin && existing.created_by !== actor.userId) {
    return { error: 'You can only delete your own ideas.' };
  }

  const admin = createAdminClient();
  const { error } = await admin.from('content_ideas').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/content');
  return { ok: true };
}
