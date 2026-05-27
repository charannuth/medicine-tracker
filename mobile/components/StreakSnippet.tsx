import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { StreakStats } from '../lib/streaks';
import { colors } from '../constants/theme';

export function StreakSnippet({ stats }: { stats: StreakStats | null }) {
  const router = useRouter();
  if (!stats?.hasMedications) return null;

  return (
    <View style={styles.row}>
      <Text style={styles.text}>
        {stats.currentStreak > 0 ? (
          <>
            <Text style={styles.count}>{stats.currentStreak}</Text>
            {` day streak${
              stats.todayComplete ? ' — today complete' : ' — finish today to continue'
            }`}
          </>
        ) : (
          'Log every dose today to start a streak'
        )}
        .{' '}
      </Text>
      <Pressable
        onPress={() => router.push('/streaks')}
        accessibilityRole="link"
        hitSlop={8}
      >
        <Text style={styles.link}>Details</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginTop: 4,
  },
  text: {
    fontSize: 14,
    color: colors.textMuted,
  },
  count: {
    fontWeight: '800',
    color: colors.accent,
  },
  link: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '800',
  },
});
