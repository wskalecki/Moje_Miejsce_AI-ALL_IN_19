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

const jsonCache = new Map<string, Promise<unknown>>()
/** fetch + JSON, deduplicated: the first caller starts the request, later callers share it. */
export function fetchJson<T>(url: string): Promise<T> {
  let p = jsonCache.get(url)
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`)
      return r.json()
    })
    p.catch(() => jsonCache.delete(url))
    jsonCache.set(url, p)
  }
  return p as Promise<T>
}

/**
 * Cold entry on `/mapa…` (QA #8): start the map chunk and the data files right away, in parallel,
 * instead of waiting for React to render MapView. Deep links also warm the cinematic + panel chunks.
 * (The production index.html adds matching `<link rel=modulepreload|preload>` before any JS runs.)
 */
export function preloadMapNow(dataUrls: readonly string[], deep: boolean): void {
  prefetched = true
  const chunk = loader ? loader().catch(() => undefined) : Promise.resolve(undefined)
  for (const url of dataUrls) void fetchJson(url).catch(() => undefined)
  // the cinematic + panel are needed only after the map's `load` — don't compete with the map chunk
  if (deep)
    void chunk.then(() => {
      void import('../cinematic/CinematicLayer').catch(() => undefined)
      void import('../cinematic/panelLoader').then((m) => m.loadPanel()).catch(() => undefined)
    })
}
