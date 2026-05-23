import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AccountSettings } from '../components/AccountSettings'
import { ProfileStreakSummary } from '../components/ProfileStreakSummary'
import { StreakBadges } from '../components/StreakBadges'
import { StreakCard } from '../components/StreakCard'
import { useAuth } from '../hooks/useAuth'
import { fetchStreakStats, type StreakStats } from '../lib/streaks'

export function AccountPage() {
  const { user, signOut } = useAuth()
  const [streakStats, setStreakStats] = useState<StreakStats | null>(null)
  const [streakLoading, setStreakLoading] = useState(true)
  const [streakError, setStreakError] = useState<string | null>(null)

  const created = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  useEffect(() => {
    if (!user) return

    let active = true

    fetchStreakStats(user.id)
      .then((data) => {
        if (active) setStreakStats(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setStreakError(
            err instanceof Error ? err.message : 'Failed to load streak',
          )
        }
      })
      .finally(() => {
        if (active) setStreakLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  return (
    <main className="page account-page">
      <header className="page-header">
        <h2>My account</h2>
        <p className="page-subtitle">Streaks, settings, and sign-in</p>
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
          <StreakBadges longestStreak={streakStats.longestStreak} />
        </>
      )}

      <StreakCard stats={streakStats ?? defaultStreakStats()} loading={streakLoading} />

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

function defaultStreakStats(): StreakStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    todayTaken: 0,
    todayExpected: 0,
    todayComplete: false,
    hasMedications: false,
    last7Days: [],
  }
}
