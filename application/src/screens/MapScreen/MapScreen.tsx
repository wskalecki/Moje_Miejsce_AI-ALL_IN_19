import { AnimatePresence } from 'motion/react'
import { Component, lazy, memo, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { PRELOAD_DATA_URLS } from '../../app/config'
import { prefetchMap } from '../../app/mapLoader'
import { DEFAULT_PROFILE } from '../../app/dictionary'
import { startedFromIntro } from '../../app/freshStart'
import { navigate, useRouter } from '../../app/router'
import type { ProfileId } from '../../app/types'
import { useAppStore } from '../../app/useAppStore'
import type { FeaturedRank } from '../../map/FeaturedMarkers'
import type { MapApi } from '../../map/MapView'
import { MatchingScreen } from '../Matching/MatchingScreen'
import { MapSkeleton } from './MapSkeleton'
import { PreferencesModal } from './PreferencesModal'
import { SentenceBar } from './SentenceBar'
import './mapScreen.css'

// memo: a store change the map doesn't take (timeline year, visited, busy…) re-renders only this
// screen, not the whole MapView / CinematicLayer tree (their props are stable references)
const LazyMapView = lazy(() => import('../../map/MapView').then((mod) => ({ default: memo(mod.default) })))
const LazyCinema = lazy(() => import('../../cinematic/CinematicLayer').then((mod) => ({ default: memo(mod.default) })))

class MapErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    if (this.state.error) return null
    return this.props.children
  }
}

export function MapScreen({ slug, hidden = false }: { slug: string | null; hidden?: boolean }) {
  const {
    state,
    markVisited,
    setProfile,
    setWeight,
    resetWeights,
    setHorizon,
    togglePoiInterest,
    toggleGastronomyCuisine,
    setFilterSections,
  } = useAppStore()
  const { query } = useRouter()
  const profile = state.profile ?? DEFAULT_PROFILE
  const horizon = state.horizon ?? 'stale'
  const [api, setApi] = useState<MapApi | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [matching, setMatching] = useState(false)
  /** The osiedle panel is up (or the camera is flying back from it): the header pill stays in place. */
  const [placeOpen, setPlaceOpen] = useState(false)
  /** Rank and match of the featured osiedla exactly as the map pills show them. */
  const [ranks, setRanks] = useState<{ bySlug: Readonly<Record<string, FeaturedRank>>; total: number } | null>(null)
  const needsSetup = !state.profile || !state.horizon
  const [prefsOpen, setPrefsOpen] = useState(() => needsSetup && startedFromIntro())
  const quick = query.get('szybko') === '1'

  useEffect(() => {
    prefetchMap(PRELOAD_DATA_URLS)
  }, [])

  const badSlug = !!slug && !!api && !api.featured.some((f) => f.slug === slug)
  useEffect(() => {
    if (badSlug) navigate('/mapa', { replace: true })
  }, [badSlug])
  const activeSlug = badSlug ? null : slug

  const onSelectFeatured = useCallback((s: string) => navigate(`/mapa/${s}${quick ? '?szybko=1' : ''}`), [quick])
  const onMapReady = useCallback((_m: unknown, a: MapApi) => setApi(a), [])
  const onFeaturedRanks = useCallback(
    (bySlug: Readonly<Record<string, FeaturedRank>>, total: number) => setRanks({ bySlug, total }),
    [],
  )
  const onProfileChange = useCallback((p: ProfileId) => setProfile(p), [setProfile])

  const finishPrefs = () => {
    setPrefsOpen(false)
    if (!matching) setMatching(true)
  }

  return (
    <div
      className="map-screen"
      data-cinema={activeSlug || busy ? '' : undefined}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <MapErrorBoundary onError={() => setFailed(true)}>
        <Suspense fallback={null}>
          <LazyMapView
            profile={profile}
            priorities={state.priorities}
            weights={state.weights}
            onWeightChange={setWeight}
            onResetWeights={resetWeights}
            poiInterests={state.poiInterests}
            onTogglePoiInterest={togglePoiInterest}
            gastronomyCuisines={state.gastronomyCuisines}
            onToggleGastronomyCuisine={toggleGastronomyCuisine}
            filterSections={state.filterSections}
            onFilterSectionsChange={setFilterSections}
            horizon={horizon}
            onHorizonChange={setHorizon}
            selectedSlug={activeSlug}
            chrome={!busy && !prefsOpen}
            onSelectFeatured={onSelectFeatured}
            onMapReady={onMapReady}
            onFeaturedRanks={onFeaturedRanks}
          />
        </Suspense>
        {api && (
          <Suspense fallback={null}>
            <LazyCinema
              api={api}
              slug={activeSlug}
              profile={profile}
              horizon={horizon}
              priorities={state.filterSections.score}
              ranks={ranks}
              visited={state.visited}
              quick={quick}
              markVisited={markVisited}
              onBusyChange={setBusy}
              onPanelChange={setPlaceOpen}
            />
          </Suspense>
        )}
      </MapErrorBoundary>
      <MapSkeleton profile={profile} done={!!api} error={failed} panel={!activeSlug} />
      <SentenceBar
        hidden={prefsOpen || ((!!activeSlug || busy) && !placeOpen)}
        profile={profile}
        onProfileChange={onProfileChange}
      />

      <AnimatePresence>
        {prefsOpen && (
          <PreferencesModal
            key="prefs"
            open={prefsOpen}
            onClose={() => {
              if (state.profile && state.horizon) setPrefsOpen(false)
            }}
            onComplete={finishPrefs}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{matching && <MatchingScreen key="matching" onDone={() => setMatching(false)} />}</AnimatePresence>
    </div>
  )
}
