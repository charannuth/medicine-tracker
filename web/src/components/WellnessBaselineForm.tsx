import type { SubstanceKey } from '../lib/medicationSafetyReview'
import type { WellnessProfileInput, SubstanceUseLevel } from '../lib/wellness'
import { SUBSTANCE_USE_LEVELS } from '../lib/wellness'
import { SymptomTrackField } from './SymptomTrackField'

const SUBSTANCE_FIELDS: { key: SubstanceKey; label: string }[] = [
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'cannabis', label: 'Cannabis (marijuana)' },
  { key: 'tobacco', label: 'Tobacco / nicotine' },
]

type WellnessBaselineFormProps = {
  value: WellnessProfileInput
  onChange: (next: WellnessProfileInput) => void
  onSubmit: () => void
  busy?: boolean
}

export function WellnessBaselineForm({
  value,
  onChange,
  onSubmit,
  busy = false,
}: WellnessBaselineFormProps) {
  function patch(partial: Partial<WellnessProfileInput>) {
    onChange({ ...value, ...partial })
  }

  function setSubstance(key: SubstanceKey, level: SubstanceUseLevel | '') {
    const next = { ...value.substance_use }
    if (level === '') {
      delete next[key]
    } else {
      next[key] = level
    }
    patch({ substance_use: next })
  }

  return (
    <form
      className="wellness-form wellness-baseline-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <p className="field-hint">
        Your usual patterns — used to highlight what to watch for with your
        medications. Update anytime.
      </p>

      <div className="wellness-field-row">
        <label>
          Usual bedtime
          <input
            type="text"
            placeholder="e.g. 10:30 PM"
            value={value.usual_bedtime}
            onChange={(e) => patch({ usual_bedtime: e.target.value })}
          />
        </label>
        <label>
          Usual wake time
          <input
            type="text"
            placeholder="e.g. 6:30 AM"
            value={value.usual_wake_time}
            onChange={(e) => patch({ usual_wake_time: e.target.value })}
          />
        </label>
      </div>

      <label>
        Eating habits (optional)
        <textarea
          rows={2}
          placeholder="e.g. breakfast light, dinner early, vegetarian"
          value={value.eating_notes}
          onChange={(e) => patch({ eating_notes: e.target.value })}
        />
      </label>

      <fieldset className="wellness-fieldset">
        <legend>Substance use (honest answers help your doctor)</legend>
        {SUBSTANCE_FIELDS.map(({ key, label }) => (
          <label key={key}>
            {label}
            <select
              value={value.substance_use[key] ?? ''}
              onChange={(e) =>
                setSubstance(key, e.target.value as SubstanceUseLevel | '')
              }
            >
              <option value="">Prefer not to say</option>
              {SUBSTANCE_USE_LEVELS.map(({ value: v, label: l }) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>

      <SymptomTrackField
        legend="Symptoms you want to track"
        hint="Choose common symptoms or add your own (e.g. wheezing, joint pain). These appear on daily check-ins."
        value={value.symptom_focus}
        onChange={(symptom_focus) => patch({ symptom_focus })}
        customPlaceholder="e.g. Shortness of breath"
      />

      <label>
        Other notes for your clinician
        <textarea
          rows={2}
          value={value.profile_notes}
          onChange={(e) => patch({ profile_notes: e.target.value })}
        />
      </label>

      <button type="submit" className="btn btn-secondary" disabled={busy}>
        {busy ? 'Saving…' : 'Save baseline'}
      </button>
    </form>
  )
}
