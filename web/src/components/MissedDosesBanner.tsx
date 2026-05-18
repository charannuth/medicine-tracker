import type { MissedDoseItem } from '../lib/missedDoses'

type MissedDosesBannerProps = {
  items: MissedDoseItem[]
  onDismiss: () => void
}

export function MissedDosesBanner({ items, onDismiss }: MissedDosesBannerProps) {
  if (items.length === 0) return null

  return (
    <div className="banner banner-missed" role="status">
      <button
        type="button"
        className="banner-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss missed doses"
      >
        ×
      </button>
      <strong>Missed doses:</strong>
      <ul className="missed-list">
        {items.map((item) => (
          <li key={`${item.periodLabel}-${item.medicationId}-${item.scheduleTime}`}>
            {item.periodLabel}: {item.medicationName} at {item.scheduleLabel}
          </li>
        ))}
      </ul>
    </div>
  )
}
