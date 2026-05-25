import { useMemo } from 'react'
import {
  CALENDAR_RANGE_OPTIONS,
  getCalendarWindow,
  shiftCalendarAnchor,
  type CalendarViewRange,
} from '../../lib/tracking/calendarRange'
import {
  calendarSourceOptions,
  type CalendarSourceMeta,
} from '../../lib/tracking/calendarSources'
import type {
  TrackingCalendarCell,
  TrackingCalendarData,
} from '../../lib/tracking/calendarTypes'
import type { TrackerId } from '../../lib/tracking/catalog'

type TrackingCalendarProps = {
  today: string
  anchor: string
  range: CalendarViewRange
  source: TrackerId | null
  selectedDate: string
  enabledTrackers: TrackerId[]
  data: TrackingCalendarData
  loading?: boolean
  onAnchorChange: (date: string) => void
  onRangeChange: (range: CalendarViewRange) => void
  onSourceChange: (source: TrackerId) => void
  onSelectDate: (date: string) => void
}

function dayButtonClasses(
  cell: TrackingCalendarCell | undefined,
  selectedDate: string,
  today: string,
  compact: boolean,
): string {
  const parts = ['tracking-calendar-day', 'cycle-calendar-day']
  if (compact) parts.push('tracking-calendar-day--compact')
  if (!cell) return parts.join(' ')
  for (const c of cell.classNames) parts.push(c)
  if (cell.date === selectedDate) parts.push('selected')
  if (cell.date === today) parts.push('today')
  return parts.join(' ')
}

function MonthGrid({
  year,
  month,
  dates,
  cells,
  selectedDate,
  today,
  compact,
  onSelectDate,
}: {
  year: number
  month: number
  dates: string[]
  cells: Map<string, TrackingCalendarCell>
  selectedDate: string
  today: string
  compact: boolean
  onSelectDate: (date: string) => void
}) {
  const firstDow = new Date(year, month - 1, 1).getDay()
  const gridCells: ({ date: string; label: string } | null)[] = []
  for (let i = 0; i < firstDow; i++) gridCells.push(null)
  for (const date of dates) {
    gridCells.push({ date, label: String(parseInt(date.slice(8), 10)) })
  }

  const monthTitle = new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: compact ? 'short' : 'long',
    year: compact ? '2-digit' : 'numeric',
  })

  return (
    <div className={`tracking-calendar-month${compact ? ' tracking-calendar-month--compact' : ''}`}>
      {compact && <h5 className="tracking-calendar-month-label">{monthTitle}</h5>}
      <div className="tracking-calendar-weekdays cycle-calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <span key={d}>{compact ? d.slice(0, 1) : d}</span>
        ))}
      </div>
      <div className="tracking-calendar-grid cycle-calendar-grid">
        {gridCells.map((cell, i) =>
          cell?.date ? (
            <button
              key={cell.date}
              type="button"
              className={dayButtonClasses(cells.get(cell.date), selectedDate, today, compact)}
              onClick={() => onSelectDate(cell.date)}
            >
              <span className="cycle-day-num">{cell.label}</span>
              <span className="cycle-day-markers" aria-hidden>
                {cells.get(cell.date)?.markers.includes('heart') && (
                  <span className="cycle-marker-heart">♥</span>
                )}
                {cells.get(cell.date)?.markers.includes('dot') && (
                  <span className="cycle-marker-symptom" />
                )}
              </span>
            </button>
          ) : (
            <span
              key={`pad-${year}-${month}-${i}`}
              className="tracking-calendar-day cycle-calendar-day--empty tracking-calendar-day--empty"
            />
          ),
        )}
      </div>
    </div>
  )
}

