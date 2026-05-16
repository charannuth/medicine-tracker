import { Link } from 'react-router-dom'
import type { RefillAlert } from '../lib/refills'

export function RefillBanner({ alerts }: { alerts: RefillAlert[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="banner banner-warning" role="status">
      <strong>Refill soon:</strong>{' '}
      {alerts.map((a, i) => (
        <span key={a.medicationId}>
          {i > 0 && ', '}
          {a.name} ({a.pillsRemaining} left)
        </span>
      ))}
      .{' '}
      <Link to="/medications">Update supply</Link>
    </div>
  )
}
