import { supabase } from './supabase'
import { lastNDays, normalizeScheduleTimes, todayLocalDate } from './dates'
import {
  expectedDosesForActiveMedicationsOnDate,
  filterMedicationsActiveOn,
} from './medicationDates'
import type { DoseLog, Medication } from './types'

export type StreakStats = {
  currentStreak: number
  longestStreak: number
  todayTaken: number
  todayExpected: number
  todayComplete: boolean
  hasMedications: boolean
  last7Days: { date: string; perfect: boolean }[]
}

const LOOKBACK_DAYS = 365

function groupLogsByDate(logs: DoseLog[]): Map<string, DoseLog[]> {
  const map = new Map<string, DoseLog[]>()
  for (const log of logs) {
    const list = map.get(log.taken_on) ?? []
    list.push(log)
    map.set(log.taken_on, list)
  }
  return map
}

function isPerfectDay(
  medications: Medication[],
  logsForDay: DoseLog[],
  date: string,
): boolean {
  const active = filterMedicationsActiveOn(medications, date)
  const expected = expectedDosesForActiveMedicationsOnDate(medications, date)
  if (expected === 0) return false

  const logged = new Set(
    logsForDay.map((l) => `${l.medication_id}|${l.schedule_time}`),
  )

  for (const med of active) {
    for (const time of normalizeScheduleTimes(med.schedule_times ?? [])) {
      if (!logged.has(`${med.id}|${time}`)) return false
    }
  }
  return true
}

function computeCurrentStreak(
  today: string,
  daysNewestFirst: string[],
  perfectDays: Set<string>,
): number {
  let streak = 0

  for (const date of daysNewestFirst) {
    if (date === today && !perfectDays.has(today)) {
      // Today still in progress — don't break the streak yet
      continue
    }
    if (perfectDays.has(date)) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function computeLongestStreak(daysOldestFirst: string[], perfectDays: Set<string>): number {
  let longest = 0
  let run = 0

  for (const date of daysOldestFirst) {
    if (perfectDays.has(date)) {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  return longest
}

export async function fetchStreakStats(userId: string): Promise<StreakStats> {
  const empty: StreakStats = {
    currentStreak: 0,
    longestStreak: 0,
    todayTaken: 0,
    todayExpected: 0,
    todayComplete: false,
    hasMedications: false,
    last7Days: lastNDays(7)
      .reverse()
      .map((date) => ({ date, perfect: false })),
  }

  if (!supabase) return empty

  const today = todayLocalDate()
  const daysNewestFirst = lastNDays(LOOKBACK_DAYS)
  const daysOldestFirst = [...daysNewestFirst].reverse()
  const startDate = daysOldestFirst[0]

  const [medsResult, logsResult] = await Promise.all([
    supabase.from('medications').select('*').eq('user_id', userId),
    supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('taken_on', startDate),
  ])

  if (medsResult.error) throw medsResult.error
  if (logsResult.error) throw logsResult.error

  const medications = (medsResult.data ?? []) as Medication[]
  const logsByDate = groupLogsByDate((logsResult.data ?? []) as DoseLog[])
  const todayExpected = expectedDosesForActiveMedicationsOnDate(medications, today)
  const hasMedications =
    filterMedicationsActiveOn(medications, today).length > 0 && todayExpected > 0

  const todayLogs = logsByDate.get(today) ?? []
  const todayTaken = new Set(
    todayLogs.map((l) => `${l.medication_id}|${l.schedule_time}`),
  ).size
  const todayComplete =
    hasMedications &&
    todayTaken >= todayExpected &&
    isPerfectDay(medications, todayLogs, today)

  const perfectDays = new Set<string>()
  for (const date of daysOldestFirst) {
    const logs = logsByDate.get(date) ?? []
    if (isPerfectDay(medications, logs, date)) {
      perfectDays.add(date)
    }
  }

  const currentStreak = hasMedications
    ? computeCurrentStreak(today, daysNewestFirst, perfectDays)
    : 0
  const longestStreak = hasMedications
    ? computeLongestStreak(daysOldestFirst, perfectDays)
    : 0

  const last7 = lastNDays(7)
    .reverse()
    .map((date) => ({ date, perfect: perfectDays.has(date) }))

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    todayTaken,
    todayExpected,
    todayComplete,
    hasMedications,
    last7Days: last7,
  }
}

export function streakMessage(stats: StreakStats): string {
  if (!stats.hasMedications) {
    return 'Add medications with dose times to start earning streaks.'
  }
  if (stats.currentStreak === 0) {
    if (stats.todayComplete) {
      return 'Great job today — come back tomorrow to start a streak!'
    }
    return 'Take every scheduled dose today to start your streak.'
  }
  if (stats.todayComplete) {
    return `All doses logged today. You're on a ${stats.currentStreak} day streak!`
  }
  return `You're on a ${stats.currentStreak} day streak. Finish today's doses to keep it going.`
}
