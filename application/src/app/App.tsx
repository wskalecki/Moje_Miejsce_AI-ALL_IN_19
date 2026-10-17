/**
 * App shell: store + mini-router + screen switcher (spec §4, §9).
 *
 * intro (/) → ankieta (/ankieta?krok=1..3) → dopasowanie (overlay) → mapa (/mapa, /mapa/:slug)
 * The map is mounted once (from the matching screen onward) and never unmounted;
 * intro and survey are opaque overlays above it.
 */
import { AnimatePresence, LazyMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { lazy, Suspense, useEffect, useState } from 'react'
import { isHorizon, isProfileId } from './dictionary'
import { navigate, useRouter } from './router'
import { AppStoreProvider } from './store'
import { useAppStore } from './useAppStore'
import { IntroScreen } from '../screens/Intro/IntroScreen'
import { SurveyScreen } from '../screens/Survey/SurveyScreen'
import { MapScreen } from '../screens/MapScreen/MapScreen'
import { MatchingScreen } from '../screens/Matching/MatchingScreen'

const DevUiScreen = import.meta.env.DEV ? lazy(() => import('../screens/dev/DevUiScreen')) : null

function Shell() {
  const { route, query } = useRouter()
  const store = useAppStore()
  const { state, setProfile, setHorizon, reset } = store
  const [mapMounted, setMapMounted] = useState(route.name === 'map')
  const [matching, setMatching] = useState(false)

  if (route.name === 'map' && !mapMounted) setMapMounted(true)

  // Presenter shortcut: ?profil=student|rodzina|senior&horyzont=chwila|stale → map.
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

  // Entering the map without a profile → rodzina / stale (spec §9).
  const onMap = route.name === 'map'
  useEffect(() => {
    if (!onMap || isProfileId(qProfile)) return
    if (!state.profile) setProfile('rodzina')
    else if (!state.horizon) setHorizon('stale')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMap, state.profile, state.horizon])

  // Shift+R → reset to intro.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'r') return
      const t = e.target instanceof Element ? e.target : null
      if (t?.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
      reset()
      navigate('/', { direction: -1 })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reset])

  const overlayKey = route.name === 'intro' ? 'intro' : route.name === 'survey' ? 'survey' : null

  return (
    <>
      {mapMounted && <MapScreen slug={route.name === 'map' ? route.slug : null} hidden={route.name !== 'map'} />}

      <AnimatePresence initial={false}>
        {overlayKey && (
          <m.div
            key={overlayKey}
            className="screen-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {overlayKey === 'intro' && <IntroScreen />}
            {overlayKey === 'survey' && route.name === 'survey' && (
              <SurveyScreen
                step={route.step}
                onFinish={() => {
                  setMatching(true)
                  setMapMounted(true)
                  navigate('/mapa')
                }}
              />
            )}
          </m.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{matching && <MatchingScreen key="matching" onDone={() => setMatching(false)} />}</AnimatePresence>

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

/** Motion's feature bundle (~30 KB gzip) loads after first paint; `m.*` components animate once it lands. */
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
