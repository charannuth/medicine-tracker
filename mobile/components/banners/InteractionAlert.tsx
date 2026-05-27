import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  checkMedicationInteractions,
  type InteractionCheckResult,
} from '../../lib/drugInteractions';
import { colors, radii, spacing } from '../../constants/theme';
import { useRouter } from 'expo-router';

export function InteractionAlert({ medicationNames }: { medicationNames: string[] }) {
  const shouldCheck = medicationNames.length >= 2;
  const [result, setResult] = useState<InteractionCheckResult | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!shouldCheck) return;
    let active = true;

    checkMedicationInteractions(medicationNames)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setResult(null);
      });

    return () => {
      active = false;
    };
  }, [medicationNames, shouldCheck]);

  if (!shouldCheck || !result || result.interactions.length === 0) return null;

  const major = result.interactions.filter((i) => i.severity === 'major').length;
  const top = result.interactions[0];

  return (
    <Pressable
      onPress={() => router.push('/interactions')}
      style={[
        styles.banner,
        major > 0 ? styles.error : styles.warning,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Review interaction safety check"
    >
      <Text style={styles.title}>
        {result.interactions.length} potential interaction
        {result.interactions.length === 1 ? '' : 's'}
      </Text>
      {top ? (
        <Text style={styles.body}>
          e.g. {top.displayA} + {top.displayB} ({top.severity})
        </Text>
      ) : null}
      <Text style={styles.link}>Review safety check</Text>
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
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  title: {
    fontWeight: '900',
    color: colors.text,
  },
  body: {
    color: colors.text,
  },
  link: {
    color: colors.accent,
    fontWeight: '800',
  },
});

