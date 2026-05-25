-- Menstrual cycle tracking: intercourse, pre/post symptoms, late period, prediction adjust.

alter table public.cycle_settings
  add column if not exists period_late boolean not null default false,
  add column if not exists late_marked_on date,
  add column if not exists prediction_push_days smallint not null default 0
    check (prediction_push_days >= 0 and prediction_push_days <= 45);

comment on column public.cycle_settings.period_late is
  'User flagged that their period is later than predicted.';
comment on column public.cycle_settings.prediction_push_days is
  'Extra days added to next-period prediction (e.g. after marking late).';

alter table public.cycle_day_logs
  add column if not exists intercourse boolean not null default false,
  add column if not exists symptoms_pre text[] not null default '{}',
  add column if not exists symptoms_post text[] not null default '{}';

comment on column public.cycle_day_logs.intercourse is 'Logged sexual activity for this day.';
comment on column public.cycle_day_logs.symptoms_pre is 'Pre-menstrual symptoms for this day.';
comment on column public.cycle_day_logs.symptoms_post is 'Post-menstrual symptoms for this day.';
