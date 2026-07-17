-- Optional: add updated_at to public.users for future profile-edit use.
-- Run this in the Supabase SQL editor ONLY if you want it.
-- The avatars work without this; the column is just nice-to-have.

alter table public.users
  add column if not exists updated_at timestamptz not null default now();

-- Reuse the touch trigger function created in 0001_init.sql.
drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();
