/**
 * "Dopasowujemy Warszawę do Ciebie…" (spec §4.2): ~1.8 s analysis moment shown
 * over the map while it loads underneath. Click / Enter skips.
 */
import { Check, LoaderCircle } from 'lucide-react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DATA_URLS, MATCHING_DURATION_MS } from '../../app/config'
import { useAppStore } from '../../app/useAppStore'
import { AmbientBackground } from '../../components/ambient/AmbientBackground'
import { WarsawArt } from '../../components/ambient/WarsawArt'
import { Sentence } from '../../components/sentence/Sentence'
import { EASE } from '../../design/tokens'
import { buildSentence } from '../../lib/sentence'
import './matching.css'

const LINE_EVERY_MS = 500
const LINE_DONE_AFTER_MS = 420
const DEFAULT_OSIEDLA_COUNT = 143

let cachedCount: number | null = null

function useOsiedlaCount(): number {
  const [n, setN] = useState(cachedCount ?? DEFAULT_OSIEDLA_COUNT)
  useEffect(() => {
    if (cachedCount !== null) return
    let alive = true
    fetch(DATA_URLS.osiedlaScores)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Record<string, unknown> | null) => {
        if (!j) return
        cachedCount = Object.keys(j).length
        if (alive) setN(cachedCount)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  return n
}

export function MatchingScreen({ onDone }: { onDone: () => void }) {
  const { state } = useAppStore()
  const reduce = useReducedMotion()
  const count = useOsiedlaCount()
  const [elapsed, setElapsed] = useState(0)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    onDoneRef.current()
  }

  // Discrete milestones instead of per-frame state: lines appear / complete.
  useEffect(() => {
    const marks = [0, 1, 2].flatMap((i) => [i * LINE_EVERY_MS, i * LINE_EVERY_MS + LINE_DONE_AFTER_MS])
    const timers = marks.map((m) => window.setTimeout(() => setElapsed(m), m))
    timers.push(window.setTimeout(finish, MATCHING_DURATION_MS))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parts = useMemo(
    () => buildSentence({ profile: state.profile, priorities: state.priorities, horizon: state.horizon, maxNamed: 4 }),
    [state.profile, state.priorities, state.horizon],
  )

  const lines = [
    'Łączymy 24 wskaźniki z otwartych danych Warszawy…',
    `Oceniamy ${count} osiedli pod Twój profil…`,
    'Gotowe — mamy dla Ciebie 3 propozycje.',
  ]

  return (
    <m.div
      className="matching"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE.standard } }}
      transition={{ duration: 0.32, ease: EASE.standard }}
      onClick={finish}
    >
      <AmbientBackground />
      <m.div
        className="matching__art"
        aria-hidden
        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: EASE.emphasized }}
      >
        <WarsawArt profile={state.profile ?? 'rodzina'} />
      </m.div>

      <div className="matching__content">
        <p className="t-small matching__eyebrow">Dopasowujemy Warszawę do Ciebie…</p>
        <Sentence parts={parts} size="md" as="h2" className="matching__sentence" />

        <ul className="matching__lines">
          <AnimatePresence>
            {lines.map((text, i) => {
              const appearAt = i * LINE_EVERY_MS
              if (elapsed < appearAt) return null
              const done = elapsed >= appearAt + LINE_DONE_AFTER_MS
              return (
                <m.li
                  key={i}
                  className="matching__line"
                  data-done={done || undefined}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, ease: EASE.emphasized }}
                >
                  <span className="matching__icon" aria-hidden>
                    <AnimatePresence mode="wait" initial={false}>
                      {done ? (
                        <m.span key="ok" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.24, ease: EASE.emphasized }}>
                          <Check size={14} strokeWidth={3} />
                        </m.span>
                      ) : (
                        <m.span key="spin" exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.12 }}>
                          <LoaderCircle size={16} strokeWidth={2.4} className="matching__spinner" />
                        </m.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="t-body">{text}</span>
                </m.li>
              )
            })}
          </AnimatePresence>
        </ul>

        <span className="matching__bar" aria-hidden>
          <i style={{ animationDuration: `${MATCHING_DURATION_MS}ms` }} />
        </span>
      </div>
    </m.div>
  )
}
