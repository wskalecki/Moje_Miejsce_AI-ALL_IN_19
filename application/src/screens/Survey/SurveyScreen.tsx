/**
 * Survey `/ankieta?krok=1|2|3` (spec §4.1): progress, back, live mad-libs
 * sentence, and one question per step with directional slide transitions.
 */
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { DATA_URLS } from '../../app/config'
import { prefetchMap } from '../../app/mapLoader'
import { back, navigate, useRouter, type SurveyStep } from '../../app/router'
import { useAppStore } from '../../app/useAppStore'
import { Button, Logo } from '../../components/ui'
import { Sentence } from '../../components/sentence/Sentence'
import { AmbientBackground } from '../../components/ambient/AmbientBackground'
import { EASE } from '../../design/tokens'
import { buildSentence, type SlotKind } from '../../lib/sentence'
import { ProfileStep } from './ProfileStep'
import { PrioritiesStep } from './PrioritiesStep'
import { HorizonStep } from './HorizonStep'
import './survey.css'

const STEP_SLOT: Record<SurveyStep, SlotKind> = { 1: 'profile', 2: 'priority', 3: 'horizon' }

export interface SurveyScreenProps {
  step: SurveyStep
  /** Called when the user confirms step 3 ("Pokaż moją Warszawę"). */
  onFinish?: () => void
}

export function SurveyScreen({ step, onFinish }: SurveyScreenProps) {
  const { state } = useAppStore()
  const { direction } = useRouter()
  const reduce = useReducedMotion()
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Deep links can skip the intro — warm the map chunk here too so the map is ready at "Pokaż".
  useEffect(() => {
    prefetchMap(Object.values(DATA_URLS))
  }, [])

  // Steps 2–3 need a profile; send deep links back to step 1.
  const missingProfile = step > 1 && !state.profile
  useEffect(() => {
    if (missingProfile) navigate('/ankieta?krok=1', { replace: true, direction: -1 })
  }, [missingProfile])

  const goBack = () => {
    if (step === 1) back('/')
    else back(`/ankieta?krok=${step - 1}`)
  }
  const goNext = () => {
    if (step === 1 && state.profile) navigate('/ankieta?krok=2')
    else if (step === 2 && state.priorities.length > 0) navigate('/ankieta?krok=3')
    else if (step === 3 && state.horizon) {
      if (onFinish) onFinish()
      else navigate('/mapa')
    }
  }
  const goNextRef = useRef(goNext)
  const goBackRef = useRef(goBack)
  useEffect(() => {
    goNextRef.current = goNext
    goBackRef.current = goBack
  })

  // Esc = back; Enter (outside controls) = next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Escape') {
        e.preventDefault()
        goBackRef.current()
        return
      }
      if (e.key === 'Enter') {
        const t = e.target instanceof Element ? e.target : null
        if (t && t !== document.body && t.closest('button, a, input, [role="radio"]')) return
        e.preventDefault()
        goNextRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Move focus to the step heading for screen readers / keyboard users.
  useEffect(() => {
    const id = window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 340)
    return () => window.clearTimeout(id)
  }, [step])

  const parts = useMemo(
    () => buildSentence({ profile: state.profile, priorities: state.priorities, horizon: state.horizon }),
    [state.profile, state.priorities, state.horizon],
  )

  const offset = reduce ? 0 : 24
  const variants = {
    enter: (dir: number) => ({ x: dir * offset, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: -dir * offset, opacity: 0 }),
  }

  return (
    <main className="survey">
      <AmbientBackground intensity={0.55} />

      <header className="survey__top">
        <Button variant="ghost" iconLeft={ArrowLeft} onClick={goBack} className="survey__back">
          Wstecz
        </Button>
        <div className="survey__progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label="Postęp ankiety">
          <span className="survey__segments" aria-hidden>
            {[1, 2, 3].map((n) => (
              <span key={n} className="survey__segment" data-state={n < step ? 'done' : n === step ? 'current' : 'todo'}>
                <i />
              </span>
            ))}
          </span>
          <span className="t-small survey__step-label tabular">Krok {step} z 3</span>
        </div>
        <Logo className="survey__logo" />
      </header>

      <div className="survey__body">
        <Sentence parts={parts} activeSlot={STEP_SLOT[step]} live as="p" className="survey__sentence" />

        <div className="survey__stage">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={step}
              className="survey__step"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: EASE.emphasized }}
            >
              {step === 1 && <ProfileStep headingRef={headingRef} onConfirmed={() => navigate('/ankieta?krok=2')} />}
              {step === 2 && <PrioritiesStep headingRef={headingRef} />}
              {step === 3 && <HorizonStep headingRef={headingRef} />}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      <footer className="survey__footer">
        {step === 1 && (
          <Button size="lg" iconRight={ArrowRight} onClick={goNext} disabled={!state.profile} className="survey__next" data-hidden={!state.profile || undefined}>
            Dalej
          </Button>
        )}
        {step === 2 && (
          <Button size="lg" iconRight={ArrowRight} onClick={goNext} disabled={state.priorities.length === 0}>
            Dalej
          </Button>
        )}
        {step === 3 && (
          <Button size="lg" iconRight={ArrowRight} onClick={goNext} disabled={!state.horizon}>
            Pokaż moją Warszawę
          </Button>
        )}
      </footer>
    </main>
  )
}
