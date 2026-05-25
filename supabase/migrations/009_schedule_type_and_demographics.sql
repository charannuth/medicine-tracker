-- Scheduled vs as-needed medications + basic profile stats on medical records.

alter table public.medications
  add column if not exists schedule_type text not null default 'scheduled'
  check (schedule_type in ('scheduled', 'as_needed'));

comment on column public.medications.schedule_type is
  'scheduled = fixed daily times; as_needed = log doses when taken (PRN).';

alter table public.medical_records
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists height_cm numeric(5, 1),
  add column if not exists weight_kg numeric(6, 2);

comment on column public.medical_records.date_of_birth is 'Used to compute age for profile display only.';
comment on column public.medical_records.gender is 'Self-reported gender identity (optional).';
comment on column public.medical_records.height_cm is 'Height stored in centimeters.';
comment on column public.medical_records.weight_kg is 'Weight stored in kilograms.';
