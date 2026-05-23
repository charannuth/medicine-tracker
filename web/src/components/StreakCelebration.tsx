import { useEffect, useState } from 'react'

type StreakCelebrationProps = {
  streakDays: number
  onDismiss: () => void
}

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300] as const

export function StreakCelebration({ streakDays, onDismiss }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onDismiss])

  const label =
    streakDays === 1 ? 'Streak × 1 — first perfect day!' : `Streak × ${streakDays}`

  return (
    <div
      className={`streak-celebration-backdrop${visible ? ' streak-celebration-visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-celebration-title"
      onClick={onDismiss}
    >
      <div
        className="streak-celebration-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="streak-celebration-glow" aria-hidden />
        <div className="streak-celebration-glow streak-celebration-glow-outer" aria-hidden />

        <div className="streak-celebration-tulip-wrap" aria-hidden>
          <div className="streak-celebration-sparkles" aria-hidden>
            <span className="streak-sparkle streak-sparkle-1" />
            <span className="streak-sparkle streak-sparkle-2" />
            <span className="streak-sparkle streak-sparkle-3" />
            <span className="streak-sparkle streak-sparkle-4" />
            <span className="streak-sparkle streak-sparkle-5" />
            <span className="streak-sparkle streak-sparkle-6" />
          </div>

          <svg
            className="streak-tulip-svg"
            viewBox="0 0 120 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="streak-petal-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="45%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
              <linearGradient id="streak-petal-shine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="streak-center-gold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="55%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
            </defs>

            <path
              className="streak-tulip-stem"
              d="M60 155 C60 128 57 102 60 78 C62 68 60 62 60 58"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              className="streak-tulip-leaf streak-tulip-leaf-left"
              d="M60 118 Q32 110 28 94 Q46 102 60 112"
              fill="currentColor"
            />
            <path
              className="streak-tulip-leaf streak-tulip-leaf-right"
              d="M60 102 Q92 94 94 78 Q74 88 60 96"
              fill="currentColor"
            />

            <g className="streak-tulip-bloom" transform="translate(60 50)">
              <ellipse
                className="streak-tulip-bud"
                cx="0"
                cy="2"
                rx="11"
                ry="14"
                fill="url(#streak-petal-fill)"
              />
              {PETAL_ANGLES.map((deg, i) => (
                <g key={deg} transform={`rotate(${deg})`}>
                  <ellipse
                    className={`streak-tulip-petal streak-tulip-petal-${i + 1}`}
                    cx="0"
                    cy="-20"
                    rx="14"
                    ry="28"
                    fill="url(#streak-petal-fill)"
                  />
                  <ellipse
                    className={`streak-tulip-petal-shine streak-tulip-petal-shine-${i + 1}`}
                    cx="-3"
                    cy="-22"
                    rx="5"
                    ry="14"
                    fill="url(#streak-petal-shine)"
                  />
                </g>
              ))}
              <circle
                className="streak-tulip-center-ring"
                cx="0"
                cy="0"
                r="14"
                stroke="#fbbf24"
                strokeWidth="1.5"
                fill="none"
              />
              <circle
                className="streak-tulip-center"
                cx="0"
                cy="0"
                r="10"
                fill="url(#streak-center-gold)"
              />
              {[0, 72, 144, 216, 288].map((deg, i) => (
                <circle
                  key={deg}
                  className={`streak-tulip-pollen streak-tulip-pollen-${i + 1}`}
                  cx="0"
                  cy="-5"
                  r="1.8"
                  fill="#fde68a"
                  transform={`rotate(${deg}) translate(0 -5)`}
                />
              ))}
            </g>
          </svg>
        </div>

        <h2 id="streak-celebration-title" className="streak-celebration-title">
          {label}
        </h2>
        <p className="streak-celebration-subtitle">
          Every scheduled dose logged today. Keep it growing tomorrow.
        </p>
        <button type="button" className="btn btn-primary streak-celebration-btn" onClick={onDismiss}>
          Continue
        </button>
      </div>
    </div>
  )
}
