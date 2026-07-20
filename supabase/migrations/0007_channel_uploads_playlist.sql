-- Migration: store each channel's uploads playlist ID so we can list its
-- videos without paying the 100-unit cost of search.list. Run in the
-- Supabase SQL editor.

alter table public.youtube_channels
  add column if not exists uploads_playlist_id text;
