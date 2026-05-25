-- Flexible dosing: PRN max doses, amount presets, per-log amounts.

alter table public.medications
  add column if not exists max_doses_per_day smallint
  check (max_doses_per_day is null or (max_doses_per_day >= 1 and max_doses_per_day <= 99));

alter table public.medications
  add column if not exists prn_amount_hints text[] not null default '{}';

comment on column public.medications.max_doses_per_day is
  'Optional daily cap for as-needed (PRN) medications.';

comment on column public.medications.prn_amount_hints is
  'Preset amounts shown when logging PRN doses (e.g. 1 puff, 2 tablets).';

alter table public.dose_logs
  add column if not exists logged_amount text;

comment on column public.dose_logs.logged_amount is
  'What the user actually took for this log (especially PRN).';

alter table public.medications
  drop constraint if exists medications_dose_amount_check;

alter table public.medications
  add constraint medications_dose_amount_check
  check (
    coalesce(trim(dose_pills), '') <> ''
    or coalesce(trim(dose_mg), '') <> ''
    or (
      schedule_type = 'as_needed'
      and max_doses_per_day is not null
    )
  );
