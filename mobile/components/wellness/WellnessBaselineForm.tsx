import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { SubstanceKey } from '../../lib/medicationSafetyReview';
import {
  SUBSTANCE_USE_LEVELS,
  type SubstanceUseLevel,
  type WellnessProfileInput,
} from '../../lib/wellness';
import { colors, radii, spacing } from '../../constants/theme';

const SUBSTANCE_FIELDS: { key: SubstanceKey; label: string }[] = [
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'cannabis', label: 'Cannabis' },
  { key: 'tobacco', label: 'Tobacco / nicotine' },
];

type Props = {
  value: WellnessProfileInput;
  onChange: (next: WellnessProfileInput) => void;
  onSubmit: () => void;
  busy?: boolean;
};

export function WellnessBaselineForm({ value, onChange, onSubmit, busy = false }: Props) {
  function patch(partial: Partial<WellnessProfileInput>) {
    onChange({ ...value, ...partial });
  }

  function setSubstance(key: SubstanceKey, level: SubstanceUseLevel | '') {
    const next = { ...value.substance_use };
    if (level === '') delete next[key];
    else next[key] = level;
    patch({ substance_use: next });
  }

  return (
    <View style={styles.form}>
      <Text style={styles.hint}>
        Your usual patterns — used to highlight what to watch for with your medications.
      </Text>
      <Text style={styles.label}>Usual bedtime</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 10:30 PM"
        value={value.usual_bedtime}
        onChangeText={(usual_bedtime) => patch({ usual_bedtime })}
      />
      <Text style={styles.label}>Usual wake time</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 6:30 AM"
        value={value.usual_wake_time}
        onChangeText={(usual_wake_time) => patch({ usual_wake_time })}
      />
      <Text style={styles.label}>Eating habits (optional)</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={value.eating_notes}
        onChangeText={(eating_notes) => patch({ eating_notes })}
      />
      {SUBSTANCE_FIELDS.map(({ key, label }) => (
        <View key={key} style={styles.substanceBlock}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.chipRow}>
            <Pressable
              style={[styles.chip, !value.substance_use[key] && styles.chipActive]}
              onPress={() => setSubstance(key, '')}
            >
              <Text style={styles.chipText}>Prefer not to say</Text>
            </Pressable>
            {SUBSTANCE_USE_LEVELS.map(({ value: v, label: l }) => (
              <Pressable
                key={v}
                style={[styles.chip, value.substance_use[key] === v && styles.chipActive]}
                onPress={() => setSubstance(key, v)}
              >
                <Text style={styles.chipText}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.label}>Symptoms to track (comma-separated)</Text>
      <TextInput
        style={styles.input}
        value={value.symptom_focus.join(', ')}
        onChangeText={(t) =>
          patch({
            symptom_focus: t
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        placeholder="e.g. Wheezing, joint pain"
      />
      <Text style={styles.label}>Notes for your clinician</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        multiline
        value={value.profile_notes}
        onChangeText={(profile_notes) => patch({ profile_notes })}
      />
      <Pressable
        style={[styles.btn, busy && styles.btnDisabled]}
        disabled={busy}
        onPress={onSubmit}
      >
        <Text style={styles.btnText}>{busy ? 'Saving…' : 'Save baseline'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  hint: { color: colors.textMuted, lineHeight: 20, marginBottom: spacing.sm },
  label: { fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  substanceBlock: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.text },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '900' },
});
