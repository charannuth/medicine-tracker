import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../constants/theme';

export function WellnessDisclaimer({ compact = false }: { compact?: boolean }) {
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

const styles = StyleSheet.create({
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
    fontWeight: '900',
  },
});

