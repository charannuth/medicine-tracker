import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing } from '../../constants/theme';

type Props = {
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
};

export function TagListField({
  label,
  hint,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type and tap Add',
}: Props) {
  const [draft, setDraft] = useState('');

  function addEntry(entry: string) {
    const trimmed = entry.trim();
    if (!trimmed) return;
    if (value.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setDraft('');
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      {value.length > 0 ? (
        <View style={styles.chips}>
          {value.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Pressable
                onPress={() => removeEntry(index)}
                hitSlop={8}
                accessibilityLabel={`Remove ${item}`}
              >
                <Text style={styles.chipRemove}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onSubmitEditing={() => addEntry(draft)}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={() => addEntry(draft)}>
          <Text style={styles.addBtnText}>Add</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsLabel}>Suggestions</Text>
          <View style={styles.suggestionChips}>
            {suggestions.map((suggestion) => {
              const taken = value.some((v) => v.toLowerCase() === suggestion.toLowerCase());
              return (
                <Pressable
                  key={suggestion}
                  disabled={taken}
                  onPress={() => addEntry(suggestion)}
                  style={[styles.suggestionChip, taken && styles.suggestionChipDisabled]}
                >
                  <Text
                    style={[
                      styles.suggestionChipText,
                      taken && styles.suggestionChipTextDisabled,
                    ]}
                  >
                    + {suggestion}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = {
  wrap: { gap: spacing.sm, marginTop: spacing.md },
  label: { fontSize: 15, fontWeight: '800' as const, color: colors.text },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.xs },
  chip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { color: colors.text, fontWeight: '600' as const, fontSize: 14 },
  chipRemove: { color: colors.textMuted, fontSize: 18, fontWeight: '700' as const, lineHeight: 20 },
  row: { flexDirection: 'row' as const, gap: spacing.sm, alignItems: 'center' as const },
  input: {
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
  addBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  addBtnText: { fontWeight: '700' as const, color: colors.text },
  suggestions: { gap: spacing.xs },
  suggestionsLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' as const },
  suggestionChips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.xs },
  suggestionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  suggestionChipDisabled: { opacity: 0.45 },
  suggestionChipText: { fontSize: 13, color: colors.accent, fontWeight: '600' as const },
  suggestionChipTextDisabled: { color: colors.textMuted },
};
