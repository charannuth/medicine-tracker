import type { MissedDoseItem } from '../lib/missedDoses'

type DueNowBannerProps = {
  items: MissedDoseItem[]
}

/** Today's past-due doses — always visible (not dismissable). */
export function DueNowBanner({ items }: DueNowBannerProps) {
  const dueToday = items.filter((item) => item.periodLabel === 'Today')
  if (dueToday.length === 0) return null

  return (
    <div className="banner banner-due-now" role="status">
      <strong>Due now — mark when taken:</strong>
      <ul className="missed-list">
        {dueToday.map((item) => (
          <li key={`${item.medicationId}-${item.scheduleTime}`}>
            {item.medicationName} at {item.scheduleLabel}
            {item.doseLabel ? ` (${item.doseLabel})` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
