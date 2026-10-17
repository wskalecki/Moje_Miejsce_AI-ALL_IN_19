import { ChevronDown, Pin, RotateCcw } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { CATEGORY_ICONS, PROFILE_ICONS } from '../app/icons'
import { PRIORITY_WEIGHT, categoriesByWeights } from '../app/weights'
import { CATEGORY_COLORS, categoryLabel, PROFILE_LABEL } from './tokens'
import type { CategoryKey, Profile } from './types'
import { PROFILES } from './types'
import type { Weights } from './weighting'

interface FilterPanelProps {
  weights: Weights
  profile: Profile
  /** True when the weights equal the profile defaults (the reset button is then disabled). */
  isDefault: boolean
  onWeight: (c: CategoryKey, v: number) => void
  onReset: () => void
  /** Effective solo category (hover / keyboard focus / pinned), null = weighted view. */
  onSoloChange: (c: CategoryKey | null) => void
  /** When provided, a presenter profile switch is shown in the header. */
  onProfileChange?: (p: Profile) => void
}

const EASE = [0.16, 1, 0.3, 1] as const
const ENTER_DELAY = 70
const LEAVE_DELAY = 140
/** Rows shown in the collapsed bottom sheet (< 1024 px). */
const SHEET_ROWS = 3

/**
 * "Co jest dla Ciebie ważne" — one weight slider per category, sorted by weight (I2-4).
 * Hover / keyboard focus on a row = solo view of that category; click pins it. Dragging a slider
 * always shows the weighted mix, so the effect of the change is visible.
 */
