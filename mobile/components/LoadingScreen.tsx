import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ColorPalette } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';

export function LoadingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bg,
    },
  });
}
