import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { PrnInsightsSummary } from '../../lib/prnInsights';
import { colors, radii, spacing } from '../../constants/theme';

export function PrnInsightsSection({
  insights,
  loading,
}: {
  insights: PrnInsightsSummary;
  loading?: boolean;
}) {
  const router = useRouter();

  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>As-needed medication patterns</Text>
        <Text style={styles.hint}>Analyzing logs…</Text>
      </View>
    );
  }

  const activeMeds = insights.meds.filter((m) => m.totalDoses14d > 0);

  if (activeMeds.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>As-needed medication patterns</Text>
        <Text style={styles.hint}>
          When you log as-needed doses on Today, patterns appear here for your doctor visit.
        </Text>
        <Pressable onPress={() => router.push('/')}>
          <Text style={styles.link}>Log on Today</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>As-needed medication patterns</Text>
      <Text style={styles.hint}>{insights.periodLabel}: PRN use vs daily check-in.</Text>
      {activeMeds.map((med) => (
        <View key={med.medicationId} style={styles.medBlock}>
          <Text style={styles.medName}>{med.medicationName}</Text>
          <Text style={styles.body}>
            {med.totalDoses14d} dose{med.totalDoses14d === 1 ? '' : 's'} across{' '}
            {med.daysWithDoses} day{med.daysWithDoses === 1 ? '' : 's'}
          </Text>
          {med.observations.map((line) => (
            <Text key={line} style={styles.bullet}>
              • {line}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  hint: { color: colors.textMuted, lineHeight: 20 },
  link: { color: colors.accent, fontWeight: '800' },
  medBlock: { marginTop: spacing.sm, gap: 4 },
  medName: { fontWeight: '800', color: colors.text },
  body: { color: colors.text },
  bullet: { color: colors.textMuted, lineHeight: 20 },
});
