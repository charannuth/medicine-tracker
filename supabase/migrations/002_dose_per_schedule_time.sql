-- Run in Supabase SQL Editor if you already ran the original schema.sql.
-- Adds one dose log per medication per day per scheduled time.

alter table public.dose_logs
  add column if not exists schedule_time text;

update public.dose_logs dl
set schedule_time = coalesce(
  (
    select m.schedule_times[1]
    from public.medications m
    where m.id = dl.medication_id
  ),
  '00:00'
)
where dl.schedule_time is null;

alter table public.dose_logs
  alter column schedule_time set not null;

alter table public.dose_logs
  drop constraint if exists dose_logs_medication_id_taken_on_key;

alter table public.dose_logs
  drop constraint if exists dose_logs_medication_id_taken_on_schedule_time_key;

alter table public.dose_logs
  add constraint dose_logs_medication_id_taken_on_schedule_time_key
  unique (medication_id, taken_on, schedule_time);

create index if not exists dose_logs_med_date_time_idx
  on public.dose_logs (medication_id, taken_on, schedule_time);
