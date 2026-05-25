import { Link } from 'react-router-dom'
import { GENDER_OPTIONS, ageFromDateOfBirth } from '../lib/profileStats'
import type { PhysicalProfileInput } from '../lib/physicalProfile'

type PhysicalProfileFormProps = {
  value: PhysicalProfileInput
  onChange: (next: PhysicalProfileInput) => void
  onSubmit: () => void
  busy?: boolean
}

export function PhysicalProfileForm({
  value,
  onChange,
  onSubmit,
  busy = false,
}: PhysicalProfileFormProps) {
  function patch(partial: Partial<PhysicalProfileInput>) {
    onChange({ ...value, ...partial })
  }

  return (
    <form
      className="physical-profile-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <p className="field-hint">
        Update anytime — helpful for growing teens, weight changes, and tracking context.
        Also editable under{' '}
        <Link to="/medical-records">Medical records</Link>.
      </p>

      <label className="tracking-field">
        Date of birth
        <input
          type="date"
          value={value.date_of_birth}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => patch({ date_of_birth: e.target.value })}
        />
        {value.date_of_birth && ageFromDateOfBirth(value.date_of_birth) != null && (
          <span className="field-hint">Age {ageFromDateOfBirth(value.date_of_birth)} years</span>
        )}
      </label>

      <label className="tracking-field">
        Gender
        <select value={value.gender} onChange={(e) => patch({ gender: e.target.value })}>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value || 'none'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <div className="tracking-stats-row">
        <label className="tracking-field">
          Height (cm)
          <input
            type="number"
            min={0}
            step={0.1}
            value={value.height_cm}
            onChange={(e) => patch({ height_cm: e.target.value })}
            placeholder="e.g. 170"
          />
        </label>
        <label className="tracking-field">
          Weight (kg)
          <input
            type="number"
            min={0}
            step={0.1}
            value={value.weight_kg}
            onChange={(e) => patch({ weight_kg: e.target.value })}
            placeholder="e.g. 68"
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  )
}
