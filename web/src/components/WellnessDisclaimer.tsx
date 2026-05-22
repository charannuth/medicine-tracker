export function WellnessDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="wellness-disclaimer wellness-disclaimer-compact">
        Personal logs only — not a diagnosis. Share with your doctor or pharmacist
        for medical advice.
      </p>
    )
  }

  return (
    <aside className="wellness-disclaimer" role="note">
      <p>
        <strong>Not medical advice.</strong> Dr. Dose helps you record daily
        experiences (sleep, mood, symptoms, exercise) so you can discuss patterns
        with your clinician. Always consult your doctor or pharmacist for proper
        diagnoses and treatment.
      </p>
    </aside>
  )
}
