-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Creates tables and Row Level Security so each user only sees their own data.
--
-- Bootstrap only (medications + dose_logs). Then run migrations 002–016 in order.
-- See docs/MIGRATIONS.md for the full checklist and verification queries.

-- Medications
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dose_pills text,
  dose_mg text,
  schedule_times text[] not null default '{}',
  constraint medications_dose_amount_check check (
    coalesce(trim(dose_pills), '') <> ''
    or coalesce(trim(dose_mg), '') <> ''
  ),
  notes text,
  pills_remaining integer,
  start_date date not null default current_date,
  end_date date,
  constraint medications_date_range_check check (
    end_date is null or end_date >= start_date
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One log per medication per calendar day per scheduled time (each dose slot)
create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  taken_on date not null,
  schedule_time text not null,
  taken_at timestamptz not null default now(),
  unique (medication_id, taken_on, schedule_time)
);

create index if not exists medications_user_id_idx on public.medications (user_id);
create index if not exists dose_logs_user_id_idx on public.dose_logs (user_id);
create index if not exists dose_logs_medication_taken_on_idx on public.dose_logs (medication_id, taken_on);
create index if not exists dose_logs_med_date_time_idx on public.dose_logs (medication_id, taken_on, schedule_time);

alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;

-- medications policies
create policy "Users can view own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

-- dose_logs policies
create policy "Users can view own dose logs"
  on public.dose_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own dose logs"
  on public.dose_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own dose logs"
  on public.dose_logs for delete
  using (auth.uid() = user_id);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists medications_updated_at on public.medications;
create trigger medications_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

-- Wellness (baseline + daily logs) — see migrations/006_wellness.sql for full DDL
