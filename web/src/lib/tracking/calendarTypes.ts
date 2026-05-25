import type { ReactNode } from 'react'

/** One cell in the shared tracking calendar. */
export type TrackingCalendarCell = {
  date: string
  /** Modifier classes on the day button (e.g. logged-period, phase-luteal). */
  classNames: string[]
  /** Small indicators under the day number. */
  markers: Array<'heart' | 'dot'>
}

export type TrackingCalendarLegendItem = {
  id: string
  label: string
  swatchClass?: string
  icon?: 'heart' | 'dot'
}

export type TrackingCalendarData = {
  cells: Map<string, TrackingCalendarCell>
  legend: TrackingCalendarLegendItem[]
  emptyMessage?: string
  footer?: ReactNode
}
