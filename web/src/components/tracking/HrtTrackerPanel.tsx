import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { formatScheduleTime } from '../../lib/dates'
import { formatDoseDisplay } from '../../lib/dose'
import { fetchTrackerDoseEvents, type TrackerDoseEvent } from '../../lib/tracking/doseSync'

export function HrtTrackerPanel() {
  const { user } = useAuth()
  const [events, setEvents] = useState<TrackerDoseEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    fetchTrackerDoseEvents(user.id, 'hrt')
      .then((data) => {
        if (active) setEvents(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load HRT doses')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  return (
    <div className="tracker-panel hrt-tracker-panel">
      <p className="field-hint">
        Doses appear here automatically when you log HRT medications on{' '}
        <Link to="/">Today</Link>. When adding or editing a medication, enable{' '}
        <strong>Sync doses to Tracking → HRT</strong>.
      </p>

      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading HRT log…</p>
      ) : events.length === 0 ? (
        <div className="empty-state empty-state-compact">
          <p>No HRT doses synced yet.</p>
          <Link to="/" className="btn btn-primary">
            Log on Today
          </Link>
        </div>
      ) : (
        <ul className="hrt-dose-list">
          {events.map((event) => (
            <li key={event.id} className="hrt-dose-item">
              <div>
                <strong>{event.medication_name}</strong>
                <span className="hrt-dose-meta">
                  {new Date(`${event.taken_on}T12:00:00`).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {formatScheduleTime(event.schedule_time)}
                </span>
              </div>
              {(event.dose_pills || event.dose_mg) && (
                <span className="hrt-dose-amount">
                  {formatDoseDisplay({
                    dose_pills: event.dose_pills,
                    dose_mg: event.dose_mg,
                  })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
