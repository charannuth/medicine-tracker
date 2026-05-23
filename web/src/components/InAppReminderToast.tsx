import { useEffect, useState } from 'react'
import {
  IN_APP_REMINDER_EVENT,
  type InAppReminderDetail,
} from '../lib/inAppReminder'

const AUTO_DISMISS_MS = 12_000

export function InAppReminderToast() {
  const [toast, setToast] = useState<InAppReminderDetail | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function onReminder(e: Event) {
      const detail = (e as CustomEvent<InAppReminderDetail>).detail
      setToast(detail)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS)
    }

    window.addEventListener(IN_APP_REMINDER_EVENT, onReminder)
    return () => {
      window.removeEventListener(IN_APP_REMINDER_EVENT, onReminder)
      if (timer) clearTimeout(timer)
    }
  }, [])

  if (!toast) return null

  return (
    <div className="in-app-reminder-toast" role="alert" aria-live="assertive">
      <div className="in-app-reminder-toast-inner">
        <p className="in-app-reminder-title">{toast.title}</p>
        <p className="in-app-reminder-body">{toast.body}</p>
        <p className="in-app-reminder-hint">
          In-app alert (always works). Mac may hide system pop-ups — check Notification
          Center or use this banner.
        </p>
        <button
          type="button"
          className="in-app-reminder-dismiss"
          aria-label="Dismiss"
          onClick={() => setToast(null)}
        >
          ×
        </button>
      </div>
    </div>
  )
}
