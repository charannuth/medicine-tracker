import { useState, type FormEvent } from 'react'
import {
  normalizeScheduleTimes,
  scheduleTimeToTwelveHour,
  todayLocalDate,
  twelveHourToScheduleTime,
  type Meridiem,
} from '../lib/dates'
import { getErrorMessage } from '../lib/errors'
import { validateMedicationDates } from '../lib/medicationDates'
import type { MedicationSuggestion } from '../lib/medicationSuggestions'
import type { Medication, MedicationInput } from '../lib/types'
import { MedicationNameInput } from './MedicationNameInput'

type MedicationFormProps = {
  initial?: Medication | null
  onSave: (input: MedicationInput) => Promise<void>
  onCancel: () => void
}

type DoseTimeRow = {
  id: string
  time12: string
  period: Meridiem
}

function newDoseTimeRow(time24?: string): DoseTimeRow {
  const base = time24
    ? scheduleTimeToTwelveHour(time24)
    : { time12: '8:00', period: 'AM' as Meridiem }
  return {
    id: crypto.randomUUID(),
    time12: base.time12,
    period: base.period,
  }
}

function buildDoseTimes(initial?: Medication | null): DoseTimeRow[] {
  const times = normalizeScheduleTimes(initial?.schedule_times ?? [])
  if (times.length > 0) {
    return times.map((t) => newDoseTimeRow(t))
  }
  return [newDoseTimeRow()]
}

function buildFormState(initial?: Medication | null) {
  if (initial) {
    return {
      name: initial.name,
      dosePills: initial.dose_pills ?? '',
      doseMg: initial.dose_mg ?? '',
      doseTimes: buildDoseTimes(initial),
      notes: initial.notes ?? '',
      trackPills: initial.pills_remaining != null,
      pillsRemaining:
        initial.pills_remaining != null ? String(initial.pills_remaining) : '',
      startDate: initial.start_date ?? todayLocalDate(),
      hasEndDate: Boolean(initial.end_date),
      endDate: initial.end_date ?? '',
    }
  }
  return {
    name: '',
    dosePills: '',
    doseMg: '',
    doseTimes: buildDoseTimes(),
    notes: '',
    trackPills: false,
    pillsRemaining: '',
    startDate: todayLocalDate(),
    hasEndDate: false,
    endDate: '',
  }
}

