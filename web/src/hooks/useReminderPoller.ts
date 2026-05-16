import { useEffect } from 'react'
import { runReminderCheck } from '../lib/reminders'
import { getReminders } from '../lib/settings'

export function useReminderPoller(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return

    const tick = () => {
      if (!getReminders().enabled) return
      void runReminderCheck(userId).catch(() => {})
    }

    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [userId])
}
