-- Migration: enforce "one clock-in per user per day"
-- Adds a unique constraint on (user_id, date) to attendance_logs.
-- The existing partial unique index on (user_id) where clock_out is null stays —
-- together they guarantee:
--   * at most one OPEN session per user (must clock out before starting another)
--   * at most one session per user per UTC day (the "one clock-in per day" rule)
--
-- Run in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Cleanup: collapse any pre-existing duplicate-date rows.
-- If a user already has multiple rows for the same `date`, keep the row with
-- the most recent clock_in and delete the older ones. This is necessary
-- because the old partial index only prevented multiple OPEN sessions, so
-- multiple closed sessions on the same day were technically allowed.
-- ---------------------------------------------------------------------------
do $$
declare
  dup record;
begin
  for dup in
    select user_id, date
    from public.attendance_logs
    group by user_id, date
    having count(*) > 1
  loop
    delete from public.attendance_logs
    where id in (
      select id
      from public.attendance_logs
      where user_id = dup.user_id
        and date = dup.date
      order by clock_in desc
      offset 1
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Enforce the rule.
-- ---------------------------------------------------------------------------
alter table public.attendance_logs
  add constraint attendance_logs_user_date_unique
  unique (user_id, date);
