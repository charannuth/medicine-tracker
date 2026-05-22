import { useEffect, useState } from 'react'
import { searchRxNormDrugNames } from '../lib/rxnormSearch'

const RXNORM_DEBOUNCE_MS = 350
export const MIN_RXNORM_QUERY_LEN = 2

export function useRxNormDrugSearch(query: string) {
  const [names, setNames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const active = query.length >= MIN_RXNORM_QUERY_LEN

  useEffect(() => {
    if (!active) return

    const controller = new AbortController()

    const timer = window.setTimeout(() => {
      setLoading(true)
      setFailed(false)

      void searchRxNormDrugNames(query, 10, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) {
            setNames(results)
            setFailed(false)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setNames([])
            setFailed(true)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, RXNORM_DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, active])

  return {
    names: active ? names : [],
    loading: active && loading,
    failed: active && failed,
  }
}
