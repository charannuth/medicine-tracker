import { useState } from 'react'

type TagListFieldProps = {
  label: string
  hint?: string
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: readonly string[]
  placeholder?: string
  id?: string
}

export function TagListField({
  label,
  hint,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Type and press Add',
  id,
}: TagListFieldProps) {
  const [draft, setDraft] = useState('')

  function addEntry(entry: string) {
    const trimmed = entry.trim()
    if (!trimmed) return
    const exists = value.some((v) => v.toLowerCase() === trimmed.toLowerCase())
    if (exists) return
    onChange([...value, trimmed])
    setDraft('')
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="tag-list-field">
      <label htmlFor={id}>
        {label}
        {hint && <span className="field-hint tag-list-hint">{hint}</span>}
      </label>

      {value.length > 0 && (
        <ul className="tag-list-chips" aria-label={`${label} entries`}>
          {value.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span className="tag-list-chip">
                {item}
                <button
                  type="button"
                  className="tag-list-chip-remove"
                  onClick={() => removeEntry(index)}
                  aria-label={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="tag-list-input-row">
        <input
          id={id}
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addEntry(draft)
            }
          }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => addEntry(draft)}
        >
          Add
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="tag-list-suggestions">
          <span className="tag-list-suggestions-label">Suggestions:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="wellness-chip"
              disabled={value.some(
                (v) => v.toLowerCase() === suggestion.toLowerCase(),
              )}
              onClick={() => addEntry(suggestion)}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
