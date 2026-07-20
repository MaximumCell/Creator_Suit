-- Migration: expand content pipeline from 4 stages to 5.
-- Old → new mapping:
--   'final'    → 'final_script' (the new "final" means "ready to post")
--   'shooting' → 'shoot_edit'   (shooting and editing are now one stage)
--   'idea'     → 'idea'         (unchanged)
--   'posted'   → 'posted'       (unchanged)
-- Adds the new 'final_script', 'shoot_edit', and 'final' values.
--
-- Run in the Supabase SQL editor.

-- 1. Drop the old check constraint.
alter table public.content_ideas
  drop constraint if exists content_ideas_stage_check;

-- 2. Remap any existing rows from the old 4-stage values to the new 5-stage values.
update public.content_ideas
  set stage = 'final_script'
  where stage = 'final';

update public.content_ideas
  set stage = 'shoot_edit'
  where stage = 'shooting';

-- 3. Add the new check constraint with all 5 values.
alter table public.content_ideas
  add constraint content_ideas_stage_check
  check (stage in ('idea', 'final_script', 'shoot_edit', 'final', 'posted'));
