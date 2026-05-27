import { useEffect, useState } from 'react';
import { buildMedicationSafetyReview } from '../lib/medicationSafetyReview';
import type { ActiveMedicationSummary } from '../lib/wellnessReport';

export type MedBriefingEntry = {
  med: ActiveMedicationSummary;
  review: Awaited<ReturnType<typeof buildMedicationSafetyReview>>;
};

export function useWellnessMedBriefings(medications: ActiveMedicationSummary[]) {
  const [entries, setEntries] = useState<MedBriefingEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const medKey = medications.map((m) => `${m.name}:${m.start_date}`).join('|');

  useEffect(() => {
    if (medications.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }

    let active = true;
    const allNames = medications.map((m) => m.name);

    setLoading(true);
    setError(null);

    void Promise.all(
      medications.map(async (med) => {
        const others = allNames.filter((n) => n.toLowerCase() !== med.name.toLowerCase());
        const review = await buildMedicationSafetyReview(med.name, others);
        return { med, review };
      }),
    )
      .then((results) => {
        if (!active) return;
        setEntries(
          [...results].sort((a, b) => b.med.start_date.localeCompare(a.med.start_date)),
        );
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load medication briefings');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [medKey]);

  return { entries, loading, error };
}
