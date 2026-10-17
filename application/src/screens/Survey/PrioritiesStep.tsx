import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import type { RefObject } from 'react'
import { CATEGORIES, CATEGORY_ORDER } from '../../app/dictionary'
import { CATEGORY_ICONS } from '../../app/icons'
import { useAppStore } from '../../app/useAppStore'
import type { CategoryKey } from '../../app/types'

function Tile({ category, order, onToggle }: { category: CategoryKey; order: number; onToggle: (c: CategoryKey) => void }) {
  const Icon = CATEGORY_ICONS[category]
  const pressed = order > 0
  return (
    <button type="button" className="priority-tile" aria-pressed={pressed} onClick={() => onToggle(category)}>
      <span className="priority-tile__icon" aria-hidden>
        <Icon size={22} strokeWidth={1.9} />
      </span>
      <span className="priority-tile__label">{CATEGORIES[category].label}</span>
      <AnimatePresence>
        {pressed && (
          <m.span
            key={order}
            className="priority-tile__order tabular"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden
          >
            {order}
          </m.span>
        )}
      </AnimatePresence>
    </button>
  )
}

export function PrioritiesStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { state, togglePriority } = useAppStore()

  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="q-priorities">
          Co jest dla Ciebie najważniejsze?
        </h1>
        <p className="t-body t-secondary survey__sub">Zaznacz tyle, ile chcesz. Zaczynamy od tego, co zwykle liczy się na Twoim etapie życia.</p>
      </div>

      <div className="priority-grid" role="group" aria-labelledby="q-priorities">
        {CATEGORY_ORDER.map((c) => (
          <Tile key={c} category={c} order={state.priorities.indexOf(c) + 1} onToggle={togglePriority} />
        ))}
      </div>
    </>
  )
}
