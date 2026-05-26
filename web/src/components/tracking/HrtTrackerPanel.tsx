import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { todayLocalDate, formatScheduleTime } from '../../lib/dates'
import { formatDoseDisplay } from '../../lib/dose'
import { CycleDayStrip } from './CycleDayStrip'
import type { TrackerDoseEvent } from '../../lib/tracking/doseSync'
import { fetchTrackerDoseEventsInRange } from '../../lib/tracking/doseSync'
import {
  HRT_BODILY_CHANGE_OPTIONS,
  HRT_MOOD_CHANGE_OPTIONS,
  upsertHrtDayLog,
  fetchHrtDayLogsInRange,
  fetchHrtDayLog,
  type HrtBodilyChange,
  type HrtMoodChange,
} from '../../lib/tracking/hrt'
import type { HrtDayLog } from '../../lib/tracking/hrt'

type HrtTrackerPanelProps = {
  selectedDate: string
  onSelectDate: (date: string) => void
  onDataMutated?: () => void
}

function monthBounds(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`
  return { start, end }
}

function toggleSelection(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function ChipMultiSelect({
  title,
  options,
  selected,
  onChange,
  disabled,
}: {
  title: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="cycle-symptom-group" disabled={disabled}>
      <legend>{title}</legend>
      <div className="cycle-symptom-chips">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`wellness-chip${selected.includes(opt) ? ' active' : ''}`}
            aria-pressed={selected.includes(opt)}
            disabled={disabled}
            onClick={() => onChange(toggleSelection(selected, opt))}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function HrtTrackerPanel({
  selectedDate,
  onSelectDate,
  onDataMutated,
}: HrtTrackerPanelProps) {
  const { user } = useAuth()
  const today = todayLocalDate()
  const isFutureDay = selectedDate > today

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [logsInMonth, setLogsInMonth] = useState<HrtDayLog[]>([])
  const [selectedLog, setSelectedLog] = useState<HrtDayLog | null>(null)
  const [doseEvents, setDoseEvents] = useState<TrackerDoseEvent[]>([])

  const [bodilyDraft, setBodilyDraft] = useState<string[]>([])
  const [moodDraft, setMoodDraft] = useState<string[]>([])
  const [otherDraft, setOtherDraft] = useState('')
  const [notesDraft, setNotesDraft] = useState('')

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const d = new Date(`${selectedDate}T12:00:00`)
      const bounds = monthBounds(d.getFullYear(), d.getMonth() + 1)

      const [monthLogs, dayLog, events] = await Promise.all([
        fetchHrtDayLogsInRange(user.id, bounds.start, bounds.end),
        fetchHrtDayLog(user.id, selectedDate),
        fetchTrackerDoseEventsInRange(user.id, 'hrt', selectedDate, selectedDate, 200),
      ])

      setLogsInMonth(monthLogs)
      setSelectedLog(dayLog)
      setDoseEvents(events)

      setBodilyDraft(dayLog?.bodily_changes ?? [])
      setMoodDraft(dayLog?.mood_changes ?? [])
      setOtherDraft(dayLog?.other_changes ?? '')
      setNotesDraft(dayLog?.notes ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HRT log')
    } finally {
      setLoading(false)
    }
  }, [user, selectedDate])

  useEffect(() => {
    void reload()
  }, [reload])

  const dayHasLog = useCallback(
    (date: string) => {
      const log = logsInMonth.find((l) => l.log_date === date)
      if (!log) return false
      return (
        log.bodily_changes.length > 0 ||
        log.mood_changes.length > 0 ||
        Boolean(log.other_changes?.trim()) ||
        Boolean(log.notes?.trim())
      )
    },
    [logsInMonth],
  )

  const saveDayLog = useCallback(async () => {
    if (!user || isFutureDay) return
    setBusy(true)
    setError(null)
    try {
      await upsertHrtDayLog(user.id, selectedDate, {
        bodily_changes: bodilyDraft as HrtBodilyChange[],
        mood_changes: moodDraft as HrtMoodChange[],
        other_changes: otherDraft,
        notes: notesDraft,
      })
      await reload()
      onDataMutated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save HRT log')
    } finally {
      setBusy(false)
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
  ])

  const discardEdits = useCallback(() => {
    setBodilyDraft(selectedLog?.bodily_changes ?? [])
    setMoodDraft(selectedLog?.mood_changes ?? [])
    setOtherDraft(selectedLog?.other_changes ?? '')
    setNotesDraft(selectedLog?.notes ?? '')
  }, [selectedLog])

  if (!user) return null

  return (
    <div className="tracker-panel hrt-tracker-panel">
      <p className="field-hint">
        Doses appear automatically when you log HRT medications on <span>Today</span>. This
        panel stores your daily transition journaling (bodily changes, mood changes, and other notes).
      </p>

      {error && <p className="banner banner-error">{error}</p>}

      {loading ? (
        <p className="loading">Loading HRT calendar panel…</p>
      ) : (
        <>
          <CycleDayStrip
            selectedDate={selectedDate}
            today={today}
            onSelectDate={onSelectDate}
            dayHasLog={dayHasLog}
          />

          {isFutureDay ? (
            <p className="field-hint cycle-future-day-hint" role="status">
              This day is in the future — you can preview predictions on the calendar, but logging unlocks on that date.
            </p>
          ) : null}

          <section className="hrt-dose-section">
            <h4>HRT dose(s) on this day</h4>
            {doseEvents.length === 0 ? (
              <p className="field-hint">No HRT dose synced for {selectedDate} yet.</p>
            ) : (
              <ul className="hrt-dose-list">
                {doseEvents.map((event) => (
                  <li key={event.id} className="hrt-dose-item">
                    <div>
                      <strong>{event.medication_name}</strong>
                      <span className="hrt-dose-meta">
                        {formatScheduleTime(event.schedule_time)}
                      </span>
                    </div>
                    {(event.dose_pills || event.dose_mg) && (
                      <span className="hrt-dose-amount">
                        {formatDoseDisplay({
                          dose_pills: event.dose_pills,
                          dose_mg: event.dose_mg,
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <fieldset className="cycle-day-log-fields" disabled={isFutureDay}>
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

            <label className="cycle-notes-label">
              Other changes noted
              <textarea
                rows={2}
                value={otherDraft}
                placeholder="Anything else: side effects, comfort, changes that didn't fit chips, etc."
                onChange={(e) => setOtherDraft(e.target.value)}
                disabled={isFutureDay}
              />
            </label>

            <label className="cycle-notes-label">
              Notes (optional)
              <textarea
                rows={2}
                value={notesDraft}
                placeholder="Additional details you want to remember."
                onChange={(e) => setNotesDraft(e.target.value)}
                disabled={isFutureDay}
              />
            </label>
          </fieldset>

          <div className="cycle-day-log-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || isFutureDay}
              onClick={() => void saveDayLog()}
            >
              Save HRT journal
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={busy || isFutureDay}
              onClick={discardEdits}
            >
              Discard edits
            </button>
          </div>
        </>
      )}
    </div>
  )
}
