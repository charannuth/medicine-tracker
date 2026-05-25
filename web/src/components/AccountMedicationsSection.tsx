import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formatScheduleTime } from '../lib/dates'
import { formatDoseDisplay } from '../lib/dose'
import { formatInventoryRemaining } from '../lib/inventory'
import {
  formatMedicationDateRange,
  scheduleStatusLabel,
} from '../lib/medicationDates'
import { scheduleTypeLabel } from '../lib/medicationSchedule'
import {
  createMedication,
  deleteMedication,
  fetchMedicationsWithStatus,
  migrateMedicationToAsNeeded,
  migrateMedicationToScheduled,
  repairMedicationSchedule,
  updateMedication,
} from '../lib/medications'
import { isAsNeededMed } from '../lib/medicationSchedule'
import type { Medication, MedicationInput, MedicationWithStatus } from '../lib/types'
import { MedicationForm } from './MedicationForm'

export function AccountMedicationsSection() {
  const { user } = useAuth()
  const [medications, setMedications] = useState<MedicationWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Medication | null>(null)
  const [busyMedId, setBusyMedId] = useState<string | null>(null)

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

  async function handleMoveToAsNeeded(med: MedicationWithStatus) {
    if (
      !confirm(
        `Move ${med.name} to as needed?\n\nFixed dose times will be removed. Doses already logged today are kept.`,
      )
    ) {
      return
    }
    setBusyMedId(`${med.id}-prn`)
    setError(null)
    try {
      await migrateMedicationToAsNeeded(med.id)
      await reload()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not move medication to as needed',
      )
    } finally {
      setBusyMedId(null)
    }
  }

  async function handleMoveToDailySchedule(med: MedicationWithStatus) {
    if (
      !confirm(
        `Move ${med.name} to a daily schedule?\n\nA default morning dose time (8:00 AM) will be added. Edit the medication to change or add times.`,
      )
    ) {
      return
    }
    setBusyMedId(`${med.id}-daily`)
    setError(null)
    try {
      await migrateMedicationToScheduled(med.id)
      await reload()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not move medication to daily schedule',
      )
    } finally {
      setBusyMedId(null)
    }
  }

  return (
    <section className="account-card" id="medications">
      <div className="account-section-header">
        <h3 className="account-section-title">Medications</h3>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          Add
        </button>
      </div>
      <p className="field-hint">
        Manage your list here. Log daily doses on <Link to="/">Today</Link>.
      </p>

      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading medications…</p>
      ) : medications.length === 0 ? (
        <p className="field-hint">No medications yet.</p>
      ) : (
        <ul className="med-manage-list">
          {medications.map((med) => (
            <li
              key={med.id}
              className={`med-manage-item med-manage-${med.scheduleStatus}`}
            >
              <div>
                <div className="med-manage-title-row">
                  <h4>{med.name}</h4>
                  {med.scheduleStatus !== 'active' && (
                    <span className={`badge badge-${med.scheduleStatus}`}>
                      {scheduleStatusLabel(med.scheduleStatus)}
                    </span>
                  )}
                </div>
                <p className="med-dosage">
                  {formatDoseDisplay(med)} · {scheduleTypeLabel(med.schedule_type)}
                  {med.tracking_sync === 'hrt' ? ' · HRT sync' : ''}
                </p>
                <p className="med-date-range">{formatMedicationDateRange(med)}</p>
                {med.schedule_times.length > 0 && (
                  <p className="med-times">
                    {med.schedule_times.map(formatScheduleTime).join(' · ')}
                  </p>
                )}
                {med.pills_remaining != null && (
                  <p className="med-pills">
                    {formatInventoryRemaining(med.pills_remaining, med)}
                  </p>
                )}
              </div>
              <div className="med-manage-actions">
                {!isAsNeededMed(med) ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyMedId === `${med.id}-prn`}
                    onClick={() => void handleMoveToAsNeeded(med)}
                  >
                    {busyMedId === `${med.id}-prn` ? '…' : 'As needed'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={busyMedId === `${med.id}-daily`}
                    onClick={() => void handleMoveToDailySchedule(med)}
                  >
                    {busyMedId === `${med.id}-daily` ? '…' : 'Daily'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEditing(med)
                    setFormOpen(true)
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm danger"
                  onClick={() => void handleDelete(med)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <MedicationForm
          key={editing ? `${editing.id}-${editing.updated_at}` : 'new'}
          initial={editing}
          existingMedicationNames={medications.map((m) => m.name)}
          onCancel={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </section>
  )
}
