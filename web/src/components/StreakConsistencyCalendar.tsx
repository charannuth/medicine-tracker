import { formatDisplayDate, lastNDays } from '../lib/dates'
import { STREAK_CALENDAR_DAYS, type StreakCalendarDay } from '../lib/streaks'

const STATUS_LABEL: Record<StreakCalendarDay['status'], string> = {
  perfect: 'Perfect day — all doses logged',
  partial: 'Partial — some doses logged',
  missed: 'Missed — scheduled doses not completed',
  none: 'No doses scheduled',
}

type StreakConsistencyCalendarProps = {
  days: StreakCalendarDay[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

export function StreakConsistencyCalendar({
  days,
  selectedDate,
  onSelectDate,
}: StreakConsistencyCalendarProps) {
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const calendarDates = lastNDays(STREAK_CALENDAR_DAYS).reverse()
  return (
    <section className="streak-consistency" aria-labelledby="streak-consistency-heading">
      <h3 id="streak-consistency-heading" className="streak-consistency-title">
        {STREAK_CALENDAR_DAYS}-day consistency
      </h3>
      <p className="field-hint streak-consistency-hint">
        Green = perfect adherence. Tap a day to see doses and notes.
      </p>

      <div className="streak-consistency-legend" aria-hidden>
        <span className="streak-legend-item streak-legend-perfect">Perfect</span>
        <span className="streak-legend-item streak-legend-partial">Partial</span>
        <span className="streak-legend-item streak-legend-missed">Missed</span>
        <span className="streak-legend-item streak-legend-none">—</span>
      </div>

      <div
        className="history-calendar streak-consistency-calendar"
        aria-label={`${STREAK_CALENDAR_DAYS} day adherence calendar`}
      >
        <div className="calendar-grid">
          {calendarDates.map((date) => {
            const day = dayMap.get(date)
            const status = day?.status ?? 'none'
            const isSelected = selectedDate === date
            return (
              <button
                key={date}
                type="button"
                className={`calendar-cell streak-calendar-cell streak-calendar-${status}${isSelected ? ' selected' : ''}`}
                title={`${formatDisplayDate(date)} — ${STATUS_LABEL[status]}`}
                onClick={() => onSelectDate(date)}
              >
                <span className="calendar-day-num">
                  {Number(date.split('-')[2])}
                </span>
              </button>
            )
          })}
        </div>
      </div>

    </section>
  )
}
