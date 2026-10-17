import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
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
  const [shown, setShown] = useState(duration && !reduce ? 0 : value)
  const shownRef = useRef(shown)

  // Count-up tween in rAF (ease-out expo ≈ --ease-emphasized). Kept off motion's animation engine,
  // so this shared component does not pull it into the initial bundle (QA #19).
  useEffect(() => {
    const from = shownRef.current
    const set = (v: number) => {
      shownRef.current = v
      setShown(v)
    }
    if (!duration || reduce || from === value) {
      const raf = requestAnimationFrame(() => set(value))
      return () => cancelAnimationFrame(raf)
    }
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration)
      const k = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      set(from + (value - from) * k)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduce])

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
