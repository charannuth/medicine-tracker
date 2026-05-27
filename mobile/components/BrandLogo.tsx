import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';

export function BrandLogo() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>Dr. Dose</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  text: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.brandMaroon,
  },
});
