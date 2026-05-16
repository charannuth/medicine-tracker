-- Start and optional end dates for each medication schedule.

alter table public.medications
  add column if not exists start_date date,
  add column if not exists end_date date;

update public.medications
set start_date = (created_at at time zone 'utc')::date
where start_date is null;

alter table public.medications
  alter column start_date set not null,
  alter column start_date set default current_date;

alter table public.medications
  drop constraint if exists medications_date_range_check;

alter table public.medications
  add constraint medications_date_range_check
  check (end_date is null or end_date >= start_date);
