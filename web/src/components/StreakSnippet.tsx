import { Link } from 'react-router-dom'
import type { StreakStats } from '../lib/streaks'

export function StreakSnippet({ stats }: { stats: StreakStats | null }) {
  if (!stats?.hasMedications) return null

  return (
    <p className="streak-snippet">
      {stats.currentStreak > 0 ? (
        <>
          <span className="streak-snippet-count">{stats.currentStreak}</span> day
          streak
          {stats.todayComplete ? ' — today complete' : ' — finish today to continue'}
        </>
      ) : (
        <>Log every dose today to start a streak</>
      )}
      . <Link to="/account">Details</Link>
    </p>
  )
}
