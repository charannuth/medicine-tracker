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

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300] as const;

function TulipBloom({
  variant,
  scale = 1,
}: {
  variant: 'purple' | 'yellow';
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

  return (
    <G scale={scale}>
      <Ellipse cx={0} cy={2} rx={11} ry={14} fill={petalFill} />
      {PETAL_ANGLES.map((deg) => (
        <G key={deg} transform={`rotate(${deg})`}>
          <Ellipse cx={0} cy={-20} rx={14} ry={28} fill={petalFill} />
          <Ellipse cx={-3} cy={-22} rx={5} ry={14} fill={petalShine} />
        </G>
      ))}
      <Circle
        cx={0}
        cy={0}
        r={14}
        stroke={ringStroke}
        strokeWidth={1.5}
        fill="none"
      />
      <Circle cx={0} cy={0} r={10} fill={centerFill} />
      {[0, 72, 144, 216, 288].map((deg) => (
        <Circle
          key={deg}
          cx={0}
          cy={-5}
          r={1.8}
          fill={pollenFill}
          transform={`rotate(${deg})`}
        />
      ))}
    </G>
  );
}

function StreakButterflyInScene() {
  return (
    <G>
      <G>
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
      </G>
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
    </G>
  );
}

type Props = {
  dual: boolean;
};

/** SVG tulips + butterfly (final pose on purple bloom for dual). */
export function StreakCelebrationScene({ dual }: Props) {
  const width = dual ? 168 : 120;
  const height = 168;
  const viewBox = dual ? '0 0 160 160' : '0 0 120 160';

  return (
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
          <Path
            d="M80 155 C80 128 78 104 80 84"
            stroke="#16a34a"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M80 84 C68 78 54 70 46 58"
            stroke="#16a34a"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M80 84 C92 78 106 70 114 56"
            stroke="#16a34a"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M80 120 Q52 112 48 96 Q66 104 80 114"
            fill="#16a34a"
          />
          <Path
            d="M80 108 Q108 100 110 84 Q92 94 80 102"
            fill="#16a34a"
          />
          <G transform="translate(46, 50)">
            <TulipBloom variant="purple" />
          </G>
          <G transform="translate(114, 48)">
            <TulipBloom variant="yellow" scale={0.92} />
          </G>
          <G transform="translate(38, 34) rotate(-10)">
            <StreakButterflyInScene />
          </G>
        </>
      ) : (
        <>
          <Path
            d="M60 155 C60 128 57 102 60 78 C62 68 60 62 60 58"
            stroke="#16a34a"
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M60 118 Q32 110 28 94 Q46 102 60 112"
            fill="#16a34a"
          />
          <Path
            d="M60 102 Q92 94 94 78 Q74 88 60 96"
            fill="#16a34a"
          />
          <G transform="translate(60, 50)">
            <TulipBloom variant="purple" />
          </G>
          <G transform="translate(54, 36) rotate(-8)">
            <StreakButterflyInScene />
          </G>
        </>
      )}
    </Svg>
  );
}
