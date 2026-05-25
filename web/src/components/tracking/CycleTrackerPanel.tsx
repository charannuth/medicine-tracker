import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { todayLocalDate } from '../../lib/dates'
import {
  buildCycleCalendarDays,
  clearPeriodLate,
  CYCLE_SYMPTOMS_DURING,
  CYCLE_SYMPTOMS_POST,
  CYCLE_SYMPTOMS_PRE,
  endPeriod,
  fetchCycleDayLogs,
  fetchCyclePeriods,
  fetchCycleSettings,
  fetchOpenPeriod,
  getCyclePrediction,
  markPeriodLate,
  PHASE_HINTS,
  PHASE_LABELS,
  startPeriod,
  updateCycleSettings,
  upsertCycleDayLog,
  type CycleDayLog,
  type CyclePeriod,
  type CycleSettings,
  type FlowLevel,
} from '../../lib/tracking/cycle'
import { CycleCalendar } from './CycleCalendar'

const FLOW_OPTIONS: { value: FlowLevel; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

function monthStart(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function monthEnd(year: number, month: number): string {
  const last = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

function datesInMonth(year: number, month: number): string[] {
  const total = new Date(year, month, 0).getDate()
  const dates: string[] = []
  for (let d = 1; d <= total; d++) {
    dates.push(
      `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    )
  }
  return dates
}

function toggleSymptom(list: string[], symptom: string): string[] {
  return list.includes(symptom)
    ? list.filter((s) => s !== symptom)
    : [...list, symptom]
}

function SymptomChipGroup({
  title,
  options,
  selected,
  onChange,
}: {
  title: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <fieldset className="cycle-symptom-group">
      <legend>{title}</legend>
      <div className="cycle-symptom-chips">
        {options.map((symptom) => (
          <button
            key={symptom}
            type="button"
            className={`wellness-chip${selected.includes(symptom) ? ' active' : ''}`}
            aria-pressed={selected.includes(symptom)}
            onClick={() => onChange(toggleSymptom(selected, symptom))}
          >
            {symptom}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function CycleTrackerPanel() {
  const { user } = useAuth()
  const today = todayLocalDate()
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(`${today}T12:00:00`)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })
  const [settings, setSettings] = useState<CycleSettings | null>(null)
  const [periods, setPeriods] = useState<CyclePeriod[]>([])
  const [openPeriod, setOpenPeriod] = useState<CyclePeriod | null>(null)
  const [dayLogs, setDayLogs] = useState<CycleDayLog[]>([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    const from = monthStart(viewMonth.year, viewMonth.month)
    const to = monthEnd(viewMonth.year, viewMonth.month)

    const [s, p, open, logs] = await Promise.all([
      fetchCycleSettings(user.id),
      fetchCyclePeriods(user.id),
      fetchOpenPeriod(user.id),
      fetchCycleDayLogs(user.id, from, to),
    ])
    setSettings(s)
    setPeriods(p)
    setOpenPeriod(open)
    setDayLogs(logs)
  }, [user, viewMonth])

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    reload()
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load cycle data')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, reload])

  const prediction = useMemo(
    () =>
      settings ? getCyclePrediction(periods, settings, today) : null,
    [settings, periods, today],
  )

  const monthDates = useMemo(
    () => datesInMonth(viewMonth.year, viewMonth.month),
    [viewMonth],
  )

  const calendarDays = useMemo(() => {
    if (!settings) return []
    return buildCycleCalendarDays(monthDates, periods, dayLogs, settings, today)
  }, [monthDates, periods, dayLogs, settings, today])

  const selectedLog = dayLogs.find((l) => l.log_date === selectedDate)
  const [flow, setFlow] = useState<FlowLevel | ''>('')
  const [symptomsPre, setSymptomsPre] = useState<string[]>([])
  const [symptomsDuring, setSymptomsDuring] = useState<string[]>([])
  const [symptomsPost, setSymptomsPost] = useState<string[]>([])
  const [intercourse, setIntercourse] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setFlow(selectedLog?.flow_level ?? '')
    setSymptomsPre(selectedLog?.symptoms_pre ?? [])
    setSymptomsDuring(selectedLog?.symptoms ?? [])
    setSymptomsPost(selectedLog?.symptoms_post ?? [])
    setIntercourse(selectedLog?.intercourse ?? false)
    setNotes(selectedLog?.notes ?? '')
  }, [selectedLog, selectedDate])

  async function runAction(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function saveDayLog() {
    if (!user) return
    await runAction(async () => {
      await upsertCycleDayLog(user.id, selectedDate, {
        flow_level: flow || null,
        symptoms: symptomsDuring,
        symptoms_pre: symptomsPre,
        symptoms_post: symptomsPost,
        intercourse,
        notes,
      })
    })
  }

  const canMarkLate =
    prediction &&
    !openPeriod &&
    prediction.nextStart &&
    today >= prediction.nextStart &&
    periods.length > 0

  if (loading && !settings) {
    return <p className="loading">Loading cycle tracker…</p>
  }

  return (
    <div className="tracker-panel cycle-tracker-panel">
      <p className="tracker-disclaimer" role="note">
        For personal tracking only — not contraception or diagnosis. Predictions use your
        average cycle length; stress, diet, and other factors can shift timing. Share logs
        with your clinician.
      </p>

      {error && <p className="banner banner-error">{error}</p>}

      {prediction?.currentPhase && (
        <div className="cycle-phase-banner">
          <p className="cycle-phase-label">
            Today: <strong>{PHASE_LABELS[prediction.currentPhase]}</strong> phase
            {prediction.cycleDay != null && (
              <span className="cycle-phase-day"> · Day {prediction.cycleDay}</span>
            )}
          </p>
          <p className="field-hint">{PHASE_HINTS[prediction.currentPhase]}</p>
        </div>
      )}

      <div className="cycle-period-actions">
        {openPeriod ? (
          <>
            <p className="cycle-status">
              Period in progress since{' '}
              {new Date(`${openPeriod.started_on}T12:00:00`).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void runAction(() => endPeriod(user!.id))}
            >
              Period ended
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void runAction(() => startPeriod(user!.id))}
          >
            Period started
          </button>
        )}

        {canMarkLate && (
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() =>
              void runAction(async () => {
                await markPeriodLate(user!.id)
              })
            }
          >
            Mark period late
          </button>
        )}

        {settings?.period_late && !openPeriod && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => void runAction(() => clearPeriodLate(user!.id))}
          >
            Clear late flag
          </button>
        )}
      </div>

      {prediction?.nextStart && (
        <p className="field-hint cycle-prediction">
          {prediction.isLate ? (
            <>
              Period is <strong>{prediction.daysLate || 'several'} day(s) late</strong>
              {settings?.prediction_push_days
                ? ` · prediction adjusted +${settings.prediction_push_days} days`
                : ''}
              . Next estimated start{' '}
            </>
          ) : (
            <>Next period estimated </>
          )}
          <strong>
            {new Date(`${prediction.nextStart}T12:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: prediction.nextStart.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined,
            })}
          </strong>
          {prediction.nextEnd && (
            <>
              {' '}
              –{' '}
              {new Date(`${prediction.nextEnd}T12:00:00`).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </>
          )}
        </p>
      )}

      {settings && (
        <div className="cycle-settings-row">
          <label>
            Average cycle length (days)
            <input
              type="number"
              min={15}
              max={60}
              value={settings.avg_cycle_length}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  avg_cycle_length: Number(e.target.value) || 28,
                })
              }
              onBlur={() =>
                void runAction(() =>
                  updateCycleSettings(user!.id, {
                    avg_cycle_length: settings.avg_cycle_length,
                    avg_period_length: settings.avg_period_length,
                  }),
                )
              }
            />
          </label>
          <label>
            Average period length (days)
            <input
              type="number"
              min={1}
              max={14}
              value={settings.avg_period_length}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  avg_period_length: Number(e.target.value) || 5,
                })
              }
              onBlur={() =>
                void runAction(() =>
                  updateCycleSettings(user!.id, {
                    avg_cycle_length: settings.avg_cycle_length,
                    avg_period_length: settings.avg_period_length,
                  }),
                )
              }
            />
          </label>
        </div>
      )}

      {settings && (
        <CycleCalendar
          year={viewMonth.year}
          month={viewMonth.month}
          days={calendarDays}
          selectedDate={selectedDate}
          today={today}
          onSelectDate={setSelectedDate}
          onPrevMonth={() =>
            setViewMonth((m) => {
              const d = new Date(m.year, m.month - 2, 1)
              return { year: d.getFullYear(), month: d.getMonth() + 1 }
            })
          }
          onNextMonth={() =>
            setViewMonth((m) => {
              const d = new Date(m.year, m.month, 1)
              return { year: d.getFullYear(), month: d.getMonth() + 1 }
            })
          }
        />
      )}

      <section className="cycle-day-log">
        <h4>
          {selectedDate === today
            ? 'Today'
            : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
        </h4>

        <label className="cycle-intercourse-toggle">
          <input
            type="checkbox"
            checked={intercourse}
            onChange={(e) => setIntercourse(e.target.checked)}
          />
          <span className="cycle-intercourse-label" aria-hidden>
            ♥
          </span>
          Sexual intercourse
        </label>

        <fieldset className="cycle-flow-fieldset">
          <legend>Flow (menstruation)</legend>
          <div className="cycle-flow-options">
            {FLOW_OPTIONS.map((opt) => (
              <label key={opt.value} className="cycle-flow-chip">
                <input
                  type="radio"
                  name="flow"
                  checked={flow === opt.value}
                  onChange={() => setFlow(opt.value)}
                />
                {opt.label}
              </label>
            ))}
            <label className="cycle-flow-chip">
              <input
                type="radio"
                name="flow"
                checked={flow === ''}
                onChange={() => setFlow('')}
              />
              None
            </label>
          </div>
        </fieldset>

        <SymptomChipGroup
          title="Pre-menstrual symptoms"
          options={CYCLE_SYMPTOMS_PRE}
          selected={symptomsPre}
          onChange={setSymptomsPre}
        />
        <SymptomChipGroup
          title="During period symptoms"
          options={CYCLE_SYMPTOMS_DURING}
          selected={symptomsDuring}
          onChange={setSymptomsDuring}
        />
        <SymptomChipGroup
          title="Post-menstrual symptoms"
          options={CYCLE_SYMPTOMS_POST}
          selected={symptomsPost}
          onChange={setSymptomsPost}
        />

        <label className="cycle-notes-label">
          Notes (stress, diet, sleep…)
          <textarea
            rows={2}
            value={notes}
            placeholder="What might have affected your cycle today?"
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => void saveDayLog()}
        >
          Save day
        </button>
      </section>
    </div>
  )
}
