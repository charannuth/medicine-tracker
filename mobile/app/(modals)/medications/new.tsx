import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { MedicationScheduleType } from '../../../lib/medicationSchedule';
import type { ColorPalette } from '../../../constants/theme';
import { useAuth } from '../../../hooks/useAuth';
import { createMedication, fetchMedicationsWithStatus } from '../../../lib/medications';
import { rescheduleAllReminders } from '../../../lib/reminders';
import { MedicationFormWizard } from '../../../components/medication/MedicationFormWizard';
import type { MedicationInput } from '../../../lib/types';
import { useThemedStyles } from '../../../hooks/useThemedStyles';

function makeSafeStyles(colors: ColorPalette) {
  return {
    safe: { flex: 1, backgroundColor: colors.bg },
  };
}

export default function AddMedicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ scheduleType?: string }>();
  const defaultScheduleType: MedicationScheduleType =
    params.scheduleType === 'as_needed' ? 'as_needed' : 'scheduled';
  const { user } = useAuth();
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const styles = useThemedStyles(makeSafeStyles);

  useEffect(() => {
    if (!user) return;
    void fetchMedicationsWithStatus(user.id).then((meds) =>
      setExistingNames(meds.map((m) => m.name)),
    );
  }, [user]);

  async function handleSave(input: MedicationInput) {
    if (!user) return;
    await createMedication(user.id, input);
    try {
      await rescheduleAllReminders(user.id);
    } catch {
      // ignore reminder scheduling errors; medication was saved
    }
    router.back();
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <MedicationFormWizard
        userId={user.id}
        existingMedicationNames={existingNames}
        defaultScheduleType={defaultScheduleType}
        onSave={handleSave}
        onCancel={() => router.back()}
      />
    </SafeAreaView>
  );
}
