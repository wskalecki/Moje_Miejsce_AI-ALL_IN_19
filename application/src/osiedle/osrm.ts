/**
 * Walking / cycling route from any point, on the same public OSRM server (FOSSGIS,
 * routing.openstreetmap.de, © OpenStreetMap, ODbL) and with the same rounding as the precomputed
 * osiedle routes (data/scripts/build_featured_content.py: `minutes = max(1, round(s / 60))`).
 * No key, no backend. Transit and car times are not computed here: transit needs the GTFS
 * routing done offline, and free-flow car times would ignore Warsaw traffic.
 */
import type { LineString } from 'geojson'
import type { LngLat, Route } from '../mock/osiedla'

const OSRM = 'https://routing.openstreetmap.de/routed-{profile}/route/v1/driving/{a};{b}?overview=full&geometries=geojson'

interface OsrmLeg {
  distance: number
  duration: number
  geometry: LineString
}

const pt = (p: LngLat) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`

/** Same rounding as the ETL. */
export const osrmMinutes = (sec: number) => Math.max(1, Math.round(sec / 60))

async function leg(profile: 'foot' | 'bike', a: LngLat, b: LngLat, signal?: AbortSignal): Promise<OsrmLeg> {
  const url = OSRM.replace('{profile}', profile).replace('{a}', pt(a)).replace('{b}', pt(b))
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = (await res.json()) as { code?: string; routes?: OsrmLeg[] }
  const r = data.routes?.[0]
  if (data.code !== 'Ok' || !r) throw new Error(`OSRM ${data.code ?? 'error'}`)
  return r
}

/** `dest` re-routed from `start`: walking geometry, walking + cycling minutes (no transit / car). */
export async function routeFrom(start: LngLat, dest: Route, signal?: AbortSignal): Promise<Route> {
  const c = dest.geometry.coordinates
  const target = c[c.length - 1] as LngLat
  const [foot, bike] = await Promise.all([leg('foot', start, target, signal), leg('bike', start, target, signal)])
  return {
    ...dest,
    id: `${dest.id}@start`,
    geometry: foot.geometry,
    distanceM: Math.round(foot.distance),
    minutes: { pieszo: osrmMinutes(foot.duration), rower: osrmMinutes(bike.duration) },
    bikeDistanceM: Math.round(bike.distance),
    source: 'OSRM FOSSGIS (foot, bike), z wybranego punktu',
  }
}
