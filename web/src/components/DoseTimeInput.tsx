import { useId, useRef } from 'react'
import type { Meridiem } from '../lib/dates'
import {
  formatTime12MaskFromDigits,
  extractTimeDigits,
  normalizeTime12Display,
  time12FromSchedule24,
  tryScheduleTime24,
} from '../lib/doseTimeInput'

type DoseTimeInputProps = {
  time12: string
  period: Meridiem
  label: string
  onChange: (next: { time12: string; period: Meridiem }) => void
}

export function DoseTimeInput({ time12, period, label, onChange }: DoseTimeInputProps) {
  const nativeId = useId()
  const nativeRef = useRef<HTMLInputElement>(null)
  const time24 = tryScheduleTime24(time12, period) ?? '08:00'

  function handleMaskedChange(raw: string) {
    const digits = extractTimeDigits(raw)
    onChange({ time12: formatTime12MaskFromDigits(digits), period })
  }

  function handleMaskedBlur() {
    if (!time12.trim()) return
    try {
      const normalized = normalizeTime12Display(time12)
      onChange({ time12: normalized, period })
    } catch {
      /* keep partial input until user fixes or taps Next */
    }
  }

  function handleNativeChange(value24: string) {
    if (!value24) return
    const next = time12FromSchedule24(value24)
    onChange(next)
  }

  function openNativePicker() {
    const el = nativeRef.current
    if (!el) return
    try {
      el.showPicker()
    } catch {
      el.focus()
      el.click()
    }
  }

  return (
    <div className="dose-time-entry">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="dose-time-input dose-time-mask"
        value={time12}
        onChange={(e) => handleMaskedChange(e.target.value)}
        onBlur={handleMaskedBlur}
        placeholder="00:00"
        aria-label={`${label} time`}
        maxLength={5}
      />
      <select
        className="dose-period-select"
        value={period}
        onChange={(e) => onChange({ time12, period: e.target.value as Meridiem })}
        aria-label={`${label} AM or PM`}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
      <button
        type="button"
        className="btn btn-ghost btn-sm dose-time-picker-btn"
        onClick={openNativePicker}
        aria-label={`${label} pick time`}
      >
        Pick
      </button>
      <input
        ref={nativeRef}
        id={nativeId}
        type="time"
        className="dose-time-native"
        value={time24}
        onChange={(e) => handleNativeChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
      />
    </div>
  )
}
