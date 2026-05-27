import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { MedicationWithStatus } from '../lib/types';
import {
  emptyPrnDoseLogPayload,
  isPrnLogReady,
  type PrnDoseLogPayload,
} from '../lib/prnCheckIn';
import {
  prnAmountPlaceholder,
  prnSymptomHint,
  prnSymptomLegend,
  prnSymptomOptionsForMed,
} from '../lib/prnSymptoms';
import { colors, radii, spacing } from '../constants/theme';

type Props = {
  medication: MedicationWithStatus;
  disabled?: boolean;
  onLog: (payload: PrnDoseLogPayload) => Promise<void> | void;
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
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function PrnDoseLogPanel({ medication, disabled = false, onLog }: Props) {
  const symptomPresets = useMemo(() => prnSymptomOptionsForMed(medication), [medication]);
  const [draft, setDraft] = useState(emptyPrnDoseLogPayload());
  const [customSymptom, setCustomSymptom] = useState('');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const max = medication.max_doses_per_day;
  const atMax = max != null && max > 0 && medication.dosesTakenToday >= max;

  function patch(partial: Partial<PrnDoseLogPayload>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function toggleSymptom(symptom: string) {
    const set = new Set(draft.symptoms);
    if (set.has(symptom)) set.delete(symptom);
    else set.add(symptom);
    patch({ symptoms: [...set] });
  }

  function addCustomSymptom() {
    const value = customSymptom.trim();
    if (!value) return;
    const exists = draft.symptoms.some((s) => s.toLowerCase() === value.toLowerCase());
    if (!exists) patch({ symptoms: [...draft.symptoms, value] });
    setCustomSymptom('');
  }

  async function handleLog() {
    if (!isPrnLogReady(draft) || atMax || disabled || saving) return;
    setSaving(true);
    try {
      await onLog({
        amount: draft.amount.trim(),
        symptoms: draft.symptoms,
        reason: draft.reason.trim(),
        notes: draft.notes.trim(),
      });
      setDraft(emptyPrnDoseLogPayload());
      setSavedMessage('Logged — saved for your history.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.wrap} accessibilityLabel={`Log ${medication.name}`}>
      {savedMessage ? <Text style={styles.saved}>{savedMessage}</Text> : null}

      {max != null && max > 0 ? (
        <Text style={styles.maxHint}>
          {medication.dosesTakenToday} of {max} max dose{max === 1 ? '' : 's'} logged today
        </Text>
      ) : null}

      <Text style={styles.legend}>Why are you taking it now?</Text>
      <TextInput
        style={styles.input}
        value={draft.reason}
        editable={!disabled && !saving}
        placeholder="e.g. shortness of breath, headache started"
        placeholderTextColor={colors.textMuted}
        onChangeText={(v) => patch({ reason: v })}
      />

      <Text style={styles.legend}>{prnSymptomLegend(medication)}</Text>
      <Text style={styles.hint}>{prnSymptomHint(medication)}</Text>
      <View style={styles.chips}>
        {symptomPresets.map((s) => (
          <Chip key={s} label={s} active={draft.symptoms.includes(s)} onPress={() => toggleSymptom(s)} />
        ))}
      </View>
      <View style={styles.customRow}>
        <TextInput
          style={[styles.input, styles.customInput]}
          value={customSymptom}
          editable={!disabled && !saving}
          placeholder="Add a symptom not listed"
          placeholderTextColor={colors.textMuted}
          onChangeText={setCustomSymptom}
          onSubmitEditing={addCustomSymptom}
          returnKeyType="done"
        />
        <Pressable
          onPress={addCustomSymptom}
          style={[styles.addChipBtn, (!customSymptom.trim() || disabled || saving) && styles.buttonDisabled]}
          disabled={!customSymptom.trim() || disabled || saving}
        >
          <Text style={styles.addChipText}>Add</Text>
        </Pressable>
      </View>

      <Text style={styles.legend}>How much did you take?</Text>
      <TextInput
        style={styles.input}
        value={draft.amount}
        editable={!disabled && !saving}
        placeholder={prnAmountPlaceholder(medication)}
        placeholderTextColor={colors.textMuted}
        onChangeText={(v) => patch({ amount: v })}
        returnKeyType="done"
        onSubmitEditing={handleLog}
      />

      <Text style={styles.legend}>Anything else? (optional)</Text>
      <TextInput
        style={[styles.input, styles.notes]}
        value={draft.notes}
        editable={!disabled && !saving}
        placeholder="Side effects, what helped before, etc."
        placeholderTextColor={colors.textMuted}
        onChangeText={(v) => patch({ notes: v })}
        multiline
      />

      <Pressable
        style={[
          styles.logButton,
          (disabled || atMax || !isPrnLogReady(draft) || saving) && styles.buttonDisabled,
        ]}
        disabled={disabled || atMax || !isPrnLogReady(draft) || saving}
        onPress={handleLog}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logButtonText}>
            {atMax ? 'Max doses reached' : 'Log dose'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  saved: {
    backgroundColor: colors.successBg,
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
    fontWeight: '700',
  },
  maxHint: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  legend: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '900',
    color: colors.text,
  },
  hint: {
    color: colors.textMuted,
    lineHeight: 18,
  },
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
  notes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: '#67e8f9',
    backgroundColor: '#ecfeff',
  },
  chipText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.accentDark,
  },
  customRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customInput: {
    flex: 1,
  },
  addChipBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addChipText: {
    fontWeight: '900',
    color: colors.text,
  },
  logButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

