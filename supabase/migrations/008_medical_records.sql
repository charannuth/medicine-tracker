-- Self-reported medical history (not certified clinical records).
-- Run in Supabase SQL Editor if not using migration tooling.

create table if not exists public.medical_records (
  user_id uuid primary key references auth.users (id) on delete cascade,
  blood_type text check (
    blood_type is null or blood_type in (
      'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'
    )
  ),
  known_allergies text[] not null default '{}',
  known_conditions text[] not null default '{}',
  past_surgeries text,
  family_history text,
  emergency_notes text,
  other_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.medical_records enable row level security;

create policy "Users can view own medical record"
  on public.medical_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own medical record"
  on public.medical_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medical record"
  on public.medical_records for update
  using (auth.uid() = user_id);

drop trigger if exists medical_records_updated_at on public.medical_records;
create trigger medical_records_updated_at
  before update on public.medical_records
  for each row execute function public.set_updated_at();
