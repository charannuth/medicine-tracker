import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DoctorVisitForm } from '../components/DoctorVisitForm'
import { useAuth } from '../hooks/useAuth'
import { addDaysToDateString, formatDisplayDate, todayLocalDate } from '../lib/dates'
import {
  deleteDoctorVisit,
  emptyDoctorVisitInput,
  fetchDoctorVisits,
  formatVisitWhen,
  insertDoctorVisit,
  isUpcomingVisit,
  splitDoctorVisits,
  updateDoctorVisit,
  visitNeedsNotes,
  visitProviderLabel,
  visitToInput,
  type DoctorVisit,
  type DoctorVisitInput,
} from '../lib/doctorVisits'

type FormMode = 'schedule' | 'notes' | 'edit' | null

export function DoctorVisitsPage() {
  const { user } = useAuth()
  const today = todayLocalDate()
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<DoctorVisitInput>(emptyDoctorVisitInput())

  const reload = useCallback(async () => {
    if (!user) return
    const data = await fetchDoctorVisits(user.id)
    setVisits(data)
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true

    fetchDoctorVisits(user.id)
      .then((data) => {
        if (active) setVisits(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load doctor visits')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const { upcoming, past } = useMemo(() => splitDoctorVisits(visits, today), [visits, today])
  const needsNotes = useMemo(() => past.filter((visit) => visitNeedsNotes(visit, today)), [past, today])

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setDraft(emptyDoctorVisitInput())
  }

  function openScheduleForm() {
    setError(null)
    setMessage(null)
    setEditingId(null)
    setDraft(emptyDoctorVisitInput(addDaysToDateString(today, 7)))
    setFormMode('schedule')
  }

  function openNotesForm(visit: DoctorVisit) {
    setError(null)
    setMessage(null)
    setEditingId(visit.id)
    setDraft(visitToInput(visit))
    setFormMode('notes')
  }

  function openEditForm(visit: DoctorVisit) {
    setError(null)
    setMessage(null)
    setEditingId(visit.id)
    setDraft(visitToInput(visit))
    setFormMode(isUpcomingVisit(visit.visit_date, today) ? 'schedule' : 'edit')
  }

  async function handleSave() {
    if (!user || !formMode) return

    if (!draft.visit_date.trim()) {
      setError('Visit date is required.')
      return
    }

    if (formMode === 'schedule' && !draft.provider_name.trim() && !draft.reason.trim()) {
      setError('Add a doctor/clinic name or reason for the visit.')
      return
    }

    if (formMode === 'notes' && !draft.notes.trim()) {
      setError('Add notes about what was discussed at your appointment.')
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      if (editingId) {
        await updateDoctorVisit(user.id, editingId, draft)
        setMessage(formMode === 'notes' ? 'Visit notes saved.' : 'Visit updated.')
      } else {
        await insertDoctorVisit(user.id, draft)
        setMessage('Visit scheduled.')
      }
      await reload()
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save visit')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(visit: DoctorVisit) {
    if (!user) return
    const label = visitProviderLabel(visit)
    if (!window.confirm(`Remove ${label} on ${formatVisitWhen(visit)}?`)) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      await deleteDoctorVisit(user.id, visit.id)
      if (editingId === visit.id) closeForm()
      await reload()
      setMessage('Visit removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove visit')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page doctor-visits-page">
      <header className="page-header">
        <h2>Doctor visits</h2>
        <p className="page-subtitle">
          Schedule upcoming appointments and save notes after your visit — for your own
          records, not a clinical chart.
        </p>
      </header>

      {error && <p className="banner banner-error">{error}</p>}
      {message && <p className="banner banner-success-style">{message}</p>}

      <section className="doctor-visits-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={openScheduleForm}
          disabled={busy || formMode !== null}
        >
          Schedule visit
        </button>
        <Link to="/wellness" className="btn btn-secondary">
          Prepare wellness report
        </Link>
      </section>

      {formMode && (
        <section className="wellness-card doctor-visits-form-card">
          <h3 className="wellness-section-title">
            {formMode === 'schedule'
              ? 'Schedule a visit'
              : formMode === 'notes'
                ? 'Log visit notes'
                : 'Edit visit'}
          </h3>
          <DoctorVisitForm
            value={draft}
            onChange={setDraft}
            onSubmit={() => void handleSave()}
            onCancel={closeForm}
            busy={busy}
            mode={formMode === 'edit' ? 'edit' : formMode}
            submitLabel={
              formMode === 'schedule'
                ? 'Save visit'
                : formMode === 'notes'
                  ? 'Save notes'
                  : 'Update visit'
            }
          />
        </section>
      )}

      {loading ? (
        <p className="loading">Loading doctor visits…</p>
      ) : (
        <>
          {needsNotes.length > 0 && (
            <section className="wellness-card doctor-visits-section">
              <h3 className="wellness-section-title">Add visit notes</h3>
              <p className="field-hint">
                These appointments are today or in the past — capture what your doctor said
                while it&apos;s fresh.
              </p>
              <ul className="doctor-visits-list">
                {needsNotes.map((visit) => (
                  <VisitRow
                    key={visit.id}
                    visit={visit}
                    busy={busy}
                    onAddNotes={() => openNotesForm(visit)}
                    onEdit={() => openEditForm(visit)}
                    onDelete={() => void handleDelete(visit)}
                    primaryAction="notes"
                  />
                ))}
              </ul>
            </section>
          )}

          <section className="wellness-card doctor-visits-section">
            <h3 className="wellness-section-title">Upcoming visits</h3>
            {upcoming.length === 0 ? (
              <p className="field-hint">No upcoming appointments scheduled.</p>
            ) : (
              <ul className="doctor-visits-list">
                {upcoming.map((visit) => (
                  <VisitRow
                    key={visit.id}
                    visit={visit}
                    busy={busy}
                    onAddNotes={() => openNotesForm(visit)}
                    onEdit={() => openEditForm(visit)}
                    onDelete={() => void handleDelete(visit)}
                    primaryAction="edit"
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="wellness-card doctor-visits-section">
            <h3 className="wellness-section-title">Past visits</h3>
            {past.length === 0 ? (
              <p className="field-hint">
                After an appointment, log notes here or schedule your next visit above.
              </p>
            ) : (
              <ul className="doctor-visits-list">
                {past.map((visit) => (
                  <VisitRow
                    key={visit.id}
                    visit={visit}
                    busy={busy}
                    onAddNotes={() => openNotesForm(visit)}
                    onEdit={() => openEditForm(visit)}
                    onDelete={() => void handleDelete(visit)}
                    primaryAction={visit.notes?.trim() ? 'edit' : 'notes'}
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <p className="page-footer-hint">
        For symptoms and daily check-ins, use{' '}
        <Link to="/wellness">Wellness</Link> — you can print a doctor report from there.
      </p>
    </main>
  )
}

function VisitRow({
  visit,
  busy,
  onAddNotes,
  onEdit,
  onDelete,
  primaryAction,
}: {
  visit: DoctorVisit
  busy: boolean
  onAddNotes: () => void
  onEdit: () => void
  onDelete: () => void
  primaryAction: 'notes' | 'edit'
}) {
  return (
    <li className="doctor-visit-row">
      <div className="doctor-visit-row-main">
        <p className="doctor-visit-row-title">{visitProviderLabel(visit)}</p>
        <p className="doctor-visit-row-when">{formatVisitWhen(visit)}</p>
        {visit.specialty?.trim() && visit.provider_name?.trim() && (
          <p className="doctor-visit-row-meta">{visit.specialty}</p>
        )}
        {visit.location?.trim() && (
          <p className="doctor-visit-row-meta">{visit.location}</p>
        )}
        {visit.reason?.trim() && (
          <p className="doctor-visit-row-reason">{visit.reason}</p>
        )}
        {visit.notes?.trim() && (
          <p className="doctor-visit-row-notes">{visit.notes}</p>
        )}
        {visit.follow_up_date && (
          <p className="doctor-visit-row-meta">
            Follow-up: {formatDisplayDate(visit.follow_up_date)}
          </p>
        )}
      </div>
      <div className="doctor-visit-row-actions">
        {primaryAction === 'notes' ? (
          <button type="button" className="btn btn-primary btn-sm" onClick={onAddNotes} disabled={busy}>
            Add notes
          </button>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onEdit} disabled={busy}>
            Edit
          </button>
        )}
        {primaryAction === 'edit' && !visit.notes?.trim() && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onAddNotes} disabled={busy}>
            Add notes
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDelete} disabled={busy}>
          Remove
        </button>
      </div>
    </li>
  )
}
