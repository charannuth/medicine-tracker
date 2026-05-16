import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  canUseNotifications,
  requestNotificationPermission,
} from '../lib/notifications'
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
    if (enabled) {
      const ok = await requestNotificationPermission()
      if (!ok) {
        setError('Enable notifications in your browser to use reminders.')
        return
      }
    }
    setRemindersOn(enabled)
    setReminders({ enabled })
    setMessage(enabled ? 'Reminders enabled while app is open.' : 'Reminders off.')
  }

  const tzOptions = Intl.supportedValuesOf('timeZone')

  return (
    <section className="account-card account-settings">
      <h3 className="account-section-title">Settings</h3>

      <div className="account-settings-fields">
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

        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
      </div>
    </section>
  )
}
