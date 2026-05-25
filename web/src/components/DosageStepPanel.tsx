import {
  dosageStepHint,
  type DosageWizardValues,
  type InjectionLogStyle,
} from '../lib/doseByRoute'
import type { MedicationRouteId } from '../lib/medicationForms'
import type { MedicationScheduleType } from '../lib/medicationSchedule'

type DosageStepPanelProps = {
  route: MedicationRouteId | null
  scheduleType: MedicationScheduleType
  values: DosageWizardValues
  onChange: (patch: Partial<DosageWizardValues>) => void
}

const INJECTION_UNITS = ['units', 'mg', 'mL', 'dose'] as const

function PrnSymptomHintsEditor({
  values,
  onChange,
}: {
  values: DosageWizardValues
  onChange: (patch: Partial<DosageWizardValues>) => void
}) {
  function addHint() {
    const trimmed = values.prnSymptomHintInput.trim()
    if (!trimmed) return
    if (values.prnSymptomHints.includes(trimmed)) return
    onChange({
      prnSymptomHints: [...values.prnSymptomHints, trimmed],
      prnSymptomHintInput: '',
    })
  }

  return (
    <>
      <label>
        Symptoms to track when logging (optional)
        <p className="field-hint">
          Leave empty to use suggestions based on this medication&apos;s name and form.
        </p>
        <div className="prn-hints-row">
          <input
            value={values.prnSymptomHintInput}
            onChange={(e) => onChange({ prnSymptomHintInput: e.target.value })}
            placeholder="e.g. Wheezing, chest tightness"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addHint()
              }
            }}
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addHint}>
            Add
          </button>
        </div>
      </label>
      {values.prnSymptomHints.length > 0 && (
        <ul className="prn-hints-list">
          {values.prnSymptomHints.map((hintText) => (
            <li key={hintText}>
              <span>{hintText}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-label={`Remove ${hintText}`}
                onClick={() =>
                  onChange({
                    prnSymptomHints: values.prnSymptomHints.filter((h) => h !== hintText),
                  })
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export function DosageStepPanel({
  route,
  scheduleType,
  values,
  onChange,
}: DosageStepPanelProps) {
  const hint = dosageStepHint(route, scheduleType)

  if (scheduleType === 'as_needed') {
    return (
      <div className="med-wizard-panel-inner">
        <p className="field-hint">{hint}</p>
        <label>
          Max doses per day (optional)
          <input
            type="number"
            min={1}
            max={99}
            value={values.maxDosesPerDay}
            onChange={(e) => onChange({ maxDosesPerDay: e.target.value })}
            placeholder="e.g. 6"
          />
        </label>
        <label>
          Example amount (optional)
          <input
            value={values.prnTypicalAmount}
            onChange={(e) => onChange({ prnTypicalAmount: e.target.value })}
            placeholder="e.g. 2 puffs — shown as a hint when logging"
          />
        </label>
        <PrnSymptomHintsEditor values={values} onChange={onChange} />
        <label>
          Strength (mg) — optional
          <input
            value={values.doseMg}
            onChange={(e) => onChange({ doseMg: e.target.value })}
            placeholder="e.g. 10 mg"
          />
        </label>
      </div>
    )
  }

  if (route === 'oral') {
    return (
      <div className="med-wizard-panel-inner">
        <p className="field-hint">{hint}</p>
        <label>
          How many per dose? *
          <input
            type="number"
            min={0.25}
            step={0.25}
            value={values.oralCount}
            onChange={(e) => onChange({ oralCount: e.target.value })}
            placeholder="e.g. 1"
          />
        </label>
        <label>
          Strength (mg) — optional
          <input
            value={values.doseMg}
            onChange={(e) => onChange({ doseMg: e.target.value })}
            placeholder="e.g. 500 mg"
          />
        </label>
      </div>
    )
  }

  if (route === 'dermal') {
    return (
      <div className="med-wizard-panel-inner">
        <p className="field-hint">{hint}</p>
        <label>
          How you apply it (optional)
          <textarea
            rows={3}
            value={values.dermalDescription}
            onChange={(e) => onChange({ dermalDescription: e.target.value })}
            placeholder="e.g. Thin layer to affected area, one patch on shoulder"
          />
        </label>
        <label>
          Strength (mg) — optional
          <input
            value={values.doseMg}
            onChange={(e) => onChange({ doseMg: e.target.value })}
            placeholder="e.g. 0.1% cream"
          />
        </label>
      </div>
    )
  }

  if (route === 'injection') {
    return (
      <div className="med-wizard-panel-inner">
        <p className="field-hint">{hint}</p>
        <div className="dose-style-options">
          <label className="dose-style-option">
            <input
              type="radio"
              name="injectionStyle"
              checked={values.injectionStyle === 'simple'}
              onChange={() => onChange({ injectionStyle: 'simple' as InjectionLogStyle })}
            />
            <span>
              <strong>Injection taken</strong>
              <span className="field-hint">Log yes/no when you inject (no fixed units)</span>
            </span>
          </label>
          <label className="dose-style-option">
            <input
              type="radio"
              name="injectionStyle"
              checked={values.injectionStyle === 'measured'}
              onChange={() => onChange({ injectionStyle: 'measured' as InjectionLogStyle })}
            />
            <span>
              <strong>Specific dose</strong>
              <span className="field-hint">Insulin units, mg, mL, EpiPen, etc.</span>
            </span>
          </label>
        </div>
        {values.injectionStyle === 'measured' && (
          <div className="injection-measured-row">
            <label>
              Amount *
              <input
                value={values.injectionAmount}
                onChange={(e) => onChange({ injectionAmount: e.target.value })}
                placeholder="e.g. 10"
              />
            </label>
            <label>
              Unit
              <select
                value={values.injectionUnit}
                onChange={(e) => onChange({ injectionUnit: e.target.value })}
              >
                {INJECTION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          Strength (mg) — optional
          <input
            value={values.doseMg}
            onChange={(e) => onChange({ doseMg: e.target.value })}
            placeholder="e.g. 100 mg/mL"
          />
        </label>
      </div>
    )
  }

  return (
    <div className="med-wizard-panel-inner">
      <p className="field-hint">{hint}</p>
      <label>
        Dose description *
        <input
          value={values.otherDescription}
          onChange={(e) => onChange({ otherDescription: e.target.value })}
          placeholder="e.g. 1 dropper, 2 sprays"
        />
      </label>
      <label>
        Strength (mg) — optional
        <input
          value={values.doseMg}
          onChange={(e) => onChange({ doseMg: e.target.value })}
          placeholder="e.g. 10 mg"
        />
      </label>
    </div>
  )
}
