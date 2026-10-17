import { Check } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { PROFILE_ORDER, PROFILES } from '../../app/dictionary'
import { PROFILE_ICONS } from '../../app/icons'
import { useAppStore } from '../../app/useAppStore'
import type { ProfileId } from '../../app/types'
import { DotPatch } from './DotPatch'

const ADVANCE_MS = 400

export function ProfileStep({
  headingRef,
  onConfirmed,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  onConfirmed: () => void
}) {
  const { state, setProfile } = useAppStore()
  const [focusIdx, setFocusIdx] = useState(() => Math.max(0, state.profile ? PROFILE_ORDER.indexOf(state.profile) : 0))
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const choose = (p: ProfileId) => {
    setProfile(p, { keepChoices: true })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(onConfirmed, ADVANCE_MS)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>, i: number) => {
    let next = i
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % PROFILE_ORDER.length
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + PROFILE_ORDER.length) % PROFILE_ORDER.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = PROFILE_ORDER.length - 1
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(PROFILE_ORDER[i])
      return
    } else return
    e.preventDefault()
    setFocusIdx(next)
    refs.current[next]?.focus()
  }

  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="q-profile">
          Na jakim etapie życia jesteś?
        </h1>
        <p className="t-body t-secondary">Od tego zależy, co pokażemy na mapie najpierw.</p>
      </div>

      <div className="profile-cards" role="radiogroup" aria-labelledby="q-profile">
        {PROFILE_ORDER.map((p, i) => {
          const def = PROFILES[p]
          const Icon = PROFILE_ICONS[p]
          const selected = state.profile === p
          return (
            <div
              key={p}
              ref={(el) => {
                refs.current[i] = el
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={i === focusIdx ? 0 : -1}
              className={`choice-card profile-card accent-${p}`}
              data-selected={selected || undefined}
              data-dimmed={(state.profile && !selected) || undefined}
              onClick={() => {
                setFocusIdx(i)
                choose(p)
              }}
              onKeyDown={(e) => onKeyDown(e, i)}
              onFocus={() => setFocusIdx(i)}
            >
              <span className="choice-card__check" aria-hidden>
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="profile-card__art" aria-hidden>
                <DotPatch seed={i} />
                <span className="profile-card__halo" />
                <span className="profile-card__icon">
                  <Icon size={52} strokeWidth={1.6} />
                </span>
              </span>
              <span className="profile-card__text">
                <span className="t-h2 profile-card__title">{def.title}</span>
                <span className="t-body t-secondary">{def.description}</span>
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
