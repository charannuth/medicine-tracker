import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTrackingCalendarData } from '../hooks/useTrackingCalendarData'
import { PhysicalProfileForm } from '../components/PhysicalProfileForm'
import { CycleTrackerPanel } from '../components/tracking/CycleTrackerPanel'
import { HrtTrackerPanel } from '../components/tracking/HrtTrackerPanel'
import { MedProgressPanel } from '../components/tracking/MedProgressPanel'
import { TrackingCalendar } from '../components/tracking/TrackingCalendar'
import {
  calendarSourceOptions,
  calendarSupportFor,
  defaultCalendarSource,
} from '../lib/tracking/calendarSources'
import type { CalendarViewRange } from '../lib/tracking/calendarRange'
import { todayLocalDate } from '../lib/dates'
import {
  TRACKER_CATALOG,
  trackerCatalogEntry,
  type TrackerId,
} from '../lib/tracking/catalog'
import {
  disableTracker,
  enableTracker,
  fetchEnabledTrackers,
} from '../lib/tracking/trackers'
import {
  emptyPhysicalProfileInput,
  fetchMedicalRecord,
  isPhysicalProfileFilled,
  physicalProfileFromRecord,
  physicalProfileSummary,
  upsertPhysicalProfile,
  type PhysicalProfileInput,
} from '../lib/physicalProfile'
import type { MedicalRecord } from '../lib/medicalRecords'

