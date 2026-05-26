import { supabase } from '../supabase'
import { todayLocalDate, normalizeScheduleTimes } from '../dates'
import type { DoseLog, Medication } from '../types'
import { isAsNeededMed } from '../medicationSchedule'
import {
  countScheduledDosesTakenOnDate,
  filterMedicationsActiveOn,
} from '../medicationDates'
import type { TrackingCalendarCell, TrackingCalendarData } from './calendarTypes'

type MedCalendarStatus = 'perfect' | 'partial' | 'missed' | 'none'

function groupLogsByDate(logs: DoseLog[]): Map<string, DoseLog[]> {
  const map = new Map<string, DoseLog[]>()
  for (const log of logs) {
    const list = map.get(log.taken_on) ?? []
    list.push(log)
    map.set(log.taken_on, list)
  }
  return map
}

function isPerfectDay(medications: Medication[], logsForDay: DoseLog[], date: string): boolean {
  const active = filterMedicationsActiveOn(medications, date)
  const expected = countScheduledDosesTakenOnDate(medications, logsForDay, date).expected
  if (expected === 0) return false

  const logged = new Set(logsForDay.map((l) => `${l.medication_id}|${l.schedule_time}`))
  for (const med of active) {
    if (isAsNeededMed(med)) continue
    for (const time of normalizeScheduleTimes(med.schedule_times ?? [])) {
      if (!logged.has(`${med.id}|${time}`)) return false
    }
  }
  return true
}

function statusForDay(
  medications: Medication[],
  logsForDay: DoseLog[],
  date: string,
  today: string,
): MedCalendarStatus {
  const { expected, taken } = countScheduledDosesTakenOnDate(medications, logsForDay, date)
  if (expected === 0) return 'none'
  if (isPerfectDay(medications, logsForDay, date)) return 'perfect'
  if (date === today) return 'partial'
  return taken > 0 ? 'partial' : 'missed'
}

function datesInRange(start: string, end: string): string[] {
  const startMs = new Date(`${start}T12:00:00`).getTime()
  const endMs = new Date(`${end}T12:00:00`).getTime()
  const n = Math.max(0, Math.round((endMs - startMs) / (24 * 60 * 60 * 1000))) + 1
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(`${start}T12:00:00`)
    d.setDate(d.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    out.push(`${y}-${m}-${day}`)
  }
  return out
}

const LEGEND: TrackingCalendarData['legend'] = [
  { id: 'perfect', label: 'All doses taken', swatchClass: 'med-perfect' },
  { id: 'partial', label: 'Some doses taken', swatchClass: 'med-partial' },
  { id: 'missed', label: 'Missed day', swatchClass: 'med-missed' },
]

export async function loadMedProgressCalendarData(
  userId: string,
  start: string,
  end: string,
): Promise<TrackingCalendarData> {
  const today = todayLocalDate()
  if (!supabase) {
    return { cells: new Map(), legend: LEGEND, emptyMessage: 'No medication data.' }
  }

  const [medsResult, logsResult] = await Promise.all([
    supabase.from('medications').select('*').eq('user_id', userId),
    supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('taken_on', start)
      .lte('taken_on', end),
  ])

  if (medsResult.error) throw medsResult.error
  if (logsResult.error) throw logsResult.error

  const medications = (medsResult.data ?? []) as Medication[]
  const logsByDate = groupLogsByDate((logsResult.data ?? []) as DoseLog[])

  const cells = new Map<string, TrackingCalendarCell>()
  for (const date of datesInRange(start, end)) {
    const logsForDay = logsByDate.get(date) ?? []
    const s = statusForDay(medications, logsForDay, date, today)

    const classNames: string[] = []
    if (date > today) classNames.push('is-future')
    if (s === 'perfect') classNames.push('med-perfect')
    if (s === 'partial') classNames.push('med-partial')
    if (s === 'missed') classNames.push('med-missed')

    const markers: TrackingCalendarCell['markers'] = []
    if (s === 'perfect') markers.push('dot')
    if (s === 'partial') markers.push('dot')
    if (s === 'missed') markers.push('heart')

    cells.set(date, { date, classNames, markers })
  }

  return {
    cells,
    legend: LEGEND,
    emptyMessage: 'No medication progress data for this range yet.',
  }
}

