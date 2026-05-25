-- Learn cycle length month-to-month; optional override for next prediction.

alter table public.cycle_periods
  add column if not exists cycle_length_days smallint
  check (
    cycle_length_days is null
    or (cycle_length_days >= 15 and cycle_length_days <= 90)
  );

comment on column public.cycle_periods.cycle_length_days is
  'Days from previous period start to this period start (recorded when this period begins).';

alter table public.cycle_settings
  add column if not exists expected_next_cycle_days smallint
  check (
    expected_next_cycle_days is null
    or (expected_next_cycle_days >= 15 and expected_next_cycle_days <= 90)
  );

comment on column public.cycle_settings.expected_next_cycle_days is
  'Optional override for days until next period; cleared when a new period starts.';
