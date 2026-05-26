-- Weight tracking: calories in/out + weight logs with baseline/goal + log frequency.

create table if not exists public.weight_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  baseline_height_cm numeric(5, 1),
  baseline_weight_kg numeric(6, 2),
  goal_direction text not null default 'lose'
    check (goal_direction in ('lose', 'gain')),
  goal_rate text not null default 'mild'
    check (goal_rate in ('mild', 'regular', 'extreme')),
  activity_level text not null default 'light'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active')),
  log_frequency_days smallint not null default 1
    check (log_frequency_days in (1, 3, 7)),
  log_frequency_anchor_date date not null default current_date,
  sync_weight_to_medical_records boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on column public.weight_settings.baseline_height_cm is
  'User baseline height (cm) used for calorie target estimates.';
comment on column public.weight_settings.baseline_weight_kg is
  'User baseline weight (kg) used for calorie target estimates.';

create table if not exists public.weight_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  weight_kg numeric(6, 2),
  breakfast_calories integer,
  lunch_calories integer,
  dinner_calories integer,
  did_workout boolean not null default false,
  workout_calories_burned integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

comment on column public.weight_logs.weight_kg is
  'Weight for this day stored as kg (UI may enter lb).';

create index if not exists weight_logs_user_date_idx
  on public.weight_logs (user_id, log_date desc);

alter table public.weight_settings enable row level security;
alter table public.weight_logs enable row level security;

create policy "Users can view own weight settings"
  on public.weight_settings for select
  using (auth.uid() = user_id);

create policy "Users can upsert own weight settings"
  on public.weight_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weight settings"
  on public.weight_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view own weight logs"
  on public.weight_logs for select
  using (auth.uid() = user_id);

create policy "Users can upsert own weight logs"
  on public.weight_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own weight logs"
  on public.weight_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists weight_settings_updated_at on public.weight_settings;
create trigger weight_settings_updated_at
  before update on public.weight_settings
  for each row execute function public.set_updated_at();

drop trigger if exists weight_logs_updated_at on public.weight_logs;
create trigger weight_logs_updated_at
  before update on public.weight_logs
  for each row execute function public.set_updated_at();

