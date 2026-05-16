import { Link } from 'react-router-dom'
import { setOnboardingDone } from '../lib/settings'

type OnboardingModalProps = {
  onDone: () => void
  onAddMedication: () => void
}

export function OnboardingModal({ onDone, onAddMedication }: OnboardingModalProps) {
  function finish() {
    setOnboardingDone()
    onDone()
  }

  function handleAdd() {
    setOnboardingDone()
    onDone()
    onAddMedication()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="modal onboarding-modal"
        role="dialog"
        aria-labelledby="onboarding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="onboarding-title">Welcome to Medicine Tracker</h2>
        <ol className="onboarding-steps">
          <li>Add your medications with dose times (12-hour + AM/PM).</li>
          <li>On <strong>Today</strong>, mark each dose when you take it.</li>
          <li>Build a streak by logging every scheduled dose each day.</li>
          <li>Check <Link to="/history" onClick={finish}>History</Link> and your{' '}
            <Link to="/account" onClick={finish}>Account</Link> for streaks and settings.
          </li>
        </ol>
        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={finish}>
            Skip for now
          </button>
          <button type="button" className="btn btn-primary" onClick={handleAdd}>
            Add first medication
          </button>
        </div>
      </div>
    </div>
  )
}
