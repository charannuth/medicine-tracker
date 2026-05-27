import { StyleSheet, Text, View } from 'react-native';
import type { TrackingCalendarLegendItem } from '../../lib/tracking/calendarTypes';
import { colors, radii, spacing } from '../../constants/theme';
import { legendDotStyle, legendHeartStyle, legendSwatchStyle } from './calendarLegendStyles';

type Props = {
  items: TrackingCalendarLegendItem[];
  title?: string;
};

function LegendSwatch({ swatchClass }: { swatchClass: string }) {
  return <View style={legendSwatchStyle(swatchClass)} accessibilityElementsHidden />;
}

function LegendIcon({ icon }: { icon: 'heart' | 'dot' }) {
  if (icon === 'heart') {
    return (
      <Text style={legendHeartStyle} accessibilityElementsHidden>
        ♥
      </Text>
    );
  }
  return <View style={legendDotStyle} accessibilityElementsHidden />;
}

export function TrackingCalendarLegend({ items, title = 'Calendar key' }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel={title}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.indicator}>
              {item.swatchClass ? <LegendSwatch swatchClass={item.swatchClass} /> : null}
              {item.icon ? <LegendIcon icon={item.icon} /> : null}
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '46%',
    flexGrow: 1,
    maxWidth: '100%',
    paddingVertical: 2,
  },
  indicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
});
