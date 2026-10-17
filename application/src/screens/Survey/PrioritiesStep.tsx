import { Check } from 'lucide-react'
import type { RefObject } from 'react'
import { CATEGORIES, FILTER_PANEL_CATEGORIES } from '../../app/dictionary'
import { UI_WEIGHT_MAX, weightToUi } from '../../app/weights'
import { CATEGORY_ICONS } from '../../app/icons'
import { useAppStore } from '../../app/useAppStore'
import type { CategoryKey } from '../../app/types'

function Tile({ category, pressed, weight, onToggle }: { category: CategoryKey; pressed: boolean; weight: number; onToggle: (c: CategoryKey) => void }) {
  const Icon = CATEGORY_ICONS[category]
  const label = CATEGORIES[category].label
  return (
    <button
      type="button"
      className="priority-tile"
      aria-pressed={pressed}
      aria-label={`${label}, ważność ${weightToUi(weight)} z ${UI_WEIGHT_MAX}`}
      onClick={() => onToggle(category)}
    >
      <span className="priority-tile__head">
        <Icon className="priority-tile__icon" size={18} strokeWidth={1.9} aria-hidden />
        <span className="priority-tile__label">{label}</span>
        <span className="priority-tile__check" aria-hidden>
          <Check size={12} strokeWidth={3.2} />
        </span>
      </span>
      <span className="priority-tile__weight" aria-hidden>
        <span className="priority-tile__track">
          <i style={{ transform: `scaleX(${weightToUi(weight) / UI_WEIGHT_MAX})` }} />
        </span>
        <span className="priority-tile__value tabular">{weightToUi(weight)}</span>
      </span>
    </button>
  )
}

export function PrioritiesStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { state, togglePriority } = useAppStore()

  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="q-priorities">
          Co jest dla Ciebie ważne?
        </h1>
        <p className="t-body t-secondary survey__sub" id="q-priorities-sub">
          Zaznacz, co ma wpływać na kolor okolicy. Suwaki w panelu (0–{UI_WEIGHT_MAX}) ustawisz dokładniej po wejściu na mapę.
        </p>
      </div>

      <div className="priority-grid" role="group" aria-labelledby="q-priorities" aria-describedby="q-priorities-sub">
        {FILTER_PANEL_CATEGORIES.map((c) => (
          <Tile key={c} category={c} pressed={state.priorities.includes(c)} weight={state.weights[c]} onToggle={togglePriority} />
        ))}
      </div>
    </>
  )
}
