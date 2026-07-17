-- CreatorSuit initial schema
-- Run this in the Supabase SQL editor: Project -> SQL -> New query
-- All 5 tables are created up-front so future features don't need a migration step.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- users (profile row mirrored from auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  role        text not null default 'member' check (role in ('admin', 'member')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user is added.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- attendance_logs
-- ---------------------------------------------------------------------------
create table if not exists public.attendance_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  clock_in          timestamptz not null,
  clock_out         timestamptz,
  duration_minutes  int,
  date              date not null,
  created_at        timestamptz not null default now()
);

create index if not exists attendance_logs_user_date_idx
  on public.attendance_logs (user_id, date desc);

-- Compute duration + date automatically when clocking out.
create or replace function public.set_attendance_metadata()
returns trigger
language plpgsql
as $$
begin
  if new.clock_out is not null then
    if new.clock_out < new.clock_in then
      raise exception 'clock_out cannot be before clock_in';
    end if;
    new.duration_minutes :=
      extract(epoch from (new.clock_out - new.clock_in)) / 60;
  end if;
  new.date := (new.clock_in at time zone 'UTC')::date;
  return new;
end;
$$;

drop trigger if exists attendance_logs_set_metadata on public.attendance_logs;
create trigger attendance_logs_set_metadata
  before insert or update on public.attendance_logs
  for each row execute function public.set_attendance_metadata();

-- Prevent two open (un-clocked-out) sessions for the same user.
create unique index if not exists attendance_logs_one_open_per_user
  on public.attendance_logs (user_id)
  where clock_out is null;

-- ---------------------------------------------------------------------------
-- youtube_channels
-- ---------------------------------------------------------------------------
create table if not exists public.youtube_channels (
  id            uuid primary key default gen_random_uuid(),
  channel_id    text not null unique,
  channel_name  text not null,
  channel_url   text not null,
  added_by      uuid not null references public.users(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- youtube_stats_snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.youtube_stats_snapshots (
  id                uuid primary key default gen_random_uuid(),
  channel_id        uuid not null references public.youtube_channels(id) on delete cascade,
  subscriber_count  bigint not null,
  view_count        bigint not null,
  video_count       int not null,
  fetched_at        timestamptz not null default now()
);

create index if not exists youtube_stats_snapshots_channel_fetched_idx
  on public.youtube_stats_snapshots (channel_id, fetched_at desc);

-- ---------------------------------------------------------------------------
-- content_ideas
-- ---------------------------------------------------------------------------
create table if not exists public.content_ideas (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  stage         text not null default 'idea'
                  check (stage in ('idea', 'final', 'shooting', 'posted')),
  assigned_to   uuid references public.users(id) on delete set null,
  created_by    uuid not null references public.users(id) on delete cascade,
  due_date      date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists content_ideas_stage_idx
  on public.content_ideas (stage);
create index if not exists content_ideas_assigned_to_idx
  on public.content_ideas (assigned_to);

-- Touch updated_at automatically.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists content_ideas_touch_updated_at on public.content_ideas;
create trigger content_ideas_touch_updated_at
  before update on public.content_ideas
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.users                 enable row level security;
alter table public.attendance_logs       enable row level security;
alter table public.youtube_channels      enable row level security;
alter table public.youtube_stats_snapshots enable row level security;
alter table public.content_ideas         enable row level security;

-- Helper: is the current request an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- users
drop policy if exists "users read all authenticated" on public.users;
create policy "users read all authenticated"
  on public.users for select
  to authenticated
  using (true);

drop policy if exists "users update self" on public.users;
create policy "users update self"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.users where id = auth.uid()));
  -- last condition prevents a member from self-promoting to admin

drop policy if exists "users admin manage" on public.users;
create policy "users admin manage"
  on public.users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- attendance_logs: members manage their own, admins manage all
drop policy if exists "attendance read own" on public.attendance_logs;
create policy "attendance read own"
  on public.attendance_logs for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance insert own" on public.attendance_logs;
create policy "attendance insert own"
  on public.attendance_logs for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance update own" on public.attendance_logs;
create policy "attendance update own"
  on public.attendance_logs for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "attendance delete own" on public.attendance_logs;
create policy "attendance delete own"
  on public.attendance_logs for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- youtube_channels / snapshots: all authed users can read, only admins write
drop policy if exists "channels read all" on public.youtube_channels;
create policy "channels read all"
  on public.youtube_channels for select
  to authenticated
  using (true);

drop policy if exists "channels admin write" on public.youtube_channels;
create policy "channels admin write"
  on public.youtube_channels for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "snapshots read all" on public.youtube_stats_snapshots;
create policy "snapshots read all"
  on public.youtube_stats_snapshots for select
  to authenticated
  using (true);

drop policy if exists "snapshots admin write" on public.youtube_stats_snapshots;
create policy "snapshots admin write"
  on public.youtube_stats_snapshots for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- content_ideas: all authed users can read; create/edit/delete by member or admin
drop policy if exists "ideas read all" on public.content_ideas;
create policy "ideas read all"
  on public.content_ideas for select
  to authenticated
  using (true);

drop policy if exists "ideas insert authed" on public.content_ideas;
create policy "ideas insert authed"
  on public.content_ideas for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "ideas update authed" on public.content_ideas;
create policy "ideas update authed"
  on public.content_ideas for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "ideas delete admin" on public.content_ideas;
create policy "ideas delete admin"
  on public.content_ideas for delete
  to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- How to bootstrap the first admin
-- ---------------------------------------------------------------------------
-- After the first user signs up (via the login page), promote them in SQL:
--
--   update public.users set role = 'admin' where full_name = 'Your Name';
--   -- or, if you know the auth user id:
--   update public.users set role = 'admin' where id = '00000000-0000-0000-0000-000000000000';
--
-- All later accounts are created via the Supabase dashboard (Authentication ->
-- Users -> Add user) and will default to 'member'. The admin can promote them
-- with the same SQL snippet.
