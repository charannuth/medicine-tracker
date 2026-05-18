-- Medication route (oral, dermal, injection) and specific form (pill, cream, etc.)

alter table public.medications
  add column if not exists medication_route text,
  add column if not exists medication_form text;
