import type { WellnessLog } from './wellness'
import { isWellnessLogFilled, logFromRow, type WellnessLogInput } from './wellness'

export type WellnessTrendPoint = {
  date: string
  label: string
  sleepHours: number | null
  sleepQuality: number | null
  energy: number | null
  hasLog: boolean
}

export type WeekMetricComparison = {
  label: string
  recentAvg: number | null
  priorAvg: number | null
  delta: number | null
  unit: string
}

function average(values: number[]): number | null {
  if (values.length === 0) return null
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
}

function shortDayLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
  })
}

export function buildTrendPoints(
  datesOldestFirst: string[],
  logs: WellnessLog[],
): WellnessTrendPoint[] {
  const byDate = new Map(logs.map((l) => [l.log_date, l]))
  return datesOldestFirst.map((date) => {
    const row = byDate.get(date)
    const input = row ? logFromRow(row) : null
    const filled = input && isWellnessLogFilled(input)
    return {
      date,
      label: shortDayLabel(date),
      sleepHours: filled ? input.sleep_hours : null,
      sleepQuality: filled ? input.sleep_quality : null,
      energy: filled ? input.energy_level : null,
      hasLog: Boolean(filled),
    }
  })
}

export function compareWeekMetrics(
  recentDates: string[],
  priorDates: string[],
  logs: WellnessLog[],
): WeekMetricComparison[] {
  const byDate = new Map(logs.map((l) => [l.log_date, l]))

  function collect(
    dates: string[],
    pick: (input: WellnessLogInput) => number | null,
  ): number[] {
    const values: number[] = []
    for (const date of dates) {
      const row = byDate.get(date)
      if (!row) continue
      const input = logFromRow(row)
      if (!isWellnessLogFilled(input)) continue
      const v = pick(input)
      if (v != null) values.push(v)
    }
    return values
  }

  const defs: { label: string; unit: string; pick: (i: WellnessLogInput) => number | null }[] =
    [
      { label: 'Sleep quality', unit: '/5', pick: (i) => i.sleep_quality },
      { label: 'Energy', unit: '/5', pick: (i) => i.energy_level },
      { label: 'Sleep hours', unit: 'h', pick: (i) => i.sleep_hours },
    ]

  return defs.map(({ label, unit, pick }) => {
    const recentAvg = average(collect(recentDates, pick))
    const priorAvg = average(collect(priorDates, pick))
    const delta =
      recentAvg != null && priorAvg != null
        ? Math.round((recentAvg - priorAvg) * 10) / 10
        : null
    return { label, recentAvg, priorAvg, delta, unit }
  })
}

export function formatComparisonLine(metric: WeekMetricComparison): string | null {
  const { label, recentAvg, priorAvg, delta, unit } = metric
  if (recentAvg == null && priorAvg == null) return null
  if (recentAvg != null && priorAvg == null) {
    return `${label}: recent week avg ${recentAvg}${unit} (not enough prior data).`
  }
  if (recentAvg == null && priorAvg != null) {
    return `${label}: prior week avg ${priorAvg}${unit}; no recent logs.`
  }
  if (delta == null) return null
  const dir =
    delta > 0 ? 'higher' : delta < 0 ? 'lower' : 'about the same'
  return `${label}: recent ${recentAvg}${unit} vs prior ${priorAvg}${unit} (${dir} by ${Math.abs(delta)}${unit}).`
}
