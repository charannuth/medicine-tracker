import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DoctorAppointmentPanel } from './DoctorAppointmentPanel'
import { DoctorVisitNotesPanel } from './DoctorVisitNotesPanel'
import { CycleDayStrip } from '../tracking/CycleDayStrip'
import { useAuth } from '../../hooks/useAuth'
import { todayLocalDate } from '../../lib/dates'
import {
  buildAppointmentSavePayload,
  buildNotesSavePayload,
  deleteDoctorVisit,
  emptyDoctorVisitInput,
  fetchDoctorVisits,
  fetchDoctorVisitsOnDate,
  insertDoctorVisit,
  isUpcomingVisit,
  updateDoctorVisit,
  pickAppointmentFields,
  visitNeedsNotes,
  visitProviderLabel,
  visitSummaryLabel,
  visitToInput,
  type DoctorVisit,
  type DoctorVisitInput,
} from '../../lib/doctorVisits'

type DoctorVisitsPanelProps = {
  selectedDate: string
  onSelectDate: (date: string) => void
  onDataMutated?: () => void
}

function formModeForDate(date: string, today: string): 'schedule' | 'edit' {
  return isUpcomingVisit(date, today) ? 'schedule' : 'edit'
}

export function DoctorVisitsPanel({
  selectedDate,
  onSelectDate,
  onDataMutated,
}: DoctorVisitsPanelProps) {
  const { user } = useAuth()
  const today = todayLocalDate()
  const isFutureDay = selectedDate > today

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const [monthVisits, setMonthVisits] = useState<DoctorVisit[]>([])
  const [dayVisits, setDayVisits] = useState<DoctorVisit[]>([])
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DoctorVisitInput>(emptyDoctorVisitInput(selectedDate))
  const [creatingNew, setCreatingNew] = useState(false)
  const [appointmentFieldsKey, setAppointmentFieldsKey] = useState(0)
  const appointmentBaselineRef = useRef(
    pickAppointmentFields(emptyDoctorVisitInput(selectedDate)),
  )

  const syncAppointmentBaseline = useCallback((input: DoctorVisitInput) => {
    appointmentBaselineRef.current = pickAppointmentFields(input)
  }, [])

  const applyVisitDraft = useCallback(
    (input: DoctorVisitInput) => {
      setDraft(input)
      syncAppointmentBaseline(input)
    },
    [syncAppointmentBaseline],
  )

  const activeVisit = useMemo(
    () => dayVisits.find((v) => v.id === activeVisitId) ?? null,
    [dayVisits, activeVisitId],
  )

  const reload = useCallback(async (): Promise<DoctorVisit[]> => {
    if (!user) return []
    setLoading(true)
    setError(null)
    try {
      const [allVisits, visitsOnDay] = await Promise.all([
        fetchDoctorVisits(user.id, 120),
        fetchDoctorVisitsOnDate(user.id, selectedDate),
      ])
      setMonthVisits(allVisits)
      setDayVisits(visitsOnDay)
      return visitsOnDay
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load visits for this day')
      return []
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => {
    setCreatingNew(false)
    setMessage(null)
    setActiveVisitId(null)
    const empty = emptyDoctorVisitInput(selectedDate)
    applyVisitDraft(empty)
  }, [selectedDate, applyVisitDraft])

  useEffect(() => {
    void (async () => {
      const visitsOnDay = await reload()
      if (visitsOnDay.length > 0) {
        setActiveVisitId(visitsOnDay[0].id)
        applyVisitDraft(visitToInput(visitsOnDay[0]))
      }
    })()
  }, [reload, applyVisitDraft])

  const dayHasVisit = useCallback(
    (date: string) => monthVisits.some((v) => v.visit_date === date),
    [monthVisits],
  )

  function startNewVisit() {
    setCreatingNew(true)
    setActiveVisitId(null)
    applyVisitDraft(emptyDoctorVisitInput(selectedDate))
    setMessage(null)
    setError(null)
  }

  function selectVisit(visit: DoctorVisit) {
    setCreatingNew(false)
    setActiveVisitId(visit.id)
    applyVisitDraft(visitToInput(visit))
    setMessage(null)
    setError(null)
  }

  function discardAppointmentEdits() {
    const baseline = appointmentBaselineRef.current
    setDraft((current) => ({
      ...current,
      ...baseline,
    }))
    setCreatingNew(false)
    setAppointmentFieldsKey((key) => key + 1)
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  function discardNotesEdits() {
    if (activeVisit) {
      const input = visitToInput(activeVisit)
      setDraft((current) => ({
        ...current,
        notes: input.notes,
        follow_up_date: input.follow_up_date,
      }))
      return
    }
    setDraft((current) => ({
      ...current,
      notes: '',
      follow_up_date: '',
    }))
  }

  async function persistVisit(payload: DoctorVisitInput, successMessage: string) {
    if (!user) return null

    if (activeVisitId && !creatingNew) {
      const saved = await updateDoctorVisit(user.id, activeVisitId, payload)
      setMessage(successMessage)
      return saved
    }

    const saved = await insertDoctorVisit(user.id, payload)
    setMessage(successMessage)
    return saved
  }

  async function handleSaveAppointment() {
    if (!user) return

    if (!draft.provider_name.trim() && !draft.reason.trim()) {
      setError('Add a doctor/clinic name or reason for the visit.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const payload = buildAppointmentSavePayload(draft, selectedDate, activeVisit)
      const saved = await persistVisit(
        payload,
        isFutureDay ? 'Appointment scheduled.' : 'Appointment details saved.',
      )
      if (!saved) return

      setCreatingNew(false)
      setActiveVisitId(saved.id)
      applyVisitDraft(visitToInput(saved))
      await reload()
      onDataMutated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save appointment')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveNotes() {
    if (!user) return
    if (!activeVisitId || creatingNew) {
      setError('Save appointment details before adding notes.')
      return
    }
    if (!activeVisit) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const payload = buildNotesSavePayload(draft, selectedDate, activeVisit)
      const saved = await updateDoctorVisit(user.id, activeVisitId, payload)
      setMessage('Visit notes saved.')
      applyVisitDraft(visitToInput(saved))
      await reload()
      onDataMutated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save notes')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(visit: DoctorVisit) {
    if (!user) return
    const label = visitProviderLabel(visit)
    if (!window.confirm(`Remove ${label} on ${selectedDate}?`)) return

    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await deleteDoctorVisit(user.id, visit.id)
      if (activeVisitId === visit.id) {
        setActiveVisitId(null)
        applyVisitDraft(emptyDoctorVisitInput(selectedDate))
      }
      setCreatingNew(false)
      await reload()
      onDataMutated?.()
      setMessage('Visit removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove visit')
    } finally {
      setBusy(false)
    }
  }

  if (!user) return null

  const mode = formModeForDate(selectedDate, today)
  const showForm = creatingNew || dayVisits.length === 0 || activeVisitId !== null
  const canSaveNotes = Boolean(activeVisitId && !creatingNew)

  return (
    <div className="tracker-panel doctor-visits-panel">
      <p className="field-hint">
        Tap a day on the calendar above, then schedule an upcoming visit or log notes after
        your appointment. Follow-up dates appear on their scheduled day.
      </p>

      {error && <p className="banner banner-error">{error}</p>}
      {message && <p className="banner banner-success-style">{message}</p>}

      {loading ? (
        <p className="loading">Loading visit details…</p>
      ) : (
        <>
          <CycleDayStrip
            selectedDate={selectedDate}
            today={today}
            onSelectDate={onSelectDate}
            dayHasLog={dayHasVisit}
          />

          {isFutureDay ? (
            <p className="field-hint cycle-future-day-hint" role="status">
              Schedule details for this upcoming visit — notes unlock after the appointment day.
            </p>
          ) : dayVisits.some((v) => visitNeedsNotes(v, today)) ? (
            <p className="field-hint doctor-visits-notes-hint" role="status">
              This day has a visit without notes — capture what your doctor said while it&apos;s
              fresh.
            </p>
          ) : null}

          {dayVisits.length > 0 && (
            <section className="doctor-visits-day-list">
              <div className="doctor-visits-day-list-header">
                <h4>
                  {dayVisits.length === 1 ? 'Visit on this day' : `${dayVisits.length} visits`}
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={busy}
                  onClick={startNewVisit}
                >
                  Add visit
                </button>
              </div>
              <ul className="doctor-visits-day-chips">
                {dayVisits.map((visit) => (
                  <li key={visit.id}>
                    <button
                      type="button"
                      className={`doctor-visits-day-chip${activeVisitId === visit.id && !creatingNew ? ' active' : ''}${visitNeedsNotes(visit, today) ? ' needs-notes' : ''}`}
                      onClick={() => selectVisit(visit)}
                    >
                      {visitSummaryLabel(visit)}
                      {visit.visit_time?.trim() ? ` · ${visit.visit_time.trim()}` : ''}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => void handleDelete(visit)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showForm && (
            <>
              <DoctorAppointmentPanel
                value={draft}
                onChange={setDraft}
                onSave={() => void handleSaveAppointment()}
                onDiscard={discardAppointmentEdits}
                busy={busy}
                mode={mode}
                lockDate
                appointmentFieldsKey={appointmentFieldsKey}
                submitLabel={
                  creatingNew || dayVisits.length === 0
                    ? isFutureDay
                      ? 'Save appointment'
                      : 'Save visit'
                    : 'Update visit'
                }
              />

              {!isFutureDay && (
                <DoctorVisitNotesPanel
                  value={draft}
                  onChange={setDraft}
                  onSave={() => void handleSaveNotes()}
                  onDiscard={discardNotesEdits}
                  busy={busy}
                  canSave={canSaveNotes}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
