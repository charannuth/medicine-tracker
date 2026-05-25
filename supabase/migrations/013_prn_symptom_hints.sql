-- Per-medication symptom chips shown when logging PRN doses.

alter table public.medications
  add column if not exists prn_symptom_hints text[] not null default '{}';

comment on column public.medications.prn_symptom_hints is
  'Symptom options for this medication PRN check-in; merged with route/name defaults.';
