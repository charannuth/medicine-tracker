import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MedicalRecordsForm } from '../components/MedicalRecordsForm'
import { useAuth } from '../hooks/useAuth'
import type { BodyMetricUnit } from '../lib/bodyMetrics'
import {
  emptyMedicalRecordInput,
  fetchMedicalRecord,
  isMedicalRecordFilled,
  recordToInput,
  updateBodyMetricUnits,
  upsertMedicalRecord,
  type MedicalRecordInput,
} from '../lib/medicalRecords'

export function MedicalRecordsPage() {
  const { user } = useAuth()
  const [draft, setDraft] = useState<MedicalRecordInput>(emptyMedicalRecordInput())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let active = true

    fetchMedicalRecord(user.id)
      .then((record) => {
        if (active) setDraft(recordToInput(record))
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load medical record')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  async function handleHeightUnitChange(unit: BodyMetricUnit) {
    setDraft((d) => ({ ...d, height_unit: unit }))
    if (!user) return
    try {
      const saved = await updateBodyMetricUnits(user.id, { height_unit: unit })
      setDraft(recordToInput(saved))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save unit preference')
    }
  }

  async function handleWeightUnitChange(unit: BodyMetricUnit) {
    setDraft((d) => ({ ...d, weight_unit: unit }))
    if (!user) return
    try {
      const saved = await updateBodyMetricUnits(user.id, { weight_unit: unit })
      setDraft(recordToInput(saved))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save unit preference')
    }
  }

  async function handleSave() {
    if (!user) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await upsertMedicalRecord(user.id, draft)
      setMessage('Medical record saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save medical record')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page medical-records-page">
      <header className="page-header">
        <h2>Medical records</h2>
        <p className="page-subtitle">
          Self-reported history — allergies, conditions, and optional profile basics
        </p>
      </header>

      {error && <p className="banner banner-error">{error}</p>}
      {message && <p className="banner banner-success-style">{message}</p>}

      {loading ? (
        <p className="loading">Loading medical record…</p>
      ) : (
        <>
          {!isMedicalRecordFilled(draft) && (
            <p className="field-hint medical-records-empty-hint">
              Add your allergies so we can flag possible matches when you add medications
              on <Link to="/">Today</Link> or run a{' '}
              <Link to="/interactions">drug safety check</Link>.
            </p>
          )}
          <MedicalRecordsForm
            value={draft}
            onChange={setDraft}
            onHeightUnitChange={(unit) => void handleHeightUnitChange(unit)}
            onWeightUnitChange={(unit) => void handleWeightUnitChange(unit)}
            onSubmit={() => void handleSave()}
            busy={busy}
          />
        </>
      )}
    </main>
  )
}
