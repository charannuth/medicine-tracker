import { useCallback, useEffect, useState } from 'react'
import type { CalendarViewRange } from '../lib/tracking/calendarRange'
import { getCalendarWindow } from '../lib/tracking/calendarRange'
import { calendarSupportFor } from '../lib/tracking/calendarSources'
import { loadCycleCalendarData } from '../lib/tracking/cycleCalendarData'
import type { TrackingCalendarData } from '../lib/tracking/calendarTypes'
import type { TrackerId } from '../lib/tracking/catalog'

const EMPTY: TrackingCalendarData = {
  cells: new Map(),
  legend: [],
  emptyMessage: 'No data for this tracker on the calendar yet.',
}

export function useTrackingCalendarData(
  userId: string | undefined,
  source: TrackerId | null,
  range: CalendarViewRange,
  anchor: string,
  refreshKey = 0,
) {
  const [data, setData] = useState<TrackingCalendarData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!userId || !source) {
      setData(EMPTY)
      return
    }

    const support = calendarSupportFor(source)
    if (support === 'planned') {
      setData({
        cells: new Map(),
        legend: [],
        emptyMessage:
          'Calendar view for this tracker is coming soon. Logs will appear here once it is enabled.',
      })
      return
    }
    if (support !== 'full') {
      setData(EMPTY)
      return
    }

    const window = getCalendarWindow(anchor, range)
    setLoading(true)
    setError(null)
    try {
      if (source === 'cycle') {
        const cycleData = await loadCycleCalendarData(userId, window.start, window.end)
        setData(cycleData)
      } else {
        setData(EMPTY)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load calendar')
      setData(EMPTY)
    } finally {
      setLoading(false)
    }
  }, [userId, source, range, anchor])

  useEffect(() => {
    void reload()
  }, [reload, refreshKey])

  return { data, loading, error, reload }
}
