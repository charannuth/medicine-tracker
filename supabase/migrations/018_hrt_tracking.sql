-- HRT journaling: bodily/mood changes and notes per calendar day.

create table if not exists public.hrt_day_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  bodily_changes text[] not null default '{}',
  mood_changes text[] not null default '{}',
  other_changes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

comment on table public.hrt_day_logs is
  'User-entered HRT journaling notes per day (bodily/mood changes).';

alter table public.hrt_day_logs enable row level security;

create policy "Users can view own HRT logs"
  on public.hrt_day_logs for select
  using (auth.uid() = user_id);

create policy "Users can upsert own HRT logs"
  on public.hrt_day_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own HRT logs"
  on public.hrt_day_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists hrt_day_logs_updated_at on public.hrt_day_logs;
create trigger hrt_day_logs_updated_at
  before update on public.hrt_day_logs
  for each row execute function public.set_updated_at();

