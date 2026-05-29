import { useCallback, useEffect, useState } from 'react';
import { loadDoctorVisitsCalendarData } from '../lib/doctorVisitsCalendar';
import { getCalendarWindow, type CalendarViewRange } from '../lib/tracking/calendarRange';
import type { TrackingCalendarData } from '../lib/tracking/calendarTypes';

const EMPTY: TrackingCalendarData = {
  cells: new Map(),
  legend: [],
};

export function useDoctorVisitsCalendarData(
  userId: string | undefined,
  range: CalendarViewRange,
  anchor: string,
  refreshKey = 0,
) {
  const [data, setData] = useState<TrackingCalendarData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setData(EMPTY);
      return;
    }

    const window = getCalendarWindow(anchor, range);
    setLoading(true);
    setError(null);
    try {
      setData(await loadDoctorVisitsCalendarData(userId, window.start, window.end));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load doctor visits calendar');
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [userId, range, anchor]);

  useEffect(() => {
    void reload();
  }, [reload, refreshKey]);

  return { data, loading, error, reload };
}
