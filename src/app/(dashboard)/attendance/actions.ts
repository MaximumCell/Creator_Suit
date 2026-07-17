'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface AttendanceActionState {
  error?: string;
  ok?: boolean;
}

/** Postgres unique-violation SQLSTATE. */
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolationOn(
  error: { code?: string; message?: string } | null,
  constraint: string,
): boolean {
  if (!error) return false;
  if (error.code !== PG_UNIQUE_VIOLATION) return false;
  return (error.message ?? '').toLowerCase().includes(constraint);
}

export async function clockIn(): Promise<AttendanceActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not signed in.' };

  // Friendly pre-check: an open row already exists. The partial unique index
  // on (user_id) where clock_out is null also catches this server-side, but
  // checking first gives a clearer message.
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
    // (user_id, date) unique — already clocked in earlier today.
    if (isUniqueViolationOn(error, 'attendance_logs_user_date_unique')) {
      return {
        error: "You've already clocked in today. You can only clock in once per day.",
      };
    }
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
