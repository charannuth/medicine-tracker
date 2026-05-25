import { supabase } from '../supabase'
import { todayLocalDate } from '../dates'
import {
  addDaysToDate,
  anchorPeriodStart,
  computePeriodPrediction,
  cycleDayNumber,
  estimatedPhaseForDate,
  phaseForCycleDay,
  type CyclePhase,
  type PeriodPrediction,
} from './cyclePhases'

export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy'

export type SymptomTiming = 'pre' | 'during' | 'post'

export type CycleSettings = {
  user_id: string
  avg_cycle_length: number
  avg_period_length: number
  period_late: boolean
  late_marked_on: string | null
  prediction_push_days: number
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
  symptoms_pre: string[]
  symptoms_post: string[]
  intercourse: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export const CYCLE_SYMPTOMS_PRE = [
  'Cramps',
  'Bloating',
  'Mood changes',
  'Fatigue',
  'Breast tenderness',
  'Food cravings',
  'Irritability',
  'Headache',
  'Acne',
] as const

export const CYCLE_SYMPTOMS_DURING = [
  'Cramps',
  'Heavy flow',
  'Clots',
  'Fatigue',
  'Headache',
  'Back pain',
  'Nausea',
] as const

export const CYCLE_SYMPTOMS_POST = [
  'Spotting',
  'Bloating',
  'Mood changes',
  'Fatigue',
  'Breast tenderness',
  'Cramping',
] as const

const DEFAULT_SETTINGS: Omit<CycleSettings, 'user_id' | 'updated_at'> = {
  avg_cycle_length: 28,
  avg_period_length: 5,
  period_late: false,
  late_marked_on: null,
  prediction_push_days: 0,
}

export type CycleCalendarDay = {
  date: string
  phase: CyclePhase | null
  isLoggedPeriod: boolean
  isPredictedPeriod: boolean
  hasSymptoms: boolean
  hasIntercourse: boolean
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
  if (data) return normalizeSettings(data as CycleSettings)

  const { data: inserted, error: insertError } = await supabase
    .from('cycle_settings')
    .insert({ user_id: userId, ...DEFAULT_SETTINGS })
    .select('*')
    .single()

  if (insertError) throw insertError
  return normalizeSettings(inserted as CycleSettings)
}

function normalizeSettings(row: CycleSettings): CycleSettings {
  return {
    ...row,
    period_late: row.period_late ?? false,
    late_marked_on: row.late_marked_on ?? null,
    prediction_push_days: row.prediction_push_days ?? 0,
  }
}

export async function updateCycleSettings(
  userId: string,
  patch: Partial<
    Pick<
      CycleSettings,
      | 'avg_cycle_length'
      | 'avg_period_length'
      | 'period_late'
      | 'late_marked_on'
      | 'prediction_push_days'
    >
  >,
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
  const periods = await fetchCyclePeriods(userId, 3)
  const open = periods.find((p) => !p.ended_on)
  return open ?? null
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

  await updateCycleSettings(userId, {
    period_late: false,
    late_marked_on: null,
    prediction_push_days: 0,
  })
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

/** Flag period as late and push the next prediction forward. */
export async function markPeriodLate(userId: string): Promise<PeriodPrediction> {
  const today = todayLocalDate()
  const [settings, periods] = await Promise.all([
    fetchCycleSettings(userId),
    fetchCyclePeriods(userId),
  ])
  const prediction = computePeriodPrediction(periods, settings, today)
  if (!prediction.nextStart) {
    throw new Error('Log at least one period start before marking late.')
  }

  const extraDays = Math.max(3, prediction.daysLate || 1)
  const newPush = settings.prediction_push_days + extraDays

  await updateCycleSettings(userId, {
    period_late: true,
    late_marked_on: today,
    prediction_push_days: newPush,
  })

  const updated = await fetchCycleSettings(userId)
  return computePeriodPrediction(periods, updated, today)
}

export async function clearPeriodLate(userId: string): Promise<void> {
  await updateCycleSettings(userId, {
    period_late: false,
    late_marked_on: null,
    prediction_push_days: 0,
  })
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
  return (data ?? []).map(normalizeDayLog)
}

function normalizeDayLog(row: CycleDayLog): CycleDayLog {
  return {
    ...row,
    symptoms_pre: row.symptoms_pre ?? [],
    symptoms_post: row.symptoms_post ?? [],
    intercourse: row.intercourse ?? false,
  }
}

export async function upsertCycleDayLog(
  userId: string,
  logDate: string,
  patch: {
    flow_level?: FlowLevel | null
    symptoms?: string[]
    symptoms_pre?: string[]
    symptoms_post?: string[]
    intercourse?: boolean
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
      symptoms_pre: patch.symptoms_pre ?? [],
      symptoms_post: patch.symptoms_post ?? [],
      intercourse: patch.intercourse ?? false,
      notes: patch.notes?.trim() || null,
    },
    { onConflict: 'user_id,log_date' },
  )
  if (error) throw error
}

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
      cursor = addDaysToDate(cursor, 1)
    }
  }
  return set
}

