import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  CYCLE_SYMPTOM_OPTIONS,
  bleedingDatesFromPeriods,
  cycleDayInPeriod,
  endPeriod,
  fetchCycleDayLogs,
  fetchCyclePeriods,
  fetchCycleSettings,
  fetchOpenPeriod,
  predictNextPeriodStart,
  startPeriod,
  updateCycleSettings,
  upsertCycleDayLog,
  type CycleDayLog,
  type CyclePeriod,
  type CycleSettings,
  type FlowLevel,
} from '../../lib/tracking/cycle'
import { todayLocalDate } from '../../lib/dates'

const FLOW_OPTIONS: { value: FlowLevel; label: string }[] = [
  { value: 'spotting', label: 'Spotting' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'heavy', label: 'Heavy' },
]

function monthStart(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
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
    const from = monthStart(new Date(viewMonth.year, viewMonth.month - 1, 1))
    const lastDay = daysInMonth(viewMonth.year, viewMonth.month)
    const to = `${viewMonth.year}-${String(viewMonth.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

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

  const bleedingDates = useMemo(
    () => bleedingDatesFromPeriods(periods, today),
    [periods, today],
  )

  const nextPredicted = settings ? predictNextPeriodStart(periods, settings) : null

  const selectedLog = dayLogs.find((l) => l.log_date === selectedDate)
  const [flow, setFlow] = useState<FlowLevel | ''>('')
  const [symptoms, setSymptoms] = useState<string[]>([])

  useEffect(() => {
    setFlow(selectedLog?.flow_level ?? '')
    setSymptoms(selectedLog?.symptoms ?? [])
  }, [selectedLog, selectedDate])

  const calendarCells = useMemo(() => {
    const firstDow = new Date(viewMonth.year, viewMonth.month - 1, 1).getDay()
    const total = daysInMonth(viewMonth.year, viewMonth.month)
    const cells: { date: string | null; label: string }[] = []
    for (let i = 0; i < firstDow; i++) cells.push({ date: null, label: '' })
    for (let day = 1; day <= total; day++) {
      const date = `${viewMonth.year}-${String(viewMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ date, label: String(day) })
    }
    return cells
  }, [viewMonth])

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
        symptoms,
      })
    })
  }

  if (loading && !settings) {
    return <p className="loading">Loading cycle tracker…</p>
  }

  return (
    <div className="tracker-panel cycle-tracker-panel">
      <p className="tracker-disclaimer" role="note">
        Not for contraception or diagnosis. Log period start/end and daily flow; predictions
        are estimates only.
      </p>

      {error && <p className="banner banner-error">{error}</p>}

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
        {nextPredicted && (
          <p className="field-hint cycle-prediction">
            Next period estimated ~{' '}
            {new Date(`${nextPredicted}T12:00:00`).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </div>

      {settings && (
        <div className="cycle-settings-row">
          <label>
            Avg cycle (days)
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
            Avg period (days)
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

      <div className="cycle-calendar-header">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() =>
            setViewMonth((m) => {
              const d = new Date(m.year, m.month - 2, 1)
              return { year: d.getFullYear(), month: d.getMonth() + 1 }
            })
          }
        >
          ←
        </button>
        <h4>
          {new Date(viewMonth.year, viewMonth.month - 1, 1).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </h4>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() =>
            setViewMonth((m) => {
              const d = new Date(m.year, m.month, 1)
              return { year: d.getFullYear(), month: d.getMonth() + 1 }
            })
          }
        >
          →
        </button>
      </div>

      <div className="cycle-calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cycle-calendar-grid">
        {calendarCells.map((cell, i) =>
          cell.date ? (
            <button
              key={cell.date}
              type="button"
              className={`cycle-calendar-day${bleedingDates.has(cell.date) ? ' bleeding' : ''}${cell.date === selectedDate ? ' selected' : ''}${cell.date === today ? ' today' : ''}${cycleDayInPeriod(cell.date, periods) ? ' in-period' : ''}`}
              onClick={() => setSelectedDate(cell.date!)}
            >
              {cell.label}
            </button>
          ) : (
            <span key={`pad-${i}`} className="cycle-calendar-day cycle-calendar-day--empty" />
          ),
        )}
      </div>

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
        <fieldset className="cycle-flow-fieldset">
          <legend>Flow</legend>
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
        <div className="cycle-symptom-chips">
          {CYCLE_SYMPTOM_OPTIONS.map((symptom) => (
            <button
              key={symptom}
              type="button"
              className={`btn btn-sm${symptoms.includes(symptom) ? ' btn-primary' : ' btn-secondary'}`}
              onClick={() =>
                setSymptoms((prev) =>
                  prev.includes(symptom)
                    ? prev.filter((s) => s !== symptom)
                    : [...prev, symptom],
                )
              }
            >
              {symptom}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => void saveDayLog()}
        >
          Save day
        </button>
      </section>
    </div>
  )
}
