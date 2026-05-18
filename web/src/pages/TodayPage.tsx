import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import type { LayoutOutletContext } from '../components/AppLayout'
import { useAuth } from '../hooks/useAuth'
import {
  createMedication,
  deleteMedication,
  fetchMedicationsWithStatus,
  markDoseTaken,
  todayDoseTotals,
  undoDose,
  repairMedicationSchedule,
  updateMedication,
} from '../lib/medications'
import type {
  DoseSlotStatus,
  Medication,
  MedicationInput,
  MedicationWithStatus,
} from '../lib/types'
import { InteractionAlert } from '../components/InteractionAlert'
import { MedicationCard } from '../components/MedicationCard'
import { MedicationForm } from '../components/MedicationForm'
import { MissedDosesBanner } from '../components/MissedDosesBanner'
import { RefillBanner } from '../components/RefillBanner'
import { StreakSnippet } from '../components/StreakSnippet'
import { fetchMissedDoses, type MissedDoseItem } from '../lib/missedDoses'
import {
  dismissMissedDosesBanner,
  isMissedDosesBannerDismissed,
} from '../lib/settings'
import { todayLocalDate } from '../lib/dates'
import { getRefillAlerts } from '../lib/refills'
import { fetchStreakStats, type StreakStats } from '../lib/streaks'

export function TodayPage() {
  const { registerAddHandler } = useOutletContext<LayoutOutletContext>()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const openAddFromNav = Boolean(
    (location.state as { openAdd?: boolean } | null)?.openAdd,
  )
  const [medications, setMedications] = useState<MedicationWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busySlot, setBusySlot] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(openAddFromNav)
  const [editing, setEditing] = useState<Medication | null>(null)
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null)
  const [missedDoses, setMissedDoses] = useState<MissedDoseItem[]>([])
  const [missedBannerDismissed, setMissedBannerDismissed] = useState(() =>
    isMissedDosesBannerDismissed(todayLocalDate()),
  )

  const openAddForm = useCallback(() => {
    setEditing(null)
    setFormOpen(true)
  }, [])

  useEffect(() => {
    registerAddHandler(openAddForm)
    return () => registerAddHandler(null)
  }, [registerAddHandler, openAddForm])

  useEffect(() => {
    if (!openAddFromNav) return
    queueMicrotask(() => {
      setEditing(null)
      setFormOpen(true)
      navigate('.', { replace: true, state: {} })
    })
  }, [openAddFromNav, navigate])

  const reload = useCallback(async () => {
    if (!user) return
    const data = await fetchMedicationsWithStatus(user.id)
    setMedications(data)
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true

    fetchMedicationsWithStatus(user.id)
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

  useEffect(() => {
    if (!user || loading) return

    let active = true

    Promise.all([fetchStreakStats(user.id), fetchMissedDoses(user.id)])
      .then(([streak, missed]) => {
        if (active) {
          setStreakStats(streak)
          setMissedDoses(missed)
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [user, loading, medications])

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
    setError(null)
    try {
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh list')
    }
  }

  async function handleMarkTaken(med: MedicationWithStatus, scheduleTime: string) {
    if (!user) return
    const key = `${med.id}-${scheduleTime}`
    setBusySlot(key)
    setError(null)
    try {
      await markDoseTaken(user.id, med.id, scheduleTime)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log dose')
    } finally {
      setBusySlot(null)
    }
  }

  async function handleUndo(med: MedicationWithStatus, slot: DoseSlotStatus) {
    if (!slot.doseLogId) return
    const key = `${med.id}-${slot.time}`
    setBusySlot(key)
    setError(null)
    try {
      await undoDose(slot.doseLogId, med.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not undo dose')
    } finally {
      setBusySlot(null)
    }
  }

  async function handleDelete(med: MedicationWithStatus) {
    if (!confirm(`Delete ${med.name}? This cannot be undone.`)) return
    setBusySlot(med.id)
    try {
      await deleteMedication(med.id)
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete')
    } finally {
      setBusySlot(null)
    }
  }

  const { taken: dosesTaken, total: dosesTotal } = todayDoseTotals(medications)
  const refillAlerts = getRefillAlerts(medications)

  return (
    <>
      <main className="page dashboard">
        <section className="today-summary">
          <h2>Today</h2>
          <p>
            {dosesTotal === 0
              ? 'No dose times scheduled'
              : `${dosesTaken} of ${dosesTotal} dose${dosesTotal === 1 ? '' : 's'} taken`}
          </p>
          <StreakSnippet stats={streakStats} />
        </section>

        <RefillBanner alerts={refillAlerts} />
        {!missedBannerDismissed && (
          <MissedDosesBanner
            items={missedDoses}
            onDismiss={() => {
              dismissMissedDosesBanner(todayLocalDate())
              setMissedBannerDismissed(true)
            }}
          />
        )}
        <InteractionAlert medicationNames={medications.map((m) => m.name)} />

        {error && <p className="banner banner-error">{error}</p>}

        {loading ? (
          <p className="loading">Loading medications…</p>
        ) : medications.length === 0 ? (
          <div className="empty-state">
            <p>No medications yet.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddForm}
            >
              Add your first medication
            </button>
          </div>
        ) : (
          <ul className="med-list">
            {medications.map((med) => (
              <li key={med.id}>
                <MedicationCard
                  medication={med}
                  busySlot={busySlot}
                  onMarkTaken={(time) => handleMarkTaken(med, time)}
                  onUndo={(slot) => handleUndo(med, slot)}
                  onEdit={() => {
                    setEditing(med)
                    setFormOpen(true)
                  }}
                  onDelete={() => handleDelete(med)}
                />
              </li>
            ))}
          </ul>
        )}
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
