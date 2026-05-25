import { supabase } from '../supabase'
import { localDateString, todayLocalDate } from '../dates'

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'

export type CycleSettings = {
  user_id: string
  avg_cycle_length: number
  avg_period_length: number
  updated_at: string
}

export type CyclePeriod = {
  id: string
  user_id: string
  started_on: string
  ended_on: string | null
  created_at: string
}

export type CycleDayLog = {
  user_id: string
  log_date: string
  flow_level: FlowLevel | null
  symptoms: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export const CYCLE_SYMPTOM_OPTIONS = [
  'Cramps',
  'Bloating',
  'Headache',
  'Fatigue',
  'Mood changes',
  'Back pain',
  'Breast tenderness',
] as const

const DEFAULT_SETTINGS: Omit<CycleSettings, 'user_id' | 'updated_at'> = {
  avg_cycle_length: 28,
  avg_period_length: 5,
}

export async function fetchCycleSettings(userId: string): Promise<CycleSettings> {
  if (!supabase) {
    return {
      user_id: userId,
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    }
  }

  const { data, error } = await supabase
    .from('cycle_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (data) return data as CycleSettings

  const { data: inserted, error: insertError } = await supabase
    .from('cycle_settings')
    .insert({ user_id: userId, ...DEFAULT_SETTINGS })
    .select('*')
    .single()

  if (insertError) throw insertError
  return inserted as CycleSettings
}

export async function updateCycleSettings(
  userId: string,
  patch: Partial<Pick<CycleSettings, 'avg_cycle_length' | 'avg_period_length'>>,
): Promise<void> {
  if (!supabase) return
  await fetchCycleSettings(userId)
  const { error } = await supabase
    .from('cycle_settings')
    .update(patch)
    .eq('user_id', userId)
  if (error) throw error
}

export async function fetchCyclePeriods(userId: string, limit = 24): Promise<CyclePeriod[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('cycle_periods')
    .select('*')
    .eq('user_id', userId)
    .order('started_on', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as CyclePeriod[]
}

export async function fetchOpenPeriod(userId: string): Promise<CyclePeriod | null> {
  const periods = await fetchCyclePeriods(userId, 1)
  const latest = periods[0]
  if (latest && !latest.ended_on) return latest
  return null
}

export async function startPeriod(userId: string, startedOn = todayLocalDate()): Promise<void> {
  if (!supabase) return
  const open = await fetchOpenPeriod(userId)
  if (open) {
    throw new Error('A period is already open. End it before starting a new one.')
  }

  const { error } = await supabase.from('cycle_periods').insert({
    user_id: userId,
    started_on: startedOn,
  })
  if (error) throw error
}

export async function endPeriod(
  userId: string,
  endedOn = todayLocalDate(),
): Promise<void> {
  if (!supabase) return
  const open = await fetchOpenPeriod(userId)
  if (!open) throw new Error('No open period to end.')

  if (endedOn < open.started_on) {
    throw new Error('End date cannot be before period start.')
  }

  const { error } = await supabase
    .from('cycle_periods')
    .update({ ended_on: endedOn })
    .eq('id', open.id)
  if (error) throw error
}

export async function fetchCycleDayLogs(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<CycleDayLog[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('cycle_day_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: true })
  if (error) throw error
  return (data ?? []) as CycleDayLog[]
}

export async function upsertCycleDayLog(
  userId: string,
  logDate: string,
  patch: {
    flow_level?: FlowLevel | null
    symptoms?: string[]
    notes?: string | null
  },
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('cycle_day_logs').upsert(
    {
      user_id: userId,
      log_date: logDate,
      flow_level: patch.flow_level ?? null,
      symptoms: patch.symptoms ?? [],
      notes: patch.notes?.trim() || null,
    },
    { onConflict: 'user_id,log_date' },
  )
  if (error) throw error
}

/** Dates (YYYY-MM-DD) that fall inside any logged period window. */
export function bleedingDatesFromPeriods(
  periods: CyclePeriod[],
  throughDate: string,
): Set<string> {
  const set = new Set<string>()
  for (const period of periods) {
    const end = period.ended_on ?? throughDate
    if (end < period.started_on) continue
    let cursor = period.started_on
    while (cursor <= end && cursor <= throughDate) {
      set.add(cursor)
      cursor = localDateString(addDays(parseDate(cursor), 1))
    }
  }
  return set
}

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function predictNextPeriodStart(
  periods: CyclePeriod[],
  settings: CycleSettings,
): string | null {
  const completed = periods.filter((p) => p.started_on)
  if (completed.length === 0) return null

  const lastStart = completed[0].started_on
  const predicted = localDateString(
    addDays(parseDate(lastStart), settings.avg_cycle_length),
  )
  return predicted
}

export function cycleDayInPeriod(
  dateStr: string,
  periods: CyclePeriod[],
): CyclePeriod | null {
  for (const period of periods) {
    const end = period.ended_on ?? dateStr
    if (dateStr >= period.started_on && dateStr <= end) return period
  }
  return null
}
