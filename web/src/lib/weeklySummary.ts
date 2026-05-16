import { supabase } from './supabase'
import { lastNDays } from './dates'
import { expectedDosesForActiveMedicationsOnDate } from './medicationDates'
import type { Medication } from './types'

export type WeeklySummary = {
  taken: number
  expected: number
  percent: number
}

export async function fetchWeeklySummary(userId: string): Promise<WeeklySummary> {
  if (!supabase) return { taken: 0, expected: 0, percent: 0 }

  const days = lastNDays(7)
  const startDate = days[days.length - 1]

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
  const expected = days.reduce(
    (sum, date) => sum + expectedDosesForActiveMedicationsOnDate(medications, date),
    0,
  )

  const taken = (logsResult.data ?? []).length
  const percent = expected > 0 ? Math.round((taken / expected) * 100) : 0

  return { taken, expected, percent }
}
