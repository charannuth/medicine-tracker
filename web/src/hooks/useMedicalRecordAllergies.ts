import { useEffect, useState } from 'react'
import { fetchMedicalRecord } from '../lib/medicalRecords'

/** Loads allergies and conditions from medical records for safety checks. */
export function useMedicalRecordAllergies(userId: string | undefined) {
  const [allergies, setAllergies] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [loading, setLoading] = useState(Boolean(userId))

  useEffect(() => {
    if (!userId) {
      setAllergies([])
      setConditions([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    fetchMedicalRecord(userId)
      .then((record) => {
        if (active) {
          setAllergies(record?.known_allergies ?? [])
          setConditions(record?.known_conditions ?? [])
        }
      })
      .catch(() => {
        if (active) {
          setAllergies([])
          setConditions([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId])

  return { allergies, conditions, loading }
}
