import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, radii, spacing } from '../../constants/theme';
import { SelectField } from './SelectField';
import { cellStylesFromClassNames, eventToneStyle } from './calendarCellStyles';
import { TrackingCalendarLegend } from './TrackingCalendarLegend';
import { trackingStyles } from './trackingStyles';

const MAX_VISIBLE_EVENTS = 3;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

function DayMarkers({ cell, detailed }: { cell?: TrackingCalendarCell; detailed: boolean }) {
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
        <EventPill key={event.id} event={event} />
      ))}
      {overflow > 0 ? (
        <Text style={styles.eventMore}>+{overflow} more</Text>
      ) : null}
    </View>
  );
}

function EventPill({ event }: { event: TrackingCalendarEvent }) {
  const tone = eventToneStyle(event.tone);
  return (
    <Text style={[styles.eventPill, { backgroundColor: tone.bg, color: tone.text }]} numberOfLines={1}>
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
}: {
  year: number;
  month: number;
  dates: string[];
  cells: Map<string, TrackingCalendarCell>;
  selectedDate: string;
  today: string;
  detailed: boolean;
  onSelectDate: (date: string) => void;
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
}: {
  date: string;
  label: string;
  cell?: TrackingCalendarCell;
  selected: boolean;
  isToday: boolean;
  detailed: boolean;
  onPress: () => void;
}) {
  const extra = cell ? cellStylesFromClassNames(cell.classNames) : [];
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
      <DayMarkers cell={cell} detailed={detailed} />
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
        <Text style={trackingStyles.hint}>
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
        <Text style={trackingStyles.hint}>{data.emptyMessage}</Text>
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
              />
            ))}
          </View>
        )
      ) : null}

      {data.footer ? <View style={{ marginTop: spacing.sm }}>{data.footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hub: {
    marginVertical: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  toolbarCenter: { flex: 1 },
  navArrow: { fontSize: 22, padding: 8, color: colors.text },
  windowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  month: { marginBottom: spacing.md },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: {
    width: '14.285%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: colors.bg,
  },
  dayDetailed: { minHeight: 72 },
  dayEmpty: {
    width: '14.285%',
    aspectRatio: 1,
  },
  daySelected: { borderColor: colors.accent, borderWidth: 2 },
  dayToday: {},
  dayNum: { fontSize: 12, fontWeight: '700', color: colors.text },
  dayNumSelected: { color: colors.accent },
  markers: { flexDirection: 'row', gap: 2, marginTop: 2 },
  heart: { fontSize: 10, color: colors.brandCrimson },
  symptomDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.partial },
  eventList: { width: '100%', marginTop: 2 },
  eventPill: { fontSize: 8, paddingHorizontal: 2, borderRadius: 3, marginBottom: 1 },
  eventMore: { fontSize: 8, color: colors.textMuted },
});
