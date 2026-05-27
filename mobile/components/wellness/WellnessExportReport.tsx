import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeProvider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { createWellnessReportData, buildWellnessReportHtml } from '../../lib/wellnessReport';
import type { ActiveMedicationSummary } from '../../lib/wellnessReport';
import type { WellnessLog, WellnessProfileInput } from '../../lib/wellness';
import type { PrnInsightsSummary } from '../../lib/prnInsights';
import type { MedBriefingEntry } from '../../hooks/useWellnessMedBriefings';

type Props = {
  userEmail: string | undefined;
  profile: WellnessProfileInput;
  medications: ActiveMedicationSummary[];
  reportLogs: WellnessLog[];
  prnInsights: PrnInsightsSummary;
  briefingEntries: MedBriefingEntry[];
};

function makeExportStyles(colors: ColorPalette) {
  return {
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: { fontSize: 16, fontWeight: '900' as const, color: colors.text },
    hint: { color: colors.textMuted, lineHeight: 20 },
    btn: {
      marginTop: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    btnSecondary: {
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
      backgroundColor: colors.bg,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: colors.onAccent, fontWeight: '900' as const },
    btnSecondaryText: { color: colors.text, fontWeight: '800' as const },
  };
}

export function WellnessExportReport(props: Props) {
  const [busy, setBusy] = useState<'view' | 'pdf' | null>(null);
  const styles = useThemedStyles(makeExportStyles);
  const { colors } = useTheme();

  function reportHtml() {
    const data = createWellnessReportData({
      userEmail: props.userEmail,
      profile: props.profile,
      medications: props.medications,
      reportLogs: props.reportLogs,
      prnInsights: props.prnInsights,
      briefingEntries: props.briefingEntries,
    });
    return buildWellnessReportHtml(data);
  }

  async function viewPrintableReport() {
    setBusy('view');
    try {
      const Print = await import('expo-print');
      await Print.printAsync({ html: reportHtml() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not open report';
      if (message.includes('ExpoPrint') || message.includes('native module')) {
        Alert.alert(
          'Rebuild required',
          'Report preview needs a fresh native build. Stop Metro, run npx expo run:ios, then try again.',
        );
      } else {
        Alert.alert('Report failed', message);
      }
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setBusy('pdf');
    try {
      const [Print, Sharing] = await Promise.all([
        import('expo-print'),
        import('expo-sharing'),
      ]);

      const html = reportHtml();
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
      setBusy(null);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Report for your doctor</Text>
      <Text style={styles.hint}>
        Opens a full report with your baseline, last 14 days of logs, as-needed medication
        patterns, week-over-week notes, and medication briefings. Preview with Print, or save
        as PDF to share.
      </Text>
      <Pressable
        style={[styles.btn, busy !== null && styles.btnDisabled]}
        disabled={busy !== null}
        onPress={viewPrintableReport}
      >
        {busy === 'view' ? (
          <ActivityIndicator color={colors.onAccent} />
        ) : (
          <Text style={styles.btnText}>View printable report</Text>
        )}
      </Pressable>
      <Pressable
        style={[styles.btnSecondary, busy !== null && styles.btnDisabled]}
        disabled={busy !== null}
        onPress={exportPdf}
      >
        {busy === 'pdf' ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Text style={styles.btnSecondaryText}>Export PDF</Text>
        )}
      </Pressable>
    </View>
  );
}
