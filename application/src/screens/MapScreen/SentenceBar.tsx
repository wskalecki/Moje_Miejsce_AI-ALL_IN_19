/**
 * Map sentence bar (spec §4.3, crit. 13): logo → intro, the survey sentence shortened to three
 * pills, and a profile popover that switches the profile live and names each profile's honest #1.
 *
 *   [Okolica] | [Mamy rodzinę ⌄], liczą się [🎓 🌳 🔇 🛒], szukamy [na stałe].
 */
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { APP_NAME } from '../../app/config'
import { CATEGORIES, DEFAULT_PRIORITIES, HORIZONS, PROFILE_ORDER, PROFILES } from '../../app/dictionary'
import { CATEGORY_ICONS, PROFILE_ICONS } from '../../app/icons'
import { navigate } from '../../app/router'
import type { CategoryKey, Horizon, ProfileId } from '../../app/types'
import { useOsiedlaNames, useRanking } from '../../app/useMatch'
import { useAppStore } from '../../app/useAppStore'
import { deriveWeights } from '../../app/weights'
import { Logo } from '../../components/ui'
import { verbFor } from '../../lib/sentence'
import './sentenceBar.css'

export interface SentenceBarProps {
  profile: ProfileId
  priorities: readonly CategoryKey[]
  horizon: Horizon
  onProfileChange: (p: ProfileId) => void
  hidden?: boolean
}

/** Priorities are unlimited — the pill shows the first few icons and "+N". */
const MAX_ICONS = 4

/** Default weights per profile — what the map switches to when the profile changes. */
const PROFILE_DEFAULT_WEIGHTS = Object.fromEntries(PROFILE_ORDER.map((p) => [p, deriveWeights(p, DEFAULT_PRIORITIES[p])])) as Record<
  ProfileId,
  ReturnType<typeof deriveWeights>
>

/** "Najlepiej: Muranów · 92%" — the honest #1 for the profile (the current weights for the active one,
 *  the profile defaults for the others — what the map switches to on a profile change). */
function BestFor({ profile, active }: { profile: ProfileId; active: boolean }) {
  const { state } = useAppStore()
  const ranking = useRanking(active ? state.weights : PROFILE_DEFAULT_WEIGHTS[profile])
  const names = useOsiedlaNames()
  const id = ranking?.order[0]
  const name = id ? names?.get(id) : undefined
  if (!id || !name) return <span className="sbar-pop__sub">{PROFILES[profile].description}</span>
  return (
    <span className="sbar-pop__sub">
      Najlepiej: <b>{name}</b>
      <span className="tabular"> · {ranking.match.get(id)}%</span>
    </span>
  )
}

function listLabel(priorities: readonly CategoryKey[]): string {
  const labels = priorities.map((c) => CATEGORIES[c].sentenceLabel)
  if (labels.length <= 1) return labels.join('')
  return `${labels.slice(0, -1).join(', ')} i ${labels[labels.length - 1]}`
}

export function SentenceBar({ profile, priorities, horizon, onProfileChange, hidden = false }: SentenceBarProps) {
  const def = PROFILES[profile]
  const ProfileIcon = PROFILE_ICONS[profile]
  const [openState, setOpen] = useState(false)
  const open = openState && !hidden
  const rootRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLButtonElement>(null)
  const popId = useId()

  // close on outside pointer / Esc; focus the active option on open
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      pillRef.current?.focus()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    rootRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.focus({ preventScroll: true })
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  const onOptionKey = (e: ReactKeyboardEvent, i: number) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = PROFILE_ORDER[(i + d + PROFILE_ORDER.length) % PROFILE_ORDER.length]
    onProfileChange(next)
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>(`[data-p="${next}"]`)?.focus())
  }

  const list = listLabel(priorities)

  return (
    <div
      ref={rootRef}
      className="sbar"
      data-hidden={hidden || undefined}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <nav className="sbar__bar" aria-label="Twoje odpowiedzi">
        <button type="button" className="sbar__logo" onClick={() => navigate('/', { direction: -1 })} aria-label={`${APP_NAME} — wróć na start`}>
          <Logo />
        </button>
        <span className="sbar__div" aria-hidden />
        <p className="sbar__sentence">
          <button
            ref={pillRef}
            type="button"
            className="sbar__pill sbar__pill--profile"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popId : undefined}
            onClick={() => setOpen((o) => !o)}
            title="Zmień profil"
          >
            <ProfileIcon className="sbar__pill-icon" size={16} strokeWidth={2.2} aria-hidden />
            <span className="sbar__full">{def.fragment}</span>
            <span className="sbar__short">{def.title}</span>
            <ChevronDown className="sbar__chev" size={14} strokeWidth={2.4} aria-hidden />
          </button>
          <span className="sbar__w">
            , {verbFor(priorities)} dla {def.pronoun}
          </span>{' '}
          <button
            type="button"
            className="sbar__pill sbar__pill--prio"
            onClick={() => navigate('/ankieta?krok=2')}
            aria-label={`Priorytety: ${list || 'brak'}. Zmień w ankiecie`}
            title={list ? `${list} — zmień` : 'Wybierz priorytety'}
          >
            {priorities.length ? (
              <>
                {priorities.slice(0, MAX_ICONS).map((c) => {
                  const Icon = CATEGORY_ICONS[c]
                  return <Icon key={c} size={16} strokeWidth={2.1} aria-hidden />
                })}
                {priorities.length > MAX_ICONS && <span className="sbar__more tabular">+{priorities.length - MAX_ICONS}</span>}
              </>
            ) : (
              <span>…</span>
            )}
          </button>
          <span className="sbar__w">, {def.verb} miejsca</span>{' '}
          <button
            type="button"
            className="sbar__pill"
            onClick={() => navigate('/ankieta?krok=3')}
            aria-label={`Horyzont: ${HORIZONS[horizon].fragment}. Zmień w ankiecie`}
            title="Zmień horyzont"
          >
            {HORIZONS[horizon].fragment}
          </button>
          <span className="sbar__w sbar__dot">.</span>
        </p>
      </nav>

      {open && (
        <div id={popId} className="sbar-pop" role="dialog" aria-label="Zmień profil">
          <div className="sbar-pop__head">
            <span className="sbar-pop__kicker">Twój profil</span>
            <p>Zmień profil — mapa i ranking przeliczą się od razu.</p>
          </div>
          <div className="sbar-pop__list" role="radiogroup" aria-label="Profil">
            {PROFILE_ORDER.map((p, i) => {
              const Icon = PROFILE_ICONS[p]
              const active = p === profile
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  data-p={p}
                  className={`sbar-pop__opt accent-${p}`}
                  onClick={() => onProfileChange(p)}
                  onKeyDown={(e) => onOptionKey(e, i)}
                >
                  <span className="sbar-pop__icon">
                    <Icon size={18} strokeWidth={2} aria-hidden />
                  </span>
                  <span className="sbar-pop__text">
                    <span className="sbar-pop__title">{PROFILES[p].title}</span>
                    <BestFor profile={p} active={active} />
                  </span>
                  <span className="sbar-pop__check" aria-hidden>
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
          <button type="button" className="sbar-pop__survey" onClick={() => navigate('/ankieta?krok=1')}>
            Zmień odpowiedzi w ankiecie
            <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
