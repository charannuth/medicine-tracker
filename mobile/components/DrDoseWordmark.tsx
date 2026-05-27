import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { colors } from '../constants/theme';

/**
 * Simple “red lava” wordmark animation: a moving gradient clipped to the text width.
 * (Not a perfect clone of the web shine yet, but gets the vibe and is performant.)
 */
export function DrDoseWordmark() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const translateX = useMemo(
    () =>
      shimmer.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, 50],
      }),
    [shimmer],
  );

  const mask = <Text style={styles.textMask}>Dr. Dose</Text>;

  return (
    <View style={styles.wrap} accessibilityRole="header" accessibilityLabel="Dr. Dose">
      <MaskedView maskElement={mask}>
        <View style={styles.wordmark}>
          <Animated.View style={[styles.gradientOverlay, { transform: [{ translateX }] }]}>
            <LinearGradient
              colors={[colors.brandDeep, colors.brandCrimson, '#fb7185', colors.brandMaroon]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradient}
            />
          </Animated.View>
        </View>
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    left: -60,
    right: -60,
    top: 0,
    bottom: 0,
  },
  gradient: {
    flex: 1,
  },
  textMask: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#000',
  },
});

