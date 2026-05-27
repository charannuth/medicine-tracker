import { StyleSheet, Text, View } from 'react-native';
import type { MissedDoseItem } from '../../lib/missedDoses';
import { colors, radii, spacing } from '../../constants/theme';

export function DueNowBanner({ items }: { items: MissedDoseItem[] }) {
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

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  dueNow: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
  item: {
    color: colors.text,
  },
});

