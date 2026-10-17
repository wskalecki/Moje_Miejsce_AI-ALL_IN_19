/** Small hooks and primitives shared by the osiedle panel sections. */
import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Bike, Car, Footprints, TramFront, type LucideIcon } from 'lucide-react'
import type { TravelMode } from '../mock/osiedla'

export const EASE_EMPHASIZED = [0.16, 1, 0.3, 1] as const

export const MODE_ORDER: TravelMode[] = ['pieszo', 'rower', 'komunikacja', 'auto']

export const MODE_META: Record<TravelMode, { label: string; adverb: string; icon: LucideIcon }> = {
  pieszo: { label: 'Pieszo', adverb: 'pieszo', icon: Footprints },
  rower: { label: 'Rower', adverb: 'rowerem', icon: Bike },
  komunikacja: { label: 'Komunikacja', adverb: 'komunikacją', icon: TramFront },
  auto: { label: 'Auto', adverb: 'autem', icon: Car },
}

/** "−3" / "+6" with a real minus sign. */
export function signed(n: number): string {
  const r = Math.round(n)
  if (r > 0) return `+${r}`
  if (r < 0) return `−${Math.abs(r)}`
  return '0'
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/** Width of an element, kept in sync with ResizeObserver. */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.getBoundingClientRect().width)
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0
      setW((prev) => (Math.abs(prev - next) > 0.5 ? next : prev))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** True once the element has been at least `amount` visible (never resets). */
export function useSeenOnce<T extends Element>(amount = 0.25): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: amount },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [amount, seen])
  return [ref, seen]
}

/**
 * Number that tweens to `value`, writing straight to the DOM (no React re-render per frame).
 * `from` is used only for the very first animation (e.g. count up from 0).
 */
export function TweenNumber({
  value,
  from,
  duration = 400,
  firstDuration,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number
  from?: number
  duration?: number
  /** Duration of the first real change (e.g. the count-up on entry). */
  firstDuration?: number
  format?: (n: number) => string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(from ?? value)
  const played = useRef(false)
  // Rendered once; afterwards the tween owns the text node (React never rewrites it).
  const [initial] = useState(() => format(from ?? value))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (Math.abs(current.current - value) < 0.01) return
    const ms = !played.current && firstDuration != null ? firstDuration : duration
    if (reduce || ms <= 0) {
      played.current = true
      current.current = value
      el.textContent = format(value)
      return
    }
    const controls = animate(current.current, value, {
      duration: ms / 1000,
      ease: EASE_EMPHASIZED,
      onUpdate: (v) => {
        played.current = true
        current.current = v
        el.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, reduce])
  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  )
}

export function SectionHead({
  id,
  icon: Icon,
  title,
  aside,
}: {
  id: string
  icon?: LucideIcon
  title: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="op-sec__head">
      <h2 id={id} className="op-sec__title">
        {Icon && <Icon size={18} strokeWidth={2} aria-hidden className="op-sec__icon" />}
        {title}
      </h2>
      {aside}
    </header>
  )
}
