import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  checkMedicationInteractions,
  type InteractionCheckResult,
} from '../lib/drugInteractions'

type InteractionAlertProps = {
  medicationNames: string[]
}

export function InteractionAlert({ medicationNames }: InteractionAlertProps) {
  const shouldCheck = medicationNames.length >= 2
  const [result, setResult] = useState<InteractionCheckResult | null>(null)

  useEffect(() => {
    if (!shouldCheck) return

    let active = true

    checkMedicationInteractions(medicationNames)
      .then((data) => {
        if (active) setResult(data)
      })
      .catch(() => {
        if (active) setResult(null)
      })

    return () => {
      active = false
    }
  }, [medicationNames, shouldCheck])

  if (!shouldCheck || !result || result.interactions.length === 0) return null

  const major = result.interactions.filter((i) => i.severity === 'major').length
  const top = result.interactions[0]

  return (
    <div
      className={`banner interaction-alert ${major > 0 ? 'banner-error' : 'banner-warning'}`}
      role="alert"
    >
      <strong>
        {result.interactions.length} potential interaction
        {result.interactions.length === 1 ? '' : 's'}
      </strong>
      {top && (
        <span>
          {' '}
          — e.g. {top.displayA} + {top.displayB} ({top.severity})
        </span>
      )}
      . <Link to="/interactions">Review safety check</Link>
    </div>
  )
}
