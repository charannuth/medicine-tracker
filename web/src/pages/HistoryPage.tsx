import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DayAdherenceDetail } from '../components/DayAdherenceDetail'
import { StreakConsistencyCalendar } from '../components/StreakConsistencyCalendar'
import { useAuth } from '../hooks/useAuth'
import { useDayDetail } from '../hooks/useDayDetail'
import { useStreakStats } from '../hooks/useStreakStats'
import { formatDisplayDate } from '../lib/dates'
import { fetchDoseHistory, historyStats, type HistoryDay } from '../lib/history'
import { STREAK_CALENDAR_DAYS } from '../lib/streaks'
import { fetchWeeklySummary, type WeeklySummary } from '../lib/weeklySummary'

export function HistoryPage() {
  const { user } = useAuth()
  const location = useLocation()
  const [days, setDays] = useState<HistoryDay[]>([])
  const [weekly, setWeekly] = useState<WeeklySummary | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const d = (location.state as { historyDate?: string } | null)?.historyDate
    return d ?? null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { stats: streakStats, loading: streakLoading } = useStreakStats(user?.id)
  const {
    detail: dayDetail,
    loading: dayLoading,
    error: dayError,
  } = useDayDetail(user?.id, selectedDate)

  const selectedStreakStatus = useMemo(() => {
    if (!selectedDate || !streakStats) return undefined
    return streakStats.consistencyCalendar.find((d) => d.date === selectedDate)?.status
  }, [selectedDate, streakStats])

  useEffect(() => {
    if (!user) return

    let active = true

    Promise.all([
      fetchDoseHistory(user.id, STREAK_CALENDAR_DAYS),
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
  const showCalendar = !loading && !error && !streakLoading && streakStats

  return (
    <main className="page history-page">
      <header className="page-header">
        <h2>History</h2>
        <p className="page-subtitle">
          {selectedDate
            ? formatDisplayDate(selectedDate)
            : `${STREAK_CALENDAR_DAYS}-day calendar · tap a day for doses and notes`}
        </p>
      </header>

      {!loading && !error && weekly && (
        (weekly.scheduledExpected > 0 || weekly.prnTaken > 0) && (
          <div className="weekly-summary">
            <p className="weekly-summary-title">This week</p>
            <div className="weekly-summary-rows">
              {weekly.scheduledExpected > 0 && (
                <p>
                  <strong>Daily schedule:</strong>{' '}
                  {weekly.scheduledTaken} of {weekly.scheduledExpected} doses (
                  {weekly.scheduledPercent}%)
                </p>
              )}
              {weekly.prnTaken > 0 && (
                <p>
                  <strong>As needed:</strong>{' '}
                  {weekly.prnTaken}
                  {weekly.prnCap > 0 ? (
                    <> of {weekly.prnCap} max doses</>
                  ) : (
                    <> dose{weekly.prnTaken === 1 ? '' : 's'} logged</>
                  )}
                </p>
              )}
            </div>
          </div>
        )
      )}

      {showCalendar && (
        <StreakConsistencyCalendar
          days={streakStats.consistencyCalendar}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {showCalendar && selectedDate && (
        <DayAdherenceDetail
          detail={dayDetail}
          loading={dayLoading}
          error={dayError}
          streakStatus={selectedStreakStatus}
          showHistoryLink={false}
          onClear={() => setSelectedDate(null)}
        />
      )}

      {!loading && !error && !selectedDate && (
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

      {loading || streakLoading ? (
        <p className="loading">Loading history…</p>
      ) : stats.totalDoses === 0 && !streakStats?.hasMedications && !selectedDate ? (
        <div className="empty-state">
          <p>No doses logged yet in the last {STREAK_CALENDAR_DAYS} days.</p>
          <Link to="/" className="btn btn-primary">
            Go to Today
          </Link>
        </div>
      ) : null}

      <p className="page-footer-hint">
        Tulip badges and streak milestones are on{' '}
        <Link to="/streaks">Streaks</Link>.
      </p>
    </main>
  )
}
