import { normalizeScheduleTimes, todayLocalDate } from './dates'
import type { DoseLog, Medication } from './types'

export type MedicationScheduleStatus = 'active' | 'upcoming' | 'ended'

type DateRangeMed = Pick<Medication, 'start_date' | 'end_date'>

export function isMedicationActiveOn(med: DateRangeMed, dateStr: string): boolean {
  if (dateStr < med.start_date) return false
  if (med.end_date && dateStr > med.end_date) return false
  return true
}

export function getMedicationScheduleStatus(
  med: DateRangeMed,
  today: string = todayLocalDate(),
): MedicationScheduleStatus {
  if (today < med.start_date) return 'upcoming'
  if (med.end_date && today > med.end_date) return 'ended'
  return 'active'
}

export function expectedDosesForActiveMedicationsOnDate(
  medications: Medication[],
  dateStr: string,
): number {
  return countScheduledDosesTakenOnDate(medications, [], dateStr).expected
}

/** Scheduled slots vs logs — only counts doses on today's active schedule. */
export function countScheduledDosesTakenOnDate(
  medications: Medication[],
  logsForDay: DoseLog[],
  dateStr: string,
): { taken: number; expected: number; extraLogs: number } {
  const expectedKeys = new Set<string>()
  for (const med of filterMedicationsActiveOn(medications, dateStr)) {
    for (const time of normalizeScheduleTimes(med.schedule_times ?? [])) {
      expectedKeys.add(`${med.id}|${time}`)
    }
  }

  const loggedKeys = new Set(
    logsForDay.map((l) => `${l.medication_id}|${l.schedule_time}`),
  )

  let taken = 0
  for (const key of expectedKeys) {
    if (loggedKeys.has(key)) taken++
  }

  let extraLogs = 0
  for (const key of loggedKeys) {
    if (!expectedKeys.has(key)) extraLogs++
  }

  return { taken, expected: expectedKeys.size, extraLogs }
}

export function filterMedicationsActiveOn<T extends DateRangeMed>(
  medications: T[],
  dateStr: string,
): T[] {
  return medications.filter((med) => isMedicationActiveOn(med, dateStr))
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatMedicationDateRange(med: DateRangeMed): string {
  const start = formatShortDate(med.start_date)
  if (!med.end_date) return `From ${start}`
  const end = formatShortDate(med.end_date)
  if (med.start_date === med.end_date) return start
  return `${start} – ${end}`
}

export function validateMedicationDates(
  startDate: string,
  endDate: string | null,
): void {
  if (!startDate) throw new Error('Start date is required.')
  if (endDate && endDate < startDate) {
    throw new Error('End date must be on or after the start date.')
  }
}

export function scheduleStatusLabel(status: MedicationScheduleStatus): string {
  switch (status) {
    case 'upcoming':
      return 'Upcoming'
    case 'ended':
      return 'Ended'
    default:
      return 'Active'
  }
}
