import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * YYYY-MM-DD for today in UTC. Matches the `date` column on
 * `attendance_logs`, which is set by the trigger from
 * `(clock_in AT TIME ZONE 'UTC')::date`.
 */
export function getTodayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * ISO 8601 string for 23:59:59.999 of the given YYYY-MM-DD, in UTC.
 * Used to auto-close a forgotten open session at end-of-day.
 */
function endOfDayUtc(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

export interface AutoCloseResult {
  /** The session that was auto-closed. */
  id: string;
  /** The UTC date the session was opened on. */
  date: string;
  /** The auto-closed clock_out timestamp. */
  clock_out: string;
}

/**
 * If the user has an open session (clock_out IS NULL) from a previous day,
 * auto-close it at 23:59:59 of that day. The partial unique index
 * `attendance_logs_one_open_per_user` then allows a fresh clock-in.
 *
 * Safe to call multiple times — once closed, re-runs no-op.
 * Returns the closed session info, or null if nothing needed closing.
 */
export async function autoCloseStaleSession(
  supabase: SupabaseClient,
  userId: string,
): Promise<AutoCloseResult | null> {
  const today = getTodayUtc();

  const { data: stale, error: findErr } = await supabase
    .from('attendance_logs')
    .select('id, date')
    .eq('user_id', userId)
    .is('clock_out', null)
    .lt('date', today)
    .maybeSingle<{ id: string; date: string }>();

  if (findErr) {
    console.error('autoCloseStaleSession: lookup failed', findErr);
    return null;
  }
  if (!stale) return null;

  const newClockOut = endOfDayUtc(stale.date);
  const { error: updateErr } = await supabase
    .from('attendance_logs')
    .update({ clock_out: newClockOut })
    .eq('id', stale.id);

  if (updateErr) {
    console.error('autoCloseStaleSession: update failed', updateErr);
    return null;
  }

  return { id: stale.id, date: stale.date, clock_out: newClockOut };
}
