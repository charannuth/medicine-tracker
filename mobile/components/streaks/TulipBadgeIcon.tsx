import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

function bouquetColorsForMinDays(minDays: number): string[] {
  if (minDays < 7) return ['#7c3aed'];
  if (minDays < 14) return ['#7c3aed', '#facc15'];
  if (minDays < 30) return ['#7c3aed', '#facc15', '#fb923c'];
  if (minDays < 60) return ['#7c3aed', '#facc15', '#fb923c', '#f472b6'];
  if (minDays < 100) return ['#7c3aed', '#facc15', '#fb923c', '#f472b6', '#f8fafc'];
  return ['#7c3aed', '#facc15', '#fb923c', '#f472b6', '#f8fafc', '#ef4444'];
}

function Tulip({
  x,
  color,
  opacity,
}: {
  x: number;
  color: string;
  opacity: number;
}) {
  return (
    <G translateX={x} opacity={opacity}>
      <Path
        d="M16 38 C16 30 15.5 24 16 18"
        stroke="#16a34a"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.95}
      />
      <Path
        d="M16 30 C10 28 9 24 11 22 C13 20 16 22 16 25"
        fill="#22c55e"
        opacity={0.85}
      />
      <Path
        d="M16 29 C22 27 23 23 21 21 C19 19 16 21 16 24"
        fill="#16a34a"
        opacity={0.75}
      />
      <G translateX={16} translateY={14}>
        <Ellipse cx={-3.2} cy={-2.5} rx={4.2} ry={6.7} fill={color} />
        <Ellipse cx={3.2} cy={-2.5} rx={4.2} ry={6.7} fill={color} />
        <Ellipse cx={0} cy={-4.2} rx={4.9} ry={7.8} fill={color} />
        <Circle cx={0} cy={0.5} r={2.3} fill="rgba(255,255,255,0.35)" />
      </G>
    </G>
  );
}

export function TulipBadgeIcon({
  earned,
  minDays,
  size = 48,
}: {
  earned: boolean;
  minDays: number;
  size?: number;
}) {
  const colorsList = bouquetColorsForMinDays(minDays);
  const baseOpacity = earned ? 1 : 0.25;
  const scale = size / 40;

  return (
    <Svg width={size} height={size * 1.25} viewBox="-16 0 64 40">
      <G transform={`scale(${scale})`}>
        {colorsList.length === 1 ? (
          <Tulip x={0} color={colorsList[0]} opacity={baseOpacity} />
        ) : (
          colorsList.slice(0, 6).map((c, idx) => {
            const offsets = [-8, 8, -4, 4, -12, 12];
            const x = offsets[idx] ?? 0;
            const depth = idx === 0 || idx === 1 ? 1 : 0.92;
            return <Tulip key={`${c}-${idx}`} x={x} color={c} opacity={baseOpacity * depth} />;
          })
        )}
      </G>
    </Svg>
  );
}
