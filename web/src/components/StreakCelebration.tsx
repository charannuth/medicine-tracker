import { useEffect, useState } from 'react'
import { getActiveStreakBadge } from '../lib/streakBadges'

type StreakCelebrationProps = {
  streakDays: number
  onDismiss: () => void
}

const PETAL_ANGLES = [0, 60, 120, 180, 240, 300] as const

/** Flat monarch-style clipart — drawn in-scene so it never clips the card. */
function StreakButterflyInScene({ dual }: { dual: boolean }) {
  return (
    <g
      className={`streak-butterfly-figure${dual ? ' streak-butterfly-figure-dual' : ' streak-butterfly-figure-single'}`}
      aria-hidden
    >
      <g className="streak-butterfly-sprite">
        <g className="streak-butterfly-wings">
          <path
            className="streak-butterfly-wing-upper"
            d="M4 10 C-14 0 -24 8 -20 22 C-12 28 2 20 4 14 Z"
            fill="url(#streak-bfly-wing)"
            stroke="#c2410c"
            strokeWidth="1.25"
            strokeLinejoin="round"
          />
          <path
            className="streak-butterfly-wing-lower"
            d="M4 16 C-10 18 -16 28 -10 30 C-4 26 4 22 4 18 Z"
            fill="url(#streak-bfly-wing-soft)"
            stroke="#c2410c"
            strokeWidth="1.15"
            strokeLinejoin="round"
          />
          <circle cx="-10" cy="12" r="2.2" fill="#fff7ed" opacity="0.9" />
          <circle cx="-14" cy="20" r="1.5" fill="#fff7ed" opacity="0.85" />
        </g>
        <ellipse cx="8" cy="16" rx="3.2" ry="8.5" fill="#4a2c20" />
        <circle cx="10" cy="6" r="3.4" fill="#4a2c20" />
        <circle cx="8.5" cy="5.5" r="1.1" fill="#fef9c3" />
        <path
          d="M9 3.5 Q7 0.5 5 0"
          stroke="#4a2c20"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M11 3.5 Q13 0.5 15 0"
          stroke="#4a2c20"
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </g>
  )
}

function TulipBloom({
  variant,
  scale = 1,
}: {
  variant: 'purple' | 'yellow'
  scale?: number
}) {
  const petalFill =
    variant === 'purple' ? 'url(#streak-petal-fill-purple)' : 'url(#streak-petal-fill-yellow)'
  const petalShine =
    variant === 'purple' ? 'url(#streak-petal-shine-purple)' : 'url(#streak-petal-shine-yellow)'
  const centerFill =
    variant === 'purple' ? 'url(#streak-center-gold)' : 'url(#streak-center-yellow)'
  const ringStroke = variant === 'purple' ? '#fbbf24' : '#f59e0b'
  const pollenFill = variant === 'purple' ? '#fde68a' : '#fef9c3'

  return (
    <g
      className={`streak-tulip-bloom streak-tulip-bloom-${variant}`}
      transform={scale !== 1 ? `scale(${scale})` : undefined}
    >
      <ellipse className="streak-tulip-bud" cx="0" cy="2" rx="11" ry="14" fill={petalFill} />
      {PETAL_ANGLES.map((deg, i) => (
        <g key={deg} transform={`rotate(${deg})`}>
          <ellipse
            className={`streak-tulip-petal streak-tulip-petal-${i + 1}`}
            cx="0"
            cy="-20"
            rx="14"
            ry="28"
            fill={petalFill}
          />
          <ellipse
            className={`streak-tulip-petal-shine streak-tulip-petal-shine-${i + 1}`}
            cx="-3"
            cy="-22"
            rx="5"
            ry="14"
            fill={petalShine}
          />
        </g>
      ))}
      <circle
        className="streak-tulip-center-ring"
        cx="0"
        cy="0"
        r="14"
        stroke={ringStroke}
        strokeWidth="1.5"
        fill="none"
      />
      <circle className="streak-tulip-center" cx="0" cy="0" r="10" fill={centerFill} />
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <circle
          key={deg}
          className={`streak-tulip-pollen streak-tulip-pollen-${i + 1}`}
          cx="0"
          cy="-5"
          r="1.8"
          fill={pollenFill}
          transform={`rotate(${deg}) translate(0 -5)`}
        />
      ))}
    </g>
  )
}

