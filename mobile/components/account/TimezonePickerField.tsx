import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeProvider';
import { listTimezones } from '../../lib/settings';
import { radii, spacing } from '../../constants/theme';

type Props = {
  value: string;
  onChange: (timezone: string) => void;
};

export function TimezonePickerField({ value, onChange }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const styles = makeStyles(colors);

  const zones = useMemo(() => listTimezones(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => z.toLowerCase().includes(q));
  }, [zones, query]);

  return (
    <View>
      <Text style={styles.label}>Timezone</Text>
      <Pressable style={styles.selectBtn} onPress={() => setOpen(true)}>
        <Text style={styles.selectText} numberOfLines={2}>
          {value}
        </Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modalSafe} edges={['top', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose timezone</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.done}>Done</Text>
            </Pressable>
          </View>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search timezones"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.zoneRow, item === value && styles.zoneRowActive]}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <Text style={[styles.zoneText, item === value && styles.zoneTextActive]}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    label: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
    selectBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    selectText: { color: colors.text, fontSize: 15 },
    modalSafe: { flex: 1, backgroundColor: colors.bg },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    done: { color: colors.accent, fontWeight: '800', fontSize: 16 },
    search: {
      margin: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    zoneRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    zoneRowActive: { backgroundColor: colors.pendingBg },
    zoneText: { color: colors.text, fontSize: 15 },
    zoneTextActive: { fontWeight: '800', color: colors.accent },
  });
}
