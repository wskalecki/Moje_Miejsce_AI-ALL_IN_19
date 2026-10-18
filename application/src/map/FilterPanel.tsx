import { ChevronRight, Minus, Pin, Plus, RotateCcw } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { HORIZON_ORDER, HORIZONS } from '../app/dictionary'
import { CATEGORY_ICONS } from '../app/icons'
import { PRIORITY_WEIGHT, uiToWeight, weightToUi } from '../app/weights'
import type { Horizon } from '../app/types'
import {
  categoryFilterBadgeCount,
  categoryHasDetailFilters,
  categoryHasSlider,
  DEFAULT_FILTER_SECTIONS,
  moveCategoryToSection,
  type FilterSectionId,
  type FilterSections,
} from './categoryFilterRows'
import { CATEGORY_COLORS, categoryLabel } from './tokens'
import type { CategoryKey } from './types'
import { isPanelMixActive, type Weights } from './weighting'

interface FilterPanelProps {
  weights: Weights
  horizon: Horizon
  onHorizonChange?: (h: Horizon) => void
  isDefault: boolean
  onWeight: (c: CategoryKey, v: number) => void
  onReset: () => void
  onSoloChange: (c: CategoryKey | null) => void
  poiInterests?: readonly string[]
  gastronomyCuisines?: readonly string[]
  detailCat?: CategoryKey | null
  onDetailCatChange?: (c: CategoryKey | null) => void
  filterSections?: FilterSections
  onFilterSectionsChange?: (sections: FilterSections) => void
}

const EASE = [0.16, 1, 0.3, 1] as const
const ENTER_DELAY = 70
const LEAVE_DELAY = 140

