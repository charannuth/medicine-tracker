import { useEffect, useState } from 'react'
import { fetchStreakStats, type StreakStats } from '../lib/streaks'

export function useStreakStats(userId: string | undefined) {
  const [stats, setStats] = useState<StreakStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setStats(null)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    fetchStreakStats(userId)
      .then((data) => {
        if (active) setStats(data)
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load streaks')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  return { stats, loading, error }
}
