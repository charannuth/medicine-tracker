import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { fetchMedProgressSnapshot, type MedProgressSnapshot } from '../../lib/tracking/medProgress'

export function MedProgressPanel() {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<MedProgressSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchMedProgressSnapshot(user.id)
      .then((data) => {
        if (active) setSnapshot(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load progress')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  if (loading) return <p className="loading">Loading medication progress…</p>
  if (error) return <p className="banner banner-error">{error}</p>
  if (!snapshot) return null

  const { dosesTaken, dosesTotal, streak, refillAlerts } = snapshot

  return (
    <div className="tracker-panel med-progress-panel">
      <p className="field-hint">
        Read-only summary from <Link to="/">Today</Link>. Log doses there — this view
        updates automatically.
      </p>

      <div className="med-progress-cards">
        <div className="med-progress-card">
          <span className="med-progress-label">Today&apos;s doses</span>
          <strong className="med-progress-value">
            {dosesTotal === 0
              ? 'No scheduled doses'
              : `${dosesTaken} / ${dosesTotal}`}
          </strong>
        </div>
        {streak && (
          <div className="med-progress-card">
            <span className="med-progress-label">Current streak</span>
            <strong className="med-progress-value">
              {streak.currentStreak} day{streak.currentStreak === 1 ? '' : 's'}
            </strong>
            <Link to="/streaks" className="med-progress-link">
              View streaks →
            </Link>
          </div>
        )}
        {refillAlerts.length > 0 && (
          <div className="med-progress-card med-progress-card-warn">
            <span className="med-progress-label">Refills</span>
            <strong className="med-progress-value">{refillAlerts.length} low</strong>
            <Link to="/account#medications" className="med-progress-link">
              Update supply →
            </Link>
          </div>
        )}
      </div>

      <div className="med-progress-actions">
        <Link to="/" className="btn btn-primary">
          Go to Today
        </Link>
        <Link to="/history" className="btn btn-secondary">
          History
        </Link>
      </div>
    </div>
  )
}
