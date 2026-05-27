import { Text, View } from 'react-native';
import type { ColorPalette } from '../constants/theme';
import { radii, spacing } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

function makeStyles(colors: ColorPalette) {
  return {
    compact: {
      color: colors.textMuted,
      lineHeight: 18,
      marginTop: spacing.sm,
    },
    full: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    fullText: {
      color: colors.text,
      lineHeight: 20,
    },
    strong: {
      fontWeight: '900' as const,
    },
  };
}

export function WellnessDisclaimer({ compact = false }: { compact?: boolean }) {
  const styles = useThemedStyles(makeStyles);

  if (compact) {
    return (
      <Text style={styles.compact}>
        Personal logs only — not a diagnosis. Share with your doctor or pharmacist for medical advice.
      </Text>
    );
  }

  return (
    <View style={styles.full} accessibilityRole="text">
      <Text style={styles.fullText}>
        <Text style={styles.strong}>Not medical advice.</Text> Dr. Dose helps you record daily experiences
        (sleep, mood, symptoms, exercise) so you can discuss patterns with your clinician. Always consult
        your doctor or pharmacist for diagnoses and treatment.
      </Text>
    </View>
  );
}
