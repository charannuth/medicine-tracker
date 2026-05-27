import { todayLocalDate } from '../dates'
import type { TrackingCalendarCell, TrackingCalendarData } from './calendarTypes'
import { fetchHrtDayLogsInRange, type HrtDayLog } from './hrt'
import {
  fetchTrackerDoseEventsInRange,
  type TrackerDoseEvent,
} from './doseSync'

function datesInRange(start: string, end: string): string[] {
  const startMs = new Date(`${start}T12:00:00`).getTime()
  const endMs = new Date(`${end}T12:00:00`).getTime()
  const n = Math.max(0, Math.round((endMs - startMs) / (24 * 60 * 60 * 1000))) + 1
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(`${start}T12:00:00`)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
}

function cellFromHrt(input: {
  date: string
  today: string
  log: HrtDayLog | null
  hasDose: boolean
}): TrackingCalendarCell {
  const { date, today, log, hasDose } = input
  const classNames: string[] = []
  if (date > today) classNames.push('is-future')
  if (log) classNames.push('hrt-logged')

  const markers: TrackingCalendarCell['markers'] = []
  if (hasDose) markers.push('heart')
  if (log) markers.push('dot')

  const events: TrackingCalendarCell['events'] = []
  if (log) events.push({ id: 'journal', label: 'HRT journal', tone: 'hrt' })
  if (hasDose) events.push({ id: 'dose', label: 'HRT dose', tone: 'hrt' })

  return { date, classNames, markers, events }
}

const HRT_LEGEND: TrackingCalendarData['legend'] = [
  { id: 'hrt', label: 'HRT journal logged', swatchClass: 'hrt-logged' },
  { id: 'dose', label: 'HRT dose synced from Today', icon: 'heart' as const },
]

const EMPTY: TrackingCalendarData = {
  cells: new Map(),
  legend: HRT_LEGEND,
  emptyMessage: 'No HRT logs or doses on this calendar yet.',
}

export async function loadHrtCalendarData(
  userId: string,
  start: string,
  end: string,
): Promise<TrackingCalendarData> {
  const today = todayLocalDate()
  const [logs, doseEvents] = await Promise.all([
    fetchHrtDayLogsInRange(userId, start, end),
    fetchTrackerDoseEventsInRange(userId, 'hrt', start, end, 500),
  ])

  const logByDate = new Map<string, HrtDayLog>()
  for (const log of logs) logByDate.set(log.log_date, log)

  const doseDates = new Set<string>()
  for (const ev of doseEvents as TrackerDoseEvent[]) doseDates.add(ev.taken_on)

  const cells = new Map<string, TrackingCalendarCell>()
  const ds = datesInRange(start, end)
  for (const date of ds) {
    cells.set(
      date,
      cellFromHrt({
        date,
        today,
        log: logByDate.get(date) ?? null,
        hasDose: doseDates.has(date),
      }),
    )
  }

  return { cells, legend: HRT_LEGEND, emptyMessage: EMPTY.emptyMessage }
}

