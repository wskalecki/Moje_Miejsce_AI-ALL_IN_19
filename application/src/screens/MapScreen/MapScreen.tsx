import { Component, lazy, Suspense, useState, type ReactNode } from 'react'
import { navigate, useRouter } from '../../app/router'
import { useAppStore } from '../../app/useAppStore'
import { Logo } from '../../components/ui'
import type { MapApi } from '../../map/MapView'
import { SentenceBar } from './SentenceBar'
import './mapScreen.css'

const LazyMapView = lazy(() => import('../../map/MapView'))
const LazyCinema = lazy(() => import('../../cinematic/CinematicLayer'))

class MapErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) return <MapPlaceholder message="Nie udało się wczytać mapy. Odśwież stronę." />
    return this.props.children
  }
}

function MapPlaceholder({ message, loading = false }: { message: string; loading?: boolean }) {
  return (
    <div className="map-placeholder" data-loading={loading || undefined}>
      <Logo />
      <p className="t-small t-secondary">{message}</p>
    </div>
  )
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
  const quick = query.get('szybko') === '1'

  return (
    <div
      className="map-screen"
      data-cinema={slug || busy ? '' : undefined}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      <MapErrorBoundary>
        <Suspense fallback={<MapPlaceholder message="Wczytujemy mapę Warszawy…" loading />}>
          <LazyMapView
            profile={profile}
            priorities={state.priorities}
            horizon={horizon}
            selectedSlug={slug}
            chrome={!busy}
            onSelectFeatured={(s) => navigate(`/mapa/${s}${quick ? '?szybko=1' : ''}`)}
            onMapReady={(_m, a) => setApi(a)}
          />
        </Suspense>
        {api && (
          <Suspense fallback={null}>
            <LazyCinema
              api={api}
              slug={slug}
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
      <SentenceBar
        profile={profile}
        priorities={state.priorities}
        horizon={horizon}
        onProfileChange={(p) => setProfile(p, { keepChoices: true })}
        hidden={!!slug || busy}
      />
    </div>
  )
}
