import { useEffect, useState } from 'react'
import { buildMedicationSafetyReview } from '../lib/medicationSafetyReview'
import type { ActiveMedicationSummary } from '../lib/wellnessReport'

export type MedBriefingEntry = {
  med: ActiveMedicationSummary
  review: Awaited<ReturnType<typeof buildMedicationSafetyReview>>
}

export function useWellnessMedBriefings(medications: ActiveMedicationSummary[]) {
  const [entries, setEntries] = useState<MedBriefingEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const medKey = medications.map((m) => `${m.name}:${m.start_date}`).join('|')

  useEffect(() => {
    if (medications.length === 0) {
      const timer = window.setTimeout(() => {
        setEntries([])
        setLoading(false)
      }, 0)
      return () => window.clearTimeout(timer)
    }

    let active = true
    const controller = new AbortController()
    const allNames = medications.map((m) => m.name)

    const timer = window.setTimeout(() => {
      if (!active) return
      setLoading(true)
      setError(null)

      void Promise.all(
        medications.map(async (med) => {
          const others = allNames.filter(
            (n) => n.toLowerCase() !== med.name.toLowerCase(),
          )
          const review = await buildMedicationSafetyReview(med.name, others)
          return { med, review }
        }),
      )
        .then((results) => {
          if (!active || controller.signal.aborted) return
          const sorted = [...results].sort((a, b) =>
            b.med.start_date.localeCompare(a.med.start_date),
          )
          setEntries(sorted)
        })
        .catch((err: unknown) => {
          if (!active || controller.signal.aborted) return
          setError(
            err instanceof Error ? err.message : 'Could not load medication briefings',
          )
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
  }, [medKey, medications])

  return { entries, loading, error }
}
