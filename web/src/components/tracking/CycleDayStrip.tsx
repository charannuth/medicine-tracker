import { useEffect, useMemo, useRef } from 'react'
import { addDaysToDateString } from '../../lib/dates'

type CycleDayStripProps = {
  selectedDate: string
  today: string
  onSelectDate: (date: string) => void
  dayHasLog?: (date: string) => boolean
  rangeDays?: number
}

function shortDayLabel(dateStr: string, today: string): string {
  if (dateStr === today) return 'Today'
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function dayNumber(dateStr: string): string {
  return String(parseInt(dateStr.slice(8), 10))
}

function monthShort(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
  })
}

export function CycleDayStrip({
  selectedDate,
  today,
  onSelectDate,
  dayHasLog,
  rangeDays = 14,
}: CycleDayStripProps) {
  const activeRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const dates = useMemo(() => {
    const list: string[] = []
    for (let i = -rangeDays; i <= rangeDays; i++) {
      list.push(addDaysToDateString(selectedDate, i))
    }
    return list
  }, [selectedDate, rangeDays])

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [selectedDate])

  function goPrevDay() {
    onSelectDate(addDaysToDateString(selectedDate, -1))
  }

  function goNextDay() {
    onSelectDate(addDaysToDateString(selectedDate, 1))
  }

  return (
    <div className="cycle-day-strip">
      <div className="cycle-day-strip-nav">
        <button
          type="button"
          className="btn btn-ghost btn-sm cycle-day-strip-arrow"
          aria-label="Previous day"
          onClick={goPrevDay}
        >
          ←
        </button>
        <p className="cycle-day-strip-title" aria-live="polite">
          {selectedDate === today
            ? 'Today'
            : new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm cycle-day-strip-today"
          disabled={selectedDate === today}
          aria-label="Go to today"
          onClick={() => onSelectDate(today)}
        >
          Today
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm cycle-day-strip-arrow"
          aria-label="Next day"
          onClick={goNextDay}
        >
          →
        </button>
      </div>

      <div
        ref={scrollRef}
        className="cycle-day-strip-scroll"
        role="group"
        aria-label="Choose a day to log"
      >
        {dates.map((date, index) => {
          const active = date === selectedDate
          const logged = dayHasLog?.(date) ?? false
          const prev = dates[index - 1]
          const showMonth = !prev || prev.slice(0, 7) !== date.slice(0, 7)
          return (
            <button
              key={date}
              ref={active ? activeRef : undefined}
              type="button"
              className={`cycle-day-strip-pill${active ? ' active' : ''}${logged ? ' has-log' : ''}${date === today ? ' is-today' : ''}${date > today ? ' is-future' : ''}`}
              aria-pressed={active}
              aria-label={new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
              onClick={() => onSelectDate(date)}
            >
              <span className="cycle-day-strip-dow">{shortDayLabel(date, today)}</span>
              <span className="cycle-day-strip-num">{dayNumber(date)}</span>
              {showMonth && (
                <span className="cycle-day-strip-month">{monthShort(date)}</span>
              )}
              {logged && <span className="cycle-day-strip-dot" aria-hidden />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
