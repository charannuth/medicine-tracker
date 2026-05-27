import { Pressable, Text, View } from 'react-native';
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
    missed: {
      backgroundColor: colors.badgeModerateBg,
      borderColor: colors.partialBorder,
    },
    title: {
      fontWeight: '800' as const,
      color: colors.text,
    },
    item: {
      color: colors.text,
    },
    dismiss: {
      position: 'absolute' as const,
      right: 6,
      top: 6,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    dismissText: {
      fontSize: 20,
      fontWeight: '800' as const,
      color: colors.textMuted,
    },
  };
}

export function MissedDosesBanner({
  items,
  onDismiss,
}: {
  items: MissedDoseItem[];
  onDismiss: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

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
