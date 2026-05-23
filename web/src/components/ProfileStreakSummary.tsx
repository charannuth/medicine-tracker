import type { User } from '@supabase/supabase-js'
import { ProfileAvatar } from './ProfileAvatar'
import { getEarnedStreakBadges } from '../lib/streakBadges'
import type { StreakStats } from '../lib/streaks'

type ProfileStreakSummaryProps = {
  user: User | null | undefined
  displayName: string | undefined
  email: string | undefined
  stats: StreakStats
}

export function ProfileStreakSummary({
  user,
  displayName,
  email,
  stats,
}: ProfileStreakSummaryProps) {
  const earned = getEarnedStreakBadges(stats.longestStreak)
  const showRing = stats.currentStreak > 0 || earned.length > 0

  return (
    <section className="account-card profile-streak-summary">
      <div className="profile-streak-header">
        <div
          className={`profile-avatar-wrap${showRing ? ' profile-avatar-wrap-glow' : ''}`}
        >
          <ProfileAvatar
            user={user}
            displayName={displayName}
            email={email}
            size="lg"
          />
          {stats.currentStreak > 0 && (
            <span className="profile-streak-pill" title="Current streak">
              ×{stats.currentStreak}
            </span>
          )}
        </div>
        <div>
          <h3 className="account-section-title profile-display-name">
            {displayName?.trim() || 'Your profile'}
          </h3>
          <p className="profile-email">{email}</p>
          <p className="profile-streak-line">
            {earned.length === 0
              ? 'No badges yet — finish every dose today for your first tulip.'
              : `${earned.length} badge${earned.length === 1 ? '' : 's'} earned · longest ${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>
    </section>
  )
}