function StripView({
  dates,
  cells,
  selectedDate,
  today,
  onSelectDate,
}: {
  dates: string[]
  cells: Map<string, TrackingCalendarCell>
  selectedDate: string
  today: string
  onSelectDate: (date: string) => void
}) {
  return (
    <div className="tracking-calendar-strip">
      {dates.map((date) => {
        const d = new Date(`${date}T12:00:00`)
        const cell = cells.get(date)
        return (
          <button
            key={date}
            type="button"
            className={dayButtonClasses(cell, selectedDate, today, false)}
            onClick={() => onSelectDate(date)}
          >
            <span className="tracking-calendar-strip-dow">
              {d.toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
            <span className="cycle-day-num">{d.getDate()}</span>
            <span className="cycle-day-markers" aria-hidden>
              {cell?.markers.includes('heart') && (
                <span className="cycle-marker-heart">♥</span>
              )}
              {cell?.markers.includes('dot') && (
                <span className="cycle-marker-symptom" />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
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
}: TrackingCalendarProps) {
  const window = useMemo(() => getCalendarWindow(anchor, range), [anchor, range])
  const sourceOptions = useMemo(
    () => calendarSourceOptions(enabledTrackers),
    [enabledTrackers],
  )
  const activeSource = sourceOptions.find((o) => o.id === source)
  const showGrid = !loading && activeSource?.support === 'full'
  const showPlannedHint = !loading && activeSource?.support === 'planned'

  function renderSourceOptions(meta: CalendarSourceMeta) {
    if (meta.support === 'full') {
      return (
        <option key={meta.id} value={meta.id}>
          {meta.label}
        </option>
      )
    }
    return (
      <option key={meta.id} value={meta.id} disabled>
        {meta.label} (coming soon)
      </option>
    )
  }

  return (
    <section className="tracking-calendar-hub" aria-label="Tracking calendar">
      <div className="tracking-calendar-toolbar">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Previous period"
          onClick={() => onAnchorChange(shiftCalendarAnchor(anchor, range, -1))}
        >
          ←
        </button>

        <label className="tracking-calendar-control">
          <span className="tracking-calendar-control-label">View</span>
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value as CalendarViewRange)}
          >
            {CALENDAR_RANGE_OPTIONS.filter((o) => o.group === 'short').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            <optgroup label="Longer ranges">
              {CALENDAR_RANGE_OPTIONS.filter((o) => o.group === 'long').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        {sourceOptions.length > 0 && (
          <label className="tracking-calendar-control">
            <span className="tracking-calendar-control-label">Show</span>
            <select
              value={source ?? ''}
              onChange={(e) => onSourceChange(e.target.value as TrackerId)}
            >
              {sourceOptions.map(renderSourceOptions)}
            </select>
          </label>
        )}

        <h4 className="tracking-calendar-title">{window.title}</h4>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-label="Next period"
          onClick={() => onAnchorChange(shiftCalendarAnchor(anchor, range, 1))}
        >
          →
        </button>
      </div>

      {loading && <p className="loading tracking-calendar-loading">Loading calendar…</p>}

      {!loading && data.legend.length > 0 && (
        <ul className="tracking-calendar-legend cycle-calendar-legend">
          {data.legend.map((item) => (
            <li key={item.id}>
              {item.swatchClass && (
                <span className={`cycle-legend-swatch ${item.swatchClass}`} />
              )}
              {item.icon === 'dot' && <span className="cycle-legend-dot symptom" />}
              {item.icon === 'heart' && (
                <span className="cycle-legend-heart" aria-hidden>
                  ♥
                </span>
              )}
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {showPlannedHint && data.emptyMessage && (
        <p className="field-hint tracking-calendar-empty">{data.emptyMessage}</p>
      )}

      {showGrid && (
        <div
          className={`tracking-calendar-body${window.isStripLayout ? ' tracking-calendar-body--strip' : ''}${window.months.length > 1 ? ' tracking-calendar-body--multi' : ''}`}
        >
          {window.isStripLayout ? (
            <StripView
              dates={window.dates}
              cells={data.cells}
              selectedDate={selectedDate}
              today={today}
              onSelectDate={onSelectDate}
            />
          ) : window.months.length === 1 ? (
            <MonthGrid
              year={window.months[0].year}
              month={window.months[0].month}
              dates={window.months[0].dates}
              cells={data.cells}
              selectedDate={selectedDate}
              today={today}
              compact={false}
              onSelectDate={onSelectDate}
            />
          ) : (
            <div className="tracking-calendar-multi">
              {window.months.map((block) => (
                <MonthGrid
                  key={`${block.year}-${block.month}`}
                  year={block.year}
                  month={block.month}
                  dates={block.dates}
                  cells={data.cells}
                  selectedDate={selectedDate}
                  today={today}
                  compact
                  onSelectDate={onSelectDate}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {data.footer}
    </section>
  )
}
