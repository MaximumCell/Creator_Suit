-- Migration: per-user OAuth tokens for the YouTube Analytics API.
-- One row per connected user. Run in the Supabase SQL editor.

create table if not exists public.youtube_oauth_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.users(id) on delete cascade,
  -- The channel the user authorized (so we know which channel to query analytics for)
  channel_id      text not null,
  channel_title   text,
  -- OAuth tokens — refresh_token is the long-lived one, access_token is short
  access_token    text not null,
  refresh_token   text not null,
  -- Unix ms
  expires_at      bigint not null,
  -- Comma-separated scope list (so we know which APIs the user authorized)
  scope           text,
  connected_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.youtube_oauth_tokens enable row level security;

-- Only the owning user can read/write their own tokens; admins can read all.
drop policy if exists "oauth tokens read own" on public.youtube_oauth_tokens;
create policy "oauth tokens read own"
  on public.youtube_oauth_tokens for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "oauth tokens admin write" on public.youtube_oauth_tokens;
create policy "oauth tokens admin write"
  on public.youtube_oauth_tokens for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Touch updated_at on row change (reuses the function from migration 0001).
drop trigger if exists youtube_oauth_tokens_touch_updated_at on public.youtube_oauth_tokens;
create trigger youtube_oauth_tokens_touch_updated_at
  before update on public.youtube_oauth_tokens
  for each row execute function public.touch_updated_at();
