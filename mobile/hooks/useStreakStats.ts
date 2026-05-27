import { useCallback, useEffect, useState } from 'react';
import { fetchStreakStats, type StreakStats } from '../lib/streaks';

export function useStreakStats(userId: string | undefined) {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    setError(null);
    const s = await fetchStreakStats(userId);
    setStats(s);
    return s;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setLoading(true);
    setError(null);

    fetchStreakStats(userId)
      .then((s) => {
        if (active) setStats(s);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load streaks');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  return { stats, loading, error, reload };
}