export function MedicationForm({ initial, onSave, onCancel }: MedicationFormProps) {
  const defaults = buildFormState(initial)
  const [name, setName] = useState(defaults.name)
  const [dosePills, setDosePills] = useState(defaults.dosePills)
  const [doseMg, setDoseMg] = useState(defaults.doseMg)
  const [doseTimes, setDoseTimes] = useState(defaults.doseTimes)
  const [notes, setNotes] = useState(defaults.notes)
  const [trackPills, setTrackPills] = useState(defaults.trackPills)
  const [pillsRemaining, setPillsRemaining] = useState(defaults.pillsRemaining)
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [hasEndDate, setHasEndDate] = useState(defaults.hasEndDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function updateDoseTime(id: string, patch: Partial<Pick<DoseTimeRow, 'time12' | 'period'>>) {
    setDoseTimes((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
  }

  function addDoseTime() {
    setDoseTimes((rows) => [...rows, newDoseTimeRow()])
  }

  function removeDoseTime(id: string) {
    setDoseTimes((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)))
  }

  function applySuggestion(suggestion: MedicationSuggestion) {
    if (!dosePills.trim() && suggestion.dosePills) {
      setDosePills(suggestion.dosePills)
    }
    if (!doseMg.trim() && suggestion.doseMg) {
      setDoseMg(suggestion.doseMg)
    }
  }

  function parseScheduleTimes(): string[] {
    const parsed = doseTimes.map((row, index) => {
      try {
        return twelveHourToScheduleTime(row.time12, row.period)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid time'
        throw new Error(`Dose ${index + 1}: ${msg}`, { cause: err })
      }
    })
    return normalizeScheduleTimes(parsed)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      if (!dosePills.trim() && !doseMg.trim()) {
        throw new Error('Enter an amount in pills, mg, or both.')
      }

      const schedule_times = parseScheduleTimes()
      const end_date = hasEndDate && endDate.trim() ? endDate.trim() : null
      validateMedicationDates(startDate, end_date)

      let pills: number | null = null
      if (trackPills) {
        const n = parseInt(pillsRemaining, 10)
        if (Number.isNaN(n) || n < 0) {
          throw new Error('Pills remaining must be a non-negative number')
        }
        pills = n
      }

      await onSave({
        name,
        dose_pills: dosePills,
        dose_mg: doseMg,
        schedule_times,
        notes,
        pills_remaining: pills,
        start_date: startDate,
        end_date,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-labelledby="med-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="med-form-title">{initial ? 'Edit medication' : 'Add medication'}</h2>

        <form onSubmit={handleSubmit} className="med-form">
          <label>
            Name *
            <MedicationNameInput
              required
              value={name}
              onChange={setName}
              onSelectSuggestion={applySuggestion}
            />
          </label>

          <fieldset className="dose-fieldset med-dates-fieldset">
            <legend>Schedule dates</legend>
            <label>
              Start date *
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={hasEndDate}
                onChange={(e) => {
                  setHasEndDate(e.target.checked)
                  if (!e.target.checked) setEndDate('')
                }}
              />
              Set an end date (optional)
            </label>
            {hasEndDate && (
              <label>
                End date
                <input
                  type="date"
                  required={hasEndDate}
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            )}
            <p className="field-hint field-hint-legend">
              Doses appear on Today only between these dates. Leave end date empty for
              ongoing medications.
            </p>
          </fieldset>

          <fieldset className="dose-fieldset">
            <legend>Amount per dose *</legend>
            <p className="field-hint field-hint-legend">
              Fill in pills, mg, or both (at least one required).
            </p>
            <label>
              Pills / tablets
              <input
                value={dosePills}
                onChange={(e) => setDosePills(e.target.value)}
                placeholder="e.g. 1 tablet, 2 capsules"
              />
            </label>
            <label>
              Milligrams (mg)
              <input
                value={doseMg}
                onChange={(e) => setDoseMg(e.target.value)}
                placeholder="e.g. 10 mg"
              />
            </label>
          </fieldset>

          <fieldset className="dose-fieldset dose-times-fieldset">
            <legend>Dose times *</legend>
            <p className="field-hint field-hint-legend">
              One row per daily dose (e.g. morning and evening = two rows).
            </p>

            {doseTimes.map((row, index) => (
              <div key={row.id} className="dose-time-row">
                <span className="dose-time-label">Dose {index + 1}:</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dose-time-input"
                  value={row.time12}
                  onChange={(e) => updateDoseTime(row.id, { time12: e.target.value })}
                  placeholder="8:00"
                  aria-label={`Dose ${index + 1} time`}
                />
                <select
                  className="dose-period-select"
                  value={row.period}
                  onChange={(e) =>
                    updateDoseTime(row.id, { period: e.target.value as Meridiem })
                  }
                  aria-label={`Dose ${index + 1} AM or PM`}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
                {doseTimes.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm dose-time-remove"
                    onClick={() => removeDoseTime(row.id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-sm dose-time-add"
              onClick={addDoseTime}
            >
              + Add dose time
            </button>
          </fieldset>

          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Take with food, etc."
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={trackPills}
              onChange={(e) => setTrackPills(e.target.checked)}
            />
            Track pills remaining (for refill reminders)
          </label>
          {trackPills && (
            <label>
              Pills remaining
              <input
                type="number"
                min={0}
                value={pillsRemaining}
                onChange={(e) => setPillsRemaining(e.target.value)}
              />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
