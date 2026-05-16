import type { MissedDoseItem } from '../lib/missedDoses'

export function MissedDosesBanner({ items }: { items: MissedDoseItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="banner banner-missed" role="status">
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
