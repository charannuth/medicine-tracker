import { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../constants/theme';
import { STREAK_CELEBRATION_MILESTONE_DAYS } from '../lib/streakCelebration';

type Props = {
  streakDays: number;
  onDismiss: () => void;
};

export function StreakCelebration({ streakDays, onDismiss }: Props) {
  const dual = streakDays >= STREAK_CELEBRATION_MILESTONE_DAYS;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[styles.cardWrap, { opacity, transform: [{ scale }] }]}
          onStartShouldSetResponder={() => true}
        >
            <LinearGradient
              colors={['#fef3c7', '#fde68a', '#fbcfe8', '#f9a8d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.card}
            >
              <Text style={styles.emoji}>🦋</Text>
              <View style={styles.tulips}>
                <Text style={styles.tulip}>🌷</Text>
                {dual && <Text style={[styles.tulip, styles.tulipYellow]}>🌷</Text>}
              </View>
              <Text style={styles.title}>
                Streak × {STREAK_CELEBRATION_MILESTONE_DAYS} — week in bloom!
              </Text>
              <Text style={styles.body}>
                You logged every scheduled dose today for {STREAK_CELEBRATION_MILESTONE_DAYS} days in a row.
                Keep it up tomorrow.
              </Text>
              <Pressable style={styles.button} onPress={onDismiss}>
                <Text style={styles.buttonText}>Continue</Text>
              </Pressable>
            </LinearGradient>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
    overflow: 'hidden',
  },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  tulips: { flexDirection: 'row', gap: 16, marginBottom: spacing.md },
  tulip: { fontSize: 56 },
  tulipYellow: { marginTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
});
