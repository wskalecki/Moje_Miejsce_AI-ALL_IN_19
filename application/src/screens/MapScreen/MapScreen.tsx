import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { PROFILES } from '../../app/dictionary'
import { navigate, useRouter } from '../../app/router'
import { useAppStore } from '../../app/useAppStore'
import type { MapApi } from '../../map/MapView'
import { MapSkeleton } from './MapSkeleton'
import { SentenceBar } from './SentenceBar'
import './mapScreen.css'

const LazyMapView = lazy(() => import('../../map/MapView'))
const LazyCinema = lazy(() => import('../../cinematic/CinematicLayer'))

/** The only slugs `/mapa/:slug` can open (spec §0.4). */
const FEATURED_SLUGS: readonly string[] = Object.values(PROFILES).map((p) => p.featured)

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

/**
 * `/mapa` and `/mapa/:slug`. Hosts the single, long-lived MapView instance, the sentence bar and
 * the cinematic transition (src/cinematic) that takes the camera into a featured osiedle and opens its panel.
 */
export function MapScreen({ slug, hidden = false }: { slug: string | null; hidden?: boolean }) {
  const { state, markVisited, setProfile } = useAppStore()
  const { query } = useRouter()
  const profile = state.profile ?? 'rodzina'
  const horizon = state.horizon ?? 'stale'
  const [api, setApi] = useState<MapApi | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const quick = query.get('szybko') === '1'

  // Unknown osiedle (`/mapa/nieistnieje`) → the city view, without a history entry (QA #17).
  const badSlug = !!slug && !FEATURED_SLUGS.includes(slug)
  useEffect(() => {
    if (badSlug) navigate('/mapa', { replace: true })
  }, [badSlug])
  const activeSlug = badSlug ? null : slug

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
            horizon={horizon}
            selectedSlug={activeSlug}
            chrome={!busy}
            onSelectFeatured={(s) => navigate(`/mapa/${s}${quick ? '?szybko=1' : ''}`)}
            onMapReady={(_m, a) => setApi(a)}
          />
        </Suspense>
        {api && (
          <Suspense fallback={null}>
            <LazyCinema
              api={api}
              slug={activeSlug}
              profile={profile}
              horizon={horizon}
              priorities={state.priorities}
              visited={state.visited}
              quick={quick}
              markVisited={markVisited}
              onBusyChange={setBusy}
            />
          </Suspense>
        )}
      </MapErrorBoundary>
      <MapSkeleton profile={profile} done={!!api} error={failed} panel={!activeSlug} />
      <SentenceBar
        profile={profile}
        priorities={state.priorities}
        horizon={horizon}
        onProfileChange={(p) => setProfile(p, { keepChoices: true })}
        hidden={!!activeSlug || busy}
      />
    </div>
  )
}
