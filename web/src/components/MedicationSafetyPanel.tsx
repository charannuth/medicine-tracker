import { useEffect, useState } from 'react'
import { severityLabel } from '../lib/drugInteractions'
import {
  buildMedicationSafetyReview,
  hasSafetyAlerts,
  type MedicationSafetyReview,
} from '../lib/medicationSafetyReview'

type MedicationSafetyPanelProps = {
  drugName: string
  existingMedicationNames: string[]
}

export function MedicationSafetyPanel({
  drugName,
  existingMedicationNames,
}: MedicationSafetyPanelProps) {
  const [review, setReview] = useState<MedicationSafetyReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const existingKey = existingMedicationNames.join('\n')

  useEffect(() => {
    if (!drugName.trim()) {
      queueMicrotask(() => {
        setReview(null)
        setLoading(false)
      })
      return
    }

    let active = true
    queueMicrotask(() => {
      if (active) {
        setLoading(true)
        setError(null)
      }
    })

    void buildMedicationSafetyReview(drugName, existingMedicationNames)
      .then((data) => {
        if (active) setReview(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Could not load safety information',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [drugName, existingKey, existingMedicationNames])

  if (!drugName.trim()) {
    return (
      <p className="field-hint">Enter a medication name earlier in the form to see safety notes.</p>
    )
  }

  if (loading) {
    return <p className="loading">Checking safety information…</p>
  }

  if (error) {
    return <p className="form-error">{error}</p>
  }

  if (!review) return null

  const alerts = hasSafetyAlerts(review)

  return (
    <div className="med-safety-panel">
      <p className="med-safety-intro">
        Summary for <strong>{review.drugName}</strong>
        {review.checkedExistingCount > 0
          ? ` compared with ${review.checkedExistingCount} medication${review.checkedExistingCount === 1 ? '' : 's'} on your list.`
          : '.'}{' '}
        This is not medical advice.
      </p>

      <section className="med-safety-section">
        <h4>Your medication list</h4>
        {review.existingMedInteractions.length === 0 ? (
          <p className="field-hint">
            No known interactions found between this drug and your current medications in our
            database.
          </p>
        ) : (
          <ul className="med-safety-list">
            {review.existingMedInteractions.map((item) => (
              <li
                key={`${item.drugA}-${item.drugB}`}
                className={`med-safety-item severity-${item.severity}`}
              >
                <strong>
                  {item.displayA} + {item.displayB} ({severityLabel(item.severity)})
                </strong>
                <p>{item.description}</p>
                <p className="field-hint">{item.management}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="med-safety-section">
        <h4>Substances (alcohol, cannabis, tobacco)</h4>
        {review.substanceWarnings.length === 0 ? (
          <p className="field-hint">
            No specific substance warnings in our database for this medication. Still use caution
            and ask a professional if you drink alcohol or use cannabis or tobacco.
          </p>
        ) : (
          <ul className="med-safety-list">
            {review.substanceWarnings.map((item) => (
              <li
                key={item.substance}
                className={`med-safety-item severity-${item.severity}`}
              >
                <strong>{item.label}</strong>
                <p>{item.description}</p>
                <p className="field-hint">{item.management}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="med-safety-section">
        <h4>Pregnancy & breastfeeding</h4>
        <p>{review.pregnancy}</p>
      </section>

      <section className="med-safety-section">
        <h4>Possible side effects</h4>
        <ul className="med-safety-bullets">
          {review.sideEffects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      </section>

      <div
        className={`med-safety-disclaimer${alerts ? ' med-safety-disclaimer-alert' : ''}`}
        role="note"
      >
        <strong>Important:</strong> This information is educational only and may be incomplete.
        Always consult your physician, pharmacist, or other qualified clinician before changing
        medications, especially if you are pregnant, planning pregnancy, or breastfeeding.
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-block med-safety-ai-btn"
        onClick={() => {
          window.alert(
            'AI medication assistant coming soon. For now, please discuss these results with your healthcare provider.',
          )
        }}
      >
        Click here to get more information about this medication from our AI agent
      </button>
    </div>
  )
}
