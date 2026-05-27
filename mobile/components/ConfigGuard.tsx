import { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ColorPalette } from '../constants/theme';
import { radii, spacing } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';
import { isSupabaseConfigured } from '../lib/supabase';

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (isSupabaseConfigured) {
    return children;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>Setup required</Text>
        <Text style={styles.body}>
          Add your Supabase credentials to mobile/.env:
        </Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=…</Text>
        <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY=…</Text>
        <Text style={styles.body}>
          See docs/SUPABASE_SETUP.md, then restart Expo with --clear.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    body: {
      fontSize: 15,
      color: colors.textMuted,
      lineHeight: 22,
    },
    code: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontSize: 13,
      color: colors.text,
      backgroundColor: colors.pendingBg,
      padding: spacing.sm,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
}
