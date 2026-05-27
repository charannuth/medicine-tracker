import { Pressable, Text, View } from 'react-native';
import type { RefillAlert } from '../../lib/refills';
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
    warning: {
      backgroundColor: colors.partialBg,
      borderColor: colors.partialBorder,
    },
    title: {
      fontWeight: '800' as const,
      color: colors.text,
    },
    body: {
      color: colors.text,
      lineHeight: 20,
    },
    link: {
      color: colors.accent,
      fontWeight: '800' as const,
      marginTop: 2,
    },
  };
}

export function RefillBanner({
  alerts,
  onPress,
}: {
  alerts: RefillAlert[];
  onPress?: () => void;
}) {
  const styles = useThemedStyles(makeStyles);

  if (alerts.length === 0) return null;

  return (
    <Pressable
      style={[styles.banner, styles.warning]}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <Text style={styles.title}>Refill soon:</Text>
      <Text style={styles.body}>
        {alerts
          .map((a) => `${a.name} (${a.remainingLabel} left)`)
          .join(', ')}
        .
      </Text>
      {onPress ? <Text style={styles.link}>Update supply</Text> : null}
    </Pressable>
  );
}
