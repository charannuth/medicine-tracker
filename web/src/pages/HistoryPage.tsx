import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HistoryCalendar } from '../components/HistoryCalendar'
import { useAuth } from '../hooks/useAuth'
import { formatDisplayDate, formatTakenTime } from '../lib/dates'
import {
  fetchDoseHistory,
  HISTORY_CALENDAR_DAYS,
  HISTORY_LIST_DAYS,
  historyStats,
  type HistoryDay,
} from '../lib/history'
import { fetchWeeklySummary, type WeeklySummary } from '../lib/weeklySummary'

export function HistoryPage() {
  const { user } = useAuth()
  const [days, setDays] = useState<HistoryDay[]>([])
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let active = true

    Promise.all([
      fetchDoseHistory(user.id, HISTORY_CALENDAR_DAYS),
      fetchWeeklySummary(user.id),
    ])
      .then(([history, summary]) => {
        if (active) {
          setDays(history)
          setWeekly(summary)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load history')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const stats = historyStats(days)
  const listDays = useMemo(() => {
    if (selectedDate) {
      const day = days.find((d) => d.date === selectedDate)
      return day ? [day] : []
    }
    return days.slice(0, HISTORY_LIST_DAYS)
  }, [days, selectedDate])

  return (
    <main className="page">
      <header className="page-header">
        <h2>History</h2>
        <p className="page-subtitle">
          {selectedDate
            ? formatDisplayDate(selectedDate)
            : `Last ${HISTORY_LIST_DAYS} days · ${HISTORY_CALENDAR_DAYS}-day calendar`}
        </p>
      </header>

      {!loading && !error && weekly && weekly.expected > 0 && (
        <div className="weekly-summary">
          <strong>This week:</strong> {weekly.taken} of {weekly.expected} doses (
          {weekly.percent}%)
        </div>
      )}

      {!loading && !error && (
        <HistoryCalendar
          days={days}
          selectedDate={selectedDate}
          onSelectDate={(date) =>
            setSelectedDate((prev) => (prev === date ? null : date))
          }
        />
      )}

      {!loading && !error && selectedDate && (
        <button
          type="button"
          className="btn btn-ghost calendar-clear"
          onClick={() => setSelectedDate(null)}
        >
          Show all recent days
        </button>
      )}

      {!loading && !error && (
        <div className="history-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.totalDoses}</span>
            <span className="stat-label">Doses logged ({stats.dayCount} days)</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.daysWithDoses}</span>
            <span className="stat-label">Days with at least one dose</span>
          </div>
        </div>
      )}

      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading history…</p>
      ) : stats.totalDoses === 0 ? (
        <div className="empty-state">
          <p>No doses logged yet in the last {HISTORY_CALENDAR_DAYS} days.</p>
          <Link to="/" className="btn btn-primary">
            Go to Today
          </Link>
        </div>
      ) : (
        <ul className="history-list">
          {listDays.map((day) => (
            <li key={day.date} className="history-day">
              <div className="history-day-header">
                <h3>{day.label}</h3>
                <span className="history-day-meta">
                  {day.entries.length === 0
                    ? 'No doses'
                    : `${day.entries.length} dose${day.entries.length === 1 ? '' : 's'}`}
                </span>
              </div>
              {day.entries.length > 0 && (
                <ul className="history-entries">
                  {day.entries.map((entry) => (
                    <li key={`${day.date}-${entry.medicationId}-${entry.takenAt}`}>
                      <span className="history-entry-name">{entry.medicationName}</span>
                      <span className="history-entry-detail">
                        {entry.doseLabel}
                        {entry.doseLabel ? ' · ' : ''}
                        {entry.scheduleLabel}
                        {' · '}
                        {formatTakenTime(entry.takenAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
