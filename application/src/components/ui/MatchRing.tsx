import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import './ui.css'

export interface MatchRingProps {
  value: number
  size?: number
  /** Count-up duration in ms (0 = no tween). */
  duration?: number
  className?: string
}

/** SVG match ring (spec §8.3): stroke 10 % of diameter, ink 8 % track, accent arc. */
export function MatchRing({ value, size = 44, duration = 900, className }: MatchRingProps) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(duration && !reduce ? 0 : value)
  const [shown, setShown] = useState(mv.get())
  useMotionValueEvent(mv, 'change', (v) => setShown(v))

  useEffect(() => {
    if (!duration || reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: duration / 1000, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, duration, reduce, mv])

  const stroke = Math.max(2, size * 0.1)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, shown))
  return (
    <span className={['ui-ring', className].filter(Boolean).join(' ')} style={{ width: size, height: size }} role="img" aria-label={`Dopasowanie ${Math.round(value)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(22,22,29,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ui-ring__label tabular" style={{ fontSize: size * 0.3 }}>
        {Math.round(pct)}
        <small>%</small>
      </span>
    </span>
  )
}
