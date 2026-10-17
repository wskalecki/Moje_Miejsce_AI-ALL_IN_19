import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { MAX_PRIORITIES } from '../../app/config'
import { CATEGORIES, CATEGORY_ORDER } from '../../app/dictionary'
import { CATEGORY_ICONS } from '../../app/icons'
import { useAppStore } from '../../app/useAppStore'
import type { CategoryKey } from '../../app/types'

const HINT_MS = 2500

function Tile({ category, order, onToggle }: { category: CategoryKey; order: number; onToggle: (c: CategoryKey, shake: () => void) => void }) {
  const ref = useRef<HTMLButtonElement>(null)
  const Icon = CATEGORY_ICONS[category]
  const pressed = order > 0
  // ±4 px, 240 ms (spec §4.1) — a CSS animation restarted by toggling the class
  const shake = () => {
    const el = ref.current
    if (!el) return
    el.classList.remove('is-shaking')
    void el.offsetWidth
    el.classList.add('is-shaking')
  }
  return (
    <button
      ref={ref}
      type="button"
      onAnimationEnd={(e) => e.currentTarget.classList.remove('is-shaking')}
      className="priority-tile"
      aria-pressed={pressed}
      onClick={() => onToggle(category, shake)}
    >
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
  const [hint, setHint] = useState(false)
  const hintTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(hintTimer.current), [])

  const onToggle = (c: CategoryKey, shake: () => void) => {
    const res = togglePriority(c)
    if (res === 'blocked') {
      shake()
      setHint(true)
      window.clearTimeout(hintTimer.current)
      hintTimer.current = window.setTimeout(() => setHint(false), HINT_MS)
    } else if (res === 'removed') {
      setHint(false)
    }
  }

  const count = state.priorities.length

  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="q-priorities">
          Co jest dla Ciebie najważniejsze?
        </h1>
        <p className="t-body t-secondary survey__sub">
          <span>Wybierz do 4. Zaznaczyliśmy to, co zwykle liczy się na Twoim etapie życia.</span>
          <span className="survey__counter tabular" data-full={count === MAX_PRIORITIES || undefined} aria-label={`Wybrano ${count} z ${MAX_PRIORITIES}`}>
            {count} / {MAX_PRIORITIES}
          </span>
        </p>
      </div>

      <div className="priority-grid" role="group" aria-labelledby="q-priorities">
        {CATEGORY_ORDER.map((c) => (
          <Tile key={c} category={c} order={state.priorities.indexOf(c) + 1} onToggle={onToggle} />
        ))}
      </div>

      <div className="survey__hint-slot" aria-live="polite">
        <AnimatePresence>
          {hint && (
            <m.p
              className="t-small survey__hint"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.2 }}
            >
              Maksymalnie 4 — odznacz coś, żeby wybrać inne.
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
