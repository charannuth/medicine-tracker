import { Text, View } from 'react-native';
import type { MissedDoseItem } from '../../lib/missedDoses';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useThemedStyles } from '../../hooks/useThemedStyles';

function makeStyles(colors: ColorPalette) {
  return {
    banner: {
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      gap: 6,
    },
    dueNow: {
      backgroundColor: colors.badgeMinorBg,
      borderColor: colors.avatarFallbackBorder,
    },
    title: {
      fontWeight: '800' as const,
      color: colors.text,
    },
    item: {
      color: colors.text,
    },
  };
}

export function DueNowBanner({ items }: { items: MissedDoseItem[] }) {
  const styles = useThemedStyles(makeStyles);
  const dueToday = items.filter((item) => item.periodLabel === 'Today');
  if (dueToday.length === 0) return null;

  return (
    <View style={[styles.banner, styles.dueNow]} accessibilityRole="text">
      <Text style={styles.title}>Due now — mark when taken:</Text>
      {dueToday.map((item) => (
        <Text
          key={`${item.medicationId}-${item.scheduleTime}`}
          style={styles.item}
        >
          • {item.medicationName} at {item.scheduleLabel}
          {item.doseLabel ? ` (${item.doseLabel})` : ''}
        </Text>
      ))}
    </View>
  );
}
