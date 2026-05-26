import { addDaysToYmd, daysBetweenYmd } from './dateYmd'

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal'

export type PeriodPrediction = {
  nextStart: string | null
  nextEnd: string | null
  isLate: boolean
  daysLate: number
  cycleDay: number | null
  currentPhase: CyclePhase | null
}

export type CyclePeriod = {
  started_on: string
  ended_on: string | null
  cycle_length_days: number | null
}

export type CycleSettings = {
  avg_cycle_length: number
  avg_period_length: number
  expected_next_cycle_days: number | null
  prediction_push_days: number
  period_late: boolean
}

export function addDaysToDate(dateStr: string, days: number): string {
  return addDaysToYmd(dateStr, days)
}

export function daysBetween(startStr: string, endStr: string): number {
  return daysBetweenYmd(startStr, endStr)
}

/** Last period anchor: open period start, else most recent period start. */
export function anchorPeriodStart(periods: CyclePeriod[]): string | null {
  const open = periods.find((p) => !p.ended_on)
  if (open) return open.started_on
  if (periods.length === 0) return null
  return [...periods].sort((a, b) => b.started_on.localeCompare(a.started_on))[0]!.started_on
}

export function cycleDayNumber(anchorStart: string, dateStr: string): number {
  return daysBetween(anchorStart, dateStr) + 1
}

export function ovulationWindow(settings: CycleSettings): { startDay: number; endDay: number } {
  const len = settings.avg_cycle_length
  const center = Math.max(10, len - 14)
  return { startDay: center, endDay: center + 2 }
}

export function phaseForCycleDay(
  day: number,
  settings: CycleSettings,
  cycleLengthDays?: number,
): CyclePhase {
  const len = cycleLengthDays ?? settings.avg_cycle_length
  const { startDay, endDay } = ovulationWindow({ ...settings, avg_cycle_length: len })
  if (day >= 1 && day <= settings.avg_period_length) return 'menstrual'
  if (day < startDay) return 'follicular'
  if (day <= endDay) return 'ovulation'
  return 'luteal'
}

export type CycleLengthSource = 'override' | 'recent' | 'average'

export type EffectiveCycleLength = {
  days: number
  source: CycleLengthSource
  recentLengths: number[]
}

/** Days between consecutive period starts (newest cycles first). */
export function recentCycleLengths(periods: CyclePeriod[]): number[] {
  const sorted = [...periods].sort((a, b) => b.started_on.localeCompare(a.started_on))
  const lengths: number[] = []
  for (const period of sorted) {
    if (period.cycle_length_days != null) {
      lengths.push(period.cycle_length_days)
      continue
    }
    const idx = sorted.indexOf(period)
    const older = sorted[idx + 1]
    if (!older) continue
    const days = daysBetween(older.started_on, period.started_on)
    if (days >= 15 && days <= 90) lengths.push(days)
  }
  return lengths
}

export function effectiveCycleLengthForPrediction(
  settings: CycleSettings,
  periods: CyclePeriod[],
): EffectiveCycleLength {
  const recent = recentCycleLengths(periods)
  const override = settings.expected_next_cycle_days
  if (override != null && override >= 15 && override <= 90) {
    return { days: override, source: 'override', recentLengths: recent }
  }
  if (recent.length >= 2) {
    const avg = Math.round(
      recent.slice(0, 6).reduce((sum, n) => sum + n, 0) / Math.min(6, recent.length),
    )
    return { days: avg, source: 'recent', recentLengths: recent }
  }
  return { days: settings.avg_cycle_length, source: 'average', recentLengths: recent }
}

export function computePeriodPrediction(
  periods: CyclePeriod[],
  settings: CycleSettings,
  today: string,
): PeriodPrediction {
  const anchor = anchorPeriodStart(periods)
  if (!anchor) {
    return {
      nextStart: null,
      nextEnd: null,
      isLate: false,
      daysLate: 0,
      cycleDay: null,
      currentPhase: null,
    }
  }

  const { days: cycleLen } = effectiveCycleLengthForPrediction(settings, periods)
  const push = settings.prediction_push_days ?? 0
  const nextStart = addDaysToDate(anchor, cycleLen + push)
  const nextEnd = addDaysToDate(nextStart, Math.max(0, settings.avg_period_length - 1))

  const open = periods.some((p) => !p.ended_on)
  const cycleDay = open ? cycleDayNumber(anchor, today) : null
  const currentPhase =
    cycleDay != null ? phaseForCycleDay(cycleDay, settings, cycleLen) : null

  const pastPredicted = today > nextStart && !open
  const daysLate = pastPredicted ? daysBetween(nextStart, today) : 0
  const isLate = Boolean(settings.period_late) || daysLate > 0

  return { nextStart, nextEnd, isLate, daysLate, cycleDay, currentPhase }
}

/** Phase for a date when not in an open period (estimated from last anchor). */
export function estimatedPhaseForDate(
  dateStr: string,
  anchorStart: string,
  settings: CycleSettings,
  cycleLengthDays: number,
): CyclePhase | null {
  const day = cycleDayNumber(anchorStart, dateStr)
  if (day < 1) return null
  const cycleDay = ((day - 1) % cycleLengthDays) + 1
  return phaseForCycleDay(cycleDay, settings, cycleLengthDays)
}

