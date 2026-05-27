export function formatDoseDisplay(med: {
  dose_pills: string | null
  dose_mg: string | null
}): string {
  const pills = med.dose_pills?.trim() ?? ''
  const mg = med.dose_mg?.trim() ?? ''
  if (pills && mg) return `${pills} · ${mg}`
  return pills || mg
}

import type { MedicationScheduleType } from './medicationSchedule'
import { ensureDoseConstraint } from './doseByRoute'

export function normalizeDoseFields(
  pills: string,
  mg: string,
  options?: {
    schedule_type?: MedicationScheduleType
    max_doses_per_day?: number | null
  },
) {
  const dose_pills = pills.trim() || null
  const dose_mg = mg.trim() || null
  ensureDoseConstraint({
    dose_pills: pills,
    dose_mg: mg,
    schedule_type: options?.schedule_type ?? 'scheduled',
    max_doses_per_day: options?.max_doses_per_day ?? null,
  })
  return { dose_pills, dose_mg }
}
