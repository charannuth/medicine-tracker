import {
  getEarnedStreakBadges,
  getNextStreakBadge,
  STREAK_BADGES,
  type StreakBadge,
} from '../lib/streakBadges'

type StreakBadgesProps = {
  longestStreak: number
  compact?: boolean
}

function BadgeIcon({ earned }: { earned: boolean }) {
  return (
    <svg
      className={`streak-badge-icon${earned ? ' earned' : ''}`}
      viewBox="0 0 32 40"
      fill="none"
      aria-hidden
    >
      <path
        className="streak-badge-stem"
        d="M16 38 C16 28 15 22 16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={earned ? 1 : 0.35}
      />
      <g className="streak-badge-bloom" transform="translate(16 14)" opacity={earned ? 1 : 0.25}>
        {[0, 72, 144, 216, 288].map((deg, i) => (
          <g key={deg} transform={`rotate(${deg})`}>
            <ellipse
              className={`streak-badge-petal streak-badge-petal-${i + 1}`}
              cx="0"
              cy="-6"
              rx="5"
              ry="9"
              fill="currentColor"
            />
          </g>
        ))}
        <circle className="streak-badge-center" cx="0" cy="0" r="3" fill="currentColor" />
      </g>
    </svg>
  )
}

function BadgeTile({
  badge,
  earned,
}: {
  badge: StreakBadge
  earned: boolean
}) {
  return (
    <li
      className={`streak-badge-tile${earned ? ' streak-badge-earned' : ' streak-badge-locked'}`}
      title={badge.description}
    >
      <BadgeIcon earned={earned} />
      <span className="streak-badge-days">{badge.minDays}d</span>
      <span className="streak-badge-label">{badge.label}</span>
    </li>
  )
}

export function StreakBadges({ longestStreak, compact = false }: StreakBadgesProps) {
  const earned = getEarnedStreakBadges(longestStreak)
  const earnedIds = new Set(earned.map((b) => b.id))
  const next = getNextStreakBadge(longestStreak)

  if (compact) {
    return (
      <div className="streak-badges streak-badges-compact" aria-label="Streak badges">
        {earned.length === 0 ? (
          <p className="field-hint">Complete a perfect day to earn your first tulip badge.</p>
        ) : (
          <ul className="streak-badge-row">
            {earned.map((badge) => (
              <li key={badge.id} className="streak-badge-chip" title={badge.description}>
                <BadgeIcon earned />
                <span>{badge.minDays}d</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <section className="streak-badges" aria-labelledby="streak-badges-heading">
      <h3 id="streak-badges-heading" className="streak-badges-title">
        Streak badges
      </h3>
      <p className="field-hint streak-badges-hint">
        Earn tulips for consecutive perfect adherence days (all doses logged).
        {next && (
          <>
            {' '}
            Next: <strong>{next.label}</strong> at {next.minDays} days
            {longestStreak > 0 && ` (${next.minDays - longestStreak} to go)`}.
          </>
        )}
      </p>
      <ul className="streak-badge-grid">
        {STREAK_BADGES.map((badge) => (
          <BadgeTile key={badge.id} badge={badge} earned={earnedIds.has(badge.id)} />
        ))}
      </ul>
    </section>
  )
}