/** Memoised: the map re-renders on every hovered osiedle / POI, the panel only when its props change. */
export const FilterPanel = memo(function FilterPanel({
  weights,
  horizon,
  onHorizonChange,
  isDefault,
  onWeight,
  onReset,
  onSoloChange,
  poiInterests = [],
  gastronomyCuisines = [],
  detailCat = null,
  onDetailCatChange,
  filterSections = DEFAULT_FILTER_SECTIONS,
  onFilterSectionsChange,
}: FilterPanelProps) {
  const reduce = useReducedMotion()
  const [hoverCat, setHoverCat] = useState<CategoryKey | null>(null)
  const [focusCat, setFocusCat] = useState<CategoryKey | null>(null)
  const [pinned, setPinned] = useState<CategoryKey | null>(null)
  const [touched, setTouched] = useState<CategoryKey | null>(null)
  const [draggingSlider, setDraggingSlider] = useState(false)
  const hoverTimer = useRef(0)

  const badgeOpts = { gastronomyCuisines, poiInterests }
  const canReorder = !!onFilterSectionsChange

  const solo = draggingSlider ? null : ((hoverCat && hoverCat !== touched ? hoverCat : null) ?? focusCat ?? pinned)
  const soloCb = useRef(onSoloChange)
  useEffect(() => {
    soloCb.current = onSoloChange
  })
  useEffect(() => {
    soloCb.current(solo)
  }, [solo])
  useEffect(() => () => window.clearTimeout(hoverTimer.current), [])

  const hoverTo = (c: CategoryKey | null, delay: number) => {
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHoverCat(c), delay)
  }

  const startSliderDrag = (c: CategoryKey, e: PointerEvent<HTMLInputElement>) => {
    setDraggingSlider(true)
    if (e.pointerType === 'mouse') setTouched(c)
    const up = () => {
      setDraggingSlider(false)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && detailCat) {
      onDetailCatChange?.(null)
      e.stopPropagation()
      return
    }
    if (e.key === 'Escape' && (pinned || focusCat)) {
      setPinned(null)
      setFocusCat(null)
      e.stopPropagation()
    }
  }

  const openDetail = (c: CategoryKey) => {
    if (!categoryHasDetailFilters(c)) return
    onDetailCatChange?.(c)
  }
  const mixActive = isPanelMixActive(weights, filterSections.score)

  const applySections = (next: FilterSections) => onFilterSectionsChange?.(next)

  const transferRow = (c: CategoryKey, from: FilterSectionId, to: FilterSectionId) => {
    if (!onFilterSectionsChange || from === to) return
    applySections(moveCategoryToSection(filterSections, c, from, to))
  }

  const renderRow = (c: CategoryKey, section: FilterSectionId) => {
    const Icon = CATEGORY_ICONS[c]
    const hasSlider = categoryHasSlider(c, filterSections)
    const v = weights[c]
    const ui = weightToUi(v)
    const label = categoryLabel(c)
    const prio = hasSlider && v >= PRIORITY_WEIGHT
    const hasDetail = categoryHasDetailFilters(c)
    const badge = categoryFilterBadgeCount(c, filterSections, badgeOpts)
    const cls = [
      'smap-flt__row',
      !hasSlider ? 'smap-flt__row--map-only' : '',
      !hasDetail ? 'smap-flt__row--no-detail' : '',
      prio ? 'is-prio' : '',
      solo === c ? 'is-solo' : '',
      pinned === c ? 'is-pinned' : '',
      hasSlider && ui === 0 ? 'is-off' : '',
      badge != null ? 'has-detail-filters' : '',
      hasDetail && detailCat === c ? 'is-detail-active' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const otherSection: FilterSectionId = section === 'score' ? 'preview' : 'score'
    const isScore = section === 'score'
    const transferLabel =
      section === 'preview' ? `Przenieś „${label}” do: Liczy się dla mnie` : `Przenieś „${label}” do: Podgląd na mapie`

    return (
      <li
        key={`${section}-${c}`}
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
          className={`smap-flt__section-btn${isScore ? ' smap-flt__section-btn--minus' : ' smap-flt__section-btn--plus'}`}
          disabled={!canReorder}
          aria-label={transferLabel}
          title={isScore ? 'Przenieś do podglądu na mapie' : 'Dodaj do „Liczy się dla mnie”'}
          onClick={() => transferRow(c, section, otherSection)}
        >
          {isScore ? <Minus size={14} strokeWidth={2.6} aria-hidden /> : <Plus size={14} strokeWidth={2.6} aria-hidden />}
        </button>
        {hasDetail ? (
          <button
            type="button"
            className="smap-flt__cat smap-flt__cat--detail"
            aria-expanded={detailCat === c}
            title={hasSlider ? 'Doprecyzuj — miejsca na mapie i filtry' : 'Wybierz, co pokazać na mapie'}
            onClick={() => openDetail(c)}
            onFocus={(e) => e.currentTarget.matches(':focus-visible') && setFocusCat(c)}
            onBlur={() => setFocusCat((f) => (f === c ? null : f))}
          >
            <span className="smap-flt__icon" aria-hidden>
              <Icon size={15} strokeWidth={2.1} />
            </span>
            <span className="smap-flt__label">{label}</span>
            {badge != null && (
              <span className="smap-flt__detail-badge tabular" aria-label="Aktywne filtry">
                {badge}
              </span>
            )}
            <ChevronRight className="smap-flt__detail-chevron" size={15} strokeWidth={2.2} aria-hidden />
          </button>
        ) : (
          <div className="smap-flt__cat smap-flt__cat--static">
            <span className="smap-flt__icon" aria-hidden>
              <Icon size={15} strokeWidth={2.1} />
            </span>
            <span className="smap-flt__label">{label}</span>
          </div>
        )}
        {hasSlider && (
          <button
            type="button"
            className={`smap-flt__pin-btn${pinned === c ? ' is-on' : ''}`}
            aria-pressed={pinned === c}
            title={pinned === c ? 'Odepnij widok kategorii' : 'Przypnij widok tylko tej kategorii'}
            onClick={() => setPinned((p) => (p === c ? null : p))}
          >
            <Pin size={12} strokeWidth={2.4} aria-hidden />
          </button>
        )}
        {hasSlider && (
          <>
            <input
              type="range"
              className="smap-flt__range"
              min={0}
              max={5}
              step={1}
              value={ui}
              aria-label={`Jak ważne: ${label}`}
              aria-valuetext={ui === 0 ? 'nie liczy się' : `${ui} na 5${prio ? ', bardzo ważne' : ''}`}
              style={{ '--v': `${(ui / 5) * 100}%` } as CSSProperties}
              onPointerDown={(e) => startSliderDrag(c, e)}
              onChange={(e) => onWeight(c, uiToWeight(Number(e.target.value)))}
            />
            <output className="smap-flt__val tabular" aria-hidden>
              {ui}
              <small>/5</small>
            </output>
          </>
        )}
      </li>
    )
  }

  const renderList = (section: FilterSectionId, rows: readonly CategoryKey[], className?: string) => (
    <ul className={className ?? 'smap-flt__list'}>
      {rows.map((c) => renderRow(c, section))}
    </ul>
  )

  return (
    <div className="smap-flt-cluster">
      <m.section
        className="smap-flt"
        aria-labelledby="smap-flt-title"
        initial={reduce ? false : { opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, delay: 0.3, ease: EASE }}
        onKeyDown={onPanelKey}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hoverTo(null, LEAVE_DELAY)}
      >
        <header className="smap-flt__head smap-flt__head--stack">
          <div>
            <h2 id="smap-flt-title">Twoja okolica</h2>
          </div>
          {onHorizonChange && (
            <div className="smap-flt__horizon" role="radiogroup" aria-label="Wynajem lub kupno">
              {HORIZON_ORDER.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={horizon === h}
                  className={horizon === h ? 'is-active' : undefined}
                  onClick={() => onHorizonChange(h)}
                >
                  {HORIZONS[h].title}
                </button>
              ))}
            </div>
          )}
        </header>

        <h3 className="smap-flt__subhead">Liczy się dla mnie</h3>
        {renderList('score', filterSections.score)}

        <div className="smap-flt__divider" role="presentation">
          <span>Podgląd na mapie</span>
        </div>
        {renderList('preview', filterSections.preview, 'smap-flt__list smap-flt__list--map')}

        <footer className="smap-flt__foot">
          <span className="smap-flt__status" aria-live="polite">
            {!mixActive
              ? 'Włącz choć jeden suwak, żeby porównać okolice'
              : pinned
                ? `Mapa pokazuje tylko: ${categoryLabel(pinned)}`
                : ''}
          </span>
          <button type="button" className="smap-flt__reset" onClick={onReset} disabled={isDefault}>
            <RotateCcw size={13} strokeWidth={2.2} aria-hidden />
            Przywróć profil
          </button>
        </footer>
      </m.section>
    </div>
  )
})