export function StreakCelebration({ streakDays, onDismiss }: StreakCelebrationProps) {
  const [visible, setVisible] = useState(false)
  const dualBloom = streakDays >= 7
  const badge = getActiveStreakBadge(streakDays)

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

  const label = badge
    ? `Streak × ${streakDays} — ${badge.label}!`
    : `Streak × ${streakDays}!`

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

        <div
          className={`streak-celebration-illustration${dualBloom ? ' streak-celebration-dual' : ''}`}
          aria-hidden
        >
          <div
            className={`streak-celebration-tulip-wrap${dualBloom ? ' streak-celebration-dual' : ''}`}
          >
          <div className="streak-celebration-sparkles" aria-hidden>
            <span className="streak-sparkle streak-sparkle-1" />
            <span className="streak-sparkle streak-sparkle-2" />
            <span className="streak-sparkle streak-sparkle-3" />
            <span className="streak-sparkle streak-sparkle-4" />
            <span className="streak-sparkle streak-sparkle-5" />
            <span className="streak-sparkle streak-sparkle-6" />
            {dualBloom && (
              <>
                <span className="streak-sparkle streak-sparkle-7" />
                <span className="streak-sparkle streak-sparkle-8" />
              </>
            )}
          </div>

          <svg
            className={`streak-tulip-svg${dualBloom ? ' streak-tulip-dual' : ''}`}
            viewBox={dualBloom ? '0 0 160 160' : '0 0 120 160'}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="streak-bfly-wing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="streak-bfly-wing-soft" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="streak-petal-fill-purple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="45%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
              <linearGradient id="streak-petal-shine-purple" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="streak-petal-fill-yellow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="streak-petal-shine-yellow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="streak-center-gold" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="55%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </radialGradient>
              <radialGradient id="streak-center-yellow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="55%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#eab308" />
              </radialGradient>
            </defs>

            {dualBloom ? (
              <>
                <path
                  className="streak-tulip-stem streak-tulip-stem-trunk"
                  d="M80 155 C80 128 78 104 80 84"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  className="streak-tulip-stem streak-tulip-stem-branch streak-tulip-stem-branch-left"
                  d="M80 84 C68 78 54 70 46 58"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  className="streak-tulip-stem streak-tulip-stem-branch streak-tulip-stem-branch-right"
                  d="M80 84 C92 78 106 70 114 56"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  className="streak-tulip-leaf streak-tulip-leaf-left"
                  d="M80 120 Q52 112 48 96 Q66 104 80 114"
                  fill="currentColor"
                />
                <path
                  className="streak-tulip-leaf streak-tulip-leaf-right"
                  d="M80 108 Q108 100 110 84 Q92 94 80 102"
                  fill="currentColor"
                />
                <g className="streak-tulip-bloom-anchor" transform="translate(46 50)">
                  <TulipBloom variant="purple" />
                </g>
                <g className="streak-tulip-bloom-anchor" transform="translate(114 48)">
                  <TulipBloom variant="yellow" scale={0.92} />
                </g>
                <StreakButterflyInScene dual />
              </>
            ) : (
              <>
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
                <g className="streak-tulip-bloom-anchor" transform="translate(60 50)">
                  <TulipBloom variant="purple" />
                </g>
                <StreakButterflyInScene dual={false} />
              </>
            )}
          </svg>
          </div>
        </div>

        <h2 id="streak-celebration-title" className="streak-celebration-title">
          {label}
        </h2>
        <p className="streak-celebration-subtitle">
          {badge?.description ?? 'Every scheduled dose logged today. Keep it growing tomorrow.'}
        </p>
        <button type="button" className="btn btn-primary streak-celebration-btn" onClick={onDismiss}>
          Continue
        </button>
      </div>
    </div>
  )
}
