import { formatDoseDisplay } from '../lib/dose'
import { formatMedicationDateRange } from '../lib/medicationDates'
import type { DoseSlotStatus, MedicationWithStatus } from '../lib/types'

type MedicationCardProps = {
  medication: MedicationWithStatus
  onMarkTaken: (scheduleTime: string) => void
  onUndo: (slot: DoseSlotStatus) => void
  onEdit: () => void
  onDelete: () => void
  busySlot: string | null
}

export function MedicationCard({
  medication,
  onMarkTaken,
  onUndo,
  onEdit,
  onDelete,
  busySlot,
}: MedicationCardProps) {
  const lowSupply =
    medication.pills_remaining != null && medication.pills_remaining <= 7

  const { dosesTakenToday, dosesTotalToday, allDosesTakenToday } = medication
  const showDateRange = Boolean(medication.end_date)

  return (
    <article className={`med-card ${allDosesTakenToday ? 'taken' : ''}`}>
      <div className="med-card-header">
        <div>
          <h3>{medication.name}</h3>
          <p className="med-dosage">
            {formatDoseDisplay(medication)}
            {dosesTotalToday > 1
              ? ` · ${dosesTotalToday} doses per day`
              : dosesTotalToday === 1
                ? ' · once daily'
                : ''}
          </p>
        </div>
        {dosesTotalToday > 0 ? (
          allDosesTakenToday ? (
            <span className="badge badge-success">All doses taken</span>
          ) : dosesTakenToday > 0 ? (
            <span className="badge badge-partial">
              {dosesTakenToday}/{dosesTotalToday} doses
            </span>
          ) : (
            <span className="badge badge-pending">Due today</span>
          )
        ) : (
          <span className="badge badge-pending">No times set</span>
        )}
      </div>

      {showDateRange && (
        <p className="med-date-range">{formatMedicationDateRange(medication)}</p>
      )}

      {medication.notes && <p className="med-notes">{medication.notes}</p>}

      {medication.pills_remaining != null && (
        <p className={`med-pills ${lowSupply ? 'low' : ''}`}>
          {medication.pills_remaining} pill
          {medication.pills_remaining === 1 ? '' : 's'} remaining
          {lowSupply && ' — refill soon'}
        </p>
      )}

      {medication.slots.length > 0 ? (
        <ul className="dose-slots">
          {medication.slots.map((slot, index) => {
            const slotKey = `${medication.id}-${slot.time}`
            const busy = busySlot === slotKey
            return (
              <li
                key={`${slot.time}-${index}`}
                className={`dose-slot ${slot.taken ? 'dose-slot-taken' : ''}`}
              >
                <span className="dose-slot-time">{slot.label}</span>
                {slot.taken ? (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={busy}
                    onClick={() => onUndo(slot)}
                  >
                    {busy ? '…' : 'Undo'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={busy}
                    onClick={() => onMarkTaken(slot.time)}
                  >
                    {busy ? '…' : 'Mark taken'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="med-times med-times-empty">
          Add dose times when editing this medication.
        </p>
      )}

      <div className="med-card-actions">
        <button type="button" className="btn btn-ghost" onClick={onEdit}>
          Edit
        </button>
        <button type="button" className="btn btn-ghost danger" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}
