-- Context captured when logging as-needed (PRN) doses.

alter table public.dose_logs
  add column if not exists prn_symptoms text[] not null default '{}',
  add column if not exists prn_reason text,
  add column if not exists prn_notes text;

comment on column public.dose_logs.prn_symptoms is 'Symptoms or experiences at time of PRN dose.';
comment on column public.dose_logs.prn_reason is 'Why the user took this dose (e.g. chest tightness).';
comment on column public.dose_logs.prn_notes is 'Optional notes with a PRN dose log.';
