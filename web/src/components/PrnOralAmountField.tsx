import { useEffect, useState } from 'react'
import {
  getFormLabel,
  isMedicationRouteId,
  type MedicationRouteId,
} from '../lib/medicationForms'
import {
  ORAL_PRN_AMOUNT_PRESETS,
  type OralPrnAmountPick,
} from '../lib/prnCheckIn'
import type { MedicationWithStatus } from '../lib/types'

type PrnOralAmountFieldProps = {
  medication: MedicationWithStatus
  amount: string
  disabled?: boolean
  resetKey: number
  onAmountChange: (amount: string) => void
  onEnter?: () => void
}

function oralCustomPlaceholder(med: MedicationWithStatus): string {
  const routeId = med.medication_route ?? ''
  const route: MedicationRouteId | null = isMedicationRouteId(routeId)
    ? routeId
    : null
  const formLabel = getFormLabel(route, med.medication_form)
  if (med.medication_form?.includes('spray')) {
    return 'e.g. 4 puffs'
  }
  if (formLabel) {
    return `e.g. 1.5 ${formLabel.toLowerCase()}s`
  }
  return 'e.g. 1 tablet, 0.5 mL'
}

export function PrnOralAmountField({
  medication,
  amount,
  disabled = false,
  resetKey,
  onAmountChange,
  onEnter,
}: PrnOralAmountFieldProps) {
  const [pick, setPick] = useState<OralPrnAmountPick>('')

  useEffect(() => {
    setPick('')
  }, [resetKey, medication.id])

  function handlePickChange(value: string) {
    const next = value as OralPrnAmountPick
    setPick(next)
    if (
      (ORAL_PRN_AMOUNT_PRESETS as readonly string[]).includes(next)
    ) {
      onAmountChange(next)
      return
    }
    if (next === 'custom') {
      onAmountChange('')
      return
    }
    onAmountChange('')
  }

  return (
    <div className="prn-oral-amount">
      <label className="prn-amount-input-label">
        Amount
        <select
          value={pick}
          disabled={disabled}
          aria-label="How much you took"
          onChange={(e) => handlePickChange(e.target.value)}
        >
          <option value="">Select amount</option>
          {ORAL_PRN_AMOUNT_PRESETS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
          <option value="custom">Enter custom amount</option>
        </select>
      </label>

      {pick === 'custom' && (
        <label className="prn-amount-input-label prn-amount-custom-row">
          Custom amount
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            disabled={disabled}
            placeholder={oralCustomPlaceholder(medication)}
            onChange={(e) => onAmountChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEnter?.()
              }
            }}
          />
        </label>
      )}
    </div>
  )
}
