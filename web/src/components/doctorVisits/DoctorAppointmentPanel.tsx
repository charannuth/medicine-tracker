import {
  DOCTOR_APPOINTMENT_TYPES,
  type DoctorAppointmentType,
  type DoctorVisitInput,
} from '../../lib/doctorVisits'

type DoctorAppointmentPanelProps = {
  value: DoctorVisitInput
  onChange: (next: DoctorVisitInput) => void
  onSave: () => void
  onDiscard: () => void
  busy?: boolean
  mode: 'schedule' | 'edit'
  lockDate?: boolean
  submitLabel?: string
  appointmentFieldsKey?: number
}

export function DoctorAppointmentPanel({
  value,
  onChange,
  onSave,
  onDiscard,
  busy = false,
  mode,
  lockDate = true,
  submitLabel,
  appointmentFieldsKey = 0,
}: DoctorAppointmentPanelProps) {
  const isScheduleMode = mode === 'schedule'

  function setField<K extends keyof DoctorVisitInput>(key: K, fieldValue: DoctorVisitInput[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <div className="doctor-visit-subpanel doctor-visit-appointment-panel">
      <h4 className="doctor-visit-subpanel-title">
        {isScheduleMode ? 'Schedule appointment' : 'Appointment details'}
      </h4>
      {!isScheduleMode && (
        <p className="field-hint doctor-visit-section-hint">
          When and who you saw — save this section on its own.
        </p>
      )}

      <form
        className="doctor-visit-form doctor-visit-form-panel"
        onSubmit={(e) => {
          e.preventDefault()
          onSave()
        }}
      >
        <fieldset className="cycle-day-log-fields doctor-visit-schedule-fields">
          {!lockDate && (
            <div className="doctor-visit-form-grid">
              <label className="cycle-notes-label">
                Visit date
                <input
                  type="date"
                  value={value.visit_date}
                  onChange={(e) => setField('visit_date', e.target.value)}
                  required
                />
              </label>

              <label className="cycle-notes-label">
                Time (optional)
                <input
                  type="text"
                  value={value.visit_time}
                  onChange={(e) => setField('visit_time', e.target.value)}
                  placeholder="e.g. 2:30 PM"
                />
              </label>
            </div>
          )}

          {lockDate && (
            <label className="cycle-notes-label">
              Time (optional)
              <input
                type="text"
                value={value.visit_time}
                onChange={(e) => setField('visit_time', e.target.value)}
                placeholder="e.g. 2:30 PM"
              />
            </label>
          )}

          <fieldset className="doctor-visit-type-fieldset">
            <legend className="doctor-visit-type-legend">Appointment type</legend>
            <div
              key={`appointment-type-${appointmentFieldsKey}-${value.appointment_type}`}
              className="wellness-chip-group"
              role="group"
              aria-label="Appointment type"
            >
              {DOCTOR_APPOINTMENT_TYPES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`wellness-chip${value.appointment_type === option.id ? ' active' : ''}`}
                  aria-pressed={value.appointment_type === option.id}
                  onClick={() => setField('appointment_type', option.id as DoctorAppointmentType)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="cycle-notes-label">
            Doctor or clinic
            <input
              type="text"
              value={value.provider_name}
              onChange={(e) => setField('provider_name', e.target.value)}
              placeholder="Dr. Smith or City Health Clinic"
            />
          </label>

          <div className="doctor-visit-form-grid">
            <label className="cycle-notes-label">
              Specialty (optional)
              <input
                type="text"
                value={value.specialty}
                onChange={(e) => setField('specialty', e.target.value)}
                placeholder="Primary care, cardiology…"
              />
            </label>

            <label className="cycle-notes-label">
              Location (optional)
              <input
                type="text"
                value={value.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Office address or telehealth"
              />
            </label>
          </div>

          <label className="cycle-notes-label">
            {isScheduleMode ? 'Reason for visit' : 'Reason (optional)'}
            <textarea
              value={value.reason}
              onChange={(e) => setField('reason', e.target.value)}
              rows={3}
              placeholder="Annual check-up, follow-up labs, new symptoms…"
            />
          </label>
        </fieldset>

        <div className="cycle-day-log-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : submitLabel ?? 'Save visit'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={onDiscard}
          >
            Discard edits
          </button>
        </div>
      </form>
    </div>
  )
}
