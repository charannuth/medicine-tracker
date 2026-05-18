-- Run in Supabase SQL Editor after 002.
-- Safe if you never had a legacy "dosage" column (already using dose_pills / dose_mg).

alter table public.medications
  add column if not exists dose_pills text;

alter table public.medications
  add column if not exists dose_mg text;

-- Move legacy single dosage field into dose_pills (only when old column exists)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'medications'
      and column_name = 'dosage'
  ) then
    update public.medications
    set dose_pills = dosage
    where coalesce(trim(dose_pills), '') = ''
      and dosage is not null
      and trim(dosage) <> '';
  end if;
end $$;

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
