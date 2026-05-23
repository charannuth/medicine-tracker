import { Link } from 'react-router-dom'
import { AccountSettings } from '../components/AccountSettings'
import { ProfileStreakSummary } from '../components/ProfileStreakSummary'
import { StreakBadges } from '../components/StreakBadges'
import { useAuth } from '../hooks/useAuth'
import { useStreakStats } from '../hooks/useStreakStats'
import { STREAK_CALENDAR_DAYS } from '../lib/streaks'

export function AccountPage() {
  const { user, signOut } = useAuth()
  const { stats: streakStats, loading: streakLoading, error: streakError } =
    useStreakStats(user?.id)

  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <main className="page account-page">
      <header className="page-header">
        <h2>My account</h2>
        <p className="page-subtitle">Profile, badges, and sign-in</p>
      </header>

      {streakError && <p className="banner banner-error">{streakError}</p>}

      {!streakLoading && streakStats && (
        <>
          <ProfileStreakSummary
            user={user}
            displayName={user?.user_metadata?.display_name as string | undefined}
            email={user?.email}
            stats={streakStats}
          />
          <StreakBadges longestStreak={streakStats.longestStreak} compact />

          <div className="account-streaks-links">
            <Link to="/streaks" className="account-streaks-teaser">
              <span className="account-streaks-teaser-label">Streaks</span>
              <span className="account-streaks-teaser-text">
                Current{' '}
                <strong>
                  {streakStats.currentStreak} day{streakStats.currentStreak === 1 ? '' : 's'}
                </strong>
                · badge milestones →
              </span>
            </Link>
            <Link to="/history" className="account-streaks-teaser">
              <span className="account-streaks-teaser-label">History</span>
              <span className="account-streaks-teaser-text">
                {STREAK_CALENDAR_DAYS}-day calendar · doses &amp; notes →
              </span>
            </Link>
          </div>
        </>
      )}

      <AccountSettings />

      <section className="account-card">
        <h3 className="account-section-title">Sign-in</h3>
        <dl className="account-details">
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          {created && (
            <div>
              <dt>Account created</dt>
              <dd>{created}</dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          className="btn btn-secondary account-sign-out"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </section>

      <p className="account-note">
        <Link to="/">Go to Today</Link> to log doses and grow your streak.
      </p>
    </main>
  )
}
