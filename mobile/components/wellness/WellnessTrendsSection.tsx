import { useMemo } from 'react';
import { Text, View } from 'react-native';
import type { WellnessLog } from '../../lib/wellness';
import { lastNDates } from '../../lib/wellness';
import {
  buildTrendPoints,
  compareWeekMetrics,
  formatComparisonLine,
} from '../../lib/wellnessTrends';
import { todayLocalDate } from '../../lib/dates';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

function makeTrendStyles(colors: ColorPalette) {
  return {
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { fontSize: 16, fontWeight: '900' as const, color: colors.text },
    hint: { color: colors.textMuted, lineHeight: 20 },
    chart: { gap: spacing.sm },
    chartTitle: { fontWeight: '800' as const, color: colors.text },
    bars: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      justifyContent: 'space-between' as const,
      height: 100,
    },
    barWrap: { alignItems: 'center' as const, flex: 1 },
    bar: { width: 20, backgroundColor: colors.accent, borderRadius: 4 },
    barEmpty: { backgroundColor: colors.border },
    barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    unitHint: { fontSize: 12, color: colors.textMuted },
    compareTitle: { fontWeight: '800' as const, marginTop: spacing.sm, color: colors.text },
    compareLine: { color: colors.text, lineHeight: 22 },
  };
}

function TrendBars({
  title,
  points,
  max,
  getValue,
  unit,
}: {
  title: string;
  points: ReturnType<typeof buildTrendPoints>;
  max: number;
  getValue: (p: (typeof points)[0]) => number | null;
  unit: string;
}) {
  const styles = useThemedStyles(makeTrendStyles);
  return (
    <View style={styles.chart}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.bars}>
        {points.map((p) => {
          const v = getValue(p);
          const pct = v != null ? Math.min(100, (v / max) * 100) : 0;
          return (
            <View key={p.date} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: v != null ? Math.max(8, pct * 0.8) : 4 },
                  v == null && styles.barEmpty,
                ]}
              />
              <Text style={styles.barLabel}>{p.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.unitHint}>{unit}</Text>
    </View>
  );
}

export function WellnessTrendsSection({ trendLogs }: { trendLogs: WellnessLog[] }) {
  const styles = useThemedStyles(makeTrendStyles);
  const today = todayLocalDate();
  const last7 = useMemo(() => [...lastNDates(7, today)].reverse(), [today]);
  const recentWeek = useMemo(() => lastNDates(7, today), [today]);
  const priorWeek = useMemo(() => lastNDates(14, today).slice(7, 14), [today]);

  const points = useMemo(() => buildTrendPoints(last7, trendLogs), [last7, trendLogs]);
  const comparisons = useMemo(
    () => compareWeekMetrics(recentWeek, priorWeek, trendLogs),
    [recentWeek, priorWeek, trendLogs],
  );
  const comparisonLines = comparisons
    .map(formatComparisonLine)
    .filter((line): line is string => line != null);
  const loggedDays = points.filter((p) => p.hasLog).length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Trends (last 7 days)</Text>
      <Text style={styles.hint}>
        Patterns in your logs only — discuss changes with your clinician.
      </Text>
      {loggedDays === 0 ? (
        <Text style={styles.hint}>Log a few check-ins to see charts here.</Text>
      ) : (
        <>
          <TrendBars
            title="Sleep quality"
            points={points}
            max={5}
            getValue={(p) => p.sleepQuality}
            unit="/5"
          />
          <TrendBars
            title="Energy"
            points={points}
            max={5}
            getValue={(p) => p.energy}
            unit="/5"
          />
          <TrendBars
            title="Sleep hours"
            points={points}
            max={10}
            getValue={(p) => p.sleepHours}
            unit="h"
          />
          <Text style={styles.compareTitle}>Week over week</Text>
          {comparisonLines.length === 0 ? (
            <Text style={styles.hint}>Need logs in both recent and prior weeks.</Text>
          ) : (
            comparisonLines.map((line) => (
              <Text key={line} style={styles.compareLine}>
                • {line}
              </Text>
            ))
          )}
        </>
      )}
    </View>
  );
}
