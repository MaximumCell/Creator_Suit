# CreatorSuit

Internal productivity tool for the Aaghaz AI team. Step 1 of the build — shell,
auth, and the **Attendance** tab. The other two tabs are placeholders; their
database tables are already in place so the next pass is feature-only.

See [`creatorsuit-plan.md`](../creatorsuit-plan.md) for the full product plan.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Auth + Row Level Security)
- Server Actions for clock in/out and sign in / sign up
- `proxy.ts` (formerly `middleware.ts`) for session refresh + auth gating

## Setup

### 1. Install dependencies

```bash
cd creatorsuit
npm install
```

### 2. Create a Supabase project

1. Sign up at https://supabase.com and create a new project.
2. Once it's ready, go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (server-only) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure env vars

```bash
cp .env.local.example .env.local
# then edit .env.local with the values from step 2
```

### 4. Run the database migration

In the Supabase dashboard go to **SQL Editor → New query**, paste the contents
of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
and click **Run**. This creates all five tables, the auto-triggers, and the
Row Level Security policies.

### 5. (Recommended) turn off email confirmation

By default Supabase requires users to click a confirmation link before they can
sign in. For an internal tool, that friction is rarely worth it.

- **Authentication → Providers → Email → Confirm email → toggle OFF**

You can leave it on if you prefer — the sign-up flow handles both cases.

### 6. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`.

### 7. Create the first user and promote to admin

- Click the **Sign up** tab and create your account (full name, email, password)
- Once signed in, you land on the Attendance tab as a **member**
- In the Supabase SQL editor, promote yourself to admin:

```sql
update public.users
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Sign out and back in for the role to take effect on the next page load.
Subsequent users can self-sign up from the same page; promote them to admin
with the same SQL when needed.

## Project layout

```
src/
  app/
    (dashboard)/
      layout.tsx            # sidebar + auth guard for all dashboard pages
      attendance/           # ← fully built (Step 1)
        page.tsx            # server component: fetches data, renders
        actions.ts          # clockIn / clockOut server actions
        personal-log.tsx    # member's own 30-day log
        admin-team-view.tsx # team-wide table with date range filter
      youtube/page.tsx      # placeholder (Step 2)
      content/page.tsx      # placeholder (Step 3)
    auth/callback/route.ts  # OAuth / magic-link callback
    login/                  # sign-in / sign-up tabs
    page.tsx                # redirects to /attendance
  components/
    clock-widget.tsx        # clock in/out + live elapsed counter
    sidebar.tsx             # responsive nav (drawer on mobile)
  lib/
    supabase/
      client.ts             # browser client (use in 'use client' components)
      server.ts             # server client (RSC, Server Actions, Route Handlers)
    time.ts                 # duration / date formatting helpers
  proxy.ts                  # auth gating + session refresh
  types/database.ts         # TypeScript types matching the SQL schema

supabase/
  migrations/
    0001_init.sql           # all 5 tables, triggers, RLS policies
```

## Data model

All five tables from `creatorsuit-plan.md` are created in a single migration:

- `users` — profile row mirrored from `auth.users` via trigger
- `attendance_logs` — clock in/out with auto-computed `duration_minutes` and `date`
- `youtube_channels` — admin-managed channel list
- `youtube_stats_snapshots` — historical stats per channel
- `content_ideas` — kanban board rows

A unique partial index on `attendance_logs (user_id) where clock_out is null`
enforces "one open session per user" at the database level, so even race
conditions between two clock-in clicks can't create duplicates.

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # run the production build
npm run lint       # ESLint
npm run seed       # seed demo users + attendance data (see below)
```

## Demo data (optional)

To populate the admin team view with sample employees:

```bash
npm run seed
```

This creates 5 demo users via the Supabase admin API and seeds 5 days of realistic attendance data (some users clocked in today, some already finished, some haven't started). The script is **idempotent** — safe to re-run. It clears previous demo logs and re-inserts them.

**Demo accounts (password is `demo1234` for all):**

| Email | Role | Today's status |
|---|---|---|
| `ali.hassan@creatorsuit.demo` | admin | In progress (3h) |
| `hassan.raza@creatorsuit.demo` | member | Done (8h 15m) |
| `ahmed.khan@creatorsuit.demo` | member | Done (8h 15m) |
| `sara.malik@creatorsuit.demo` | member | Not started yet |
| `bilal.ahmed@creatorsuit.demo` | member | Just clocked in |

Sign in as Ali to see the admin team view populated, or as any member to see their own attendance against a populated team.

**To remove the demo data:** delete the users from the Supabase dashboard (Authentication → Users → ⋯ → Delete user). The `on delete cascade` on `public.users.id` will clean up the `attendance_logs` rows for them automatically.

## Roles

- **admin** — sees everyone's hours, can use the team-view date filter, will
  manage channels and content ideas in later steps.
- **member** — sees only their own hours; can clock in/out.

RLS enforces this at the database level: members can `select/insert/update`
their own `attendance_logs` only; admins can do all of it for everyone.
