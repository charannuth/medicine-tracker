import { useEffect, useRef, useState } from 'react'
import {
  markStreakCelebratedToday,
  wasStreakCelebratedToday,
} from '../lib/streakCelebration'
import { isStreakCelebrationMilestone } from '../lib/streakBadges'
import type { StreakStats } from '../lib/streaks'

/** Dev-only: `?previewStreak=7` (or 14, 30, …) replays the milestone modal. */
function devPreviewStreakDays(): number | null {
  if (!import.meta.env.DEV) return null
  const params = new URLSearchParams(window.location.search)
  if (!params.has('previewStreak')) return null
  if (params.get('previewStreak') === '0') return null
  const n = Number(params.get('previewStreak'))
  if (!Number.isFinite(n) || n <= 0) return 7
  return isStreakCelebrationMilestone(n) ? n : null
}

export function useStreakCelebration(
  userId: string | undefined,
  stats: StreakStats | null,
) {
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null)
  const initializedRef = useRef(false)
  const devPreviewShownRef = useRef(false)
  const prevRef = useRef<{
    todayComplete: boolean
    currentStreak: number
  } | null>(null)

  useEffect(() => {
    if (!userId) return

    const previewDays = devPreviewStreakDays()
    if (previewDays !== null) {
      if (!devPreviewShownRef.current) {
        devPreviewShownRef.current = true
        setCelebrationStreak(previewDays)
      }
      return
    }

    if (!stats?.hasMedications) return

    if (!initializedRef.current) {
      initializedRef.current = true
      prevRef.current = {
        todayComplete: stats.todayComplete,
        currentStreak: stats.currentStreak,
      }
      return
    }

    const prev = prevRef.current
    if (!prev) return

    const becameCompleteToday = stats.todayComplete && !prev.todayComplete
    const alreadyCelebrated = wasStreakCelebratedToday(userId)
    const hitMilestone = isStreakCelebrationMilestone(stats.currentStreak)

    if (becameCompleteToday && !alreadyCelebrated && hitMilestone) {
      markStreakCelebratedToday(userId)
      setCelebrationStreak(stats.currentStreak)
    }

    prevRef.current = {
      todayComplete: stats.todayComplete,
      currentStreak: stats.currentStreak,
    }
  }, [userId, stats])

  return {
    celebrationStreak,
    dismissCelebration: () => setCelebrationStreak(null),
  }
}
