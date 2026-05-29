import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { DoctorVisitsPanel } from '../components/doctorVisits/DoctorVisitsPanel'
import { TrackingCalendar } from '../components/tracking/TrackingCalendar'
import { useAuth } from '../hooks/useAuth'
import { useDoctorVisitsCalendarData } from '../hooks/useDoctorVisitsCalendarData'
import { todayLocalDate } from '../lib/dates'
import { CALENDAR_SOURCE_ALL } from '../lib/tracking/calendarSources'
import type { CalendarSourceMeta } from '../lib/tracking/calendarSources'
import type { CalendarViewRange } from '../lib/tracking/calendarRange'

const DOCTOR_VISITS_SOURCE_OPTIONS: CalendarSourceMeta[] = [
  {
    id: CALENDAR_SOURCE_ALL,
    label: 'Doctor visits',
    support: 'full',
  },
]

export function DoctorVisitsPage() {
  const { user } = useAuth()
  const today = todayLocalDate()
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarAnchor, setCalendarAnchor] = useState(today)
  const [calendarRange, setCalendarRange] = useState<CalendarViewRange>('month')
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const {
    data: calendarData,
    loading: calendarLoading,
    error: calendarError,
  } = useDoctorVisitsCalendarData(user?.id, calendarRange, calendarAnchor, calendarRefreshKey)

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setCalendarAnchor(date)
  }

  const bumpCalendarRefresh = useCallback(() => {
    setCalendarRefreshKey((k) => k + 1)
  }, [])

  return (
    <main className="page doctor-visits-page">
      <header className="page-header">
        <h2>Doctor visits</h2>
        <p className="page-subtitle">
          Schedule upcoming appointments and save notes after your visit — for your own
          records, not a clinical chart.
        </p>
      </header>

      {calendarError && <p className="banner banner-error">{calendarError}</p>}

      <section className="tracking-section doctor-visits-section">
        <div className="doctor-visits-toolbar">
          <Link to="/wellness" className="btn btn-secondary btn-sm">
            Prepare wellness report
          </Link>
        </div>

        <TrackingCalendar
          today={today}
          anchor={calendarAnchor}
          range={calendarRange}
          source={CALENDAR_SOURCE_ALL}
          selectedDate={selectedDate}
          enabledTrackers={[]}
          data={calendarData}
          loading={calendarLoading}
          sourceOptions={DOCTOR_VISITS_SOURCE_OPTIONS}
          onAnchorChange={setCalendarAnchor}
          onRangeChange={setCalendarRange}
          onSourceChange={() => {}}
          onSelectDate={handleSelectDate}
        />

        <div className="tracking-module-panel doctor-visits-module-panel">
          <div className="tracking-module-header">
            <h4>Visit details</h4>
          </div>
          <DoctorVisitsPanel
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onDataMutated={bumpCalendarRefresh}
          />
        </div>
      </section>

      <p className="page-footer-hint">
        For symptoms and daily check-ins, use{' '}
        <Link to="/wellness">Wellness</Link> — you can print a doctor report from there.
      </p>
    </main>
  )
}