export function loggedFlowDates(logs: CycleDayLog[]): Set<string> {
  const set = new Set<string>()
  for (const log of logs) {
    if (log.flow_level) set.add(log.log_date)
  }
  return set
}

export function loggedPeriodDates(
  periods: CyclePeriod[],
  logs: CycleDayLog[],
  throughDate: string,
): Set<string> {
  const set = bleedingDatesFromPeriods(periods, throughDate)
  for (const d of loggedFlowDates(logs)) set.add(d)
  return set
}

export function predictedPeriodDateSet(
  prediction: PeriodPrediction,
): Set<string> {
  const set = new Set<string>()
  if (!prediction.nextStart || !prediction.nextEnd) return set
  let cursor = prediction.nextStart
  while (cursor <= prediction.nextEnd) {
    set.add(cursor)
    cursor = addDaysToDate(cursor, 1)
  }
  return set
}

export function buildCycleCalendarDays(
  dates: string[],
  periods: CyclePeriod[],
  logs: CycleDayLog[],
  settings: CycleSettings,
  today: string,
): CycleCalendarDay[] {
  const anchor = anchorPeriodStart(periods)
  const prediction = computePeriodPrediction(periods, settings, today)
  const loggedPeriod = loggedPeriodDates(periods, logs, today)
  const predicted = predictedPeriodDateSet(prediction)
  const open = periods.some((p) => !p.ended_on)
  const logByDate = new Map(logs.map((l) => [l.log_date, l]))

  return dates.map((date) => {
    const log = logByDate.get(date)
    const isLoggedPeriod = loggedPeriod.has(date)
    const isPredictedPeriod = predicted.has(date) && !isLoggedPeriod

    let phase: CyclePhase | null = null
    if (open && anchor) {
      const day = cycleDayNumber(anchor, date)
      if (day >= 1 && day <= settings.avg_cycle_length + 21) {
        phase = phaseForCycleDay(day, settings)
      }
    } else if (anchor && !open) {
      phase = estimatedPhaseForDate(date, anchor, settings)
    }

    const hasSymptoms = Boolean(
      log &&
        (log.symptoms.length > 0 ||
          log.symptoms_pre.length > 0 ||
          log.symptoms_post.length > 0),
    )

    return {
      date,
      phase,
      isLoggedPeriod,
      isPredictedPeriod,
      hasSymptoms,
      hasIntercourse: log?.intercourse ?? false,
    }
  })
}

export function getCyclePrediction(
  periods: CyclePeriod[],
  settings: CycleSettings,
  today = todayLocalDate(),
): PeriodPrediction {
  return computePeriodPrediction(periods, settings, today)
}

export { computePeriodPrediction, type CyclePhase, type PeriodPrediction }
export {
  PHASE_HINTS,
  PHASE_LABELS,
} from './cyclePhases'

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

/** @deprecated Use getCyclePrediction */
export function predictNextPeriodStart(
  periods: CyclePeriod[],
  settings: CycleSettings,
): string | null {
  return computePeriodPrediction(periods, settings, todayLocalDate()).nextStart
}
