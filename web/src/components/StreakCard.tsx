import { streakMessage, type StreakStats } from '../lib/streaks'

type StreakCardProps = {
  stats: StreakStats
  loading?: boolean
}

export function StreakCard({ stats, loading }: StreakCardProps) {
  if (loading) {
    return (
      <section className="streak-card">
        <p className="loading">Loading streak…</p>
      </section>
    )
  }

  return (
    <section className="streak-card" aria-labelledby="streak-heading">
      <header className="streak-header">
        <h3 id="streak-heading">Adherence streak</h3>
        <p className="streak-subtitle">
          A perfect day means every scheduled dose was logged.
        </p>
      </header>

      <div className="streak-stats-row">
        <div className="streak-stat streak-stat-primary">
          <span className="streak-stat-value">{stats.currentStreak}</span>
          <span className="streak-stat-label">Current streak</span>
          <span className="streak-stat-unit">
            {stats.currentStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="streak-stat">
          <span className="streak-stat-value">{stats.longestStreak}</span>
          <span className="streak-stat-label">Longest streak</span>
          <span className="streak-stat-unit">
            {stats.longestStreak === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {stats.hasMedications && (
        <p className="streak-today-progress">
          Today: {stats.todayTaken} of {stats.todayExpected} doses logged
          {stats.todayComplete && (
            <span className="streak-today-done"> · Complete</span>
          )}
        </p>
      )}

      <div className="streak-week" aria-label="Last 7 days">
        {stats.last7Days.map((day) => (
          <div
            key={day.date}
            className={`streak-day ${day.perfect ? 'streak-day-perfect' : ''}`}
            title={day.perfect ? 'Perfect day' : 'Incomplete'}
          >
            <span className="streak-day-bar" />
          </div>
        ))}
      </div>
      <p className="streak-week-labels">
        <span>7 days ago</span>
        <span>Today</span>
      </p>

      <p className="streak-message">{streakMessage(stats)}</p>
    </section>
  )
}
