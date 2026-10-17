import { Component, lazy, Suspense, type ReactNode } from 'react'
import { hasMapView, loadMapView } from '../../app/mapLoader'
import { navigate } from '../../app/router'
import { useAppStore } from '../../app/useAppStore'
import { Logo } from '../../components/ui'
import './mapScreen.css'

const LazyMapView = hasMapView ? lazy(loadMapView) : null

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
 * `/mapa` and `/mapa/:slug`. Hosts the single, long-lived MapView instance
 * (src/map/MapView.tsx, built separately). Falls back to a placeholder when
 * the map module is not there yet.
 */
export function MapScreen({ slug, hidden = false }: { slug: string | null; hidden?: boolean }) {
  const { state } = useAppStore()
  const profile = state.profile ?? 'rodzina'
  const horizon = state.horizon ?? 'stale'

  return (
    <div className="map-screen" aria-hidden={hidden || undefined} inert={hidden || undefined}>
      {LazyMapView ? (
        <MapErrorBoundary>
          <Suspense fallback={<MapPlaceholder message="Wczytujemy mapę Warszawy…" loading />}>
            <LazyMapView
              profile={profile}
              priorities={state.priorities}
              horizon={horizon}
              selectedSlug={slug}
              onSelectFeatured={(s) => navigate(`/mapa/${s}`)}
            />
          </Suspense>
        </MapErrorBoundary>
      ) : (
        <MapPlaceholder message={slug ? `Mapa w przygotowaniu · ${slug}` : 'Mapa w przygotowaniu'} />
      )}
    </div>
  )
}
