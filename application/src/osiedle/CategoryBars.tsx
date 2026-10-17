import { useEffect, useState } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import { CATEGORIES, categoriesByWeight } from '../app/dictionary'
import type { CategoryId, ProfileId } from '../app/types'
import { SectionHead, TweenNumber, clamp, signed, useSeenOnce } from './shared'

interface CategoryBarsProps {
  profile: ProfileId
  priorities: CategoryId[]
  /** Values to show (base `stats`, or stats at the timeline year). */
  values: Record<CategoryId, number>
  /** Change vs the 2026 baseline; non-zero entries get a chip. */
  deltas?: Partial<Record<CategoryId, number>>
}

/** Priorities first (in pick order), then the rest by profile weight (spec §4.5 pkt 3). */
export function orderCategories(profile: ProfileId, priorities: CategoryId[]): CategoryId[] {
  const rest = categoriesByWeight(profile).filter((c) => !priorities.includes(c))
  return [...priorities, ...rest]
}

/**
 * "Jak wypada dla Ciebie": ten horizontal bars, 0–100. One series, so one colour: priorities in
 * the accent, the rest in ink 24 %. Bars grow from the baseline via `scaleX` (compositor only).
 */
export function CategoryBars({ profile, priorities, values, deltas }: CategoryBarsProps) {
  const [ref, seen] = useSeenOnce<HTMLUListElement>(0.2)
  const [compare, setCompare] = useState(false)
  // After the entry animation, switch the bars to the faster 400 ms timeline transition.
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = window.setTimeout(() => setLive(true), 950)
    return () => window.clearTimeout(t)
  }, [seen])
  const order = orderCategories(profile, priorities)

  return (
    <section className="op-sec" aria-labelledby="op-cats-title" data-section="Jak wypada dla Ciebie">
      <SectionHead
        id="op-cats-title"
        title="Jak wypada dla Ciebie"
        aside={
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            className={`op-switch${compare ? ' is-on' : ''}`}
            onClick={() => setCompare((v) => !v)}
          >
            <span className="op-switch__track" aria-hidden>
              <span className="op-switch__thumb" />
            </span>
            Średnia Warszawy
          </button>
        }
      />
      <ul ref={ref} className={`op-bars${compare ? ' is-compare' : ''}${live ? ' is-live' : ''}`}>
        {order.map((c) => {
          const Icon = CATEGORY_ICONS[c]
          const isPriority = priorities.includes(c)
          const v = clamp(values[c] ?? 0, 0, 100)
          const d = Math.round(deltas?.[c] ?? 0)
          return (
            <li key={c} className={`op-bar${isPriority ? ' is-priority' : ''}`}>
              <div className="op-bar__row">
                <Icon size={16} strokeWidth={2} aria-hidden className="op-bar__icon" />
                <span className="op-bar__label">{CATEGORIES[c].label}</span>
                {isPriority && <span className="op-chip op-chip--accent">Twój priorytet</span>}
                <span className="op-bar__spacer" />
                {d !== 0 && (
                  <span className={`op-chip op-chip--delta ${d > 0 ? 'is-up' : 'is-down'}`} aria-label={`${d > 0 ? 'wzrost' : 'spadek'} o ${Math.abs(d)}`}>
                    {signed(d)}
                  </span>
                )}
                <TweenNumber className="op-bar__value" value={seen ? v : 0} from={0} firstDuration={900} duration={400} />
              </div>
              <div
                className="op-bar__track"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(v)}
                aria-label={CATEGORIES[c].label}
              >
                <span className="op-bar__fill" style={{ transform: `scaleX(${seen ? v / 100 : 0})` }} />
                <span className="op-bar__avg" aria-hidden />
              </div>
            </li>
          )
        })}
      </ul>
      <p className="op-note" aria-live="polite">
        {compare ? 'Kreska na pasku to średnia Warszawy (50). Wyniki 0–100 względem całego miasta.' : 'Wyniki 0–100 względem całego miasta.'}
      </p>
    </section>
  )
}
