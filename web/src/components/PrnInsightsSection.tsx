import { Link } from 'react-router-dom'
import type { PrnInsightsSummary } from '../lib/prnInsights'

type PrnInsightsSectionProps = {
  insights: PrnInsightsSummary
  loading?: boolean
}

export function PrnInsightsSection({ insights, loading }: PrnInsightsSectionProps) {
  if (loading) {
    return (
      <section className="wellness-card prn-insights-card">
        <h3 className="wellness-section-title">As-needed medication patterns</h3>
        <p className="loading">Analyzing logs…</p>
      </section>
    )
  }

  const activeMeds = insights.meds.filter((m) => m.totalDoses14d > 0)

  if (activeMeds.length === 0) {
    return (
      <section className="wellness-card prn-insights-card">
        <h3 className="wellness-section-title">As-needed medication patterns</h3>
        <p className="field-hint">
          When you log as-needed doses with the check-in on Today, we compare them to
          your daily wellness logs here — for your doctor visit, not as a diagnosis.
        </p>
        <p>
          No as-needed doses in the {insights.periodLabel.toLowerCase()} yet.{' '}
          <Link to="/">Log on Today</Link> when you take one.
        </p>
      </section>
    )
  }

  return (
    <section className="wellness-card prn-insights-card">
      <h3 className="wellness-section-title">As-needed medication patterns</h3>
      <p className="field-hint">
        {insights.periodLabel}: how often you used PRN meds vs your daily check-in.
        Correlations are not medical conclusions — bring the printable report to your
        visit.
      </p>

      <ul className="prn-insights-med-list">
        {activeMeds.map((med) => (
          <li key={med.medicationId} className="prn-insights-med">
            <h4>{med.medicationName}</h4>
            <p className="prn-insights-stats">
              {med.totalDoses14d} dose{med.totalDoses14d === 1 ? '' : 's'} across{' '}
              {med.daysWithDoses} day{med.daysWithDoses === 1 ? '' : 's'}
              {med.daysAtMax > 0 &&
                ` · max limit hit ${med.daysAtMax} day${med.daysAtMax === 1 ? '' : 's'}`}
            </p>

            {med.observations.length > 0 && (
              <div className="prn-insights-block">
                <h5>What we noticed</h5>
                <ul>
                  {med.observations.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {med.copingTips.length > 0 && (
              <div className="prn-insights-block prn-insights-coping">
                <h5>Ideas to try (not medical advice)</h5>
                <ul>
                  {med.copingTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="prn-insights-foot field-hint">
        Included in <strong>View printable report</strong> above for your next
        appointment.
      </p>
    </section>
  )
}
