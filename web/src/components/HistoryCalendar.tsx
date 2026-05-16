import { formatDisplayDate, lastNDays } from '../lib/dates'
import type { HistoryDay } from '../lib/history'

type HistoryCalendarProps = {
  days: HistoryDay[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

export function HistoryCalendar({
  days,
  selectedDate,
  onSelectDate,
}: HistoryCalendarProps) {
  const dayMap = new Map(days.map((d) => [d.date, d]))
  const calendarDays = lastNDays(42).reverse()

  return (
    <div className="history-calendar" aria-label="42 day calendar">
      <div className="calendar-grid">
        {calendarDays.map((date) => {
          const day = dayMap.get(date)
          const hasDoses = (day?.entries.length ?? 0) > 0
          const isSelected = selectedDate === date
          return (
            <button
              key={date}
              type="button"
              className={`calendar-cell ${hasDoses ? 'has-doses' : ''} ${isSelected ? 'selected' : ''}`}
              title={formatDisplayDate(date)}
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
  )
}
