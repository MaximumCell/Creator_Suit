-- Migration: per-video stats for tracked YouTube channels.
-- Run in the Supabase SQL editor.

create table if not exists public.youtube_videos (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.youtube_channels(id) on delete cascade,
  video_id      text not null,                         -- YouTube's stable video ID
  title         text not null,
  thumbnail_url text,
  published_at  timestamptz not null,
  duration      text,                                  -- ISO 8601 ("PT15M30S")
  view_count    bigint not null default 0,
  like_count    bigint,
  comment_count bigint,
  fetched_at    timestamptz not null default now(),
  unique (channel_id, video_id)
);

create index if not exists youtube_videos_channel_views_idx
  on public.youtube_videos (channel_id, view_count desc);
create index if not exists youtube_videos_channel_published_idx
  on public.youtube_videos (channel_id, published_at desc);

alter table public.youtube_videos enable row level security;

drop policy if exists "videos read all" on public.youtube_videos;
create policy "videos read all"
  on public.youtube_videos for select
  to authenticated
  using (true);

drop policy if exists "videos admin write" on public.youtube_videos;
create policy "videos admin write"
  on public.youtube_videos for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
