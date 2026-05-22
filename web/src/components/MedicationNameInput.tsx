import { useEffect, useId, useRef, useState } from 'react'
import {
  useFloatingPanelPosition,
  useIsMobileLayout,
} from '../hooks/useFloatingPanelPosition'
import {
  mergeMedicationSuggestions,
  searchLocalMedicationSuggestions,
  type MedicationSuggestion,
} from '../lib/medicationSuggestions'
import { searchRxNormDrugNames } from '../lib/rxnormSearch'

const RXNORM_DEBOUNCE_MS = 350
const MIN_RXNORM_QUERY_LEN = 2

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
  const [rxnormNames, setRxnormNames] = useState<string[]>([])
  const [rxnormLoading, setRxnormLoading] = useState(false)
  const [rxnormFailed, setRxnormFailed] = useState(false)
  const isMobile = useIsMobileLayout()

  const localSuggestions = searchLocalMedicationSuggestions(value, 6)
  const suggestions = mergeMedicationSuggestions(localSuggestions, rxnormNames, 10)
  const showList = open && value.trim().length > 0 && suggestions.length > 0
  const activeIndex = Math.min(highlight, Math.max(0, suggestions.length - 1))
  const floatingStyle = useFloatingPanelPosition(showList, wrapRef, isMobile)

  useEffect(() => {
    const q = value.trim()
    if (q.length < MIN_RXNORM_QUERY_LEN) {
      setRxnormNames([])
      setRxnormLoading(false)
      setRxnormFailed(false)
      return
    }

    const controller = new AbortController()
    setRxnormLoading(true)
    setRxnormFailed(false)

    const timer = window.setTimeout(() => {
      void searchRxNormDrugNames(q, 10, controller.signal)
        .then((names) => {
          if (!controller.signal.aborted) {
            setRxnormNames(names)
            setRxnormFailed(false)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setRxnormNames([])
            setRxnormFailed(true)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setRxnormLoading(false)
        })
    }, RXNORM_DEBOUNCE_MS)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    setHighlight(0)
  }, [value, suggestions.length])

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
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150)
        }}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Lipitor, Lisinopril"
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={showList ? listId : undefined}
        aria-expanded={showList}
        aria-busy={rxnormLoading}
      />
      {value.trim().length >= MIN_RXNORM_QUERY_LEN && (
        <p className="med-name-search-hint" aria-live="polite">
          {rxnormLoading
            ? 'Searching RxNorm (NIH drug names)…'
            : rxnormFailed
              ? 'Showing common names only — RxNorm search unavailable.'
              : 'Suggestions include brands and generics from RxNorm.'}
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
