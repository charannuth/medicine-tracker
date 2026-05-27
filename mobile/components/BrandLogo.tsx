import { Text, View } from 'react-native';
import type { ColorPalette } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

function makeStyles(colors: ColorPalette) {
  return {
    wrap: {
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    text: {
      fontSize: 34,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      color: colors.brandMaroon,
    },
  };
}

export function BrandLogo() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Dr. Dose</Text>
    </View>
  );
}
