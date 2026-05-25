import { addDaysToDateString, todayLocalDate } from '../dates'
import {
  buildCycleCalendarDays,
  fetchCycleDayLogs,
  fetchCyclePeriods,
  fetchCycleSettings,
  type CycleCalendarDay,
} from './cycle'
import type { TrackingCalendarCell, TrackingCalendarData } from './calendarTypes'

function cellFromCycleDay(day: CycleCalendarDay): TrackingCalendarCell {
  const classNames: string[] = []
  if (day.phase) classNames.push(`phase-${day.phase}`)
  if (day.isLoggedPeriod) classNames.push('logged-period')
  if (day.isPredictedPeriod) classNames.push('predicted-period')
  if (day.isFuture) classNames.push('is-future')
  if (day.hasSymptoms) classNames.push('has-symptoms')

  const markers: TrackingCalendarCell['markers'] = []
  if (day.hasIntercourse) markers.push('heart')
  if (day.hasSymptoms) markers.push('dot')

  return { date: day.date, classNames, markers }
}

const CYCLE_LEGEND = [
  { id: 'logged', label: 'Logged period', swatchClass: 'logged-period' },
  { id: 'predicted', label: 'Predicted period', swatchClass: 'predicted-period' },
  { id: 'symptom', label: 'Symptoms', icon: 'dot' as const },
  { id: 'heart', label: 'Intercourse', icon: 'heart' as const },
  { id: 'follicular', label: 'Follicular', swatchClass: 'phase-follicular' },
  { id: 'ovulation', label: 'Ovulation', swatchClass: 'phase-ovulation' },
  { id: 'luteal', label: 'Luteal', swatchClass: 'phase-luteal' },
]

export async function loadCycleCalendarData(
  userId: string,
  start: string,
  end: string,
): Promise<TrackingCalendarData> {
  const today = todayLocalDate()
  const [settings, periods, logs] = await Promise.all([
    fetchCycleSettings(userId),
    fetchCyclePeriods(userId),
    fetchCycleDayLogs(userId, start, end),
  ])

  const dateList = datesInRange(start, end)
  const cycleDays = buildCycleCalendarDays(
    dateList,
    periods,
    logs,
    settings,
    today,
  )

  const cells = new Map<string, TrackingCalendarCell>()
  for (const day of cycleDays) {
    cells.set(day.date, cellFromCycleDay(day))
  }

  return { cells, legend: CYCLE_LEGEND }
}

function daysBetweenInclusive(start: string, end: string): number {
  const s = new Date(`${start}T12:00:00`).getTime()
  const e = new Date(`${end}T12:00:00`).getTime()
  return Math.max(0, Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1)
}

function datesInRange(start: string, end: string): string[] {
  const n = daysBetweenInclusive(start, end)
  return Array.from({ length: n }, (_, i) => addDaysToDateString(start, i))
}