export function FilterPanel({ weights, profile, isDefault, onWeight, onReset, onSoloChange, onProfileChange }: FilterPanelProps) {
  const reduce = useReducedMotion()
  const [frozen, setFrozen] = useState<CategoryKey[] | null>(null)
  const order = frozen ?? categoriesByWeights(weights)
  const [hoverCat, setHoverCat] = useState<CategoryKey | null>(null)
  const [focusCat, setFocusCat] = useState<CategoryKey | null>(null)
  const [pinned, setPinned] = useState<CategoryKey | null>(null)
  /** Row whose slider was used while hovered — its hover-solo stays off until the pointer leaves it. */
  const [touched, setTouched] = useState<CategoryKey | null>(null)
  const [dragging, setDragging] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const hoverTimer = useRef(0)
  const unfreezeTimer = useRef(0)

  const solo = dragging ? null : ((hoverCat && hoverCat !== touched ? hoverCat : null) ?? focusCat ?? pinned)
  const soloCb = useRef(onSoloChange)
  useEffect(() => {
    soloCb.current = onSoloChange
  })
  useEffect(() => {
    soloCb.current(solo)
  }, [solo])
  useEffect(
    () => () => {
      window.clearTimeout(hoverTimer.current)
      window.clearTimeout(unfreezeTimer.current)
    },
    [],
  )

  const hoverTo = (c: CategoryKey | null, delay: number) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHoverCat(c), delay)
  }

  const freeze = () => {
    window.clearTimeout(unfreezeTimer.current)
    setFrozen((f) => f ?? order)
  }
  const unfreeze = (delay = 350) => {
    window.clearTimeout(unfreezeTimer.current)
    unfreezeTimer.current = window.setTimeout(() => setFrozen(null), delay)
  }

  const startDrag = (c: CategoryKey, e: PointerEvent<HTMLInputElement>) => {
    freeze()
    setDragging(true)
    if (e.pointerType === 'mouse') setTouched(c)
    const up = () => {
      setDragging(false)
      unfreeze()
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && (pinned || focusCat)) {
      setPinned(null)
      setFocusCat(null)
      e.stopPropagation()
    }
  }

  const visible = expanded ? order : order.slice(0, SHEET_ROWS)

  return (
    <m.section
      className={['smap-flt', expanded ? 'is-expanded' : ''].filter(Boolean).join(' ')}
      aria-labelledby="smap-flt-title"
      initial={reduce ? false : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.42, delay: 0.3, ease: EASE }}
      onKeyDown={onPanelKey}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hoverTo(null, LEAVE_DELAY)}
    >
      <header className="smap-flt__head">
        <div>
          <h2 id="smap-flt-title">Co jest dla Ciebie ważne</h2>
          <p>Ustaw wagi — mapa przeliczy się od razu. Najedź na kategorię, by zobaczyć tylko ją.</p>
        </div>
        {onProfileChange && (
          <div className="smap-flt__switch" role="radiogroup" aria-label="Profil (tryb prezentera)">
            {PROFILES.map((p) => {
              const Icon = PROFILE_ICONS[p]
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={p === profile}
                  aria-label={PROFILE_LABEL[p]}
                  title={PROFILE_LABEL[p]}
                  className={p === profile ? 'is-active' : undefined}
                  onClick={() => onProfileChange(p)}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden />
                </button>
              )
            })}
          </div>
        )}
      </header>

      <ul className="smap-flt__list">
        {order.map((c) => {
          const Icon = CATEGORY_ICONS[c]
          const v = weights[c]
          const label = categoryLabel(c)
          const prio = v >= PRIORITY_WEIGHT
          const hidden = !visible.includes(c)
          const cls = [
            'smap-flt__row',
            prio ? 'is-prio' : '',
            solo === c ? 'is-solo' : '',
            pinned === c ? 'is-pinned' : '',
            v === 0 ? 'is-off' : '',
            hidden ? 'is-sheet-hidden' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <m.li
              key={c}
              layout={!reduce}
              transition={{ layout: { duration: 0.36, ease: EASE } }}
              className={cls}
              data-cat={c}
              style={{ '--cat': CATEGORY_COLORS[c] } as CSSProperties}
              onPointerEnter={(e) => e.pointerType === 'mouse' && hoverTo(c, hoverCat ? 0 : ENTER_DELAY)}
              onPointerLeave={(e) => {
                if (e.pointerType !== 'mouse') return
                if (touched === c) setTouched(null)
              }}
            >
              <button
                type="button"
                className="smap-flt__cat"
                aria-pressed={pinned === c}
                title={pinned === c ? 'Odepnij — wróć do mapy wszystkich wag' : 'Przypnij widok tylko tej kategorii'}
                onClick={() => setPinned((p) => (p === c ? null : c))}
                onFocus={(e) => e.currentTarget.matches(':focus-visible') && setFocusCat(c)}
                onBlur={() => setFocusCat((f) => (f === c ? null : f))}
              >
                <span className="smap-flt__icon" aria-hidden>
                  <Icon size={15} strokeWidth={2.1} />
                </span>
                <span className="smap-flt__label">{label}</span>
                {pinned === c && <Pin className="smap-flt__pin" size={12} strokeWidth={2.4} aria-label="przypięte" />}
              </button>
              <input
                type="range"
                className="smap-flt__range"
                min={0}
                max={100}
                step={5}
                value={v}
                aria-label={`Waga: ${label}`}
                aria-valuetext={`${v}%${prio ? ', priorytet' : ''}`}
                style={{ '--v': `${v}%` } as CSSProperties}
                onPointerDown={(e) => startDrag(c, e)}
                onKeyDown={(e) => {
                  if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key.startsWith('Page')) freeze()
                }}
                onBlur={() => unfreeze(0)}
                onChange={(e) => onWeight(c, Number(e.target.value))}
              />
              <output className="smap-flt__val tabular" aria-hidden>
                {v}
                <small>%</small>
              </output>
            </m.li>
          )
        })}
      </ul>

      <footer className="smap-flt__foot">
        <button type="button" className="smap-flt__more" aria-expanded={expanded} onClick={() => setExpanded((x) => !x)}>
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden />
          {expanded ? 'Zwiń' : `Wszystkie kategorie (${order.length})`}
        </button>
        <span className="smap-flt__status" aria-live="polite">
          {pinned ? `Przypięte: ${categoryLabel(pinned)}` : priorityCount(weights) ? `Priorytety: ≥ ${PRIORITY_WEIGHT}%` : ''}
        </span>
        <button type="button" className="smap-flt__reset" onClick={onReset} disabled={isDefault}>
          <RotateCcw size={13} strokeWidth={2.2} aria-hidden />
          Przywróć profil
        </button>
      </footer>
    </m.section>
  )
}

function priorityCount(w: Weights): number {
  return Object.values(w).filter((v) => v >= PRIORITY_WEIGHT).length
}
