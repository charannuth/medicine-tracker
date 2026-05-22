import { useMemo } from 'react'
import type { WellnessLog } from '../lib/wellness'
import { lastNDates } from '../lib/wellness'
import {
  buildTrendPoints,
  compareWeekMetrics,
  formatComparisonLine,
} from '../lib/wellnessTrends'
import { todayLocalDate } from '../lib/dates'

type WellnessTrendsSectionProps = {
  trendLogs: WellnessLog[]
}

function TrendBars({
  title,
  points,
  max,
  getValue,
  unit,
}: {
  title: string
  points: ReturnType<typeof buildTrendPoints>
  max: number
  getValue: (p: (typeof points)[0]) => number | null
  unit: string
}) {
  return (
    <div className="wellness-trend-chart">
      <h4>{title}</h4>
      <div className="wellness-trend-bars" role="img" aria-label={`${title} last 7 days`}>
        {points.map((p) => {
          const v = getValue(p)
          const pct = v != null ? Math.min(100, (v / max) * 100) : 0
          return (
            <div key={p.date} className="wellness-trend-bar-wrap">
              <div
                className={`wellness-trend-bar${v == null ? ' empty' : ''}`}
                style={{ height: v != null ? `${pct}%` : '4px' }}
                title={v != null ? `${v}${unit}` : 'No data'}
              />
              <span className="wellness-trend-bar-label">{p.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WellnessTrendsSection({ trendLogs }: WellnessTrendsSectionProps) {
  const today = todayLocalDate()
  const last7 = useMemo(() => [...lastNDates(7, today)].reverse(), [today])
  const recentWeek = useMemo(() => lastNDates(7, today), [today])
  const priorWeek = useMemo(() => lastNDates(14, today).slice(7, 14), [today])

  const points = useMemo(
    () => buildTrendPoints(last7, trendLogs),
    [last7, trendLogs],
  )

  const comparisons = useMemo(
    () => compareWeekMetrics(recentWeek, priorWeek, trendLogs),
    [recentWeek, priorWeek, trendLogs],
  )

  const comparisonLines = comparisons
    .map(formatComparisonLine)
    .filter((line): line is string => line != null)

  const loggedDays = points.filter((p) => p.hasLog).length

  return (
    <section className="wellness-card wellness-trends">
      <h3 className="wellness-section-title">Trends (last 7 days)</h3>
      <p className="field-hint">
        Patterns in your logs only — not proof your medications caused a change. Discuss
        with your clinician.
      </p>

      {loggedDays === 0 ? (
        <p className="field-hint">Log a few check-ins to see charts here.</p>
      ) : (
        <>
          <TrendBars
            title="Sleep quality"
            points={points}
            max={5}
            getValue={(p) => p.sleepQuality}
            unit="/5"
          />
          <TrendBars
            title="Energy"
            points={points}
            max={5}
            getValue={(p) => p.energy}
            unit="/5"
          />
          <TrendBars
            title="Sleep hours"
            points={points}
            max={10}
            getValue={(p) => p.sleepHours}
            unit="h"
          />
        </>
      )}

      <h4 className="wellness-trends-compare-title">Week over week</h4>
      {comparisonLines.length === 0 ? (
        <p className="field-hint">
          Need logs in both the recent and prior 7-day windows for comparison.
        </p>
      ) : (
        <ul className="wellness-trends-compare-list">
          {comparisonLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
