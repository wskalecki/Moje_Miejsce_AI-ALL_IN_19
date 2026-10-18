/**
 * On-map preferences modal (~90% viewport): replaces full-screen `/ankieta`.
 * Steps: intro hints → profile → filter priorities → wynajem/kupno.
 */
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { AnimatePresence, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useAppStore } from '../../app/useAppStore'
import { Button, Logo } from '../../components/ui'
import { EASE } from '../../design/tokens'
import { HorizonStep } from '../Survey/HorizonStep'
import { PrioritiesStep } from '../Survey/PrioritiesStep'
import { ProfileStep } from '../Survey/ProfileStep'
import '../Survey/survey.css'
import './preferencesModal.css'

type Step = 'intro' | 1 | 2 | 3

const STEPS: Step[] = ['intro', 1, 2, 3]

export interface PreferencesModalProps {
  open: boolean
  onClose: () => void
  /** User finished step 3 (wynajem/kupno). */
  onComplete: () => void
}

export function PreferencesModal({ open, onClose, onComplete }: PreferencesModalProps) {
  const reduce = useReducedMotion()
  const { state } = useAppStore()
  const canDismiss = !!state.profile && !!state.horizon
  const [step, setStep] = useState<Step>('intro')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // always from the intro: the profile step shows the preselected (default) profile and can change it
  useEffect(() => {
    if (open) setStep('intro')
  }, [open])

  useEffect(() => {
    if (open) headingRef.current?.focus({ preventScroll: true })
  }, [open, step])

  const idx = STEPS.indexOf(step)
  const canNext =
    step === 'intro' ||
    (step === 1 && !!state.profile) ||
    (step === 2 && state.priorities.length > 0) ||
    (step === 3 && !!state.horizon)

  const goNext = () => {
    if (step === 'intro') setStep(1)
    else if (step === 1 && state.profile) setStep(2)
    else if (step === 2) setStep(3)
    else if (step === 3 && state.horizon) onComplete()
  }

  const goBack = () => {
    if (step === 'intro') onClose()
    else if (step === 1) setStep('intro')
    else setStep((step - 1) as Step)
  }

  if (!open) return null

  return (
    <div className="prefs-modal" role="presentation">
      <m.button
        type="button"
        className="prefs-modal__backdrop"
        aria-label="Zamknij preferencje"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => canDismiss && onClose()}
      />
      <m.div
        className="prefs-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefs-modal-title"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: EASE.emphasized }}
      >
        <header className="prefs-modal__head">
          <button type="button" className="prefs-modal__back" onClick={goBack} aria-label="Wstecz">
            <ArrowLeft size={18} strokeWidth={2.2} aria-hidden />
          </button>
          <div className="prefs-modal__progress" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={String(s)} className="prefs-modal__seg" data-state={i < idx ? 'done' : i === idx ? 'current' : 'todo'} />
            ))}
          </div>
          <button type="button" className="prefs-modal__close" onClick={() => canDismiss && onClose()} aria-label="Zamknij" disabled={!canDismiss}>
            <X size={18} strokeWidth={2.2} aria-hidden />
          </button>
        </header>

        <div className="prefs-modal__logo">
          <Logo />
        </div>

        <div className="prefs-modal__body survey">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={String(step)}
              className="survey__body"
              initial={reduce ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.emphasized }}
            >
              {step === 'intro' && (
                <IntroStep headingRef={headingRef} />
              )}
              {step === 1 && (
                <ProfileStep headingRef={headingRef} onConfirmed={() => setStep(2)} />
              )}
              {step === 2 && <PrioritiesStep headingRef={headingRef} />}
              {step === 3 && <HorizonStep headingRef={headingRef} />}
            </m.div>
          </AnimatePresence>
        </div>

        {step !== 1 && (
          <footer className="prefs-modal__foot">
            <Button type="button" variant="primary" iconRight={ArrowRight} disabled={!canNext} onClick={goNext}>
              {step === 3 ? 'Pokaż mapę' : 'Dalej'}
            </Button>
          </footer>
        )}
      </m.div>
    </div>
  )
}

function IntroStep({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <>
      <div className="survey__question">
        <h1 className="t-h1" ref={headingRef} tabIndex={-1} id="prefs-modal-title">
          Dopasuj okolicę do siebie
        </h1>
        <p className="t-body t-secondary">
          Za chwilę wybierzesz profil, to co jest dla Ciebie najważniejsze na co dzień (cisza, zieleń, kultura, gastronomia) oraz wynajem lub kupno.
          Szkoły, parki, komunikacja czy sklepy doprecyzujesz w panelu po lewej stronie mapy.
        </p>
      </div>
      <ul className="prefs-modal__hints">
        <li><strong>Suwaki 0–5</strong> — od „nie liczy się” do „bardzo ważne”; 0 chowa kategorię z porównania.</li>
        <li><strong>Podgląd na mapie</strong> — opcjonalnie pokaż parki, przystanki, szkoły i inne miejsca.</li>
        <li>Mapa pod spodem już działa — możesz ją zobaczyć po zamknięciu tego okna.</li>
      </ul>
    </>
  )
}
