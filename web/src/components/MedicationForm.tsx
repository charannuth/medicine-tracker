import { useState, type FormEvent } from 'react'
import {
  normalizeScheduleTimes,
  scheduleTimeToTwelveHour,
  todayLocalDate,
  twelveHourToScheduleTime,
  type Meridiem,
} from '../lib/dates'
import { getErrorMessage } from '../lib/errors'
import {
  isMedicationRouteId,
  MEDICATION_FORMS_BY_ROUTE,
  MEDICATION_ROUTES,
  type MedicationRouteId,
} from '../lib/medicationForms'
import { validateMedicationDates } from '../lib/medicationDates'
import type { MedicationSuggestion } from '../lib/medicationSuggestions'
import {
  canUseNotifications,
  requestNotificationPermission,
} from '../lib/notifications'
import { getReminders, setReminders } from '../lib/settings'
import type { Medication, MedicationInput } from '../lib/types'
import { MedicationNameInput } from './MedicationNameInput'
import { MedicationSafetyPanel } from './MedicationSafetyPanel'

type MedicationFormProps = {
  initial?: Medication | null
  existingMedicationNames?: string[]
  onSave: (input: MedicationInput) => Promise<void>
  onCancel: () => void
}

type DoseTimeRow = {
  id: string
  time12: string
  period: Meridiem
}

const WIZARD_STEPS = [
  'name',
  'route',
  'form',
  'dates',
  'dosage',
  'times',
  'notes',
  'tracking',
  'notifications',
  'safety',
] as const

type WizardStep = (typeof WIZARD_STEPS)[number]

const STEP_TITLES: Record<WizardStep, string> = {
  name: 'Medication name',
  route: 'How do you take it?',
  form: 'What type is it?',
  dates: 'Schedule dates',
  dosage: 'Amount per dose',
  times: 'Dose times',
  notes: 'Notes',
  tracking: 'Refill tracking',
  notifications: 'Reminders',
  safety: 'Safety review',
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
  const route =
    initial?.medication_route && isMedicationRouteId(initial.medication_route)
      ? initial.medication_route
      : null

  if (initial) {
    return {
      name: initial.name,
      route,
      form: initial.medication_form ?? '',
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
      remindersOn: getReminders().enabled,
    }
  }

  return {
    name: '',
    route: null as MedicationRouteId | null,
    form: '',
    dosePills: '',
    doseMg: '',
    doseTimes: buildDoseTimes(),
    notes: '',
    trackPills: false,
    pillsRemaining: '',
    startDate: todayLocalDate(),
    hasEndDate: false,
    endDate: '',
    remindersOn: getReminders().enabled,
  }
}

