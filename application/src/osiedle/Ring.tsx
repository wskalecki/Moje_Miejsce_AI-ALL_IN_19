import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { EASE_EMPHASIZED, clamp } from './shared'

export interface RingProps {
  value: number
  size?: number
  /** First animation counts up from 0 over this many ms; later changes use `changeDuration`. */
  duration?: number
  changeDuration?: number
  label?: string
}

/**
 * Match ring (spec §8.3): stroke 10 % of the diameter, ink 8 % track, accent arc with a
 * round cap and a tweened counter. Writes to the DOM directly so the tween never re-renders React.
 */
export function Ring({ value, size = 88, duration = 900, changeDuration = 400, label }: RingProps) {
  const reduce = useReducedMotion()
  const arc = useRef<SVGCircleElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const current = useRef(0)
  const first = useRef(true)

  const stroke = Math.max(3, size * 0.1)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  useEffect(() => {
    const paint = (v: number) => {
      current.current = v
      if (arc.current) arc.current.style.strokeDashoffset = String(c * (1 - clamp(v, 0, 100) / 100))
      if (num.current) num.current.textContent = String(Math.round(v))
    }
    const ms = first.current ? duration : changeDuration
    if (reduce || ms <= 0) {
      first.current = false
      paint(value)
      return
    }
    const controls = animate(current.current, value, {
      duration: ms / 1000,
      ease: EASE_EMPHASIZED,
      onUpdate: (v) => {
        first.current = false
        paint(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, changeDuration, reduce, c])

  return (
    <span className="op-ring" style={{ width: size, height: size }} role="img" aria-label={label ?? `Dopasowanie ${Math.round(value)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(22,22,29,0.08)" strokeWidth={stroke} />
        <circle
          ref={arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent, #7C5CFF)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: c }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="op-ring__label" style={{ fontSize: Math.round(size * 0.32) }} aria-hidden>
        <span ref={num}>0</span>
        <small>%</small>
      </span>
    </span>
  )
}
