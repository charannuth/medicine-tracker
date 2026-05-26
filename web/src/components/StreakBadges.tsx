import {
  getEarnedStreakBadges,
  getNextStreakBadge,
  STREAK_BADGES,
  type StreakBadge,
} from '../lib/streakBadges'

type StreakBadgesProps = {
  longestStreak: number
  compact?: boolean
  /** Full badge catalog with unlock requirements (Streaks page). */
  catalog?: boolean
}

function bouquetColorsForMinDays(minDays: number): string[] {
  // 1/3-day keep the single purple tulip. Starting at 7 days, shift into
  // an assorted bouquet that grows with each milestone.
  if (minDays < 7) return ['#7c3aed']
  if (minDays < 14) return ['#f8fafc', '#facc15'] // white + yellow
  if (minDays < 30) return ['#f8fafc', '#facc15', '#fb923c'] // + orange
  if (minDays < 60) return ['#f8fafc', '#facc15', '#fb923c', '#f472b6'] // + pink
  if (minDays < 100) return ['#f8fafc', '#facc15', '#fb923c', '#f472b6', '#a855f7'] // + purple
  return ['#f8fafc', '#facc15', '#fb923c', '#f472b6', '#a855f7', '#ef4444'] // + red
}

function Tulip({
  x,
  color,
  opacity,
}: {
  x: number
  color: string
  opacity: number
}) {
  return (
    <g transform={`translate(${x} 0)`} opacity={opacity}>
      {/* stem */}
      <path
        d="M16 38 C16 30 15.5 24 16 18"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.95}
      />
      {/* leaves */}
      <path
        d="M16 30 C10 28 9 24 11 22 C13 20 16 22 16 25"
        fill="#22c55e"
        opacity={0.85}
      />
      <path
        d="M16 29 C22 27 23 23 21 21 C19 19 16 21 16 24"
        fill="#16a34a"
        opacity={0.75}
      />
      {/* bloom */}
      <g transform="translate(16 14)">
        <ellipse cx="-3.2" cy="-2.5" rx="4.2" ry="6.7" fill={color} />
        <ellipse cx="3.2" cy="-2.5" rx="4.2" ry="6.7" fill={color} />
        <ellipse cx="0" cy="-4.2" rx="4.9" ry="7.8" fill={color} />
        <circle cx="0" cy="0.5" r="2.3" fill="rgba(255,255,255,0.35)" />
      </g>
    </g>
  )
}

function BadgeIcon({ earned, minDays }: { earned: boolean; minDays: number }) {
  const colors = bouquetColorsForMinDays(minDays)
  const baseOpacity = earned ? 1 : 0.25

  return (
    <svg
      className={`streak-badge-icon${earned ? ' earned' : ''}`}
      viewBox="0 0 32 40"
      fill="none"
      aria-hidden
    >
      {colors.length === 1 ? (
        <Tulip x={0} color={colors[0]} opacity={baseOpacity} />
      ) : (
        <g>
          {colors.slice(0, 6).map((c, idx) => {
            // Spread across the 32px width, with slight depth layering.
            const offsets = [-8, 8, -4, 4, -12, 12]
            const x = offsets[idx] ?? 0
            const depth = idx === 0 || idx === 1 ? 1 : 0.92
            return <Tulip key={`${c}-${idx}`} x={x} color={c} opacity={baseOpacity * depth} />
          })}
        </g>
      )}
    </svg>
  )
}

function BadgeTile({
  badge,
  earned,
  catalog,
}: {
  badge: StreakBadge
  earned: boolean
  catalog?: boolean
}) {
  const dayLabel =
    badge.minDays === 1 ? '1 day' : `${badge.minDays} days`

  return (
    <li
      className={`streak-badge-tile${earned ? ' streak-badge-earned' : ' streak-badge-locked'}${catalog ? ' streak-badge-tile-catalog' : ''}`}
      title={badge.description}
    >
      <BadgeIcon earned={earned} minDays={badge.minDays} />
      {catalog ? (
        <>
          <span className="streak-badge-label">{badge.label}</span>
          <span className="streak-badge-requirement">
            {earned ? 'Unlocked' : `Unlock at ${dayLabel}`}
          </span>
          <span className="streak-badge-desc">{badge.description}</span>
        </>
      ) : (
        <>
          <span className="streak-badge-days">{badge.minDays}d</span>
          <span className="streak-badge-label">{badge.label}</span>
        </>
      )}
    </li>
  )
}

export function StreakBadges({
  longestStreak,
  compact = false,
  catalog = false,
}: StreakBadgesProps) {
  const earned = getEarnedStreakBadges(longestStreak)
  const earnedIds = new Set(earned.map((b) => b.id))
  const next = getNextStreakBadge(longestStreak)

  if (catalog) {
    return (
      <section className="streak-badges streak-badges-catalog" aria-labelledby="streak-badges-heading">
        <h3 id="streak-badges-heading" className="streak-badges-title">
          Tulip badges
        </h3>
        <p className="field-hint streak-badges-hint">
          Each badge unlocks when your <strong>longest streak</strong> reaches consecutive
          perfect days (every scheduled dose logged).
          {next && (
            <>
              {' '}
              Next up: <strong>{next.label}</strong> at {next.minDays} day
              {next.minDays === 1 ? '' : 's'}
              {longestStreak > 0 && ` (${next.minDays - longestStreak} to go)`}.
            </>
          )}
        </p>
        <ul className="streak-badge-grid streak-badge-grid-catalog">
          {STREAK_BADGES.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              earned={earnedIds.has(badge.id)}
              catalog
            />
          ))}
        </ul>
      </section>
    )
  }

  if (compact) {
    return (
      <div className="streak-badges streak-badges-compact" aria-label="Streak badges">
        {earned.length === 0 ? (
          <p className="field-hint">Complete a perfect day to earn your first tulip badge.</p>
        ) : (
          <ul className="streak-badge-row">
            {earned.map((badge) => (
              <li key={badge.id} className="streak-badge-chip" title={badge.description}>
                <BadgeIcon earned minDays={badge.minDays} />
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
