export type MedicationScheduleType = 'scheduled' | 'as_needed'

export function isAsNeededMed(med: {
  schedule_type?: MedicationScheduleType | string | null
}): boolean {
  return med.schedule_type === 'as_needed'
}

export function scheduleTypeLabel(type: MedicationScheduleType | string | null | undefined): string {
  return isAsNeededMed({ schedule_type: type }) ? 'As needed' : 'Daily schedule'
}
