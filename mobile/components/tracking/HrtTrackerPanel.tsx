import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { todayLocalDate, formatScheduleTime } from '../../lib/dates';
import { formatDoseDisplay } from '../../lib/dose';
import { CycleDayStrip } from './CycleDayStrip';
import { ChipMultiSelect } from './ChipMultiSelect';
import type { TrackerDoseEvent } from '../../lib/tracking/doseSync';
import { fetchTrackerDoseEventsInRange } from '../../lib/tracking/doseSync';
import {
  HRT_BODILY_CHANGE_OPTIONS,
  HRT_MOOD_CHANGE_OPTIONS,
  upsertHrtDayLog,
  fetchHrtDayLogsInRange,
  fetchHrtDayLog,
  type HrtBodilyChange,
  type HrtMoodChange,
  type HrtDayLog,
} from '../../lib/tracking/hrt';
import { trackingStyles } from './trackingStyles';

type Props = {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onDataMutated?: () => void;
};

function monthBounds(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  return { start, end };
}

export function HrtTrackerPanel({ selectedDate, onSelectDate, onDataMutated }: Props) {
  const { user } = useAuth();
  const today = todayLocalDate();
  const isFutureDay = selectedDate > today;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logsInMonth, setLogsInMonth] = useState<HrtDayLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<HrtDayLog | null>(null);
  const [doseEvents, setDoseEvents] = useState<TrackerDoseEvent[]>([]);

  const [bodilyDraft, setBodilyDraft] = useState<string[]>([]);
  const [moodDraft, setMoodDraft] = useState<string[]>([]);
  const [otherDraft, setOtherDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const d = new Date(`${selectedDate}T12:00:00`);
      const bounds = monthBounds(d.getFullYear(), d.getMonth() + 1);

      const [monthLogs, dayLog, events] = await Promise.all([
        fetchHrtDayLogsInRange(user.id, bounds.start, bounds.end),
        fetchHrtDayLog(user.id, selectedDate),
        fetchTrackerDoseEventsInRange(user.id, 'hrt', selectedDate, selectedDate, 200),
      ]);

      setLogsInMonth(monthLogs);
      setSelectedLog(dayLog);
      setDoseEvents(events);
      setBodilyDraft(dayLog?.bodily_changes ?? []);
      setMoodDraft(dayLog?.mood_changes ?? []);
      setOtherDraft(dayLog?.other_changes ?? '');
      setNotesDraft(dayLog?.notes ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HRT log');
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const dayHasLog = useCallback(
    (date: string) => {
      const log = logsInMonth.find((l) => l.log_date === date);
      if (!log) return false;
      return (
        log.bodily_changes.length > 0 ||
        log.mood_changes.length > 0 ||
        Boolean(log.other_changes?.trim()) ||
        Boolean(log.notes?.trim())
      );
    },
    [logsInMonth],
  );

  const saveDayLog = useCallback(async () => {
    if (!user || isFutureDay) return;
    setBusy(true);
    setError(null);
    try {
      await upsertHrtDayLog(user.id, selectedDate, {
        bodily_changes: bodilyDraft as HrtBodilyChange[],
        mood_changes: moodDraft as HrtMoodChange[],
        other_changes: otherDraft,
        notes: notesDraft,
      });
      await reload();
      onDataMutated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save HRT log');
    } finally {
      setBusy(false);
    }
  }, [
    user,
    isFutureDay,
    selectedDate,
    bodilyDraft,
    moodDraft,
    otherDraft,
    notesDraft,
    reload,
    onDataMutated,
  ]);

  if (!user) return null;

  return (
    <View>
      <Text style={trackingStyles.hint}>
        Doses appear automatically when you log HRT medications on Today. This panel stores your
        daily transition journaling.
      </Text>
      {error ? <Text style={trackingStyles.errorBanner}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#0891b2" style={{ marginVertical: 16 }} />
      ) : (
        <>
          <CycleDayStrip
            selectedDate={selectedDate}
            today={today}
            onSelectDate={onSelectDate}
            dayHasLog={dayHasLog}
          />
          {isFutureDay ? (
            <Text style={trackingStyles.hint}>
              This day is in the future — logging unlocks on that date.
            </Text>
          ) : null}
          <Text style={trackingStyles.sectionTitle}>HRT dose(s) on this day</Text>
          {doseEvents.length === 0 ? (
            <Text style={trackingStyles.hint}>No HRT dose synced for {selectedDate} yet.</Text>
          ) : (
            doseEvents.map((event) => (
              <View key={event.id} style={trackingStyles.card}>
                <Text style={{ fontWeight: '700', color: '#0f172a' }}>{event.medication_name}</Text>
                <Text style={trackingStyles.hint}>{formatScheduleTime(event.schedule_time)}</Text>
                {(event.dose_pills || event.dose_mg) && (
                  <Text style={trackingStyles.hint}>
                    {formatDoseDisplay({
                      dose_pills: event.dose_pills,
                      dose_mg: event.dose_mg,
                    })}
                  </Text>
                )}
              </View>
            ))
          )}
          <ChipMultiSelect
            title="Bodily changes"
            options={HRT_BODILY_CHANGE_OPTIONS}
            selected={bodilyDraft}
            onChange={setBodilyDraft}
            disabled={isFutureDay}
          />
          <ChipMultiSelect
            title="Mood changes"
            options={HRT_MOOD_CHANGE_OPTIONS}
            selected={moodDraft}
            onChange={setMoodDraft}
            disabled={isFutureDay}
          />
          <Text style={trackingStyles.label}>Other changes noted</Text>
          <TextInput
            style={[trackingStyles.input, trackingStyles.textarea]}
            multiline
            value={otherDraft}
            onChangeText={setOtherDraft}
            editable={!isFutureDay}
            placeholder="Side effects, comfort, etc."
          />
          <Text style={trackingStyles.label}>Notes (optional)</Text>
          <TextInput
            style={[trackingStyles.input, trackingStyles.textarea]}
            multiline
            value={notesDraft}
            onChangeText={setNotesDraft}
            editable={!isFutureDay}
          />
          <Pressable
            style={[trackingStyles.primaryBtn, (busy || isFutureDay) && trackingStyles.disabled]}
            disabled={busy || isFutureDay}
            onPress={() => void saveDayLog()}
          >
            <Text style={trackingStyles.primaryBtnText}>Save HRT journal</Text>
          </Pressable>
          <Pressable
            style={trackingStyles.ghostBtn}
            disabled={busy || isFutureDay}
            onPress={() => {
              setBodilyDraft(selectedLog?.bodily_changes ?? []);
              setMoodDraft(selectedLog?.mood_changes ?? []);
              setOtherDraft(selectedLog?.other_changes ?? '');
              setNotesDraft(selectedLog?.notes ?? '');
            }}
          >
            <Text style={trackingStyles.ghostBtnText}>Discard edits</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
