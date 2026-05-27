import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RefillAlert } from '../../lib/refills';
import { colors, radii, spacing } from '../../constants/theme';

export function RefillBanner({
  alerts,
  onPress,
}: {
  alerts: RefillAlert[];
  onPress?: () => void;
}) {
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

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  warning: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
  body: {
    color: colors.text,
    lineHeight: 20,
  },
  link: {
    color: colors.accent,
    fontWeight: '800',
    marginTop: 2,
  },
});