export function MedicationForm({
  initial,
  existingMedicationNames = [],
  onSave,
  onCancel,
}: MedicationFormProps) {
  const defaults = buildFormState(initial)
  const [stepIndex, setStepIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'forward' | 'back'>('forward')

  const [name, setName] = useState(defaults.name)
  const [route, setRoute] = useState<MedicationRouteId | null>(defaults.route)
  const [form, setForm] = useState(defaults.form)
  const [dosePills, setDosePills] = useState(defaults.dosePills)
  const [doseMg, setDoseMg] = useState(defaults.doseMg)
  const [doseTimes, setDoseTimes] = useState(defaults.doseTimes)
  const [notes, setNotes] = useState(defaults.notes)
  const [trackPills, setTrackPills] = useState(defaults.trackPills)
  const [pillsRemaining, setPillsRemaining] = useState(defaults.pillsRemaining)
  const [startDate, setStartDate] = useState(defaults.startDate)
  const [hasEndDate, setHasEndDate] = useState(defaults.hasEndDate)
  const [endDate, setEndDate] = useState(defaults.endDate)
  const [remindersOn, setRemindersOn] = useState(defaults.remindersOn)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const step = WIZARD_STEPS[stepIndex]
  const isLastStep = stepIndex === WIZARD_STEPS.length - 1
  const isOtherRoute = route === 'other'
  const formOptions =
    route && !isOtherRoute ? MEDICATION_FORMS_BY_ROUTE[route] : []

  function stepLabel(wizardStep: WizardStep): string {
    if (wizardStep === 'form' && isOtherRoute) {
      return 'Describe how you take it'
    }
    return STEP_TITLES[wizardStep]
  }

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

  function selectRoute(next: MedicationRouteId) {
    setRoute(next)
    setForm('')
    setError(null)
  }

  function selectFormType(formId: string) {
    setForm(formId)
    setError(null)
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

  function validateStep(current: WizardStep): string | null {
    switch (current) {
      case 'name':
        if (!name.trim()) return 'Enter a medication name.'
        return null
      case 'route':
        if (!route) return 'Choose how you take this medication.'
        return null
      case 'form':
        if (!form.trim()) {
          return isOtherRoute
            ? 'Describe how you take this medication.'
            : 'Choose the medication type.'
        }
        return null
      case 'dates': {
        const end = hasEndDate && endDate.trim() ? endDate.trim() : null
        try {
          validateMedicationDates(startDate, end)
        } catch (err) {
          return getErrorMessage(err, 'Check your schedule dates.')
        }
        if (hasEndDate && !endDate.trim()) return 'Enter an end date or turn it off.'
        return null
      }
      case 'dosage':
        if (!dosePills.trim() && !doseMg.trim()) {
          return 'Enter an amount in pills, mg, or both.'
        }
        return null
      case 'times':
        try {
          if (parseScheduleTimes().length === 0) {
            return 'Add at least one dose time.'
          }
        } catch (err) {
          return getErrorMessage(err, 'Check your dose times.')
        }
        return null
      case 'tracking':
        if (trackPills) {
          const n = parseInt(pillsRemaining, 10)
          if (Number.isNaN(n) || n < 0) {
            return 'Pills remaining must be a non-negative number.'
          }
        }
        return null
      default:
        return null
    }
  }

  function goNext() {
    const message = validateStep(step)
    if (message) {
      setError(message)
      return
    }
    setError(null)
    setSlideDirection('forward')
    setStepIndex((i) => Math.min(i + 1, WIZARD_STEPS.length - 1))
  }

  function goBack() {
    setError(null)
    setSlideDirection('back')
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  async function handleRemindersToggle(enabled: boolean) {
    if (enabled) {
      const ok = await requestNotificationPermission()
      if (!ok) {
        setError('Enable notifications in your browser to use reminders.')
        setRemindersOn(false)
        return
      }
    }
    setRemindersOn(enabled)
    setReminders({ enabled })
    setError(null)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const message = validateStep(step)
    if (message) {
      setError(message)
      return
    }
    if (!isLastStep) {
      goNext()
      return
    }

    setError(null)
    setBusy(true)

    try {
      if (!route) throw new Error('Choose how you take this medication.')

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

      setReminders({ enabled: remindersOn })

      await onSave({
        name,
        medication_route: route,
        medication_form: form.trim(),
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

  function renderStepPanel(current: WizardStep) {
    switch (current) {
      case 'name':
        return (
          <div className="med-wizard-panel-inner">
            <p className="field-hint">Search common medications or type your own.</p>
            <label>
              Name *
              <MedicationNameInput
                required
                value={name}
                onChange={setName}
                onSelectSuggestion={applySuggestion}
              />
            </label>
          </div>
        )

      case 'route':
        return (
          <div className="med-wizard-panel-inner med-wizard-panel-inner--scroll">
            <p className="field-hint">Pick the category that best matches how you use it.</p>
            <p className="field-hint med-wizard-nav-hint">Select one option, then tap Next.</p>
            <div className="med-type-grid med-type-grid-route">
              {MEDICATION_ROUTES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`med-type-card${route === option.id ? ' selected' : ''}`}
                  onClick={() => selectRoute(option.id)}
                  aria-pressed={route === option.id}
                >
                  <span className="med-type-card-label">{option.label}</span>
                  <span className="med-type-card-desc">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'form':
        return (
          <div className="med-wizard-panel-inner med-wizard-panel-inner--scroll">
            {isOtherRoute ? (
              <>
                <p className="field-hint">
                  Tell us how this medication is taken (e.g. inhaler, eye drops, suppository).
                </p>
                <p className="field-hint med-wizard-nav-hint">
                  Describe it below, then tap Next.
                </p>
                <label>
                  How do you take it? *
                  <textarea
                    value={form}
                    onChange={(e) => {
                      setForm(e.target.value)
                      setError(null)
                    }}
                    rows={4}
                    placeholder="e.g. One puff from inhaler twice daily"
                  />
                </label>
              </>
            ) : (
              <>
                <p className="field-hint">
                  {route
                    ? `Options for ${MEDICATION_ROUTES.find((r) => r.id === route)?.label ?? 'this route'}`
                    : 'Go back and choose a route first.'}
                </p>
                <p className="field-hint med-wizard-nav-hint">
                  Select one type, then tap Next.
                </p>
                <div className="med-type-grid med-type-grid-form">
                  {formOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`med-type-chip${form === option.id ? ' selected' : ''}`}
                      onClick={() => selectFormType(option.id)}
                      aria-pressed={form === option.id}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )

      case 'dates':
        return (
          <div className="med-wizard-panel-inner">
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
            <p className="field-hint">
              Doses appear on Today only between these dates. Leave end date empty for
              ongoing medications.
            </p>
          </div>
        )

      case 'dosage':
        return (
          <div className="med-wizard-panel-inner">
            <p className="field-hint">Fill in pills, mg, or both (at least one required).</p>
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
          </div>
        )

      case 'times':
        return (
          <div className="med-wizard-panel-inner">
            <p className="field-hint">
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
          </div>
        )

      case 'notes':
        return (
          <div className="med-wizard-panel-inner">
            <label>
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Take with food, avoid alcohol, etc."
              />
            </label>
          </div>
        )

      case 'tracking':
        return (
          <div className="med-wizard-panel-inner">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={trackPills}
                onChange={(e) => setTrackPills(e.target.checked)}
              />
              Track supply remaining (for refill reminders)
            </label>
            {trackPills && (
              <label>
                Amount remaining
                <input
                  type="number"
                  min={0}
                  value={pillsRemaining}
                  onChange={(e) => setPillsRemaining(e.target.value)}
                  placeholder="e.g. 30"
                />
              </label>
            )}
            <p className="field-hint">
              When enabled, marking doses taken updates your remaining count automatically.
            </p>
          </div>
        )

      case 'notifications':
        return (
          <div className="med-wizard-panel-inner">
            <p className="field-hint">
              Get browser reminders while this app is open when a dose time passes.
            </p>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={remindersOn}
                disabled={!canUseNotifications()}
                onChange={(e) => void handleRemindersToggle(e.target.checked)}
              />
              Enable dose reminders
            </label>
            {!canUseNotifications() && (
              <p className="field-hint">Notifications are not supported in this browser.</p>
            )}
          </div>
        )

      case 'safety':
        return (
          <div className="med-wizard-panel-inner med-wizard-panel-inner--scroll">
            <MedicationSafetyPanel
              drugName={name}
              existingMedicationNames={existingMedicationNames.filter(
                (medName) =>
                  medName.toLowerCase() !== name.trim().toLowerCase() &&
                  medName.toLowerCase() !== (initial?.name.trim().toLowerCase() ?? ''),
              )}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal med-form-modal"
        role="dialog"
        aria-labelledby="med-form-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="med-wizard-header">
          <h2 id="med-form-title">{initial ? 'Edit medication' : 'Add medication'}</h2>
          <p className="med-wizard-step-label">
            Step {stepIndex + 1} of {WIZARD_STEPS.length} — {stepLabel(step)}
          </p>
          <div
            className="med-wizard-progress"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={WIZARD_STEPS.length}
          >
            {WIZARD_STEPS.map((_, i) => (
              <span
                key={WIZARD_STEPS[i]}
                className={`med-wizard-dot${i <= stepIndex ? ' filled' : ''}${i === stepIndex ? ' current' : ''}`}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="med-form med-form-wizard">
          <div className="med-wizard-viewport" data-direction={slideDirection}>
            <div key={step} className="med-wizard-slide">
              <h3 className="med-wizard-panel-title">{stepLabel(step)}</h3>
              {renderStepPanel(step)}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions med-wizard-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <div className="med-wizard-nav">
              {stepIndex > 0 && (
                <button type="button" className="btn btn-secondary" onClick={goBack}>
                  Back
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : isLastStep ? 'Save' : 'Next'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
