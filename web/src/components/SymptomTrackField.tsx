import { useState } from 'react'
import {
  buildSymptomChipOptions,
  WELLNESS_SYMPTOM_OPTIONS,
} from '../lib/wellness'

type SymptomTrackFieldProps = {
  legend: string
  hint?: string
  value: string[]
  onChange: (next: string[]) => void
  /** Symptoms from baseline profile to show as chips on daily logs. */
  trackedFromProfile?: string[]
  allowCustom?: boolean
  customPlaceholder?: string
}

export function SymptomTrackField({
  legend,
  hint,
  value,
  onChange,
  trackedFromProfile = [],
  allowCustom = true,
  customPlaceholder = 'Add your own symptom',
}: SymptomTrackFieldProps) {
  const [draft, setDraft] = useState('')
  const chipOptions = buildSymptomChipOptions(value, trackedFromProfile)

  function toggle(symptom: string) {
    const has = value.includes(symptom)
    onChange(has ? value.filter((s) => s !== symptom) : [...value, symptom])
  }

  function addCustom(entry: string) {
    const trimmed = entry.trim()
    if (!trimmed) return
    const exists = value.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    onChange([...value, trimmed])
    setDraft('')
  }

  return (
    <fieldset className="wellness-fieldset symptom-track-field">
      <legend>{legend}</legend>
      {hint && <p className="field-hint symptom-track-hint">{hint}</p>}

      <div className="wellness-chip-group" role="group" aria-label={legend}>
        {chipOptions.map((symptom) => {
          const isPreset = (WELLNESS_SYMPTOM_OPTIONS as readonly string[]).includes(
            symptom,
          )
          return (
            <button
              key={symptom}
              type="button"
              className={`wellness-chip${value.includes(symptom) ? ' active' : ''}${isPreset ? '' : ' wellness-chip-custom'}`}
              aria-pressed={value.includes(symptom)}
              onClick={() => toggle(symptom)}
            >
              {symptom}
            </button>
          )
        })}
      </div>

      {allowCustom && (
        <div className="symptom-track-custom">
          <div className="tag-list-input-row">
            <input
              type="text"
              value={draft}
              placeholder={customPlaceholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom(draft)
                }
              }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => addCustom(draft)}
            >
              Add
            </button>
          </div>
          <p className="field-hint">
            Custom symptoms appear as chips above. Tap to select or deselect.
          </p>
        </div>
      )}
    </fieldset>
  )
}
