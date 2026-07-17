'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface AttendanceActionState {
  error?: string;
  ok?: boolean;
}

export async function clockIn(): Promise<AttendanceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not signed in.' };

  // Guard: an open row already exists. The unique partial index will also
  // catch this server-side, but checking first gives a friendlier error.
  const { data: open } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle<{ id: string }>();

  if (open) {
    return { error: 'You are already clocked in. Clock out first.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from('attendance_logs').insert({
    user_id: user.id,
    clock_in: now,
    // clock_out, duration_minutes, date are set by the trigger
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/attendance');
  return { ok: true };
}

export async function clockOut(): Promise<AttendanceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not signed in.' };

  const { data: open, error: findErr } = await supabase
    .from('attendance_logs')
    .select('id')
    .eq('user_id', user.id)
    .is('clock_out', null)
    .maybeSingle<{ id: string }>();

  if (findErr) return { error: findErr.message };
  if (!open) return { error: 'You are not currently clocked in.' };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('attendance_logs')
    .update({ clock_out: now })
    .eq('id', open.id);

  if (error) return { error: error.message };

  revalidatePath('/attendance');
  return { ok: true };
}
