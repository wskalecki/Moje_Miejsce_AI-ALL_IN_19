/**
 * Background warm-up of the basemap tiles under the 3 featured osiedla, so the fly-in lands on a
 * drawn city instead of a grey placeholder. The tiles are fetched into the HTTP cache (OpenFreeMap
 * serves them with a 10-year max-age); MapLibre then reads them back without a network round trip.
 */
import type { Map as MlMap, VectorTileSource } from 'maplibre-gl'

type Pt = [number, number]

/** Radius (m) around each osiedle per tile zoom: the pitched view needs z14 nearby and z12–13 towards the horizon. */
const RINGS: [number, number][] = [
  [14, 1700],
  [13, 3200],
  [12, 6000],
]
const CONCURRENCY = 3

function tileRange(center: Pt, radiusM: number, z: number) {
  const n = 2 ** z
  const kx = 111320 * Math.cos((center[1] * Math.PI) / 180)
  const dLon = radiusM / kx
  const dLat = radiusM / 111320
  const tx = (lon: number) => Math.floor(((lon + 180) / 360) * n)
  const ty = (lat: number) => {
    const r = (lat * Math.PI) / 180
    return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n)
  }
  return { x0: tx(center[0] - dLon), x1: tx(center[0] + dLon), y0: ty(center[1] + dLat), y1: ty(center[1] - dLat) }
}

export function tileUrls(map: MlMap, centers: Pt[]): string[] {
  const src = map.getSource('openmaptiles') as VectorTileSource | undefined
  const template = src?.tiles?.[0]
  if (!template) return []
  const max = src?.maxzoom ?? 14
  const seen = new Set<string>()
  for (const c of centers)
    for (const [z, r] of RINGS) {
      if (z > max) continue
      const { x0, x1, y0, y1 } = tileRange(c, r, z)
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) seen.add(template.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)))
    }
  return [...seen]
}

/**
 * Fetch the tiles once the map is idle; `paused()` holds the queue while the transition runs so the
 * prefetch never competes with the tiles on screen. Returns a cancel function.
 */
export function prefetchTiles(map: MlMap, centers: Pt[], paused: () => boolean): () => void {
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (conn?.saveData) return () => {}
  let cancelled = false
  const ctrl = new AbortController()
  let queue: string[] = []
  const worker = async () => {
    while (!cancelled && queue.length) {
      if (paused()) {
        await new Promise((r) => window.setTimeout(r, 800))
        continue
      }
      const url = queue.shift()!
      try {
        await fetch(url, { signal: ctrl.signal, priority: 'low', mode: 'cors', credentials: 'same-origin' } as RequestInit)
      } catch {
        /* offline or aborted: the map loads the tile itself later */
      }
    }
  }
  const start = () => {
    if (cancelled) return
    queue = tileUrls(map, centers)
    for (let i = 0; i < CONCURRENCY; i++) void worker()
  }
  // first quiet moment after the overview has settled
  let timer = 0
  const onIdle = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(start, 1200)
  }
  map.once('idle', onIdle)
  return () => {
    cancelled = true
    window.clearTimeout(timer)
    map.off('idle', onIdle)
    ctrl.abort()
  }
}
