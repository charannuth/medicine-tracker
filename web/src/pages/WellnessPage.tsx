import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWellnessPageData } from '../hooks/useWellnessPageData'
import { useWellnessMedBriefings } from '../hooks/useWellnessMedBriefings'
import { WellnessBaselineForm } from '../components/WellnessBaselineForm'
import { WellnessDailyForm } from '../components/WellnessDailyForm'
import { WellnessDisclaimer } from '../components/WellnessDisclaimer'
import { PrnInsightsSection } from '../components/PrnInsightsSection'
import { WellnessTrendsSection } from '../components/WellnessTrendsSection'
import { WellnessMedBriefings } from '../components/WellnessMedBriefings'
import { WellnessExportReport } from '../components/WellnessExportReport'
import {
  formatWellnessLogSummary,
  isWellnessLogFilled,
  lastNDates,
  logFromRow,
  upsertWellnessLog,
  upsertWellnessProfile,
} from '../lib/wellness'
import { todayLocalDate } from '../lib/dates'

function formatDisplayDate(dateStr: string): string {
  const today = todayLocalDate()
  if (dateStr === today) return 'Today'
  const yesterday = lastNDates(2, today)[1]
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function WellnessPage() {
  const { user } = useAuth()
  const location = useLocation()
  const today = todayLocalDate()
  const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => {
    const date = (location.state as { wellnessDate?: string } | null)?.wellnessDate
    if (date) setSelectedDate(date)
  }, [location.state])
  const {
    weekDates,
    profileDraft,
    setProfileDraft,
    logDraft,
    setLogDraft,
    weekLogs,
    trendLogs,
    reportLogs,
    prnInsights,
    activeMeds,
    pageLoading,
    logLoading,
    error,
    setError,
    refreshWeekLogs,
  } = useWellnessPageData(user?.id, selectedDate)

  const { entries: briefingEntries } = useWellnessMedBriefings(activeMeds)

  const [profileBusy, setProfileBusy] = useState(false)
  const [logBusy, setLogBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState<string | null>(null)
  const [logMessage, setLogMessage] = useState<string | null>(null)

  async function handleSaveProfile() {
    if (!user) return
    setProfileBusy(true)
    setProfileMessage(null)
    setError(null)
    try {
      await upsertWellnessProfile(user.id, profileDraft)
      setProfileMessage('Baseline saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save baseline')
    } finally {
      setProfileBusy(false)
    }
  }

  async function handleSaveLog() {
    if (!user) return
    if (!isWellnessLogFilled(logDraft)) {
      setError('Add at least one field before saving this day.')
      return
    }
    setLogBusy(true)
    setLogMessage(null)
    setError(null)
    try {
      await upsertWellnessLog(user.id, logDraft)
      setLogMessage(`Saved ${formatDisplayDate(logDraft.log_date)}.`)
      await refreshWeekLogs()
      if (logDraft.log_date === today) {
        setSelectedDate(today)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save log')
    } finally {
      setLogBusy(false)
    }
  }

  const logByDate = new Map(weekLogs.map((l) => [l.log_date, l]))

  return (
    <main className="page wellness-page">
      <header className="page-header">
        <h2>Wellness</h2>
        <p className="page-subtitle">
          Track daily experiences to share with your doctor — not a substitute for
          medical care.
        </p>
      </header>

      <WellnessDisclaimer />

      {error && <p className="banner banner-error">{error}</p>}

      {pageLoading ? (
        <p className="loading">Loading wellness…</p>
      ) : (
        <>
          <WellnessExportReport
            userEmail={user?.email}
            profile={profileDraft}
            medications={activeMeds}
            reportLogs={reportLogs}
            prnInsights={prnInsights}
            briefingEntries={briefingEntries}
          />

          <PrnInsightsSection insights={prnInsights} />

          <WellnessTrendsSection trendLogs={trendLogs} />

          <section className="wellness-card">
            <h3 className="wellness-section-title">Your baseline</h3>
            {profileMessage && (
              <p className="banner banner-success-style">{profileMessage}</p>
            )}
            <WellnessBaselineForm
              value={profileDraft}
              onChange={setProfileDraft}
              onSubmit={() => void handleSaveProfile()}
              busy={profileBusy}
            />
          </section>

          <section className="wellness-card">
            <h3 className="wellness-section-title">Daily log</h3>
            <p className="field-hint">
              Same check-in as on Today — pick a day below or change the date.
            </p>
            {logMessage && (
              <p className="banner banner-success-style">{logMessage}</p>
            )}
            {logLoading ? (
              <p className="loading">Loading day…</p>
            ) : (
              <WellnessDailyForm
                showDate
                value={logDraft}
                onChange={setLogDraft}
                onSubmit={() => void handleSaveLog()}
                busy={logBusy}
                submitLabel={`Save ${formatDisplayDate(logDraft.log_date)}`}
                trackedSymptoms={profileDraft.symptom_focus}
              />
            )}
          </section>

          <section className="wellness-card">
            <h3 className="wellness-section-title">Last 7 days</h3>
            <ul className="wellness-day-list">
              {weekDates.map((date) => {
                const row = logByDate.get(date)
                const filled = row && isWellnessLogFilled(logFromRow(row))
                const active = date === selectedDate
                return (
                  <li key={date}>
                    <button
                      type="button"
                      className={`wellness-day-btn${active ? ' active' : ''}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <span className="wellness-day-label">
                        {formatDisplayDate(date)}
                      </span>
                      <span
                        className={`wellness-day-status${filled ? ' done' : ''}`}
                      >
                        {filled
                          ? formatWellnessLogSummary(logFromRow(row))
                          : 'No log'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <WellnessMedBriefings medications={activeMeds} />
        </>
      )}
    </main>
  )
}
