/**
 * Seed demo users + attendance data so the admin team view has something
 * to show. Idempotent — safe to re-run.
 *
 * Run:   npm run seed
 * Reset: npm run seed:reset
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses Node's --env-file flag (Node 20+).
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n┌─ Seed preflight ─────────────────────────────────────');

if (!url) {
  console.error('│  ✗ NEXT_PUBLIC_SUPABASE_URL is missing from .env.local');
}
if (!serviceKey) {
  console.error('│  ✗ SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
}

if (url) {
  const looksReal = !url.includes('placeholder') && !url.includes('your-project');
  console.log(
    `│  • URL:    ${url.replace(/\/\/.+@/, '//***@')}` +
      (looksReal ? ' ✓' : ' ✗ (looks like a placeholder!)'),
  );
  if (serviceKey) {
    const isJwt = serviceKey.startsWith('eyJ');
    const isPlaceholder = serviceKey.includes('placeholder') || serviceKey.length < 50;
    console.log(
      `│  • KEY:    ${serviceKey.slice(0, 8)}…${serviceKey.slice(-4)} (len=${serviceKey.length})` +
        (isJwt ? ' ✓ (JWT format)' : ' ✗ (not a JWT — probably wrong)') +
        (isPlaceholder ? ' ✗ (looks like a placeholder!)' : ''),
    );
  }
}

if (!url || !serviceKey) {
  console.error(
    '│\n│  Fix: open .env.local and fill in real values from\n' +
      '│       Supabase → Project Settings → API\n' +
      '│  See README "Setup" section for details.\n' +
      '└─────────────────────────────────────────────────────────\n',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Connectivity test before doing anything destructive.
console.log('│\n│  Testing connection to Supabase…');
try {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) throw error;
  console.log(`│  ✓ Connected. Existing user count visible: ${data.users.length >= 1 ? '1+' : '0'}`);
} catch (err) {
  console.error('│  ✗ Connection failed:', err.message);
  console.error(
    '│\n│  Most likely causes:\n' +
      '│  • Service role key is wrong (regenerate from Supabase → Settings → API)\n' +
      '│  • Project URL is wrong (should look like https://abcdefg.supabase.co)\n' +
      '│  • Network/firewall blocking the request\n' +
      '└─────────────────────────────────────────────────────────\n',
  );
  process.exit(1);
}

console.log('└─────────────────────────────────────────────────────────\n');

const DEMO_PASSWORD = 'demo1234';

const DEMO_USERS = [
  { full_name: 'Ali Hassan',  email: 'ali.hassan@creatorsuit.demo',   role: 'member' },
  { full_name: 'Hassan Raza', email: 'hassan.raza@creatorsuit.demo',  role: 'member' },
  { full_name: 'Ahmed Khan',  email: 'ahmed.khan@creatorsuit.demo',   role: 'member' },
  { full_name: 'Sara Malik',  email: 'sara.malik@creatorsuit.demo',   role: 'member' },
  { full_name: 'Bilal Ahmed', email: 'bilal.ahmed@creatorsuit.demo',  role: 'member' },
];

/**
 * For each demo user, returns a "schedule" that controls the seed data:
 *   inProgress  — clocked in earlier today, still working
 *   completed   — clocked in and out today (8-ish hours)
 *   notToday    — no entry today (random past days only)
 *   late        — clocked in today but only just now, no clock-out
 */
const SCHEDULES = {
  'ali.hassan@creatorsuit.demo':   'inProgress',
  'hassan.raza@creatorsuit.demo':  'completed',
  'ahmed.khan@creatorsuit.demo':   'completed',
  'sara.malik@creatorsuit.demo':   'notToday',
  'bilal.ahmed@creatorsuit.demo':  'late',
};

/** YYYY-MM-DD in UTC (matches what the DB trigger stores). */
function utcDate(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** ISO timestamp at HH:MM UTC on the given date. */
function utcIso(d, hh, mm = 0) {
  const out = new Date(d);
  out.setUTCHours(hh, mm, 0, 0);
  return out.toISOString();
}

/** Deterministic pseudo-random based on a seed string — so re-runs produce the same data. */
function seedRand(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    h ^= h >>> 16;
    return (h >>> 0) / 0xffffffff;
  };
}

