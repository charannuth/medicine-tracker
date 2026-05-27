import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDaysToDateString } from '../../lib/dates';
import { colors, radii, spacing } from '../../constants/theme';

type Props = {
  selectedDate: string;
  today: string;
  onSelectDate: (date: string) => void;
  dayHasLog?: (date: string) => boolean;
  rangeDays?: number;
};

function shortDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function dayNumber(dateStr: string): string {
  return String(parseInt(dateStr.slice(8), 10));
}

function monthShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, { month: 'short' });
}

export function CycleDayStrip({
  selectedDate,
  today,
  onSelectDate,
  dayHasLog,
  rangeDays = 14,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const dates = useMemo(() => {
    const list: string[] = [];
    for (let i = -rangeDays; i <= rangeDays; i++) {
      list.push(addDaysToDateString(selectedDate, i));
    }
    return list;
  }, [selectedDate, rangeDays]);

  useEffect(() => {
    const idx = dates.indexOf(selectedDate);
    if (idx >= 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, idx * 56 - 120), animated: true });
    }
  }, [selectedDate, dates]);

  const title =
    selectedDate === today
      ? 'Today'
      : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });

  return (
    <View style={styles.wrap}>
      <View style={styles.nav}>
        <Pressable onPress={() => onSelectDate(addDaysToDateString(selectedDate, -1))} style={styles.arrow}>
          <Text style={styles.arrowText}>←</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={() => onSelectDate(today)}
          disabled={selectedDate === today}
          style={[styles.todayBtn, selectedDate === today && styles.disabled]}
        >
          <Text style={styles.todayBtnText}>Today</Text>
        </Pressable>
        <Pressable onPress={() => onSelectDate(addDaysToDateString(selectedDate, 1))} style={styles.arrow}>
          <Text style={styles.arrowText}>→</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {dates.map((date, index) => {
          const active = date === selectedDate;
          const logged = dayHasLog?.(date) ?? false;
          const prev = dates[index - 1];
          const showMonth = !prev || prev.slice(0, 7) !== date.slice(0, 7);
          const isFuture = date > today;
          return (
            <Pressable
              key={date}
              onPress={() => onSelectDate(date)}
              style={[
                styles.pill,
                active && styles.pillActive,
                logged && styles.pillLogged,
                date === today && styles.pillToday,
                isFuture && styles.pillFuture,
              ]}
            >
              <Text style={[styles.dow, active && styles.pillTextActive]}>{shortDayLabel(date, today)}</Text>
              <Text style={[styles.num, active && styles.pillTextActive]}>{dayNumber(date)}</Text>
              {showMonth ? (
                <Text style={[styles.month, active && styles.pillTextActive]}>{monthShort(date)}</Text>
              ) : null}
              {logged ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.md },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: 8,
  },
  arrow: { padding: 8 },
  arrowText: { fontSize: 20, color: colors.text },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, textAlign: 'center' },
  todayBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  todayBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
  disabled: { opacity: 0.4 },
  scroll: { gap: 8, paddingVertical: 4 },
  pill: {
    minWidth: 52,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  pillLogged: {},
  pillToday: { borderColor: colors.accent },
  pillFuture: { opacity: 0.65 },
  dow: { fontSize: 11, color: colors.textMuted },
  num: { fontSize: 18, fontWeight: '700', color: colors.text },
  month: { fontSize: 10, color: colors.textMuted },
  pillTextActive: { color: '#fff' },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandCrimson,
    marginTop: 4,
  },
});
