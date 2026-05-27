import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radii, spacing } from '../constants/theme';
import { setOnboardingDone } from '../lib/settings';

type Props = {
  userId: string;
  visible: boolean;
  onDone: () => void;
};

export function OnboardingModal({ userId, visible, onDone }: Props) {
  const router = useRouter();

  function finish() {
    void setOnboardingDone(userId);
    onDone();
  }

  function handleAdd() {
    void setOnboardingDone(userId);
    onDone();
    router.push('/medications/new');
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to Dr. Dose</Text>
          <View style={styles.list}>
            <Text style={styles.item}>
              1. Add your medications with dose times (12-hour + AM/PM).
            </Text>
            <Text style={styles.item}>
              2. On <Text style={styles.bold}>Today</Text>, mark each dose when you take it.
            </Text>
            <Text style={styles.item}>
              3. Build a streak by logging every scheduled dose each day.
            </Text>
            <Text style={styles.item}>
              4. Use <Text style={styles.link} onPress={finish}>History</Text> for your calendar
              and daily notes; <Text style={styles.link} onPress={finish}>Streaks</Text> for tulip
              badges.
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.ghostBtn} onPress={finish}>
              <Text style={styles.ghostText}>Skip for now</Text>
            </Pressable>
            <Pressable style={styles.primaryBtn} onPress={handleAdd}>
              <Text style={styles.primaryText}>Add first medication</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  list: { gap: spacing.sm },
  item: { color: colors.textMuted, lineHeight: 22, fontSize: 15 },
  bold: { fontWeight: '800', color: colors.text },
  link: { color: colors.accent, fontWeight: '800' },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  ghostBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostText: { color: colors.textMuted, fontWeight: '800' },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
