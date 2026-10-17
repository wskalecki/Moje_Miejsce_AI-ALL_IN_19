/** Small hooks, constants and pure helpers shared by the osiedle panel sections (components: `ui.tsx`). */
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { Bike, Car, Footprints, TramFront, type LucideIcon } from 'lucide-react'
import { categoriesByWeight } from '../app/dictionary'
import type { CategoryId, ProfileId } from '../app/types'
import type { Route, TravelMode } from '../mock/osiedla'

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
  // Without IntersectionObserver everything counts as seen right away.
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
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

/** Priorities first (in pick order), then the rest by profile weight (spec §4.5 pkt 3). */
export function orderCategories(profile: ProfileId, priorities: CategoryId[]): CategoryId[] {
  const rest = categoriesByWeight(profile).filter((c) => !priorities.includes(c))
  return [...priorities, ...rest]
}

export function availableModes(route: Route): TravelMode[] {
  return MODE_ORDER.filter((m) => route.minutes[m] != null)
}

/** Default tab for a destination: walking when it's a short walk (≤ 15 min), otherwise the fastest mode. */
export function defaultMode(route: Route): TravelMode {
  const walk = route.minutes.pieszo
  if (walk != null && walk <= 15) return 'pieszo'
  const modes = availableModes(route)
  return modes.reduce((best, m) => ((route.minutes[m] ?? Infinity) < (route.minutes[best] ?? Infinity) ? m : best), modes[0] ?? 'pieszo')
}
