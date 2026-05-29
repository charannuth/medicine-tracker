import { Link } from 'react-router-dom'
import { StreakBadgeIcon } from './StreakBadgeIcon'
import { getActiveStreakBadge } from '../lib/streakBadges'
import type { StreakStats } from '../lib/streaks'

export function StreakSnippet({ stats }: { stats: StreakStats | null }) {
  if (!stats?.hasMedications) return null

  const activeBadge =
    stats.currentStreak > 0 ? getActiveStreakBadge(stats.currentStreak) : null

  return (
    <p className="streak-snippet">
      {activeBadge && (
        <span
          className="streak-snippet-badge streak-badge-earned"
          title={activeBadge.description}
        >
          <StreakBadgeIcon earned minDays={activeBadge.minDays} />
        </span>
      )}
      {stats.currentStreak > 0 ? (
        <>
          <span className="streak-snippet-count">{stats.currentStreak}</span> day
          streak
          {stats.todayComplete ? ' — today complete' : ' — finish today to continue'}
          {activeBadge && (
            <span className="streak-snippet-tier"> · {activeBadge.label}</span>
          )}
        </>
      ) : (
        <>Log every dose today to start a streak</>
      )}
      . <Link to="/streaks">Details</Link>
    </p>
  )
}
