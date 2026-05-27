import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { StreakStats } from '../lib/streaks';
import type { ColorPalette } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

function makeStyles(colors: ColorPalette) {
  return {
    row: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'baseline' as const,
      marginTop: 4,
    },
    text: {
      fontSize: 14,
      color: colors.textMuted,
    },
    count: {
      fontWeight: '800' as const,
      color: colors.accent,
    },
    link: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '800' as const,
    },
  };
}

export function StreakSnippet({ stats }: { stats: StreakStats | null }) {
  const router = useRouter();
  const styles = useThemedStyles(makeStyles);

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
