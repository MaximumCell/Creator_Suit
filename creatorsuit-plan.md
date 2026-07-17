# CreatorSuit — Product Plan

Internal productivity tool for the Aaghaz AI team. Tracks team attendance/working hours, pulls in YouTube channel stats, and manages a content pipeline board.

**Scope:** Internal use only, small team (editors, tech, designer, founder). No public sign-up, no multi-tenant billing.

---

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes / Server Actions
- **Database & Auth:** Supabase (Postgres + built-in Auth + Row Level Security)
- **Hosting:** Vercel (or wherever MCode deploys by default)
- **External API:** YouTube Data API v3 (for channel stats)

---

## Auth & Roles

- Supabase Auth, email/password login (no public sign-up — accounts created manually by admin)
- Two roles:
  - **Admin** (founder) — can see all team members' hours, manage content board, add/remove YouTube channels
  - **Member** (editor/designer/tech) — can clock in/out, view own hours, view/update content board cards assigned to them

---

## Data Model (Supabase Tables)

### `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | matches Supabase auth.users id |
| full_name | text | |
| role | text | 'admin' \| 'member' |
| avatar_url | text | nullable |
| created_at | timestamptz | |

### `attendance_logs`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users.id) | |
| clock_in | timestamptz | |
| clock_out | timestamptz | nullable until clocked out |
| duration_minutes | int | computed on clock-out |
| date | date | for daily grouping/reporting |
| created_at | timestamptz | |

### `youtube_channels`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| channel_id | text | YouTube channel ID |
| channel_name | text | |
| channel_url | text | |
| added_by | uuid (FK → users.id) | |
| created_at | timestamptz | |

### `youtube_stats_snapshots`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| channel_id | uuid (FK → youtube_channels.id) | |
| subscriber_count | bigint | |
| view_count | bigint | total views |
| video_count | int | |
| fetched_at | timestamptz | for showing growth over time |

### `content_ideas`
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| description | text | nullable |
| stage | text | 'idea' \| 'final' \| 'shooting' \| 'posted' |
| assigned_to | uuid (FK → users.id) | nullable |
| created_by | uuid (FK → users.id) | |
| due_date | date | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Features by Tab

### 1. Attendance Tab
- **Clock In / Clock Out button** — single click, timestamps to `attendance_logs`
- **Today's status** — shows current clock-in time and running duration if still clocked in
- **Working hours log** — table/list of past entries (date, clock in, clock out, total hours) for the logged-in user
- **Admin view** — table of all team members' hours, filterable by date range, with total hours per person per week/month
- **Simple validation:** can't clock in twice without clocking out first

### 2. YouTube Stats Tab
- **Add channel** — admin pastes channel URL or ID, app fetches and stores channel info via YouTube Data API
- **Stats display per channel:** subscriber count, total views, video count, shown as cards
- **Growth indicator** — compare latest snapshot vs. previous (e.g. "+240 subs this week") using `youtube_stats_snapshots` history
- **Auto-refresh** — scheduled job (daily) to fetch and store a new snapshot per channel
- **Multiple channels supported** — grid/list view if more than one channel is tracked

### 3. Content Pipeline Tab
- **Kanban-style board** with 4 columns: **Idea → Final → Shooting → Posted**
- **Card = one content idea**, shows title, assigned person, due date
- **Drag-and-drop** to move cards between stages (or simple dropdown/button to change stage if drag-and-drop isn't feasible in first build)
- **Add new idea** — modal/form: title, description, assign to team member, due date
- **Click card to expand** — view/edit full details, change stage, add notes
- **Filter by assigned person** (optional, nice-to-have)

---

## Non-Functional Requirements

- Mobile-responsive (team may check in from phone)
- Fast load — this is a daily-use internal tool, not a marketing site
- Simple, clean UI — no need for heavy branding, just clear and usable
- Row Level Security in Supabase: members can only edit their own attendance logs; admin has full access

---

## Out of Scope (for this build)

- Payroll/salary calculations
- Public-facing pages or client access
- Multi-workspace/multi-team support
- Notifications (email/Slack) — can be a future add-on
