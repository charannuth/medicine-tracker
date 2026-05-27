import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, spacing } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import {
  fetchMedicationsWithStatus,
  repairMedicationSchedule,
  updateMedication,
} from '../../../lib/medications';
import { rescheduleDoseReminders } from '../../../lib/reminderScheduler';
import { useAuth } from '../../../hooks/useAuth';
import { MedicationFormWizard } from '../../../components/medication/MedicationFormWizard';
import type { Medication, MedicationInput } from '../../../lib/types';

export default function EditMedicationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [med, setMed] = useState<Medication | null>(null);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    let active = true;

    async function load() {
      if (!supabase) throw new Error('Supabase is not configured');
      const [medRes, allMeds] = await Promise.all([
        supabase.from('medications').select('*').eq('id', id).single(),
        fetchMedicationsWithStatus(user!.id),
      ]);
      if (medRes.error) throw medRes.error;
      const row = medRes.data as Medication;
      await repairMedicationSchedule(row.id);
      if (active) {
        setMed(row);
        setExistingNames(allMeds.filter((m) => m.id !== id).map((m) => m.name));
      }
    }

    load()
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, id]);

  async function handleSave(input: MedicationInput) {
    if (!user || !med) return;
    await updateMedication(med.id, input);
    try {
      await rescheduleDoseReminders(user.id);
    } catch {
      // ignore
    }
    router.back();
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading medication…</Text>
      </View>
    );
  }

  if (error || !med || !user) {
    return (
      <View style={styles.loading}>
        <Text style={styles.error}>{error ?? 'Medication not found'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <MedicationFormWizard
        initial={med}
        userId={user.id}
        existingMedicationNames={existingNames}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  muted: { color: colors.textMuted },
  error: { color: colors.error, fontWeight: '800' },
});
