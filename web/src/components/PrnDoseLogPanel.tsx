import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PrnOralAmountField } from './PrnOralAmountField'
import {
  emptyPrnDoseLogPayload,
  isPrnLogReady,
  usesOralPrnAmountDropdown,
  type PrnDoseLogPayload,
} from '../lib/prnCheckIn'
import { prnExtraDoseGuidance } from '../lib/prnMedContext'
import {
  prnAmountPlaceholder,
  prnSymptomHint,
  prnSymptomLegend,
  prnSymptomOptionsForMed,
} from '../lib/prnSymptoms'
import type { MedicationWithStatus } from '../lib/types'
import { SymptomTrackField } from './SymptomTrackField'

type PrnDoseLogPanelProps = {
  medication: MedicationWithStatus
  disabled?: boolean
  onLog: (payload: PrnDoseLogPayload) => void
}

export function PrnDoseLogPanel({
  medication,
  disabled = false,
  onLog,
}: PrnDoseLogPanelProps) {
  const symptomPresets = useMemo(
    () => prnSymptomOptionsForMed(medication),
    [medication],
  )
  const [draft, setDraft] = useState(emptyPrnDoseLogPayload)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [amountResetKey, setAmountResetKey] = useState(0)
  const useOralAmountDropdown = usesOralPrnAmountDropdown(
    medication.medication_route,
  )

  const extraGuidance = useMemo(
    () => prnExtraDoseGuidance(medication, medication.dosesTakenToday),
    [medication],
  )

  const max = medication.max_doses_per_day
  const atMax =
    max != null && max > 0 && medication.dosesTakenToday >= max

  function patch(partial: Partial<PrnDoseLogPayload>) {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  function handleLog() {
    if (!isPrnLogReady(draft)) return
    onLog({
      amount: draft.amount.trim(),
      symptoms: draft.symptoms,
      reason: draft.reason.trim(),
      notes: draft.notes.trim(),
    })
    setDraft(emptyPrnDoseLogPayload())
    setAmountResetKey((k) => k + 1)
    setSavedMessage(
      'Logged — saved for your doctor visit report (Wellness → View printable report).',
    )
  }

  return (
    <section className="prn-checkin" aria-label={`Log ${medication.name}`}>
      {extraGuidance && (
        <div className="prn-extra-dose-callout" role="note">
          <strong>{extraGuidance.headline}</strong>
          <p>{extraGuidance.body}</p>
          <p className="field-hint">
            <Link to="/wellness">Daily wellness check-in</Link> on the same day helps
            spot patterns for your clinician.
          </p>
        </div>
      )}

      {savedMessage && (
        <p className="banner banner-success-style prn-saved-banner">{savedMessage}</p>
      )}

      {max != null && max > 0 && (
        <p className="field-hint prn-max-hint">
          {medication.dosesTakenToday} of {max} max dose{max === 1 ? '' : 's'} logged today
        </p>
      )}

      <fieldset className="prn-checkin-fieldset">
        <legend>Why are you taking it now?</legend>
        <input
          type="text"
          value={draft.reason}
          disabled={disabled}
          placeholder={
            extraGuidance?.reasonPlaceholder ??
            'e.g. shortness of breath, headache started'
          }
          onChange={(e) => patch({ reason: e.target.value })}
        />
      </fieldset>

      <SymptomTrackField
        legend={prnSymptomLegend(medication)}
        hint={prnSymptomHint(medication)}
        chipPresets={symptomPresets}
        value={draft.symptoms}
        onChange={(symptoms) => patch({ symptoms })}
        allowCustom
        customPlaceholder="Add a symptom not listed"
      />

      <fieldset className="prn-checkin-fieldset">
        <legend>How much did you take?</legend>
        {useOralAmountDropdown ? (
          <PrnOralAmountField
            medication={medication}
            amount={draft.amount}
            disabled={disabled}
            resetKey={amountResetKey}
            onAmountChange={(amount) => patch({ amount })}
            onEnter={handleLog}
          />
        ) : (
          <label className="prn-amount-input-label">
            Amount
            <input
              type="text"
              value={draft.amount}
              disabled={disabled}
              placeholder={prnAmountPlaceholder(medication)}
              onChange={(e) => patch({ amount: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleLog()
                }
              }}
            />
          </label>
        )}
      </fieldset>

      <label className="prn-checkin-fieldset prn-notes-label">
        Anything else? (optional)
        <textarea
          rows={2}
          value={draft.notes}
          disabled={disabled}
          placeholder={
            extraGuidance?.notesPlaceholder ??
            'Side effects, what helped before, etc.'
          }
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled || atMax || !isPrnLogReady(draft)}
        onClick={handleLog}
      >
        {disabled ? 'Saving…' : atMax ? 'Max doses reached' : 'Log dose'}
      </button>
    </section>
  )
}
