import type { DoctorVisitInput } from '../lib/doctorVisits'

type DoctorVisitFormProps = {
  value: DoctorVisitInput
  onChange: (next: DoctorVisitInput) => void
  onSubmit: () => void
  onCancel: () => void
  busy?: boolean
  mode: 'schedule' | 'notes' | 'edit'
  submitLabel?: string
}

export function DoctorVisitForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  busy = false,
  mode,
  submitLabel,
}: DoctorVisitFormProps) {
  const isNotesMode = mode === 'notes'
  const isScheduleMode = mode === 'schedule'

  function setField<K extends keyof DoctorVisitInput>(key: K, fieldValue: DoctorVisitInput[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <form
      className="doctor-visit-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="doctor-visit-form-grid">
        <label className="field">
          <span className="field-label">Visit date</span>
          <input
            type="date"
            value={value.visit_date}
            onChange={(e) => setField('visit_date', e.target.value)}
            required
            disabled={isNotesMode}
          />
        </label>

        <label className="field">
          <span className="field-label">Time (optional)</span>
          <input
            type="text"
            value={value.visit_time}
            onChange={(e) => setField('visit_time', e.target.value)}
            placeholder="e.g. 2:30 PM"
            disabled={isNotesMode}
          />
        </label>
      </div>

      {!isNotesMode && (
        <>
          <label className="field">
            <span className="field-label">Doctor or clinic</span>
            <input
              type="text"
              value={value.provider_name}
              onChange={(e) => setField('provider_name', e.target.value)}
              placeholder="Dr. Smith or City Health Clinic"
            />
          </label>

          <div className="doctor-visit-form-grid">
            <label className="field">
              <span className="field-label">Specialty (optional)</span>
              <input
                type="text"
                value={value.specialty}
                onChange={(e) => setField('specialty', e.target.value)}
                placeholder="Primary care, cardiology…"
              />
            </label>

            <label className="field">
              <span className="field-label">Location (optional)</span>
              <input
                type="text"
                value={value.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="Office address or telehealth"
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">
              {isScheduleMode ? 'Reason for visit' : 'Reason (optional)'}
            </span>
            <textarea
              value={value.reason}
              onChange={(e) => setField('reason', e.target.value)}
              rows={3}
              placeholder="Annual check-up, follow-up labs, new symptoms…"
            />
          </label>
        </>
      )}

      {(mode === 'notes' || mode === 'edit') && (
        <>
          <label className="field">
            <span className="field-label">Visit notes</span>
            <textarea
              value={value.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={6}
              placeholder="What your doctor said, next steps, medication changes, questions to follow up on…"
            />
          </label>

          <label className="field">
            <span className="field-label">Follow-up date (optional)</span>
            <input
              type="date"
              value={value.follow_up_date}
              onChange={(e) => setField('follow_up_date', e.target.value)}
            />
          </label>
        </>
      )}

      <div className="doctor-visit-form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel ?? 'Save visit'}
        </button>
      </div>
    </form>
  )
}
