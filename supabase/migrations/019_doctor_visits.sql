-- Doctor visit scheduling and post-appointment notes (self-reported).

create table if not exists public.doctor_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  visit_date date not null,
  visit_time text,
  provider_name text,
  specialty text,
  location text,
  reason text,
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_visits_user_date_idx
  on public.doctor_visits (user_id, visit_date desc);

alter table public.doctor_visits enable row level security;

create policy "Users can view own doctor visits"
  on public.doctor_visits for select
  using (auth.uid() = user_id);

create policy "Users can insert own doctor visits"
  on public.doctor_visits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own doctor visits"
  on public.doctor_visits for update
  using (auth.uid() = user_id);

create policy "Users can delete own doctor visits"
  on public.doctor_visits for delete
  using (auth.uid() = user_id);

drop trigger if exists doctor_visits_updated_at on public.doctor_visits;
create trigger doctor_visits_updated_at
  before update on public.doctor_visits
  for each row execute function public.set_updated_at();
