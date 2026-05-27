import { useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  CALENDAR_SOURCE_ALL,
  calendarSourceOptions,
  type CalendarSourceId,
  type CalendarSourceMeta,
} from '../../lib/tracking/calendarSources';
import {
  CALENDAR_RANGE_OPTIONS,
  getCalendarWindow,
  shiftCalendarAnchor,
  type CalendarViewRange,
} from '../../lib/tracking/calendarRange';
import type {
  TrackingCalendarCell,
  TrackingCalendarData,
  TrackingCalendarEvent,
} from '../../lib/tracking/calendarTypes';
import type { TrackerId } from '../../lib/tracking/catalog';
import type { ColorPalette } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeProvider';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { SelectField } from './SelectField';
import { cellStylesFromClassNames, eventToneStyle } from './calendarCellStyles';
import { TrackingCalendarLegend } from './TrackingCalendarLegend';
import { useTrackingStyles } from './trackingStyles';

const MAX_VISIBLE_EVENTS = 3;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarUiStyles = ReturnType<typeof makeTrackingCalendarStyles>;

type Props = {
  today: string;
  anchor: string;
  range: CalendarViewRange;
  source: CalendarSourceId | null;
  selectedDate: string;
  enabledTrackers: TrackerId[];
  data: TrackingCalendarData;
  loading?: boolean;
  onAnchorChange: (date: string) => void;
  onRangeChange: (range: CalendarViewRange) => void;
  onSourceChange: (source: CalendarSourceId) => void;
  onSelectDate: (date: string) => void;
};

function DayMarkers({
  cell,
  detailed,
  styles,
}: {
  cell?: TrackingCalendarCell;
  detailed: boolean;
  styles: CalendarUiStyles;
}) {
  const events = cell?.events ?? [];
  const markers = cell?.markers ?? [];
  if (!detailed) {
    return (
      <View style={styles.markers}>
        {markers.includes('heart') ? <Text style={styles.heart}>♥</Text> : null}
        {markers.includes('dot') ? <View style={styles.symptomDot} /> : null}
        {!detailed &&
          events.some((e) => e.tone === 'cycle-symptom' || e.tone === 'hrt') && (
            <Text style={styles.heart}>♥</Text>
          )}
      </View>
    );
  }
  const visible = events.slice(0, MAX_VISIBLE_EVENTS);
  const overflow = events.length - visible.length;
  return (
    <View style={styles.eventList}>
      {visible.map((event) => (
        <EventPill key={event.id} event={event} pillBase={styles.eventPill} />
      ))}
      {overflow > 0 ? (
        <Text style={styles.eventMore}>+{overflow} more</Text>
      ) : null}
    </View>
  );
}

function EventPill({
  event,
  pillBase,
}: {
  event: TrackingCalendarEvent;
  pillBase: CalendarUiStyles['eventPill'];
}) {
  const { colors, isDark } = useTheme();
  const tone = eventToneStyle(event.tone, colors, isDark);
  return (
    <Text style={[pillBase, { backgroundColor: tone.bg, color: tone.text }]} numberOfLines={1}>
      {event.label}
    </Text>
  );
}

function MonthGrid({
  year,
  month,
  dates,
  cells,
  selectedDate,
  today,
  detailed,
  onSelectDate,
  styles,
  colors,
  isDark,
}: {
  year: number;
  month: number;
  dates: string[];
  cells: Map<string, TrackingCalendarCell>;
  selectedDate: string;
  today: string;
  detailed: boolean;
  onSelectDate: (date: string) => void;
  styles: CalendarUiStyles;
  colors: ColorPalette;
  isDark: boolean;
}) {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const gridCells: ({ date: string; label: string } | null)[] = [];
  for (let i = 0; i < firstDow; i++) gridCells.push(null);
  for (const date of dates) {
    gridCells.push({ date, label: String(parseInt(date.slice(8), 10)) });
  }

  return (
    <View style={styles.month}>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {gridCells.map((cell, i) =>
          cell?.date ? (
            <DayButton
              key={cell.date}
              date={cell.date}
              label={cell.label}
              cell={cells.get(cell.date)}
              selected={cell.date === selectedDate}
              isToday={cell.date === today}
              detailed={detailed}
              onPress={() => onSelectDate(cell.date)}
              styles={styles}
              colors={colors}
              isDark={isDark}
            />
          ) : (
            <View key={`pad-${i}`} style={styles.dayEmpty} />
          ),
        )}
      </View>
    </View>
  );
}

function DayButton({
  date,
  label,
  cell,
  selected,
  isToday,
  detailed,
  onPress,
  styles,
  colors,
  isDark,
}: {
  date: string;
  label: string;
  cell?: TrackingCalendarCell;
  selected: boolean;
  isToday: boolean;
  detailed: boolean;
  onPress: () => void;
  styles: CalendarUiStyles;
  colors: ColorPalette;
  isDark: boolean;
}) {
  const extra = cell ? cellStylesFromClassNames(cell.classNames, colors, isDark) : [];
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.day,
        detailed && styles.dayDetailed,
        ...extra,
        selected && styles.daySelected,
        isToday && styles.dayToday,
      ]}
    >
      <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{label}</Text>
      <DayMarkers cell={cell} detailed={detailed} styles={styles} />
    </Pressable>
  );
}

