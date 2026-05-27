import { StyleSheet, Text, View } from 'react-native';
import { streakMessage, type StreakStats } from '../../lib/streaks';
import { colors, radii, spacing } from '../../constants/theme';

export function StreakCard({ stats, loading }: { stats: StreakStats; loading?: boolean }) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.muted}>Loading streak…</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.h3}>Adherence streak</Text>
        <Text style={styles.sub}>A perfect day means every scheduled dose was logged.</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.stat, styles.statPrimary]}>
          <Text style={styles.value}>{stats.currentStreak}</Text>
          <Text style={styles.label}>Current streak</Text>
          <Text style={styles.unit}>{stats.currentStreak === 1 ? 'day' : 'days'}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.value}>{stats.longestStreak}</Text>
          <Text style={styles.label}>Longest streak</Text>
          <Text style={styles.unit}>{stats.longestStreak === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>

      {stats.hasMedications ? (
        <Text style={styles.today}>
          Today: {stats.todayTaken} of {stats.todayExpected} scheduled doses logged
          {stats.todayComplete ? <Text style={styles.todayDone}> · Complete</Text> : null}
          {stats.todayExtraLogs > 0 ? (
            <Text style={styles.todayExtra}>
              {' '}
              ({stats.todayExtraLogs} extra log{stats.todayExtraLogs === 1 ? '' : 's'} not on today&apos;s schedule)
            </Text>
          ) : null}
        </Text>
      ) : null}

      <View style={styles.week} accessibilityLabel="Last 7 days">
        {stats.last7Days.map((day) => (
          <View
            key={day.date}
            style={[styles.weekBar, day.perfect && styles.weekBarPerfect]}
          />
        ))}
      </View>
      <View style={styles.weekLabels}>
        <Text style={styles.weekLabelText}>7 days ago</Text>
        <Text style={styles.weekLabelText}>Today</Text>
      </View>

      <Text style={styles.message}>{streakMessage(stats)}</Text>
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
  header: { gap: 4 },
  h3: { fontSize: 18, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, lineHeight: 18 },
  muted: { color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    gap: 2,
  },
  statPrimary: {
    borderColor: '#67e8f9',
    backgroundColor: '#ecfeff',
  },
  value: { fontSize: 28, fontWeight: '900', color: colors.text },
  label: { color: colors.textMuted, fontWeight: '800' },
  unit: { color: colors.textMuted },
  today: { color: colors.text, lineHeight: 20 },
  todayDone: { color: colors.success, fontWeight: '900' },
  todayExtra: { color: colors.textMuted },
  week: { flexDirection: 'row', gap: 6, marginTop: spacing.sm },
  weekBar: {
    flex: 1,
    height: 14,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  weekBarPerfect: { backgroundColor: '#22c55e' },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  weekLabelText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  message: { color: colors.textMuted, lineHeight: 20, marginTop: spacing.sm },
});

