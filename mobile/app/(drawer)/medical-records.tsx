import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MedicalRecordsForm } from '../../components/medicalRecords/MedicalRecordsForm';
import { colors, radii, spacing } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import {
  formatHeightForUnit,
  formatWeightForUnit,
  normalizeBodyMetricUnit,
  type BodyMetricUnit,
} from '../../lib/bodyMetrics';
import {
  emptyMedicalRecordInput,
  fetchMedicalRecord,
  isMedicalRecordFilled,
  recordToInput,
  updateBodyMetricUnits,
  upsertMedicalRecord,
  type MedicalRecordInput,
} from '../../lib/medicalRecords';

export default function MedicalRecordsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<MedicalRecordInput>(emptyMedicalRecordInput());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    fetchMedicalRecord(user.id)
      .then((record) => {
        if (!active) return;
        const next = recordToInput(record);
        setDraft(next);
        setExpanded(!isMedicalRecordFilled(next));
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load medical record');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  async function handleHeightUnitChange(unit: BodyMetricUnit) {
    setDraft((d) => ({ ...d, height_unit: unit }));
    if (!user) return;
    try {
      const saved = await updateBodyMetricUnits(user.id, { height_unit: unit });
      setDraft(recordToInput(saved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save unit preference');
    }
  }

  async function handleWeightUnitChange(unit: BodyMetricUnit) {
    setDraft((d) => ({ ...d, weight_unit: unit }));
    if (!user) return;
    try {
      const saved = await updateBodyMetricUnits(user.id, { weight_unit: unit });
      setDraft(recordToInput(saved));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save unit preference');
    }
  }

  async function handleSave() {
    if (!user) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await upsertMedicalRecord(user.id, draft);
      setMessage('Medical record saved.');
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save medical record');
    } finally {
      setBusy(false);
    }
  }

  const filled = isMedicalRecordFilled(draft);
  const heightSummary = formatHeightForUnit(
    draft.height_cm ? Number(draft.height_cm) : null,
    normalizeBodyMetricUnit(draft.height_unit),
  );
  const weightSummary = formatWeightForUnit(
    draft.weight_kg ? Number(draft.weight_kg) : null,
    normalizeBodyMetricUnit(draft.weight_unit),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.h1}>Medical records</Text>
          <Text style={styles.sub}>
            Self-reported history — allergies, conditions, and optional profile basics
          </Text>
        </View>

        {error ? (
          <View style={[styles.banner, styles.bannerError]}>
            <Text style={styles.bannerErrorText}>{error}</Text>
          </View>
        ) : null}
        {message ? (
          <View style={[styles.banner, styles.bannerSuccess]}>
            <Text style={styles.bannerSuccessText}>{message}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.sub}>Loading medical record…</Text>
          </View>
        ) : (
          <>
            {!filled ? (
              <Text style={styles.emptyHint}>
                Add your allergies so we can flag possible matches when you add medications on{' '}
                <Text style={styles.link} onPress={() => router.push('/(drawer)')}>
                  Today
                </Text>{' '}
                or run a{' '}
                <Text style={styles.link} onPress={() => router.push('/(drawer)/interactions')}>
                  drug safety check
                </Text>
                .
              </Text>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Medical record</Text>
                {!expanded && filled ? (
                  <Pressable onPress={() => setExpanded(true)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                ) : null}
              </View>

              {!expanded && filled ? (
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    {draft.date_of_birth ? (
                      <Text style={styles.summaryItem}>
                        DOB: <Text style={styles.strong}>{draft.date_of_birth}</Text>
                      </Text>
                    ) : null}
                    {draft.gender ? (
                      <Text style={styles.summaryItem}>
                        Gender: <Text style={styles.strong}>{draft.gender}</Text>
                      </Text>
                    ) : null}
                    {heightSummary ? (
                      <Text style={styles.summaryItem}>
                        Height: <Text style={styles.strong}>{heightSummary}</Text>
                      </Text>
                    ) : null}
                    {weightSummary ? (
                      <Text style={styles.summaryItem}>
                        Weight: <Text style={styles.strong}>{weightSummary}</Text>
                      </Text>
                    ) : null}
                    {draft.blood_type ? (
                      <Text style={styles.summaryItem}>
                        Blood type: <Text style={styles.strong}>{draft.blood_type}</Text>
                      </Text>
                    ) : null}
                  </View>

                  {draft.known_allergies.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Allergies</Text>
                      <Text style={styles.detailValue}>{draft.known_allergies.join(', ')}</Text>
                    </View>
                  ) : null}
                  {draft.known_conditions.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Conditions</Text>
                      <Text style={styles.detailValue}>{draft.known_conditions.join(', ')}</Text>
                    </View>
                  ) : null}
                  {draft.past_surgeries.trim() ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Surgeries / hospitalizations</Text>
                      <Text style={styles.detailValue}>{draft.past_surgeries}</Text>
                    </View>
                  ) : null}
                  {draft.family_history.trim() ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Family history</Text>
                      <Text style={styles.detailValue}>{draft.family_history}</Text>
                    </View>
                  ) : null}
                  {draft.emergency_notes.trim() ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Emergency notes</Text>
                      <Text style={styles.detailValue}>{draft.emergency_notes}</Text>
                    </View>
                  ) : null}
                  {draft.other_notes.trim() ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Other notes</Text>
                      <Text style={styles.detailValue}>{draft.other_notes}</Text>
                    </View>
                  ) : null}

                  <Text style={styles.savedHint}>
                    Everything is saved to your account. Tap Edit to update anytime.
                  </Text>
                </View>
              ) : (
                <MedicalRecordsForm
                  value={draft}
                  onChange={setDraft}
                  onHeightUnitChange={(unit) => void handleHeightUnitChange(unit)}
                  onWeightUnitChange={(unit) => void handleWeightUnitChange(unit)}
                  onSubmit={() => void handleSave()}
                  busy={busy}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  header: { gap: spacing.xs },
  h1: { fontSize: 24, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, lineHeight: 20 },
  emptyHint: { color: colors.textMuted, lineHeight: 20 },
  link: { color: colors.accent, fontWeight: '700' },
  loading: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  banner: { borderRadius: radii.md, padding: spacing.md, borderWidth: 1 },
  bannerError: { backgroundColor: colors.errorBg, borderColor: '#fecaca' },
  bannerErrorText: { color: colors.error, fontWeight: '700' },
  bannerSuccess: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  bannerSuccessText: { color: '#047857', fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
  editLink: { color: colors.accent, fontWeight: '800', fontSize: 15 },
  summary: { gap: spacing.md },
  summaryRow: { gap: spacing.xs },
  summaryItem: { color: colors.text, lineHeight: 22 },
  strong: { fontWeight: '800' },
  detailRow: { gap: 4 },
  detailLabel: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  detailValue: { color: colors.text, lineHeight: 20 },
  savedHint: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: spacing.sm },
});
