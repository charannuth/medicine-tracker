import { useId, useRef, useState } from 'react'
import {
  useFloatingPanelPosition,
  useIsMobileLayout,
} from '../hooks/useFloatingPanelPosition'
import { MIN_RXNORM_QUERY_LEN, useRxNormDrugSearch } from '../hooks/useRxNormDrugSearch'
import {
  mergeMedicationSuggestions,
  searchLocalMedicationSuggestions,
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

  const query = value.trim()
  const { names: rxnormNames, loading: rxnormLoading, failed: rxnormFailed } =
    useRxNormDrugSearch(query)

  const localSuggestions = searchLocalMedicationSuggestions(value, 8)
  const suggestions = mergeMedicationSuggestions(localSuggestions, rxnormNames, 12)
  const showList = open && query.length > 0 && suggestions.length > 0
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
        placeholder="e.g. Lexapro, Lipitor, lisinopril"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        aria-expanded={showList}
        aria-busy={rxnormLoading}
      />
      {query.length >= MIN_RXNORM_QUERY_LEN && (
        <p className="med-name-search-hint" aria-live="polite">
          {rxnormLoading
            ? 'Searching RxNorm (NIH drug names)…'
            : rxnormFailed
              ? 'Showing common names only — RxNorm search unavailable.'
              : 'Brand names (Lexapro, Tylenol) and RxNorm matches appear as you type.'}
        </p>
      )}
      {showList && (
        <ul
          id={listId}
          className={`med-suggestions${isMobile ? ' med-suggestions--floating' : ''}`}
          role="listbox"
          style={floatingStyle}
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.name}-${index}`} role="presentation">
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
                {(suggestion.genericName ||
                  suggestion.doseMg ||
                  suggestion.dosePills) && (
                  <span className="med-suggestion-hint">
                    {suggestion.genericName
                      ? `Generic: ${suggestion.genericName}`
                      : [suggestion.dosePills, suggestion.doseMg]
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
