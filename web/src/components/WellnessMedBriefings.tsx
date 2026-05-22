import { Link } from 'react-router-dom'
import { severityLabel } from '../lib/drugInteractions'
import { useWellnessMedBriefings } from '../hooks/useWellnessMedBriefings'
import type { ActiveMedicationSummary } from '../lib/wellnessReport'

function formatStartDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type WellnessMedBriefingsProps = {
  medications: ActiveMedicationSummary[]
}

export function WellnessMedBriefings({ medications }: WellnessMedBriefingsProps) {
  const { entries, loading, error } = useWellnessMedBriefings(medications)

  if (medications.length === 0) {
    return (
      <section className="wellness-card">
        <h3 className="wellness-section-title">Starting a medication</h3>
        <p>
          When you add a medication, briefing cards appear here with educational side
          effects and substance notes. <Link to="/">Add a medication</Link>.
        </p>
      </section>
    )
  }

  return (
    <section className="wellness-card wellness-briefings">
      <h3 className="wellness-section-title">Medication briefings</h3>
      <p className="field-hint">
        What you might notice in daily routines when on these medicines — for discussion
        with your doctor, not a diagnosis.
      </p>

      {error && <p className="banner banner-error">{error}</p>}
      {loading && <p className="loading">Loading briefings…</p>}

      {!loading &&
        entries.map(({ med, review }) => (
          <article key={med.name} className="wellness-briefing-card">
            <header className="wellness-briefing-header">
              <h4>{med.name}</h4>
              <p className="wellness-briefing-meta">
                Active since {formatStartDate(med.start_date)}
              </p>
            </header>

            <p className="wellness-briefing-routine">
              Track sleep, energy, and appetite in your daily check-in. Many people
              notice changes in the first 1–2 weeks on a new medicine — your logs help
              your clinician see <em>your</em> experience.
            </p>

            <div className="wellness-briefing-block">
              <h5>Common side effects (educational)</h5>
              <ul className="wellness-briefing-bullets">
                {review.sideEffects.map((effect) => (
                  <li key={effect}>{effect}</li>
                ))}
              </ul>
            </div>

            {review.substanceWarnings.length > 0 && (
              <div className="wellness-briefing-block">
                <h5>Alcohol, cannabis, tobacco</h5>
                <ul className="wellness-briefing-bullets">
                  {review.substanceWarnings.map((w) => (
                    <li key={w.substance}>
                      <strong>{w.label}:</strong> {w.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.existingMedInteractions.length > 0 && (
              <div className="wellness-briefing-block">
                <h5>With your other medications</h5>
                <ul className="wellness-briefing-bullets">
                  {review.existingMedInteractions.map((item) => (
                    <li key={`${item.drugA}-${item.drugB}`}>
                      {item.displayA} + {item.displayB} (
                      {severityLabel(item.severity)}): {item.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="wellness-briefing-foot">
              Not medical advice. Confirm with your pharmacist or physician.
            </p>
          </article>
        ))}

      <p>
        <Link to="/interactions">Full drug safety check</Link> for your complete list.
      </p>
    </section>
  )
}
