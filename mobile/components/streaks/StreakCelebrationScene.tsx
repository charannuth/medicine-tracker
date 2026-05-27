import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300] as const;
const SCENE_MS = 4200;

const SPARKLE_LAYOUT = [
  { top: '18%', left: '12%', delay: 2600 },
  { top: '8%', right: '18%', delay: 2750, size: 5 },
  { top: '32%', right: '8%', delay: 2900 },
  { top: '28%', left: '6%', delay: 3050, size: 4 },
  { top: '42%', left: '22%', delay: 3150 },
  { top: '38%', right: '22%', delay: 3250, size: 4 },
  { top: '14%', right: '10%', delay: 3350 },
  { top: '24%', right: '4%', delay: 3500, size: 5 },
] as const;

function bloomOpacity(clock: SharedValue<number>, startMs: number) {
  'worklet';
  return interpolate(clock.value, [startMs, startMs + 900], [0, 1], Extrapolation.CLAMP);
}

function bloomScale(clock: SharedValue<number>, startMs: number) {
  'worklet';
  return interpolate(
    clock.value,
    [startMs, startMs + 200, startMs + 900],
    [0.15, 0.55, 1],
    Extrapolation.CLAMP,
  );
}

function petalOpacity(clock: SharedValue<number>, index: number, bloomStart: number) {
  'worklet';
  const delay = bloomStart + 50 + index * 120;
  return interpolate(clock.value, [delay, delay + 700], [0, 1], Extrapolation.CLAMP);
}

function petalScaleY(clock: SharedValue<number>, index: number, bloomStart: number) {
  'worklet';
  const delay = bloomStart + 50 + index * 120;
  return interpolate(
    clock.value,
    [delay, delay + 200, delay + 700],
    [0.08, 0.5, 1],
    Extrapolation.CLAMP,
  );
}

function TulipPetal({
  clock,
  deg,
  index,
  bloomStart,
  petalFill,
  petalShine,
}: {
  clock: SharedValue<number>;
  deg: number;
  index: number;
  bloomStart: number;
  petalFill: string;
  petalShine: string;
}) {
  const petalProps = useAnimatedProps(() => ({
    opacity: petalOpacity(clock, index, bloomStart),
    transform: [{ rotate: `${deg}deg` }, { scaleY: petalScaleY(clock, index, bloomStart) }],
  }));

  const shineProps = useAnimatedProps(() => ({
    opacity: interpolate(
      clock.value,
      [bloomStart + 250 + index * 120, bloomStart + 550 + index * 120],
      [0, 0.85],
      Extrapolation.CLAMP,
    ),
    transform: [{ rotate: `${deg}deg` }, { scaleY: petalScaleY(clock, index, bloomStart) }],
  }));

  return (
    <G>
      <AnimatedG animatedProps={petalProps}>
        <Ellipse cx={0} cy={-20} rx={14} ry={28} fill={petalFill} />
      </AnimatedG>
      <AnimatedG animatedProps={shineProps}>
        <Ellipse cx={-3} cy={-22} rx={5} ry={14} fill={petalShine} />
      </AnimatedG>
    </G>
  );
}

