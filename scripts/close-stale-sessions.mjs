/**
 * One-off cleanup: close any attendance session that was left open across
 * a day boundary. Sets clock_out to 23:59:59.999 UTC of the day it was
 * opened, so the partial unique index frees up and the user can clock in
 * fresh the next day.
 *
 * Idempotent — safe to re-run. After this, /attendance also does this
 * automatically on every page load, so this script is just a backfill
 * for sessions that pre-date the fix.
 *
 * Run:   npm run seed:close-stale
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.\n' +
      'Run via `npm run seed:close-stale` (uses --env-file).',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function endOfDayUtc(dateStr) {
  return `${dateStr}T23:59:59.999Z`;
}

async function main() {
  console.log('\n┌─ Stale-session cleanup ─────────────────────────────');
  const today = todayUtc();
  console.log(`│  today (UTC) = ${today}`);

  const { data: stale, error: findErr } = await supabase
    .from('attendance_logs')
    .select('id, user_id, date, clock_in')
    .is('clock_out', null)
    .lt('date', today);

  if (findErr) {
    console.error('│  ✗ Lookup failed:', findErr.message);
    console.error('└─────────────────────────────────────────────────────────\n');
    process.exit(1);
  }

  if (!stale || stale.length === 0) {
    console.log('│  ✓ No stale open sessions found.');
    console.log('└─────────────────────────────────────────────────────────\n');
    return;
  }

  console.log(`│  Found ${stale.length} stale open session(s):`);
  for (const row of stale) {
    console.log(
      `│    • user=${row.user_id.slice(0, 8)}…  date=${row.date}  clock_in=${row.clock_in}`,
    );
  }

  let closed = 0;
  for (const row of stale) {
    const newClockOut = endOfDayUtc(row.date);
    const { error: updateErr } = await supabase
      .from('attendance_logs')
      .update({ clock_out: newClockOut })
      .eq('id', row.id);
    if (updateErr) {
      console.error(
        `│  ✗ Failed to close ${row.id}:`,
        updateErr.message,
      );
    } else {
      closed += 1;
      console.log(`│  ✓ Closed ${row.id.slice(0, 8)}… at ${newClockOut}`);
    }
  }

  console.log(`│  Closed ${closed}/${stale.length} session(s).`);
  console.log('└─────────────────────────────────────────────────────────\n');
}

main().catch((err) => {
  console.error('\n✗ Cleanup failed:', err);
  process.exit(1);
});
