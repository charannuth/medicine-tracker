import { useId, useRef, useState } from 'react'
import {
  useFloatingPanelPosition,
  useIsMobileLayout,
} from '../hooks/useFloatingPanelPosition'
import {
  searchMedicationSuggestions,
  type MedicationSuggestion,
} from '../lib/medicationSuggestions'

type MedicationNameInputProps = {
  value: string
  onChange: (value: string) => void
  onSelectSuggestion?: (suggestion: MedicationSuggestion) => void
  required?: boolean
}

export function MedicationNameInput({
  value,
  onChange,
  onSelectSuggestion,
  required,
}: MedicationNameInputProps) {
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const isMobile = useIsMobileLayout()

  const suggestions = searchMedicationSuggestions(value)
  const showList = open && value.trim().length > 0 && suggestions.length > 0
  const activeIndex = Math.min(highlight, Math.max(0, suggestions.length - 1))
  const floatingStyle = useFloatingPanelPosition(showList, wrapRef, isMobile)

  function pick(suggestion: MedicationSuggestion) {
    onChange(suggestion.name)
    onSelectSuggestion?.(suggestion)
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter' && suggestions[activeIndex]) {
      e.preventDefault()
      pick(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="med-name-autocomplete" ref={wrapRef}>
      <input
        ref={inputRef}
        required={required}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setHighlight(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150)
        }}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Lisinopril"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        aria-expanded={showList}
      />
      {showList && (
        <ul
          id={listId}
          className={`med-suggestions${isMobile ? ' med-suggestions--floating' : ''}`}
          role="listbox"
          style={floatingStyle}
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.name} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`med-suggestion-item ${index === activeIndex ? 'highlighted' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(suggestion)}
                onMouseEnter={() => setHighlight(index)}
              >
                <span className="med-suggestion-name">{suggestion.name}</span>
                {(suggestion.doseMg || suggestion.dosePills) && (
                  <span className="med-suggestion-hint">
                    {[suggestion.dosePills, suggestion.doseMg]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
