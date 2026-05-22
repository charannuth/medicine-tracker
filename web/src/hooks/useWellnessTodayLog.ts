import { useEffect, useState } from 'react'
import {
  emptyWellnessLogInput,
  fetchWellnessLog,
  isWellnessLogFilled,
  logFromRow,
  type WellnessLogInput,
} from '../lib/wellness'

export function useWellnessTodayLog(userId: string | undefined, today: string) {
  const [draft, setDraft] = useState<WellnessLogInput>(() =>
    emptyWellnessLogInput(today),
  )
  const [saved, setSaved] = useState<WellnessLogInput | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let active = true
    const controller = new AbortController()

    const timer = window.setTimeout(() => {
      if (!active) return
      setLoading(true)
      setError(null)

      void fetchWellnessLog(userId, today)
        .then((row) => {
          if (!active || controller.signal.aborted) return
          if (row && isWellnessLogFilled(logFromRow(row))) {
            const input = logFromRow(row)
            setSaved(input)
            setDraft(input)
          } else {
            setSaved(null)
            setDraft(emptyWellnessLogInput(today))
          }
        })
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted) return
          setError(err instanceof Error ? err.message : 'Could not load check-in')
        })
        .finally(() => {
          if (!active || controller.signal.aborted) return
          setLoading(false)
        })
    }, 0)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [userId, today])

  return {
    draft,
    setDraft,
    saved,
    setSaved,
    loading,
    error,
    setError,
  }
}
