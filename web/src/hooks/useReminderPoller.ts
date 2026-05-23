import { useEffect } from 'react'
import { runReminderCheck } from '../lib/reminders'
import { getReminders } from '../lib/settings'

const REMINDER_POLL_MS = 30_000

export function useReminderPoller(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    const tick = () => {
      if (!getReminders().enabled) return
      void runReminderCheck(userId).catch(() => {})
    }

    tick()
    const id = window.setInterval(tick, REMINDER_POLL_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])
}
