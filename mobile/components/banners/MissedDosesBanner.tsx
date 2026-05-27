import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MissedDoseItem } from '../../lib/missedDoses';
import { colors, radii, spacing } from '../../constants/theme';

export function MissedDosesBanner({
  items,
  onDismiss,
}: {
  items: MissedDoseItem[];
  onDismiss: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <View style={[styles.banner, styles.missed]} accessibilityRole="text">
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss missed doses"
        style={styles.dismiss}
      >
        <Text style={styles.dismissText}>×</Text>
      </Pressable>
      <Text style={styles.title}>Missed doses:</Text>
      {items.map((item) => (
        <Text
          key={`${item.periodLabel}-${item.medicationId}-${item.scheduleTime}`}
          style={styles.item}
        >
          • {item.periodLabel}: {item.medicationName} at {item.scheduleLabel}
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
  missed: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
  item: {
    color: colors.text,
  },
  dismiss: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMuted,
  },
});

