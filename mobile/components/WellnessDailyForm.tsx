import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import type { AppetiteLevel, WellnessLogInput } from '../lib/wellness';
import { buildSymptomChipOptions } from '../lib/wellness';
import { colors, radii, spacing } from '../constants/theme';

type Props = {
  value: WellnessLogInput;
  onChange: (next: WellnessLogInput) => void;
  onSubmit: () => void;
  busy?: boolean;
  submitLabel?: string;
  compact?: boolean;
  trackedSymptoms?: string[];
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function WellnessDailyForm({
  value,
  onChange,
  onSubmit,
  busy = false,
  submitLabel = 'Save check-in',
  compact = false,
  trackedSymptoms = [],
}: Props) {
  const [customSymptom, setCustomSymptom] = useState('');

  function patch(partial: Partial<WellnessLogInput>) {
    onChange({ ...value, ...partial });
  }

  const symptomOptions = useMemo(
    () => buildSymptomChipOptions(value.symptoms, trackedSymptoms),
    [value.symptoms, trackedSymptoms],
  );

  function toggleSymptom(symptom: string) {
    const set = new Set(value.symptoms);
    if (set.has(symptom)) set.delete(symptom);
    else set.add(symptom);
    patch({ symptoms: [...set] });
  }

  function addCustomSymptom() {
    const trimmed = customSymptom.trim();
    if (!trimmed) return;
    if (!value.symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      patch({ symptoms: [...value.symptoms, trimmed] });
    }
    setCustomSymptom('');
  }

  function setNullableNumber(key: keyof WellnessLogInput, raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) {
      patch({ [key]: null } as any);
      return;
    }
    const n = Number(cleaned);
    patch({ [key]: Number.isFinite(n) ? (n as any) : null } as any);
  }

  const appetiteOptions: { value: AppetiteLevel; label: string }[] = [
    { value: 'same', label: 'Same as usual' },
    { value: 'better', label: 'Better' },
    { value: 'worse', label: 'Worse' },
  ];

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Text style={styles.legend}>Sleep (last night)</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Hours</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="e.g. 7"
            placeholderTextColor={colors.textMuted}
            editable={!busy}
            value={value.sleep_hours == null ? '' : String(value.sleep_hours)}
            onChangeText={(t) => setNullableNumber('sleep_hours', t)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Quality (1–5)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="1-5"
            placeholderTextColor={colors.textMuted}
            editable={!busy}
            value={value.sleep_quality == null ? '' : String(value.sleep_quality)}
            onChangeText={(t) => setNullableNumber('sleep_quality', t)}
          />
        </View>
      </View>

      <Text style={styles.legend}>Energy today (1–5)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="1-5"
        placeholderTextColor={colors.textMuted}
        editable={!busy}
        value={value.energy_level == null ? '' : String(value.energy_level)}
        onChangeText={(t) => setNullableNumber('energy_level', t)}
      />

      <Text style={styles.legend}>Appetite</Text>
      <View style={styles.chips}>
        {appetiteOptions.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            active={value.appetite === opt.value}
            onPress={() =>
              patch({ appetite: value.appetite === opt.value ? null : opt.value })
            }
          />
        ))}
      </View>

      <Text style={styles.legend}>Exercise</Text>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Exercised today</Text>
        <Switch
          value={value.exercised}
          onValueChange={(v) =>
            patch({ exercised: v, exercise_minutes: v ? value.exercise_minutes : null })
          }
          disabled={busy}
        />
      </View>
      {value.exercised ? (
        <>
          <Text style={styles.label}>Minutes</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="e.g. 30"
            placeholderTextColor={colors.textMuted}
            editable={!busy}
            value={value.exercise_minutes == null ? '' : String(value.exercise_minutes)}
            onChangeText={(t) => setNullableNumber('exercise_minutes', t)}
          />
        </>
      ) : null}

      <Text style={styles.legend}>Symptoms or changes today</Text>
      <Text style={styles.hint}>
        Select any that apply today, including symptoms from your tracking list.
      </Text>
      <View style={styles.chips}>
        {symptomOptions.map((s) => (
          <Chip key={s} label={s} active={value.symptoms.includes(s)} onPress={() => toggleSymptom(s)} />
        ))}
      </View>
      <View style={styles.customRow}>
        <TextInput
          style={[styles.input, styles.customInput]}
          value={customSymptom}
          onChangeText={setCustomSymptom}
          editable={!busy}
          placeholder="e.g. Chest tightness today"
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={addCustomSymptom}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, (!customSymptom.trim() || busy) && styles.disabled]}
          disabled={!customSymptom.trim() || busy}
          onPress={addCustomSymptom}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.legend}>Notes for your clinician</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        multiline
        editable={!busy}
        placeholder="Anything else to mention at your next visit"
        placeholderTextColor={colors.textMuted}
        value={value.notes}
        onChangeText={(t) => patch({ notes: t })}
      />

      <Pressable
        onPress={onSubmit}
        disabled={busy}
        style={[styles.saveBtn, busy && styles.disabled]}
      >
        <Text style={styles.saveBtnText}>{busy ? 'Saving…' : submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  wrapCompact: { gap: spacing.sm },
  legend: { marginTop: spacing.sm, fontSize: 13, fontWeight: '900', color: colors.text },
  hint: { color: colors.textMuted, lineHeight: 18 },
  row: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  notes: { minHeight: 90, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: '#67e8f9', backgroundColor: '#ecfeff' },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: colors.accentDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, fontWeight: '700' },
  customRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: { flex: 1 },
  addBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  addBtnText: { fontWeight: '900', color: colors.text },
  saveBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  disabled: { opacity: 0.6 },
});

