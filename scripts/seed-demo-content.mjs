/**
 * Seed demo content ideas so the Content Pipeline kanban has something
 * to show. Idempotent — safe to re-run.
 *
 * Run:   npm run seed:content
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Uses Node's --env-file flag (Node 20+).
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.\n' +
      'Make sure .env.local is filled in and run via `npm run seed:content` (uses --env-file).',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** YYYY-MM-DD in UTC, offset by `days` from today. */
function offsetDate(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Deterministic pseudo-random so re-runs produce the same data. */
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

/** Pool of realistic content ideas for a small creator team. */
const IDEA_POOL = [
  {
    title: 'Behind the scenes: how we edit videos in 3 hours',
    description:
      'Walk through our full edit pipeline from raw footage to export. Show keyboard shortcuts, the trim tool, color pass, and the audio mix.',
    stage: 'idea',
  },
  {
    title: 'Top 5 YouTube thumbnail mistakes (and how to fix them)',
    description:
      'Common patterns that kill CTR: tiny text, no contrast, no focal point, too busy, missing emotion. Show before/after.',
    stage: 'idea',
  },
  {
    title: 'Our content calendar — full breakdown',
    description:
      'Why we post on Tuesdays and Fridays, how we batch 4 videos in one day, and the spreadsheet that keeps us sane.',
    stage: 'final_script',
  },
  {
    title: 'Why we switched from Final Cut to DaVinci Resolve',
    description:
      'We tried both for a month. DaVinci won on color grading and price; Final Cut won on speed of edit. Here is the data.',
    stage: 'final_script',
  },
  {
    title: 'Studio tour: inside our new office',
    description:
      'Two-camera walkthrough of the new space. Green screen wall, podcast corner, the edit bay, the snack shelf.',
    stage: 'shoot_edit',
  },
  {
    title: 'How we grew from 0 to 10,000 subscribers',
    description:
      'The honest timeline. What worked (thumbnails, consistency), what did not (shorts, collabs), and what we would do differently.',
    stage: 'shoot_edit',
  },
  {
    title: '10 tools we use every single day',
    description:
      'Notion, Linear, DaVinci, OBS, a calendar, a timer, a notebook, a kettle, a good chair, and one really long HDMI cable.',
    stage: 'final',
  },
  {
    title: 'We hired 3 new people — here is why',
    description:
      'Editor, designer, and a community manager. What we looked for, what we asked, and the first 30 days.',
    stage: 'final',
  },
  {
    title: 'Our first 100 days on YouTube — the real numbers',
    description:
      'Views, watch time, revenue, what surprised us, what we got wrong, what we are changing for the next 100.',
    stage: 'posted',
  },
  {
    title: 'Why we left YouTube for TikTok (and came back)',
    description:
      'Six months on TikTok, what we learned about short-form, and why our long-form still lives on YouTube.',
    stage: 'posted',
  },
  {
    title: 'A day in the life of a 4-person content team',
    description:
      'From 9am standup to 7pm upload. Real timecodes, real screens, real coffee refills.',
    stage: 'idea',
  },
  {
    title: 'How we script a 10-minute video in under an hour',
    description:
      'Our beat-sheet template, the research shortcut, and the hook formula that gets us past the 8-minute dropoff.',
    stage: 'final_script',
  },
];

async function main() {
  console.log('\n┌─ Content seed preflight ───────────────────────────');

  if (!url) {
    console.error('│  ✗ NEXT_PUBLIC_SUPABASE_URL is missing from .env.local');
  }
  if (!serviceKey) {
    console.error('│  ✗ SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');
  }
  if (url && serviceKey) {
    console.log('│  ✓ env vars present');
  }

  if (!url || !serviceKey) {
    console.error('└─────────────────────────────────────────────────────────\n');
    process.exit(1);
  }

  // Connectivity test.
  try {
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    console.log('│  ✓ Connected to Supabase');
  } catch (err) {
    console.error('│  ✗ Connection failed:', err.message);
    console.error('└─────────────────────────────────────────────────────────\n');
    process.exit(1);
  }
  console.log('└─────────────────────────────────────────────────────────\n');

  // Look up all users so we can assign ideas to real people.
  const { data: userList, error: usersErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (usersErr) {
    console.error('Failed to list users:', usersErr.message);
    process.exit(1);
  }
  const users = userList.users;
  if (users.length === 0) {
    console.error('No users found. Run `npm run seed` first to create demo users.');
    process.exit(1);
  }
  console.log(`Found ${users.length} user(s):`);
  for (const u of users) {
    console.log(`  • ${u.email}  (${u.id.slice(0, 8)}…)`);
  }
  console.log('');

  // Clear any existing demo ideas (idempotent reseed).
  const { error: clearErr } = await supabase
    .from('content_ideas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows
  if (clearErr) {
    console.error('Failed to clear existing ideas:', clearErr.message);
    process.exit(1);
  }
  console.log('✓ Cleared existing content_ideas\n');

  // Build the rows.
  const rand = seedRand('creatorsuit-content-seed');
  const rows = IDEA_POOL.map((idea, i) => {
    // Spread assignees round-robin across the user pool.
    const assignee = users[i % users.length];
    // Vary due dates: some overdue, some today, some upcoming, some unset.
    const dueChoice = rand();
    let due_date = null;
    if (dueChoice < 0.2) due_date = offsetDate(-Math.floor(rand() * 5) - 1); // overdue
    else if (dueChoice < 0.35) due_date = offsetDate(0); // today
    else if (dueChoice < 0.85) due_date = offsetDate(Math.floor(rand() * 21) + 1); // 1-21 days
    // else: no due date

    return {
      title: idea.title,
      description: idea.description,
      stage: idea.stage,
      assigned_to: assignee.id,
      created_by: users[0].id, // first user is the "creator" for the audit trail
      due_date,
    };
  });

  const { data: inserted, error: insertErr } = await supabase
    .from('content_ideas')
    .insert(rows)
    .select('id, title, stage, due_date, assigned_to');

  if (insertErr) {
    console.error('Failed to insert ideas:', insertErr.message);
    process.exit(1);
  }

  // Tally by stage.
  const byStage = {};
  for (const row of inserted ?? []) {
    byStage[row.stage] = (byStage[row.stage] ?? 0) + 1;
  }
  console.log(`✓ Inserted ${inserted.length} ideas:`);
  for (const [stage, count] of Object.entries(byStage)) {
    console.log(`  • ${stage.padEnd(15)} ${count}`);
  }

  console.log('\n✅ Done. Open /content to see the populated kanban.\n');
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err);
  process.exit(1);
});
