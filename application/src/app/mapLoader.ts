/**
 * Optional loader for `src/map/MapView.tsx` (built by the map agent).
 * `import.meta.glob` resolves to an empty object when the file does not exist,
 * so the shell builds with or without the map module.
 */
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { ComponentType } from 'react'
import type { MapViewProps } from './types'

type MapViewModule = {
  default?: ComponentType<MapViewProps>
  MapView?: ComponentType<MapViewProps>
}

const modules = import.meta.glob<MapViewModule>('../map/MapView.tsx')
const loader = modules['../map/MapView.tsx'] as (() => Promise<MapViewModule>) | undefined

export const hasMapView = Boolean(loader)

export async function loadMapView(): Promise<{ default: ComponentType<MapViewProps> }> {
  if (!loader) throw new Error('src/map/MapView.tsx is not available')
  const mod = await loader()
  const Component = mod.default ?? mod.MapView
  if (!Component) throw new Error('src/map/MapView.tsx must export MapView (named or default)')
  return { default: Component }
}

let prefetched = false
/**
 * Warm the map chunk (MapView + maplibre-gl, kept out of the initial bundle), the maplibre
 * worker and the data files. Called from the intro and the survey; runs once, on idle.
 */
export function prefetchMap(dataUrls: readonly string[] = []): void {
  if (prefetched) return
  prefetched = true
  const run = () => {
    if (loader) void loader().catch(() => undefined)
    for (const href of [maplibreWorker, ...dataUrls]) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'fetch'
      link.href = href
      document.head.appendChild(link)
    }
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1500 })
  else setTimeout(run, 400)
}