export function TrackingPage() {
  const { user } = useAuth()
  const today = todayLocalDate()
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null)
  const [profileDraft, setProfileDraft] = useState<PhysicalProfileInput>(
    emptyPhysicalProfileInput(),
  )
  const [enabled, setEnabled] = useState<TrackerId[]>([])
  const [activeTracker, setActiveTracker] = useState<TrackerId | null>(null)
  const [profileExpanded, setProfileExpanded] = useState(true)
  const [addTrackerId, setAddTrackerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [profileBusy, setProfileBusy] = useState(false)
  const [trackerBusy, setTrackerBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(today)
  const [calendarAnchor, setCalendarAnchor] = useState(today)
  const [calendarRange, setCalendarRange] = useState<CalendarViewRange>('month')
  const [calendarSource, setCalendarSource] = useState<TrackerId | null>(null)
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)

  const reload = useCallback(async () => {
    if (!user) return
    const [record, trackers] = await Promise.all([
      fetchMedicalRecord(user.id),
      fetchEnabledTrackers(user.id),
    ])
    setMedicalRecord(record)
    setProfileDraft(physicalProfileFromRecord(record))
    setEnabled(trackers)
    setActiveTracker((prev) =>
      prev && trackers.includes(prev) ? prev : trackers[0] ?? null,
    )
    if (!isPhysicalProfileFilled(physicalProfileFromRecord(record))) {
      setProfileExpanded(true)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    let active = true
    reload()
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load tracking')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user, reload])

  useEffect(() => {
    setCalendarSource((prev) => defaultCalendarSource(enabled, prev ?? activeTracker))
  }, [enabled, activeTracker])

  useEffect(() => {
    if (activeTracker && calendarSupportFor(activeTracker) !== 'none') {
      setCalendarSource(activeTracker)
    }
  }, [activeTracker])

  const calendarOptions = calendarSourceOptions(enabled)
  const showCalendar = calendarOptions.length > 0

  const {
    data: calendarData,
    loading: calendarLoading,
    error: calendarError,
  } = useTrackingCalendarData(
    user?.id,
    calendarSource,
    calendarRange,
    calendarAnchor,
    calendarRefreshKey,
  )

  function handleSelectDate(date: string) {
    setSelectedDate(date)
    setCalendarAnchor(date)
  }

  function bumpCalendarRefresh() {
    setCalendarRefreshKey((k) => k + 1)
  }

  async function handleSaveProfile() {
    if (!user) return
    setProfileBusy(true)
    setMessage(null)
    setError(null)
    try {
      const saved = await upsertPhysicalProfile(user.id, profileDraft, medicalRecord)
      setMedicalRecord(saved)
      setMessage('Physical profile saved.')
      setProfileExpanded(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setProfileBusy(false)
    }
  }

  async function handleAddTracker() {
    if (!user || !addTrackerId) return
    const entry = trackerCatalogEntry(addTrackerId as TrackerId)
    if (!entry?.available) return
    setTrackerBusy(true)
    setError(null)
    try {
      await enableTracker(user.id, addTrackerId as TrackerId)
      setAddTrackerId('')
      await reload()
      setActiveTracker(addTrackerId as TrackerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable tracker')
    } finally {
      setTrackerBusy(false)
    }
  }

  async function handleRemoveTracker(trackerId: TrackerId) {
    if (!user) return
    if (!confirm(`Remove ${trackerCatalogEntry(trackerId)?.label ?? trackerId} from your trackers?`)) {
      return
    }
    setTrackerBusy(true)
    setError(null)
    try {
      await disableTracker(user.id, trackerId)
      if (activeTracker === trackerId) {
        setActiveTracker(null)
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove tracker')
    } finally {
      setTrackerBusy(false)
    }
  }

  const availableToAdd = TRACKER_CATALOG.filter(
    (t) => t.available && !enabled.includes(t.id),
  )

  const profileSummary = physicalProfileSummary(medicalRecord)

  function renderTrackerPanel(id: TrackerId) {
    switch (id) {
      case 'cycle':
        return (
          <CycleTrackerPanel
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onDataMutated={bumpCalendarRefresh}
          />
        )
      case 'hrt':
        return <HrtTrackerPanel />
      case 'med_progress':
        return <MedProgressPanel />
      default:
        return null
    }
  }

  return (
    <main className="page tracking-page">
      <header className="page-header">
        <h2>Tracking</h2>
        <p className="page-subtitle">
          Optional health modules — enable what you need, skip the rest
        </p>
      </header>

      {error && <p className="banner banner-error">{error}</p>}
      {calendarError && <p className="banner banner-error">{calendarError}</p>}
      {message && <p className="banner banner-success-style">{message}</p>}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : (
        <>
          <section className="tracking-section tracking-profile-section">
            <button
              type="button"
              className="tracking-section-toggle"
              aria-expanded={profileExpanded}
              onClick={() => setProfileExpanded((v) => !v)}
            >
              <h3>Physical profile</h3>
              {!profileExpanded && profileSummary && (
                <span className="tracking-section-summary">{profileSummary}</span>
              )}
            </button>
            {profileExpanded && (
              <PhysicalProfileForm
                value={profileDraft}
                onChange={setProfileDraft}
                onSubmit={() => void handleSaveProfile()}
                busy={profileBusy}
              />
            )}
          </section>

          <section className="tracking-section">
            <h3>My trackers</h3>
            {enabled.length === 0 ? (
              <p className="field-hint">
                Choose a tracker below to get started. Wellness stays on its own page for now.
              </p>
            ) : (
              <div className="tracker-tabs" role="tablist" aria-label="Enabled trackers">
                {enabled.map((id) => {
                  const entry = trackerCatalogEntry(id)
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={activeTracker === id}
                      className={`tracker-tab${activeTracker === id ? ' active' : ''}`}
                      onClick={() => setActiveTracker(id)}
                    >
                      {entry?.label ?? id}
                    </button>
                  )
                })}
              </div>
            )}

            {showCalendar && calendarSource && (
              <TrackingCalendar
                today={today}
                anchor={calendarAnchor}
                range={calendarRange}
                source={calendarSource}
                selectedDate={selectedDate}
                enabledTrackers={enabled}
                data={calendarData}
                loading={calendarLoading}
                onAnchorChange={setCalendarAnchor}
                onRangeChange={setCalendarRange}
                onSourceChange={setCalendarSource}
                onSelectDate={handleSelectDate}
              />
            )}

            <div className="tracking-add-row">
              <label className="tracking-add-label">
                Add tracker
                <select
                  value={addTrackerId}
                  onChange={(e) => setAddTrackerId(e.target.value)}
                  disabled={availableToAdd.length === 0 || trackerBusy}
                >
                  <option value="">
                    {availableToAdd.length === 0
                      ? 'All available trackers enabled'
                      : 'Choose…'}
                  </option>
                  {availableToAdd.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                  {TRACKER_CATALOG.filter((t) => !t.available).map((t) => (
                    <option key={t.id} value={t.id} disabled>
                      {t.label} (coming soon)
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!addTrackerId || trackerBusy}
                onClick={() => void handleAddTracker()}
              >
                Enable
              </button>
            </div>

            {activeTracker && enabled.includes(activeTracker) && (
              <div
                className="tracking-module-panel"
                role="tabpanel"
                id={`tracker-panel-${activeTracker}`}
              >
                <div className="tracking-module-header">
                  <h4>{trackerCatalogEntry(activeTracker)?.label}</h4>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm danger"
                    disabled={trackerBusy}
                    onClick={() => void handleRemoveTracker(activeTracker)}
                  >
                    Remove
                  </button>
                </div>
                <p className="field-hint">
                  {trackerCatalogEntry(activeTracker)?.description}
                </p>
                {renderTrackerPanel(activeTracker)}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
