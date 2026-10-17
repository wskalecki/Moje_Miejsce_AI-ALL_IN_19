import { ArrowRight } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useEffect, useState } from 'react'
import { APP_NAME, APP_TAGLINE, PRELOAD_DATA_URLS } from '../../app/config'
import { PROFILE_ORDER, PROFILES } from '../../app/dictionary'
import { prefetchMap } from '../../app/mapLoader'
import { navigate } from '../../app/router'
import type { ProfileId } from '../../app/types'
import { AmbientBackground } from '../../components/ambient/AmbientBackground'
import { WarsawArt } from '../../components/ambient/WarsawArt'
import { Button, Logo } from '../../components/ui'
import { EASE } from '../../design/tokens'
import './intro.css'

const CYCLE_MS = 3800

export function IntroScreen() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState<ProfileId>('student')

  const start = () => navigate('/mapa')

  useEffect(() => {
    prefetchMap(PRELOAD_DATA_URLS)
  }, [])

  // Cycle the map through the three profiles.
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setActive((p) => PROFILE_ORDER[(PROFILE_ORDER.indexOf(p) + 1) % PROFILE_ORDER.length])
    }, CYCLE_MS)
    return () => window.clearInterval(id)
  }, [reduce])

  // Enter starts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.defaultPrevented) return
      const t = e.target instanceof Element ? e.target : null
      if (t && t !== document.body && t.closest('button, a, input')) return
      e.preventDefault()
      start()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: EASE.emphasized },
  })

  return (
    <main className="intro">
      <AmbientBackground />

      <div className="intro__art" aria-hidden>
        <WarsawArt profile={active} />
      </div>

      <header className="intro__top">
        <Logo />
      </header>

      <section className="intro__content">
        <m.p className="t-micro intro__eyebrow" {...rise(0.05)}>
          Hackathon W3 · Warszawa: Twój ruch!
        </m.p>
        <m.h1 className="t-display-xl intro__title" {...rise(0.12)}>
          {APP_NAME}
        </m.h1>
        <m.p className="t-h2 intro__promise" {...rise(0.2)}>
          {APP_TAGLINE}
        </m.p>
        <m.div className="intro__cta" {...rise(0.32)}>
          <Button size="lg" iconRight={ArrowRight} onClick={start}>
            Zacznij
          </Button>
          <p className="t-small intro__hint">3 pytania · 30 sekund · bez logowania</p>
        </m.div>
      </section>

      <footer className="intro__bottom">
        <p className="t-small intro__credits">Dane: m.st. Warszawa, GUGiK, GIOŚ, ZTM · ©&nbsp;współtwórcy OpenStreetMap, OpenFreeMap</p>
        <m.div className="intro__legend" {...rise(0.9)} aria-hidden>
          <span className="intro__legend-label">Jak dobrze okolica pasuje do profilu</span>
          {PROFILE_ORDER.map((p) => (
            <span key={p} className={`intro__chip accent-${p}`} data-on={p === active || undefined}>
              <i />
              {PROFILES[p].title}
            </span>
          ))}
        </m.div>
      </footer>
    </main>
  )
}
