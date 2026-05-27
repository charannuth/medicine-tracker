import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Meridiem } from '../../lib/dates';
import { colors, radii, spacing } from '../../constants/theme';
import { normalizeTime12Display } from '../../lib/doseTimeInput';

type Props = {
  time12: string;
  period: Meridiem;
  label: string;
  onChange: (next: { time12: string; period: Meridiem }) => void;
};

export function DoseTimeInput({ time12, period, label, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputs}>
        <TextInput
          style={styles.timeInput}
          value={time12}
          onChangeText={(t) => onChange({ time12: t, period })}
          onBlur={() => {
            if (!time12.trim()) return;
            try {
              onChange({ time12: normalizeTime12Display(time12), period });
            } catch {
              // keep partial
            }
          }}
          placeholder="8:00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />
        <View style={styles.periodWrap}>
          {(['AM', 'PM'] as Meridiem[]).map((p) => (
            <Pressable
              key={p}
              style={[styles.periodBtn, period === p && styles.periodActive]}
              onPress={() => onChange({ time12, period: p })}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, marginBottom: spacing.sm },
  label: { fontWeight: '700', color: colors.text, fontSize: 14 },
  inputs: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  periodWrap: { flexDirection: 'row', gap: 4 },
  periodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  periodText: { fontWeight: '700', color: colors.textMuted },
  periodTextActive: { color: '#fff' },
});
