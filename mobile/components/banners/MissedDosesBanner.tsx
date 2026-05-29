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
      paddingRight: spacing.xl + spacing.sm,
      borderWidth: 1,
      gap: 6,
      position: 'relative' as const,
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
      right: 4,
      top: 4,
      zIndex: 10,
      elevation: 10,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    dismissText: {
      fontSize: 22,
      fontWeight: '800' as const,
      color: colors.textMuted,
      lineHeight: 24,
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
      <Text style={styles.title}>Missed doses:</Text>
      {items.map((item) => (
        <Text
          key={`${item.periodLabel}-${item.medicationId}-${item.scheduleTime}`}
          style={styles.item}
        >
          • {item.periodLabel}: {item.medicationName} at {item.scheduleLabel}
        </Text>
      ))}
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss missed doses"
        hitSlop={8}
        style={({ pressed }) => [styles.dismiss, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.dismissText}>×</Text>
      </Pressable>
    </View>
  );
}