function generateLogsForUser(email) {
  const schedule = SCHEDULES[email] ?? 'completed';
  const rand = seedRand(email);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const logs = [];

  // Past 5 days: always populated with a completed session
  for (let daysAgo = 1; daysAgo <= 5; daysAgo++) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - daysAgo);

    // Random weekend skip (Sat/Sun) ~ 30% of the time
    const dow = day.getUTCDay();
    if ((dow === 0 || dow === 6) && rand() < 0.6) continue;

    // Random day-off ~ 8% of the time
    if (rand() < 0.08) continue;

    const startHour = 8 + Math.floor(rand() * 2); // 8 or 9
    const startMin = Math.floor(rand() * 30);
    const workMinutes = 7 * 60 + Math.floor(rand() * 3 * 60); // 7-10 hours

    const clockIn = utcIso(day, startHour, startMin);
    const clockOut = new Date(
      new Date(clockIn).getTime() + workMinutes * 60_000,
    ).toISOString();

    logs.push({ clock_in: clockIn, clock_out: clockOut });
  }

  // Today: based on schedule
  if (schedule === 'inProgress') {
    // Clocked in 3 hours ago, no clock-out
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000);
    logs.push({ clock_in: threeHoursAgo.toISOString(), clock_out: null });
  } else if (schedule === 'late') {
    // Just clocked in 10 min ago
    const tenMinAgo = new Date(Date.now() - 10 * 60_000);
    logs.push({ clock_in: tenMinAgo.toISOString(), clock_out: null });
  } else if (schedule === 'completed') {
    // Clocked in at 9:30 UTC, clocked out 8h 15m later
    const clockIn = utcIso(today, 9, 30);
    const clockOut = new Date(
      new Date(clockIn).getTime() + (8 * 60 + 15) * 60_000,
    ).toISOString();
    logs.push({ clock_in: clockIn, clock_out: clockOut });
  }
  // 'notToday' → no today entry

  return logs;
}

async function ensureAuthUser({ email, full_name }) {
  // Check if already exists
  const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const found = list.users.find((u) => u.email === email);
  if (found) return found;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true, // skip confirmation email
    user_metadata: { full_name },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  console.log('\nSeeding demo users + attendance data…\n');

  // 1) Create auth users
  console.log('1. Auth users');
  const userIds = {};
  for (const u of DEMO_USERS) {
    try {
      const user = await ensureAuthUser(u);
      userIds[u.email] = user.id;
      console.log(`   ✓ ${u.email}`);
    } catch (err) {
      console.error(`   ✗ ${u.email}: ${err.message}`);
    }
  }

  // 2) Update roles (the trigger only sets full_name, role defaults to 'member')
  console.log('\n2. Roles');
  for (const u of DEMO_USERS) {
    const id = userIds[u.email];
    if (!id) continue;
    const { error } = await supabase
      .from('users')
      .update({ role: u.role })
      .eq('id', id);
    if (error) {
      console.error(`   ✗ ${u.email}: ${error.message}`);
    } else {
      console.log(`   ✓ ${u.email} → ${u.role}`);
    }
  }

  // 3) Clear existing attendance logs for these users (idempotent reseed)
  console.log('\n3. Attendance logs (clearing existing)');
  const ids = Object.values(userIds);
  if (ids.length > 0) {
    const { error } = await supabase
      .from('attendance_logs')
      .delete()
      .in('user_id', ids);
    if (error) {
      console.error(`   ✗ ${error.message}`);
    } else {
      console.log(`   ✓ Cleared logs for ${ids.length} users`);
    }
  }

  // 4) Insert fresh logs
  console.log('\n4. Inserting fresh logs');
  for (const u of DEMO_USERS) {
    const id = userIds[u.email];
    if (!id) continue;
    const logs = generateLogsForUser(u.email);
    if (logs.length === 0) continue;
    const rows = logs.map((l) => ({ user_id: id, ...l }));
    const { error } = await supabase.from('attendance_logs').insert(rows);
    if (error) {
      console.error(`   ✗ ${u.email}: ${error.message}`);
    } else {
      const todayCount = rows.filter((r) => utcDate(new Date(r.clock_in)) === utcDate(new Date())).length;
      console.log(
        `   ✓ ${u.email} — ${rows.length} entries${todayCount > 0 ? ` (${todayCount} today, ${logs.find((l) => l.clock_out == null) ? 'in progress' : 'completed'})` : ''}`,
      );
    }
  }

  console.log('\n✅ Done. Sign in as any demo user with password: ' + DEMO_PASSWORD);
  console.log('   Admin:     ali.hassan@creatorsuit.demo');
  console.log('   Members:   hassan.raza / ahmed.khan / sara.malik / bilal.ahmed @creatorsuit.demo\n');
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err);
  process.exit(1);
});
