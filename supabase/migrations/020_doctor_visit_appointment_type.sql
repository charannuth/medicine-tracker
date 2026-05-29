-- Appointment category for doctor visits (scheduled, checkup, emergency, etc.)

alter table public.doctor_visits
  add column if not exists appointment_type text;

comment on column public.doctor_visits.appointment_type is
  'Visit category: scheduled, regular_checkup, follow_up, walk_in, emergency, telehealth, other';
