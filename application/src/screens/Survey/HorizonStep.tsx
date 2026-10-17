import { Check } from 'lucide-react'
import { useRef, type KeyboardEvent, type RefObject } from 'react'
import { HORIZON_ORDER, HORIZONS } from '../../app/dictionary'
import { HORIZON_ICONS } from '../../app/icons'
import { useAppStore } from '../../app/useAppStore'

export function HorizonStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { state, setHorizon } = useAppStore()
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const selectedIdx = state.horizon ? HORIZON_ORDER.indexOf(state.horizon) : 0

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    let next: number
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % HORIZON_ORDER.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + HORIZON_ORDER.length) % HORIZON_ORDER.length
    else if (e.key === ' ') {
      e.preventDefault()
      setHorizon(HORIZON_ORDER[i])
      return
    } else return
    e.preventDefault()
    setHorizon(HORIZON_ORDER[next])
    refs.current[next]?.focus()
  }

  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="q-horizon">
          Na jak długo szukasz miejsca?
        </h1>
        <p className="t-body t-secondary">Zmienimy ceny i pokażemy, jak okolica będzie się rozwijać.</p>
      </div>

      <div className="horizon-cards" role="radiogroup" aria-labelledby="q-horizon">
        {HORIZON_ORDER.map((h, i) => {
          const def = HORIZONS[h]
          const Icon = HORIZON_ICONS[h]
          const selected = state.horizon === h
          return (
            <div
              key={h}
              ref={(el) => {
                refs.current[i] = el
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={i === selectedIdx ? 0 : -1}
              className="choice-card horizon-card"
              data-selected={selected || undefined}
              onClick={() => setHorizon(h)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="choice-card__check" aria-hidden>
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="horizon-card__icon" aria-hidden>
                <Icon size={30} strokeWidth={1.7} />
              </span>
              <span className="horizon-card__text">
                <span className="t-h2">{def.title}</span>
                <span className="t-body t-secondary">{def.description}</span>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
