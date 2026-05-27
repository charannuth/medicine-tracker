import { useEffect, useState } from 'react';
import {
  emptyWellnessLogInput,
  fetchWellnessLog,
  fetchWellnessProfile,
  isWellnessLogFilled,
  logFromRow,
  profileToInput,
  type WellnessLogInput,
} from '../lib/wellness';

export function useWellnessTodayLog(userId: string | undefined, today: string) {
  const [draft, setDraft] = useState<WellnessLogInput>(() => emptyWellnessLogInput(today));
  const [saved, setSaved] = useState<WellnessLogInput | null>(null);
  const [trackedSymptoms, setTrackedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    setLoading(true);
    setError(null);

    Promise.all([fetchWellnessLog(userId, today), fetchWellnessProfile(userId)])
      .then(([row, profile]) => {
        if (!active) return;
        setTrackedSymptoms(profileToInput(profile).symptom_focus);
        if (row && isWellnessLogFilled(logFromRow(row))) {
          const input = logFromRow(row);
          setSaved(input);
          setDraft(input);
        } else {
          setSaved(null);
          setDraft(emptyWellnessLogInput(today));
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load check-in');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId, today]);

  return {
    draft,
    setDraft,
    saved,
    setSaved,
    trackedSymptoms,
    loading,
    error,
    setError,
  };
}

