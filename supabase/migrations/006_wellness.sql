-- Wellness profile (baseline) and daily logs for doctor conversations.
-- Run in Supabase SQL Editor if not using migration tooling.

create table if not exists public.wellness_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  usual_bedtime text,
  usual_wake_time text,
  eating_notes text,
  substance_use jsonb not null default '{}',
  symptom_focus text[] not null default '{}',
  profile_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  sleep_hours numeric(4, 1),
  sleep_quality smallint check (sleep_quality is null or sleep_quality between 1 and 5),
  energy_level smallint check (energy_level is null or energy_level between 1 and 5),
  appetite text check (
    appetite is null or appetite in ('same', 'better', 'worse')
  ),
  exercised boolean not null default false,
  exercise_minutes integer check (exercise_minutes is null or exercise_minutes >= 0),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists wellness_logs_user_date_idx
  on public.wellness_logs (user_id, log_date desc);

alter table public.wellness_profiles enable row level security;
alter table public.wellness_logs enable row level security;

create policy "Users can view own wellness profile"
  on public.wellness_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own wellness profile"
  on public.wellness_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wellness profile"
  on public.wellness_profiles for update
  using (auth.uid() = user_id);

create policy "Users can view own wellness logs"
  on public.wellness_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own wellness logs"
  on public.wellness_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own wellness logs"
  on public.wellness_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own wellness logs"
  on public.wellness_logs for delete
  using (auth.uid() = user_id);

drop trigger if exists wellness_profiles_updated_at on public.wellness_profiles;
create trigger wellness_profiles_updated_at
  before update on public.wellness_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists wellness_logs_updated_at on public.wellness_logs;
create trigger wellness_logs_updated_at
  before update on public.wellness_logs
  for each row execute function public.set_updated_at();
