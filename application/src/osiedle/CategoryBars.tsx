import { useEffect, useState, type CSSProperties } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import { CATEGORIES, CATEGORY_COLORS } from '../app/dictionary'
import type { CategoryId, ProfileId } from '../app/types'
import { clamp, orderCategories, signed, useSeenOnce } from './shared'
import { SectionHead, TweenNumber } from './ui'

interface CategoryBarsProps {
  profile: ProfileId
  /** Categories that count in the score (map filters "Liczy się dla mnie"), in panel order. */
  priorities: CategoryId[]
  /** Values to show (base `stats`, or stats at the timeline year). */
  values: Record<CategoryId, number>
  /** Change vs the 2026 baseline; non-zero entries get a chip. */
  deltas?: Partial<Record<CategoryId, number>>
}

/**
 * "Jak wypada dla Ciebie": ten rows 0–100 in the map's language — tinted category square, label,
 * a bar in the category colour (as in the map hover card) and the value. Grouped like the filter
 * card: what counts for the user first, then the rest. Bars grow via `scaleX` (compositor only).
 */
export function CategoryBars({ profile, priorities, values, deltas }: CategoryBarsProps) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>(0.2)
  const [compare, setCompare] = useState(false)
  // After the entry animation, switch the bars to the faster 400 ms timeline transition.
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = window.setTimeout(() => setLive(true), 950)
    return () => window.clearTimeout(t)
  }, [seen])
  const order = orderCategories(profile, priorities)
  const groups: { label: string; cats: CategoryId[] }[] = [
    { label: 'Liczy się dla mnie', cats: order.filter((c) => priorities.includes(c)) },
    { label: 'Pozostałe', cats: order.filter((c) => !priorities.includes(c)) },
  ].filter((g) => g.cats.length > 0)

  const row = (c: CategoryId) => {
    const Icon = CATEGORY_ICONS[c]
    const v = clamp(values[c] ?? 0, 0, 100)
    const d = Math.round(deltas?.[c] ?? 0)
    return (
      <li key={c} className="op-bar" style={{ '--cat': CATEGORY_COLORS[c] } as CSSProperties}>
        <span className="op-bar__icon chrome-icon" aria-hidden>
          <Icon size={15} strokeWidth={2.1} />
        </span>
        <span className="op-bar__label">{CATEGORIES[c].label}</span>
        <span
          className="op-bar__track"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(v)}
          aria-label={CATEGORIES[c].label}
        >
          <span className="op-bar__fill" style={{ transform: `scaleX(${seen ? Math.max(0.02, v / 100) : 0})` }} />
          <span className="op-bar__avg" aria-hidden />
        </span>
        <span className="op-bar__end">
          {d !== 0 && (
            <span className={`op-chip op-chip--delta ${d > 0 ? 'is-up' : 'is-down'}`} aria-label={`${d > 0 ? 'wzrost' : 'spadek'} o ${Math.abs(d)}`}>
              {signed(d)}
            </span>
          )}
          <TweenNumber className="op-bar__value" value={seen ? v : 0} from={0} firstDuration={900} duration={400} />
        </span>
      </li>
    )
  }

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
      <div ref={ref} className={`op-bars${compare ? ' is-compare' : ''}${live ? ' is-live' : ''}`}>
        {groups.map((g) => (
          <div key={g.label} className="op-bars__group">
            <h3 className="op-bars__label chrome-label">{g.label}</h3>
            <ul>{g.cats.map(row)}</ul>
          </div>
        ))}
      </div>
      {compare && (
        <p className="op-note" aria-live="polite">
          Kreska na pasku to średnia Warszawy (50). Wyniki 0–100 względem całego miasta.
        </p>
      )}
    </section>
  )
}
