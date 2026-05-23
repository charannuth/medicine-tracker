import { useEffect, useRef, useState } from 'react'
import {
  markStreakCelebratedToday,
  wasStreakCelebratedToday,
} from '../lib/streakCelebration'
import type { StreakStats } from '../lib/streaks'

export function useStreakCelebration(
  userId: string | undefined,
  stats: StreakStats | null,
) {
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null)
  const initializedRef = useRef(false)
  const prevRef = useRef<{
    todayComplete: boolean
    currentStreak: number
  } | null>(null)

  useEffect(() => {
    if (!userId || !stats?.hasMedications) return

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

    if (becameCompleteToday && !alreadyCelebrated) {
      const streak = Math.max(1, stats.currentStreak)
      markStreakCelebratedToday(userId)
      setCelebrationStreak(streak)
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
