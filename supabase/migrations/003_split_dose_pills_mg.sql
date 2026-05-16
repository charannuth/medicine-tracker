-- Run in Supabase SQL Editor after 002 (or on fresh DB that still has dosage column).

alter table public.medications
  add column if not exists dose_pills text;

alter table public.medications
  add column if not exists dose_mg text;

-- Move legacy single dosage field into dose_pills when new columns are empty
update public.medications
set dose_pills = dosage
where coalesce(trim(dose_pills), '') = ''
  and dosage is not null
  and trim(dosage) <> '';

alter table public.medications
  drop column if exists dosage;

alter table public.medications
  drop constraint if exists medications_dose_amount_check;

alter table public.medications
  add constraint medications_dose_amount_check
  check (
    coalesce(trim(dose_pills), '') <> ''
    or coalesce(trim(dose_mg), '') <> ''
  );
