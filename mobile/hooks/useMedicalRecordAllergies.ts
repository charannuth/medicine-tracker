import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMedicalRecordAllergies(userId: string | undefined) {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId || !supabase) {
      setAllergies([]);
      setConditions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from('medical_records')
          .select('known_allergies, known_conditions')
          .eq('user_id', userId)
          .maybeSingle();
        if (!active) return;
        setAllergies((data?.known_allergies as string[] | undefined) ?? []);
        setConditions((data?.known_conditions as string[] | undefined) ?? []);
      } catch {
        if (active) {
          setAllergies([]);
          setConditions([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return { allergies, conditions, loading };
}
