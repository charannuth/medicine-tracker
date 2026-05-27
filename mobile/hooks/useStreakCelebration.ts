import { useEffect, useRef, useState } from 'react';
import {
  markStreakCelebratedToday,
  STREAK_CELEBRATION_MILESTONE_DAYS,
  wasStreakCelebratedToday,
} from '../lib/streakCelebration';
import type { StreakStats } from '../lib/streaks';

export function useStreakCelebration(
  userId: string | undefined,
  stats: StreakStats | null,
) {
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const prevRef = useRef<{ todayComplete: boolean; currentStreak: number } | null>(null);

  useEffect(() => {
    if (!userId || !stats?.hasMedications) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevRef.current = {
        todayComplete: stats.todayComplete,
        currentStreak: stats.currentStreak,
      };
      return;
    }

    const prev = prevRef.current;
    if (!prev) return;

    const becameCompleteToday = stats.todayComplete && !prev.todayComplete;

    void (async () => {
      const already = await wasStreakCelebratedToday(userId);
      const hitMilestone = stats.currentStreak === STREAK_CELEBRATION_MILESTONE_DAYS;
      if (becameCompleteToday && !already && hitMilestone) {
        await markStreakCelebratedToday(userId);
        setCelebrationStreak(STREAK_CELEBRATION_MILESTONE_DAYS);
      }
    })();

    prevRef.current = {
      todayComplete: stats.todayComplete,
      currentStreak: stats.currentStreak,
    };
  }, [userId, stats]);

  return {
    celebrationStreak,
    dismissCelebration: () => setCelebrationStreak(null),
  };
}
