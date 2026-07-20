-- Migration: store YouTube channel thumbnail so we can render it without
-- re-fetching from the API on every page load.
-- Run in the Supabase SQL editor.

alter table public.youtube_channels
  add column if not exists thumbnail_url text;
