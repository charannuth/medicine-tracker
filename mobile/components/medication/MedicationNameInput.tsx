import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeProvider';
import { MIN_RXNORM_QUERY_LEN, useRxNormDrugSearch } from '../../hooks/useRxNormDrugSearch';
import {
  mergeMedicationSuggestions,
  searchLocalMedicationSuggestions,
  type MedicationSuggestion,
} from '../../lib/medicationSuggestions';
import { radii, spacing } from '../../constants/theme';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: MedicationSuggestion) => void;
  placeholder?: string;
};

export function MedicationNameInput({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'e.g. Tylenol, Albuterol',
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const query = value.trim();
  const { names: rxnormNames, loading: rxnormLoading, failed: rxnormFailed } =
    useRxNormDrugSearch(query);

  const localSuggestions = useMemo(
    () => searchLocalMedicationSuggestions(value, 8),
    [value],
  );
  const suggestions = useMemo(
    () => mergeMedicationSuggestions(localSuggestions, rxnormNames, 12),
    [localSuggestions, rxnormNames],
  );

  const showList = focused && query.length > 0 && suggestions.length > 0;
  const showSearchHint = query.length >= MIN_RXNORM_QUERY_LEN;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="words"
        autoCorrect={false}
      />
      {showSearchHint ? (
        <View style={styles.hintRow}>
          {rxnormLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : null}
          <Text style={styles.hint}>
            {rxnormLoading
              ? 'Searching RxNorm (NIH drug names)…'
              : rxnormFailed
                ? 'Showing common names only — RxNorm search unavailable.'
                : 'Suggestions from your list and RxNorm appear as you type.'}
          </Text>
        </View>
      ) : null}
      {showList ? (
        <View style={styles.list}>
          {suggestions.map((s, index) => (
            <Pressable
              key={`${s.name}-${index}`}
              style={styles.item}
              onPress={() => {
                onChange(s.name);
                onSelectSuggestion?.(s);
                setFocused(false);
              }}
            >
              <Text style={styles.itemName}>{s.name}</Text>
              {s.genericName ? (
                <Text style={styles.itemSub}>Generic: {s.genericName}</Text>
              ) : s.doseMg || s.dosePills ? (
                <Text style={styles.itemSub}>
                  {[s.dosePills, s.doseMg].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    hint: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    list: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    item: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemName: { fontWeight: '700', color: colors.text },
    itemSub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  });
}
