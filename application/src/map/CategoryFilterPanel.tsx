import { X } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { memo, type CSSProperties } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import { weightToUi } from '../app/weights'
import {
  categoryHasGastronomyFilters,
  categoryHasPoiFilters,
  categoryHasSlider,
  DEFAULT_FILTER_SECTIONS,
  type FilterSections,
} from './categoryFilterRows'
import { GASTRONOMY_CUISINES } from './gastronomyCuisine'
import { poiInterestGroupForCategory } from './poiInterests'
import { CATEGORY_COLORS, categoryLabel } from './tokens'
import type { CategoryKey } from './types'

const EASE = [0.16, 1, 0.3, 1] as const
const TITLE_ID = 'smap-flt-detail-title'

interface CategoryFilterPanelProps {
  category: CategoryKey
  onClose: () => void
  weight: number
  gastronomyCuisines: readonly string[]
  onToggleGastronomyCuisine?: (cuisine: string) => void
  poiInterests: readonly string[]
  onTogglePoiInterest?: (subtype: string) => void
  filterSections?: FilterSections
}

function statusLine(
  category: CategoryKey,
  sections: FilterSections,
  weight: number,
  gastronomyCuisines: readonly string[],
  poiInterests: readonly string[],
): string {
  const ui = weightToUi(weight)
  const hasSlider = categoryHasSlider(category, sections)

  if (categoryHasGastronomyFilters(category)) {
    const total = GASTRONOMY_CUISINES.length
    const n = gastronomyCuisines.length
    if (ui === 0) return 'Gastronomia wyłączona w panelu filtrów.'
    if (n === 0) return 'Zaznacz kuchnie, które chcesz widzieć na mapie.'
    if (n < total) return `${n} z ${total} typów kuchni na mapie`
    return 'Wszystkie kuchnie na mapie'
  }

  const poi = poiInterestGroupForCategory(category)
  if (poi) {
    const on = poi.options.filter((o) => poiInterests.includes(o.subtype)).length
    const mapPart = on ? `Podgląd: ${on} ${on === 1 ? 'typ' : 'typy'}` : 'Brak zaznaczonych miejsc na mapie'
    if (hasSlider) {
      if (ui === 0) return `${mapPart} · nie wliczane w ranking`
      return mapPart
    }
    return `${mapPart} · tylko mapa, bez rankingu`
  }

  if (hasSlider) {
    return ui === 0 ? 'Wyłączone — bez wpływu na mapę i ranking' : 'Wliczane według wagi z panelu filtrów'
  }
  return ''
}

function leadText(category: CategoryKey, sections: FilterSections): string {
  if (category === 'cisza' || category === 'zycieNocne') return ''

  if (categoryHasGastronomyFilters(category)) {
    return 'Zaznacz kuchnie, które chcesz zobaczyć na mapie. Rozpoznajemy je po nazwach lokali.'
  }

  const poi = poiInterestGroupForCategory(category)
  if (poi) {
    if (category === 'zielen') {
      return 'Parki na mapie włączają się razem z suwakiem „Zieleń”.'
    }
    if (categoryHasSlider(category, sections)) {
      return 'Zaznacz miejsca do podglądu. Na ranking wpływa suwak tej kategorii w panelu filtrów.'
    }
    return 'Zaznacz miejsca, które chcesz zobaczyć na mapie.'
  }

  return ''
}

export const CategoryFilterPanel = memo(function CategoryFilterPanel({
  category,
  onClose,
  weight,
  gastronomyCuisines,
  onToggleGastronomyCuisine,
  poiInterests,
  onTogglePoiInterest,
  filterSections = DEFAULT_FILTER_SECTIONS,
}: CategoryFilterPanelProps) {
  const reduce = useReducedMotion()
  const Icon = CATEGORY_ICONS[category]
  const poi = poiInterestGroupForCategory(category)
  const showGastro = categoryHasGastronomyFilters(category) && onToggleGastronomyCuisine
  const showPoi = categoryHasPoiFilters(category) && onTogglePoiInterest && poi
  const lead = leadText(category, filterSections)
  const status = statusLine(category, filterSections, weight, gastronomyCuisines, poiInterests)

  return (
    <m.div
      className="smap-flt-detail-wrap"
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.24, ease: EASE }}
    >
      <button type="button" className="smap-flt-detail__backdrop" aria-label="Zamknij" onClick={onClose} />
      <m.aside
        className="smap-flt-detail"
        role="dialog"
        aria-labelledby={TITLE_ID}
        aria-modal="true"
        style={{ '--cat': CATEGORY_COLORS[category] } as CSSProperties}
        initial={reduce ? false : { opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={reduce ? undefined : { opacity: 0, x: 14 }}
        transition={{ duration: 0.34, ease: EASE }}
      >
        <header className="smap-flt-detail__head">
          <div className="smap-flt-detail__title-row">
            <span className="smap-flt-detail__icon" aria-hidden>
              <Icon size={17} strokeWidth={2.1} />
            </span>
            <div className="smap-flt-detail__titles">
              <h3 id={TITLE_ID}>{categoryLabel(category)}</h3>
              {status ? <p>{status}</p> : null}
            </div>
          </div>
          <button type="button" className="smap-flt-detail__close" onClick={onClose} aria-label="Zamknij">
            <X size={18} strokeWidth={2.2} />
          </button>
        </header>

        {lead ? <p className="smap-flt-detail__lead">{lead}</p> : null}

        {showGastro && (
          <div className="smap-flt-detail__grid" role="group" aria-label="Typy kuchni">
            {GASTRONOMY_CUISINES.map((c) => {
              const on = gastronomyCuisines.includes(c.id)
              return (
                <label key={c.id} className={`smap-flt-detail__chip${on ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => onToggleGastronomyCuisine!(c.id)} />
                  <span className="smap-flt-detail__chip-label">{c.label}</span>
                </label>
              )
            })}
          </div>
        )}

        {showPoi && (
          <div className="smap-flt-detail__grid" role="group" aria-label={poi.title}>
            {poi.options.map((o) => {
              const on = poiInterests.includes(o.subtype)
              return (
                <label key={o.subtype} className={`smap-flt-detail__chip${on ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={on} onChange={() => onTogglePoiInterest!(o.subtype)} />
                  <span className="smap-flt-detail__chip-label">{o.label}</span>
                </label>
              )
            })}
          </div>
        )}

        <footer className="smap-flt-detail__foot">
          <button type="button" className="smap-flt-detail__done" onClick={onClose}>Gotowe</button>
        </footer>
      </m.aside>
    </m.div>
  )
})
