-- Preferred height/weight entry units (values still stored as cm / kg).

alter table public.medical_records
  add column if not exists height_unit text not null default 'metric'
    check (height_unit in ('metric', 'imperial')),
  add column if not exists weight_unit text not null default 'metric'
    check (weight_unit in ('metric', 'imperial'));

comment on column public.medical_records.height_unit is
  'User preference for height entry/display: metric (cm) or imperial (ft/in).';
comment on column public.medical_records.weight_unit is
  'User preference for weight entry/display: metric (kg) or imperial (lb).';
