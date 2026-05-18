import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatScheduleTime } from '../lib/dates'
import { formatDoseDisplay } from '../lib/dose'
import {
  formatMedicationDateRange,
  scheduleStatusLabel,
} from '../lib/medicationDates'
import {
  createMedication,
  deleteMedication,
  fetchMedicationsWithStatus,
  repairMedicationSchedule,
  updateMedication,
} from '../lib/medications'
import type { Medication, MedicationInput, MedicationWithStatus } from '../lib/types'
import { MedicationForm } from '../components/MedicationForm'

export function MedicationsPage() {
  const { user } = useAuth()
  const [medications, setMedications] = useState<MedicationWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Medication | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    const data = await fetchMedicationsWithStatus(user.id, {
      includeInactive: true,
    })
    setMedications(data)
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true

    fetchMedicationsWithStatus(user.id, { includeInactive: true })
      .then((data) => {
        if (active) setMedications(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : 'Failed to load medications',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  async function handleSave(input: MedicationInput) {
    if (!user) return
    if (editing) {
      await updateMedication(editing.id, input)
      await repairMedicationSchedule(editing.id)
    } else {
      await createMedication(user.id, input)
    }
    setFormOpen(false)
    setEditing(null)
    await reload()
  }

  async function handleDelete(med: MedicationWithStatus) {
    if (!confirm(`Delete ${med.name}? This cannot be undone.`)) return
    try {
      await deleteMedication(med.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    }
  }

  return (
    <>
      <main className="page">
        <header className="page-header page-header-row">
          <div>
            <h2>All medications</h2>
            <p className="page-subtitle">Manage your medication list</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Add medication
          </button>
        </header>

        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="loading">Loading…</p>
        ) : medications.length === 0 ? (
          <div className="empty-state">
            <p>No medications yet.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setFormOpen(true)}
            >
              Add medication
            </button>
          </div>
        ) : (
          <ul className="med-manage-list">
            {medications.map((med) => (
              <li
                key={med.id}
                className={`med-manage-item med-manage-${med.scheduleStatus}`}
              >
                <div>
                  <div className="med-manage-title-row">
                    <h3>{med.name}</h3>
                    {med.scheduleStatus !== 'active' && (
                      <span className={`badge badge-${med.scheduleStatus}`}>
                        {scheduleStatusLabel(med.scheduleStatus)}
                      </span>
                    )}
                  </div>
                  <p className="med-dosage">{formatDoseDisplay(med)}</p>
                  <p className="med-date-range">{formatMedicationDateRange(med)}</p>
                  <p className="med-times">
                    {med.schedule_times.map(formatScheduleTime).join(' · ')}
                  </p>
                  {med.pills_remaining != null && (
                    <p className="med-pills">{med.pills_remaining} pills remaining</p>
                  )}
                </div>
                <div className="med-manage-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditing(med)
                      setFormOpen(true)
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost danger"
                    onClick={() => void handleDelete(med)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="page-footer-hint">
          To log today&apos;s doses, go to{' '}
          <Link to="/">Today</Link>.
        </p>
      </main>

      {formOpen && (
        <MedicationForm
          key={
            editing
              ? `${editing.id}-${editing.updated_at}`
              : 'new'
          }
          initial={editing}
          existingMedicationNames={medications.map((m) => m.name)}
          onCancel={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </>
  )
}
