import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getLastReminderCheck, runReminderCheck } from '../lib/reminders'
import {
  canUseNotifications,
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from '../lib/notifications'
import { ProfilePictureEditor } from './ProfilePictureEditor'
import {
  getReminders,
  getTheme,
  getTimezone,
  setReminders,
  setTheme,
  setTimezone,
  THEME_CHANGE_EVENT,
  type Theme,
} from '../lib/settings'

export function AccountSettings() {
  const { user, updateDisplayName } = useAuth()
  const [displayName, setDisplayName] = useState(
    () => (user?.user_metadata?.display_name as string) ?? '',
  )
  const [theme, setThemeState] = useState<Theme>(() => getTheme())

  useEffect(() => {
    function onThemeChange(e: Event) {
      setThemeState((e as CustomEvent<Theme>).detail)
    }
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange)
  }, [])
  const [timezone, setTimezoneState] = useState(() => getTimezone())
  const [remindersOn, setRemindersOn] = useState(() => getReminders().enabled)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [reminderDebug, setReminderDebug] = useState(
    () => getLastReminderCheck(),
  )

  async function saveProfile() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await updateDisplayName(displayName)
      setMessage('Profile updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update profile')
    } finally {
      setBusy(false)
    }
  }

  function handleThemeChange(next: Theme) {
    setThemeState(next)
    setTheme(next)
  }

  function handleTimezoneChange(tz: string) {
    setTimezoneState(tz)
    setTimezone(tz)
    setMessage('Timezone saved. “Today” uses this zone.')
  }

  async function toggleReminders(enabled: boolean) {
    setError(null)
    setMessage(null)
    if (enabled) {
      if (!isNotificationSupported()) {
        setError(
          'This browser does not support reminders. Try Chrome or Edge on desktop, or the mobile app later.',
        )
        return
      }
      const ok = await requestNotificationPermission()
      if (!ok) {
        setError(
          'Notifications are blocked. Click the lock icon in the address bar → Notifications → Allow, then try again.',
        )
        return
      }
    }
    setRemindersOn(enabled)
    setReminders({ enabled })
    if (enabled && user?.id) {
      const result = await runReminderCheck(user.id)
      setReminderDebug(result)
      setMessage(result.summary)
    } else if (enabled) {
      setMessage('Reminders on. Keep this tab open; alerts fire after each scheduled dose time.')
    } else {
      setMessage('Reminders off.')
      setReminderDebug(null)
    }
  }

  async function handleCheckRemindersNow() {
    if (!user?.id) return
    setError(null)
    setMessage(null)
    try {
      const result = await runReminderCheck(user.id)
      setReminderDebug(result)
      setMessage(result.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reminder check failed')
    }
  }

  const permission = getNotificationPermission()
  const permissionHint =
    permission === 'unsupported'
      ? 'Not supported in this browser.'
      : permission === 'granted'
        ? 'Allowed'
        : permission === 'denied'
          ? 'Blocked — change in browser site settings'
          : 'Not asked yet — turn on reminders to allow'

  const tzOptions = Intl.supportedValuesOf('timeZone')

  return (
    <section className="account-card account-settings">
      <h3 className="account-section-title">Settings</h3>

      <div className="account-settings-fields">
        <ProfilePictureEditor />

        <label className="account-field">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled={busy}
          onClick={() => void saveProfile()}
        >
          Save name
        </button>

        <label className="account-field">
          Theme
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as Theme)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label className="account-field">
          Timezone
          <select
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
          >
            {tzOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        <label className="account-field account-field-checkbox">
          <input
            type="checkbox"
            checked={remindersOn}
            onChange={(e) => void toggleReminders(e.target.checked)}
          />
          <span>
            Browser reminders (while app is open)
            {!canUseNotifications() && remindersOn && (
              <span className="field-hint"> — permission required</span>
            )}
          </span>
        </label>

        <p className="field-hint account-notification-status">
          Notification permission: <strong>{permissionHint}</strong>
        </p>

        {remindersOn && (
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={() => void handleCheckRemindersNow()}
          >
            Check dose reminders now
          </button>
        )}

        {reminderDebug && remindersOn && (
          <div className="reminder-debug">
            <p>
              App clock: <strong>{reminderDebug.nowLabel}</strong> ({reminderDebug.timezone}
              ) · Today: {reminderDebug.today}
            </p>
            {reminderDebug.slots.length === 0 ? (
              <p className="field-hint">No dose slots for today.</p>
            ) : (
              <ul>
                {reminderDebug.slots.map((slot) => (
                  <li key={`${slot.medicationName}-${slot.scheduleTime}`}>
                    <strong>{slot.medicationName}</strong> {slot.scheduleLabel}
                    {slot.taken
                      ? ' — taken'
                      : slot.notifiedNow
                        ? ' — reminder sent'
                        : slot.skipReason
                          ? ` — ${slot.skipReason}`
                          : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="field-hint">
          Dose reminders fire after each scheduled time passes (if not marked taken). On Mac,
          switch to another app or check Notification Center if no banner appears. Use{' '}
          <strong>Check dose reminders now</strong> to verify your schedule.
        </p>

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
      </div>
    </section>
  )
}
