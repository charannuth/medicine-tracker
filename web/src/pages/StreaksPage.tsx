import { Link } from 'react-router-dom'
import { StreakBadges } from '../components/StreakBadges'
import { StreakCard } from '../components/StreakCard'
import { useAuth } from '../hooks/useAuth'
import { useStreakStats } from '../hooks/useStreakStats'
import type { StreakStats } from '../lib/streaks'

export function StreaksPage() {
  const { user } = useAuth()
  const { stats, loading, error } = useStreakStats(user?.id)

  return (
    <main className="page streaks-page">
      <header className="page-header">
        <h2>Streaks</h2>
        <p className="page-subtitle">
          Current streak, tulip badges, and what it takes to earn each one
        </p>
      </header>

      {error && <p className="banner banner-error">{error}</p>}

      <StreakCard stats={stats ?? emptyStats()} loading={loading} />

      {!loading && stats && (
        <StreakBadges longestStreak={stats.longestStreak} catalog />
      )}

      {!loading && stats && !stats.hasMedications && (
        <div className="empty-state">
          <p>Add medications with dose times on Today to start tracking streaks.</p>
          <Link to="/" className="btn btn-primary">
            Go to Today
          </Link>
        </div>
      )}

      <p className="page-footer-hint">
        Tap days on{' '}
        <Link to="/history">History</Link> to see doses logged, missed slots, and wellness
        notes.
      </p>
    </main>
  )
}

function emptyStats(): StreakStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    todayTaken: 0,
    todayExpected: 0,
    todayComplete: false,
    hasMedications: false,
    last7Days: [],
    consistencyCalendar: [],
  }
}
