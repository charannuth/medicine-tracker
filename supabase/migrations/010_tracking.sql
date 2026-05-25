-- Tracking hub: enabled modules, cycle data, dose sync from Today.

alter table public.medications
  add column if not exists tracking_sync text not null default 'none'
  check (tracking_sync in ('none', 'hrt'));

comment on column public.medications.tracking_sync is
  'When hrt, dose logs on Today are mirrored into Tracking (HRT module).';

create table if not exists public.user_trackers (
  user_id uuid not null references auth.users (id) on delete cascade,
  tracker_id text not null,
  enabled_at timestamptz not null default now(),
  primary key (user_id, tracker_id)
);

comment on table public.user_trackers is 'Which tracking modules the user has enabled.';

create table if not exists public.cycle_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  avg_cycle_length smallint not null default 28
    check (avg_cycle_length >= 15 and avg_cycle_length <= 60),
  avg_period_length smallint not null default 5
    check (avg_period_length >= 1 and avg_period_length <= 14),
  updated_at timestamptz not null default now()
);

create table if not exists public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_on date not null,
  ended_on date,
  created_at timestamptz not null default now(),
  check (ended_on is null or ended_on >= started_on)
);

create index if not exists cycle_periods_user_started_idx
  on public.cycle_periods (user_id, started_on desc);

create table if not exists public.cycle_day_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  flow_level text check (
    flow_level is null or flow_level in ('spotting', 'light', 'medium', 'heavy')
  ),
  symptoms text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

create table if not exists public.tracker_dose_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  dose_log_id uuid not null references public.dose_logs (id) on delete cascade,
  tracker_id text not null,
  taken_on date not null,
  schedule_time time not null,
  medication_name text not null,
  dose_pills text,
  dose_mg text,
  created_at timestamptz not null default now(),
  unique (dose_log_id, tracker_id)
);

create index if not exists tracker_dose_events_user_tracker_idx
  on public.tracker_dose_events (user_id, tracker_id, taken_on desc);

alter table public.user_trackers enable row level security;
alter table public.cycle_settings enable row level security;
alter table public.cycle_periods enable row level security;
alter table public.cycle_day_logs enable row level security;
alter table public.tracker_dose_events enable row level security;

create policy "Users manage own trackers"
  on public.user_trackers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own cycle settings"
  on public.cycle_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own cycle periods"
  on public.cycle_periods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own cycle day logs"
  on public.cycle_day_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own tracker dose events"
  on public.tracker_dose_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists cycle_settings_updated_at on public.cycle_settings;
create trigger cycle_settings_updated_at
  before update on public.cycle_settings
  for each row execute function public.set_updated_at();

drop trigger if exists cycle_day_logs_updated_at on public.cycle_day_logs;
create trigger cycle_day_logs_updated_at
  before update on public.cycle_day_logs
  for each row execute function public.set_updated_at();
