import { useEffect, useRef, useState } from 'react';
import {
  markStreakCelebratedToday,
  wasStreakCelebratedToday,
} from '../lib/streakCelebration';
import { getDisplayStreakDays } from '../lib/streakBadges';
import type { StreakStats } from '../lib/streaks';

/** Dev-only: set EXPO_PUBLIC_PREVIEW_STREAK=7 (or any day count) in mobile/.env to replay the modal. */
function devPreviewStreakDays(): number | null {
  if (!__DEV__) return null;
  const flag = process.env.EXPO_PUBLIC_PREVIEW_STREAK;
  if (!flag || flag === '0') return null;
  const n = Number(flag);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return n;
}

export function useStreakCelebration(
  userId: string | undefined,
  stats: StreakStats | null,
) {
  const [celebrationStreak, setCelebrationStreak] = useState<number | null>(null);
  const initializedRef = useRef(false);
  const devPreviewShownRef = useRef(false);
  const prevRef = useRef<{ todayComplete: boolean; currentStreak: number } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const previewDays = devPreviewStreakDays();
    if (previewDays !== null) {
      if (!devPreviewShownRef.current) {
        devPreviewShownRef.current = true;
        setCelebrationStreak(previewDays);
      }
      return;
    }

    if (!stats?.hasMedications) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevRef.current = {
        todayComplete: stats.todayComplete,
        currentStreak: getDisplayStreakDays(stats),
      };
      return;
    }

    const prev = prevRef.current;
    if (!prev) return;

    const becameCompleteToday = stats.todayComplete && !prev.todayComplete;

    void (async () => {
      const already = await wasStreakCelebratedToday(userId);
      const displayStreak = getDisplayStreakDays(stats);

      if (becameCompleteToday && !already && displayStreak > 0) {
        await markStreakCelebratedToday(userId);
        setCelebrationStreak(displayStreak);
      }
    })();

    prevRef.current = {
      todayComplete: stats.todayComplete,
      currentStreak: getDisplayStreakDays(stats),
    };
  }, [userId, stats]);

  return {
    celebrationStreak,
    dismissCelebration: () => setCelebrationStreak(null),
    previewCelebration: __DEV__
      ? (days?: number) => {
          const fallback =
            stats != null ? getDisplayStreakDays(stats) : 0;
          setCelebrationStreak(days ?? (fallback > 0 ? fallback : 7));
        }
      : undefined,
  };
}
