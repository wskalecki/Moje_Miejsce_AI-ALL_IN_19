/**
 * App shell: store + mini-router + screen switcher (spec §4, §9).
 *
 * intro (/) → mapa (/mapa) with preferences modal + dopasowanie overlay.
 * Legacy `/ankieta` redirects to `/mapa`.
 */
import { AnimatePresence, LazyMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { lazy, Suspense, useEffect } from 'react'
import { isHorizon, isProfileId } from './dictionary'
import { forgetSession } from './freshStart'
import { navigate, useRouter } from './router'
import { AppStoreProvider } from './store'
import { useAppStore } from './useAppStore'
import { IntroScreen } from '../screens/Intro/IntroScreen'
import { MapScreen } from '../screens/MapScreen/MapScreen'

const DevUiScreen = import.meta.env.DEV ? lazy(() => import('../screens/dev/DevUiScreen')) : null

function Shell() {
  const { route, query } = useRouter()
  const { setProfile, setHorizon, reset } = useAppStore()

  useEffect(() => {
    if (route.name === 'survey') navigate('/mapa', { replace: true })
  }, [route.name])

  const qProfile = query.get('profil')
  const qHorizon = query.get('horyzont')
  useEffect(() => {
    if (!isProfileId(qProfile) && !isHorizon(qHorizon)) return
    if (isProfileId(qProfile)) setProfile(qProfile)
    if (isHorizon(qHorizon)) setHorizon(qHorizon)
    const target = route.name === 'map' && route.slug ? `/mapa/${route.slug}` : '/mapa'
    navigate(target, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qProfile, qHorizon])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'r') return
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
      forgetSession()
      reset()
      navigate('/', { direction: -1 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset])

  return (
    <>
      {route.name === 'map' && <MapScreen slug={route.slug} />}

      <AnimatePresence initial={false}>
        {route.name === 'intro' && (
          <m.div
            key="intro"
            className="screen-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <IntroScreen />
          </m.div>
        )}
      </AnimatePresence>

      {route.name === 'devUi' && DevUiScreen && (
        <Suspense fallback={null}>
          <div className="screen-layer">
            <DevUiScreen />
          </div>
        </Suspense>
      )}
    </>
  )
}

const loadMotionFeatures = () => import('./motionFeatures').then((mod) => mod.default)

export default function App() {
  return (
    <LazyMotion features={loadMotionFeatures}>
      <AppStoreProvider>
        <Shell />
      </AppStoreProvider>
    </LazyMotion>
  )
}