export function TrackingCalendar({
  today,
  anchor,
  range,
  source,
  selectedDate,
  enabledTrackers,
  data,
  loading = false,
  onAnchorChange,
  onRangeChange,
  onSourceChange,
  onSelectDate,
}: Props) {
  const { colors, isDark } = useTheme();
  const track = useTrackingStyles();
  const styles = useThemedStyles(makeTrackingCalendarStyles);
  const window = useMemo(() => getCalendarWindow(anchor, range), [anchor, range]);
  const sourceOptions = useMemo(
    () => calendarSourceOptions(enabledTrackers),
    [enabledTrackers],
  );
  const activeSource = sourceOptions.find((o) => o.id === source);
  const showGrid = !loading && activeSource?.support === 'full';
  const showPlannedHint = !loading && activeSource?.support === 'planned';
  const isOverview = source === CALENDAR_SOURCE_ALL;
  const detailedMonth =
    !window.isStripLayout && window.months.length === 1 && (isOverview || range === 'month');

  const rangeOptions = CALENDAR_RANGE_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  const sourceSelectOptions = sourceOptions.map((meta: CalendarSourceMeta) => ({
    value: meta.id,
    label: meta.support === 'full' ? meta.label : `${meta.label} (coming soon)`,
    disabled: meta.support !== 'full',
  }));

  return (
    <View style={styles.hub}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => onAnchorChange(shiftCalendarAnchor(anchor, range, -1))}>
          <Text style={styles.navArrow}>←</Text>
        </Pressable>
        <View style={styles.toolbarCenter}>
          <SelectField
            label="View"
            value={range}
            options={rangeOptions}
            onChange={(v) => onRangeChange(v as CalendarViewRange)}
          />
          {sourceOptions.length > 0 && source ? (
            <SelectField
              label="Show"
              value={source}
              options={sourceSelectOptions}
              onChange={(v) => onSourceChange(v as CalendarSourceId)}
            />
          ) : null}
          <Text style={styles.windowTitle}>{window.title}</Text>
        </View>
        <Pressable onPress={() => onAnchorChange(shiftCalendarAnchor(anchor, range, 1))}>
          <Text style={styles.navArrow}>→</Text>
        </Pressable>
      </View>

      {isOverview && !loading ? (
        <Text style={track.hint}>
          Birds-eye view — every enabled tracker on one calendar. Tap a day for details below.
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginVertical: spacing.md }} color={colors.accent} />
      ) : null}

      {!loading && data.legend.length > 0 ? (
        <TrackingCalendarLegend items={data.legend} />
      ) : null}

      {showPlannedHint && data.emptyMessage ? (
        <Text style={track.hint}>{data.emptyMessage}</Text>
      ) : null}

      {showGrid ? (
        window.isStripLayout ? (
          <View style={styles.strip}>
            {window.dates.map((date) => {
              const cell = data.cells.get(date);
              const d = new Date(`${date}T12:00:00`);
              return (
                <DayButton
                  key={date}
                  date={date}
                  label={String(d.getDate())}
                  cell={cell}
                  selected={date === selectedDate}
                  isToday={date === today}
                  detailed={false}
                  onPress={() => onSelectDate(date)}
                  styles={styles}
                  colors={colors}
                  isDark={isDark}
                />
              );
            })}
          </View>
        ) : window.months.length === 1 ? (
          <MonthGrid
            year={window.months[0].year}
            month={window.months[0].month}
            dates={window.months[0].dates}
            cells={data.cells}
            selectedDate={selectedDate}
            today={today}
            detailed={detailedMonth}
            onSelectDate={onSelectDate}
            styles={styles}
            colors={colors}
            isDark={isDark}
          />
        ) : (
          <View>
            {window.months.map((block) => (
              <MonthGrid
                key={`${block.year}-${block.month}`}
                year={block.year}
                month={block.month}
                dates={block.dates}
                cells={data.cells}
                selectedDate={selectedDate}
                today={today}
                detailed={false}
                onSelectDate={onSelectDate}
                styles={styles}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </View>
        )
      ) : null}

      {data.footer ? <View style={{ marginTop: spacing.sm }}>{data.footer}</View> : null}
    </View>
  );
}

function makeTrackingCalendarStyles(colors: ColorPalette) {
  return {
    hub: {
      marginVertical: spacing.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    toolbar: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    toolbarCenter: { flex: 1 },
    navArrow: { fontSize: 22, padding: 8, color: colors.text },
    windowTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center' as const,
      marginVertical: spacing.sm,
    },
    strip: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 6 },
    month: { marginBottom: spacing.md },
    weekdayRow: { flexDirection: 'row' as const, marginBottom: 4 },
    weekday: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.textMuted,
    },
    grid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
    day: {
      width: '14.285%' as const,
      aspectRatio: 1,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 2,
      alignItems: 'center' as const,
      justifyContent: 'flex-start' as const,
      backgroundColor: colors.bg,
    },
    dayDetailed: { minHeight: 72 },
    dayEmpty: {
      width: '14.285%' as const,
      aspectRatio: 1,
    },
    daySelected: { borderColor: colors.accent, borderWidth: 2 },
    dayToday: {},
    dayNum: { fontSize: 12, fontWeight: '700' as const, color: colors.text },
    dayNumSelected: { color: colors.accent },
    markers: { flexDirection: 'row' as const, gap: 2, marginTop: 2 },
    heart: { fontSize: 10, color: colors.brandCrimson },
    symptomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.partial },
    eventList: { width: '100%' as const, marginTop: 2 },
    eventPill: { fontSize: 8, paddingHorizontal: 2, borderRadius: 3, marginBottom: 1 },
    eventMore: { fontSize: 8, color: colors.textMuted },
  };
}
