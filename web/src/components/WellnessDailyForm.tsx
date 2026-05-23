import type { WellnessLogInput, AppetiteLevel } from '../lib/wellness'
import { SymptomTrackField } from './SymptomTrackField'

type WellnessDailyFormProps = {
  value: WellnessLogInput
  onChange: (next: WellnessLogInput) => void
  onSubmit: () => void
  busy?: boolean
  submitLabel?: string
  compact?: boolean
  showDate?: boolean
  /** From wellness baseline — custom symptoms the user chose to track. */
  trackedSymptoms?: string[]
}

export function WellnessDailyForm({
  value,
  onChange,
  onSubmit,
  busy = false,
  submitLabel = 'Save check-in',
  compact = false,
  showDate = false,
  trackedSymptoms = [],
}: WellnessDailyFormProps) {
  function patch(partial: Partial<WellnessLogInput>) {
    onChange({ ...value, ...partial })
  }

  return (
    <form
      className={`wellness-form${compact ? ' wellness-form-compact' : ''}`}
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      {showDate && (
        <label>
          Date
          <input
            type="date"
            value={value.log_date}
            onChange={(e) => patch({ log_date: e.target.value })}
          />
        </label>
      )}

      <fieldset className="wellness-fieldset">
        <legend>Sleep (last night)</legend>
        <div className="wellness-field-row">
          <label>
            Hours
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              inputMode="decimal"
              placeholder="e.g. 7"
              value={value.sleep_hours ?? ''}
              onChange={(e) =>
                patch({
                  sleep_hours:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            Quality (1–5)
            <select
              value={value.sleep_quality ?? ''}
              onChange={(e) =>
                patch({
                  sleep_quality:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <label>
        Energy today (1–5)
        <select
          value={value.energy_level ?? ''}
          onChange={(e) =>
            patch({
              energy_level:
                e.target.value === '' ? null : Number(e.target.value),
            })
          }
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n} — {n <= 2 ? 'low' : n === 3 ? 'okay' : 'good'}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="wellness-fieldset">
        <legend>Appetite</legend>
        <div className="wellness-chip-group" role="group" aria-label="Appetite">
          {(
            [
              ['same', 'Same as usual'],
              ['better', 'Better'],
              ['worse', 'Worse'],
            ] as const
          ).map(([level, label]) => (
            <button
              key={level}
              type="button"
              className={`wellness-chip${value.appetite === level ? ' active' : ''}`}
              aria-pressed={value.appetite === level}
              onClick={() =>
                patch({
                  appetite: value.appetite === level ? null : (level as AppetiteLevel),
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="wellness-fieldset">
        <legend>Exercise</legend>
        <label className="wellness-checkbox">
          <input
            type="checkbox"
            checked={value.exercised}
            onChange={(e) =>
              patch({
                exercised: e.target.checked,
                exercise_minutes: e.target.checked ? value.exercise_minutes : null,
              })
            }
          />
          Exercised today
        </label>
        {value.exercised && (
          <label>
            Minutes
            <input
              type="number"
              min={0}
              max={600}
              inputMode="numeric"
              placeholder="e.g. 30"
              value={value.exercise_minutes ?? ''}
              onChange={(e) =>
                patch({
                  exercise_minutes:
                    e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
        )}
      </fieldset>

      <SymptomTrackField
        legend="Symptoms or changes today"
        hint="Select any that apply today, including symptoms from your tracking list."
        value={value.symptoms}
        onChange={(symptoms) => patch({ symptoms })}
        trackedFromProfile={trackedSymptoms}
        customPlaceholder="e.g. Chest tightness today"
      />

      <label>
        Notes for your clinician
        <textarea
          rows={compact ? 2 : 3}
          placeholder="Anything else to mention at your next visit"
          value={value.notes}
          onChange={(e) => patch({ notes: e.target.value })}
        />
      </label>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