function TulipPollen({
  clock,
  deg,
  index,
  bloomStart,
  pollenFill,
}: {
  clock: SharedValue<number>;
  deg: number;
  index: number;
  bloomStart: number;
  pollenFill: string;
}) {
  const pollenProps = useAnimatedProps(() => ({
    opacity: interpolate(
      clock.value,
      [bloomStart + 1250 + index * 70, bloomStart + 1450 + index * 70],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [{ rotate: `${deg}deg` }, { scale: bloomScale(clock, bloomStart + 1250) }],
  }));

  return (
    <AnimatedCircle cx={0} cy={-5} r={1.8} fill={pollenFill} animatedProps={pollenProps} />
  );
}

function TulipBloomAnimated({
  clock,
  variant,
  bloomStart,
  scale = 1,
}: {
  clock: SharedValue<number>;
  variant: 'purple' | 'yellow';
  bloomStart: number;
  scale?: number;
}) {
  const petalFill =
    variant === 'purple' ? 'url(#streak-petal-fill-purple)' : 'url(#streak-petal-fill-yellow)';
  const petalShine =
    variant === 'purple'
      ? 'url(#streak-petal-shine-purple)'
      : 'url(#streak-petal-shine-yellow)';
  const centerFill =
    variant === 'purple' ? 'url(#streak-center-gold)' : 'url(#streak-center-yellow)';
  const ringStroke = variant === 'purple' ? '#fbbf24' : '#f59e0b';
  const pollenFill = variant === 'purple' ? '#fde68a' : '#fef9c3';

  const budProps = useAnimatedProps(() => ({
    opacity: interpolate(
      clock.value,
      [bloomStart, bloomStart + 850],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [{ scale: bloomScale(clock, bloomStart) * 1.1 }],
  }));

  const centerRingProps = useAnimatedProps(() => ({
    opacity: interpolate(clock.value, [bloomStart + 950, bloomStart + 1200], [0, 0.55], Extrapolation.CLAMP),
    transform: [{ scale: bloomScale(clock, bloomStart + 950) }],
  }));

  const centerProps = useAnimatedProps(() => ({
    opacity: bloomOpacity(clock, bloomStart + 1050),
    transform: [{ scale: bloomScale(clock, bloomStart + 1050) }],
  }));

  return (
    <G transform={scale !== 1 ? `scale(${scale})` : undefined}>
      <AnimatedEllipse cx={0} cy={2} rx={11} ry={14} fill={petalFill} animatedProps={budProps} />
      {PETAL_ANGLES.map((deg, index) => (
        <TulipPetal
          key={deg}
          clock={clock}
          deg={deg}
          index={index}
          bloomStart={bloomStart}
          petalFill={petalFill}
          petalShine={petalShine}
        />
      ))}
      <AnimatedCircle
        cx={0}
        cy={0}
        r={14}
        stroke={ringStroke}
        strokeWidth={1.5}
        fill="none"
        animatedProps={centerRingProps}
      />
      <AnimatedCircle cx={0} cy={0} r={10} fill={centerFill} animatedProps={centerProps} />
      {[0, 72, 144, 216, 288].map((deg, index) => (
        <TulipPollen
          key={deg}
          clock={clock}
          deg={deg}
          index={index}
          bloomStart={bloomStart}
          pollenFill={pollenFill}
        />
      ))}
    </G>
  );
}

function StreakButterflyAnimated({
  clock,
  dual,
}: {
  clock: SharedValue<number>;
  dual: boolean;
}) {
  const startMs = 2200;
  const endMs = 4700;
  const fromX = dual ? 168 : 128;
  const fromY = dual ? 82 : 78;
  const toX = dual ? 38 : 54;
  const toY = dual ? 34 : 36;
  const fromRot = dual ? 14 : 12;
  const toRot = dual ? -10 : -8;

  const bodyProps = useAnimatedProps(() => {
    const opacity =
      clock.value < startMs
        ? 0
        : interpolate(clock.value, [startMs, startMs + 300], [0, 1], Extrapolation.CLAMP);
    const x = interpolate(clock.value, [startMs, endMs], [fromX, toX], Extrapolation.CLAMP);
    const y = interpolate(clock.value, [startMs, endMs], [fromY, toY], Extrapolation.CLAMP);
    const rot = interpolate(clock.value, [startMs, endMs], [fromRot, toRot], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${rot}deg` }],
    };
  });

  const wingProps = useAnimatedProps(() => {
    if (clock.value < startMs) {
      return { transform: [{ rotate: '0deg' }] };
    }
    const flap = Math.sin(((clock.value - startMs) / 160) * Math.PI) * 5;
    return { transform: [{ rotate: `${flap}deg` }] };
  });

  return (
    <AnimatedG animatedProps={bodyProps}>
      <AnimatedG animatedProps={wingProps}>
        <Path
          d="M4 10 C-14 0 -24 8 -20 22 C-12 28 2 20 4 14 Z"
          fill="url(#streak-bfly-wing)"
          stroke="#c2410c"
          strokeWidth={1.25}
          strokeLinejoin="round"
        />
        <Path
          d="M4 16 C-10 18 -16 28 -10 30 C-4 26 4 22 4 18 Z"
          fill="url(#streak-bfly-wing-soft)"
          stroke="#c2410c"
          strokeWidth={1.15}
          strokeLinejoin="round"
        />
        <Circle cx={-10} cy={12} r={2.2} fill="#fff7ed" opacity={0.9} />
        <Circle cx={-14} cy={20} r={1.5} fill="#fff7ed" opacity={0.85} />
      </AnimatedG>
      <Ellipse cx={8} cy={16} rx={3.2} ry={8.5} fill="#4a2c20" />
      <Circle cx={10} cy={6} r={3.4} fill="#4a2c20" />
      <Circle cx={8.5} cy={5.5} r={1.1} fill="#fef9c3" />
      <Path
        d="M9 3.5 Q7 0.5 5 0"
        stroke="#4a2c20"
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M11 3.5 Q13 0.5 15 0"
        stroke="#4a2c20"
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
      />
    </AnimatedG>
  );
}

function Sparkle({
  clock,
  layout,
}: {
  clock: SharedValue<number>;
  layout: (typeof SPARKLE_LAYOUT)[number];
}) {
  const size = 'size' in layout ? layout.size : 6;
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      clock.value,
      [layout.delay, layout.delay + 400],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          clock.value,
          [layout.delay, layout.delay + 350],
          [0, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const posStyle = {
    top: layout.top,
    left: 'left' in layout ? layout.left : undefined,
    right: 'right' in layout ? layout.right : undefined,
  };

  return (
    <Animated.View
      style={[
        styles.sparkle,
        posStyle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

type Props = {
  dual: boolean;
};

/** Animated SVG tulips + butterfly (matches web celebration timing). */
export function StreakCelebrationScene({ dual }: Props) {
  const clock = useSharedValue(0);
  const width = dual ? 168 : 120;
  const height = 168;
  const viewBox = dual ? '0 0 160 160' : '0 0 120 160';

  useEffect(() => {
    clock.value = 0;
    clock.value = withTiming(SCENE_MS, {
      duration: SCENE_MS,
      easing: Easing.linear,
    });
  }, [clock, dual]);

  const wrapStyle = useAnimatedStyle(() => {
    const riseY = interpolate(clock.value, [0, 1150], [32, 0], Extrapolation.CLAMP);
    const riseScale = interpolate(clock.value, [0, 1150], [0.78, 1], Extrapolation.CLAMP);
    const swayY =
      clock.value > 3200
        ? Math.sin(((clock.value - 3200) / 750) * Math.PI * 2) * 2
        : 0;
    return {
      opacity: interpolate(clock.value, [0, 400], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: riseY + swayY }, { scale: riseScale }],
    };
  });

  const trunkProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(clock.value, [200, 1100], [85, 0], Extrapolation.CLAMP),
  }));

  const branchLeftProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(clock.value, [400, 1200], [40, 0], Extrapolation.CLAMP),
  }));

  const branchRightProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(clock.value, [500, 1300], [40, 0], Extrapolation.CLAMP),
  }));

  const singleStemProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(clock.value, [200, 1100], [110, 0], Extrapolation.CLAMP),
  }));

  const leafLeftProps = useAnimatedProps(() => ({
    opacity: interpolate(clock.value, [950, 1400], [0, 1], Extrapolation.CLAMP),
  }));

  const leafRightProps = useAnimatedProps(() => ({
    opacity: interpolate(clock.value, [1150, 1600], [0, 1], Extrapolation.CLAMP),
  }));

  const purpleStart = 1200;
  const yellowStart = dual ? 1850 : purpleStart;

  return (
    <View style={[styles.container, { width, height: height + 16 }]}>
      <Animated.View style={[styles.svgWrap, { width, height }, wrapStyle]}>
        <Svg width={width} height={height} viewBox={viewBox} fill="none">
          <Defs>
            <LinearGradient id="streak-bfly-wing" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fde68a" />
              <Stop offset="50%" stopColor="#fbbf24" />
              <Stop offset="100%" stopColor="#f97316" />
            </LinearGradient>
            <LinearGradient id="streak-bfly-wing-soft" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#fef3c7" />
              <Stop offset="100%" stopColor="#f59e0b" />
            </LinearGradient>
            <LinearGradient id="streak-petal-fill-purple" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#a78bfa" />
              <Stop offset="45%" stopColor="#7c3aed" />
              <Stop offset="100%" stopColor="#5b21b6" />
            </LinearGradient>
            <LinearGradient id="streak-petal-shine-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ede9fe" stopOpacity={0.9} />
              <Stop offset="100%" stopColor="#c4b5fd" stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id="streak-petal-fill-yellow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#fef08a" />
              <Stop offset="45%" stopColor="#facc15" />
              <Stop offset="100%" stopColor="#ca8a04" />
            </LinearGradient>
            <LinearGradient id="streak-petal-shine-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fffbeb" stopOpacity={0.95} />
              <Stop offset="100%" stopColor="#fde047" stopOpacity={0} />
            </LinearGradient>
            <RadialGradient id="streak-center-gold" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fde047" />
              <Stop offset="55%" stopColor="#fbbf24" />
              <Stop offset="100%" stopColor="#d97706" />
            </RadialGradient>
            <RadialGradient id="streak-center-yellow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fffbeb" />
              <Stop offset="55%" stopColor="#fde047" />
              <Stop offset="100%" stopColor="#eab308" />
            </RadialGradient>
          </Defs>

          {dual ? (
            <>
              <AnimatedPath
                d="M80 155 C80 128 78 104 80 84"
                stroke="#16a34a"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="85"
                animatedProps={trunkProps}
              />
              <AnimatedPath
                d="M80 84 C68 78 54 70 46 58"
                stroke="#16a34a"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="40"
                animatedProps={branchLeftProps}
              />
              <AnimatedPath
                d="M80 84 C92 78 106 70 114 56"
                stroke="#16a34a"
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="40"
                animatedProps={branchRightProps}
              />
              <AnimatedPath
                d="M80 120 Q52 112 48 96 Q66 104 80 114"
                fill="#16a34a"
                animatedProps={leafLeftProps}
              />
              <AnimatedPath
                d="M80 108 Q108 100 110 84 Q92 94 80 102"
                fill="#16a34a"
                animatedProps={leafRightProps}
              />
              <G transform="translate(46, 50)">
                <TulipBloomAnimated clock={clock} variant="purple" bloomStart={purpleStart} />
              </G>
              <G transform="translate(114, 48)">
                <TulipBloomAnimated
                  clock={clock}
                  variant="yellow"
                  bloomStart={yellowStart}
                  scale={0.92}
                />
              </G>
            </>
          ) : (
            <>
              <AnimatedPath
                d="M60 155 C60 128 57 102 60 78 C62 68 60 62 60 58"
                stroke="#16a34a"
                strokeWidth={4}
                strokeLinecap="round"
                fill="none"
                strokeDasharray="110"
                animatedProps={singleStemProps}
              />
              <AnimatedPath
                d="M60 118 Q32 110 28 94 Q46 102 60 112"
                fill="#16a34a"
                animatedProps={leafLeftProps}
              />
              <AnimatedPath
                d="M60 102 Q92 94 94 78 Q74 88 60 96"
                fill="#16a34a"
                animatedProps={leafRightProps}
              />
              <G transform="translate(60, 50)">
                <TulipBloomAnimated clock={clock} variant="purple" bloomStart={purpleStart} />
              </G>
            </>
          )}

          <StreakButterflyAnimated clock={clock} dual={dual} />
        </Svg>
      </Animated.View>

      <View style={[styles.sparkleLayer, { width, height }]} pointerEvents="none">
        {SPARKLE_LAYOUT.map((layout, index) => (
          <Sparkle key={index} clock={clock} layout={layout} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFill,
  },
  sparkle: {
    position: 'absolute',
    backgroundColor: '#fde047',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
