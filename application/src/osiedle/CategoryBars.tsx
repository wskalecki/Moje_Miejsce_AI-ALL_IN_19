import { ChevronDown } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import { CATEGORIES, CATEGORY_COLORS, FILTER_PANEL_CATEGORIES } from '../app/dictionary'
import type { CategoryId, ProfileId } from '../app/types'
import { clamp, orderCategories, signed, useSeenOnce } from './shared'
import { CollapsibleSection, TweenNumber } from './ui'

interface CategoryBarsProps {
  profile: ProfileId
  /** Categories that count in the score (map filters "Liczy się dla mnie"), in panel order. */
  priorities: CategoryId[]
  /** Values to show (base `stats`, or stats at the timeline year). */
  values: Record<CategoryId, number>
  /** Change vs the 2026 baseline; non-zero entries get a chip. */
  deltas?: Partial<Record<CategoryId, number>>
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Shown right away: the key indicators (the filter card's main four) plus whatever counts for the user. */
const isKey = (c: CategoryId, priorities: CategoryId[]) => FILTER_PANEL_CATEGORIES.includes(c) || priorities.includes(c)

/**
 * "Jak wypada dla Ciebie": ten rows 0–100 in the map's language — tinted category square, label,
 * a bar in the category colour (as in the map hover card) and the value. The key indicators show
 * at once (what counts for the user first); the rest fold under "Pozostałe wskaźniki".
 * Bars grow via `scaleX` (compositor only).
 */
export function CategoryBars({ profile, priorities, values, deltas, open, onOpenChange }: CategoryBarsProps) {
  const [ref, seen] = useSeenOnce<HTMLDivElement>(0.2)
  // After the entry animation, switch the bars to the faster 400 ms timeline transition.
  const [live, setLive] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = window.setTimeout(() => setLive(true), 950)
    return () => window.clearTimeout(t)
  }, [seen])
  const [moreOpen, setMoreOpen] = useState(false)
  const order = orderCategories(profile, priorities)
  const key = order.filter((c) => isKey(c, priorities))
  const rest = order.filter((c) => !isKey(c, priorities))

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
    <CollapsibleSection id="op-cats-title" title="Jak wypada dla Ciebie" section="Jak wypada dla Ciebie" open={open} onOpenChange={onOpenChange}>
      <div ref={ref} className={`op-bars${live ? ' is-live' : ''}`}>
        <ul>{key.map(row)}</ul>
        {rest.length > 0 && (
          <div className={`op-bars__more${moreOpen ? ' is-open' : ''}`}>
            <button
              type="button"
              className="op-bars__toggle"
              aria-expanded={moreOpen}
              aria-controls="op-cats-more"
              onClick={() => setMoreOpen((o) => !o)}
            >
              {moreOpen ? 'Zwiń pozostałe wskaźniki' : `Pozostałe wskaźniki (${rest.length})`}
              <ChevronDown size={15} strokeWidth={2.2} aria-hidden className="op-bars__chev" />
            </button>
            {/* light rows, but still only mounted when asked for */}
            <div id="op-cats-more">{moreOpen && <ul>{rest.map(row)}</ul>}</div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
