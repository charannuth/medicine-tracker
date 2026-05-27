import type { TrackingCalendarCell, TrackingCalendarData } from './calendarTypes'

const MAX_EVENTS_PER_DAY = 4

function mergeCell(
  base: TrackingCalendarCell,
  next: TrackingCalendarCell,
): TrackingCalendarCell {
  return {
    date: base.date,
    classNames: [...new Set([...base.classNames, ...next.classNames])],
    markers: [...new Set([...base.markers, ...next.markers])],
    events: [...base.events, ...next.events],
  }
}

export function mergeCalendarData(
  datasets: TrackingCalendarData[],
): TrackingCalendarData {
  const cells = new Map<string, TrackingCalendarCell>()
  const legendSeen = new Set<string>()
  const legend: TrackingCalendarData['legend'] = []

  for (const data of datasets) {
    for (const item of data.legend) {
      if (!legendSeen.has(item.id)) {
        legendSeen.add(item.id)
        legend.push(item)
      }
    }
    for (const [date, cell] of data.cells) {
      const existing = cells.get(date)
      if (!existing) {
        cells.set(date, {
          ...cell,
          events: [...cell.events],
        })
        continue
      }
      const merged = mergeCell(existing, cell)
      merged.events = merged.events.slice(0, MAX_EVENTS_PER_DAY)
      cells.set(date, merged)
    }
  }

  for (const [date, cell] of cells) {
    if (cell.events.length > MAX_EVENTS_PER_DAY) {
      cells.set(date, { ...cell, events: cell.events.slice(0, MAX_EVENTS_PER_DAY) })
    }
  }

  return {
    cells,
    legend,
    emptyMessage: 'No tracker activity in this range yet.',
  }
}
