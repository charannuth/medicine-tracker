import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { createWellnessReportData, buildWellnessReportHtml } from '../../lib/wellnessReport';
import type { ActiveMedicationSummary } from '../../lib/wellnessReport';
import type { WellnessLog, WellnessProfileInput } from '../../lib/wellness';
import type { PrnInsightsSummary } from '../../lib/prnInsights';
import type { MedBriefingEntry } from '../../hooks/useWellnessMedBriefings';
import { colors, radii, spacing } from '../../constants/theme';

type Props = {
  userEmail: string | undefined;
  profile: WellnessProfileInput;
  medications: ActiveMedicationSummary[];
  reportLogs: WellnessLog[];
  prnInsights: PrnInsightsSummary;
  briefingEntries: MedBriefingEntry[];
};

export function WellnessExportReport(props: Props) {
  const [busy, setBusy] = useState(false);

  async function exportPdf() {
    setBusy(true);
    try {
      const [Print, Sharing] = await Promise.all([
        import('expo-print'),
        import('expo-sharing'),
      ]);

      const data = createWellnessReportData({
        userEmail: props.userEmail,
        profile: props.profile,
        medications: props.medications,
        reportLogs: props.reportLogs,
        prnInsights: props.prnInsights,
        briefingEntries: props.briefingEntries,
      });
      const html = buildWellnessReportHtml(data);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Wellness report',
        });
      } else {
        Alert.alert('Report ready', `Saved to ${uri}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create report';
      if (message.includes('ExpoPrint') || message.includes('native module')) {
        Alert.alert(
          'Rebuild required',
          'PDF export needs a fresh native build. Stop Metro, run npx expo run:ios, then try again.',
        );
      } else {
        Alert.alert('Export failed', message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Report for your doctor</Text>
      <Text style={styles.hint}>
        Generates a PDF with your baseline, last 14 days of logs, PRN patterns, and medication
        briefings. Share or save from the system sheet.
      </Text>
      <Pressable style={[styles.btn, busy && styles.btnDisabled]} disabled={busy} onPress={exportPdf}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Export PDF report</Text>
        )}
      </Pressable>
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
  btn: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '900' },
});
