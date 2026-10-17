/**
 * Loading of the per-area OSM 3D files (public/data/3d/<msiId>/, docs/data/zrodla-danych.md §6–7)
 * and the "coverage" polygon: the part of the map where our own buildings replace the basemap
 * extrusion. The files cover the MSI area + a 600 m buffer, so the coverage is the MSI outline
 * pushed out by slightly less than that, as a star polygon around the osiedle centre — known
 * synchronously (no basemap filter change after the data arrives, which would reload the tiles).
 */
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'
import { hasOsm3d, osm3dUrl, type Osm3dAreaId, type Osm3dLayerFile } from '../lib/osm3d/paths'
import type { BuildingKind, BuildingProps } from '../lib/osm3d/buildingStyle'
import type { RoadProps } from '../lib/osm3d/roadStyle'
import type { TrafficDoc } from '../lib/osm3d/traffic'

type Pt = [number, number]

/** Buffer of the data extract around the MSI area (data/scripts/osm3d). */
const DATA_BUFFER_M = 600
/** Safety margin inside the buffer (buildings straddling the edge, simplification). */
const COVER_MARGIN_M = 90
const SECTORS = 96

export interface Coverage {
  centre: Pt
  /** Star polygon (lng/lat) for the basemap filter `distance(…) > 0`. */
  polygon: Polygon
  /** Polar radius (m) per sector. */
  radii: Float64Array
}

export interface AreaData {
  msiId: string
  buildings: FeatureCollection<Polygon | MultiPolygon, BuildingProps>
  roads: FeatureCollection<Polygon | MultiPolygon, RoadProps>
  green: FeatureCollection<Polygon | MultiPolygon, { kind: string; name?: string }> | null
  traffic: TrafficDoc | null
  /** Buildings per kind (after clipping to the coverage) — the legend lists only present kinds. */
  kindCounts: Partial<Record<BuildingKind, number>>
}

const kxAt = (lat: number) => 111320 * Math.cos((lat * Math.PI) / 180)

function outerRings(shape: Feature<Polygon | MultiPolygon>): Position[][] {
  const g = shape.geometry
  return g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0])
}

/** Coverage of the 3D files for an area: per direction the farthest crossing of the MSI outline + buffer. */
export function coverage(shape: Feature<Polygon | MultiPolygon>, centre: Pt, maxRadiusM: number): Coverage {
  const kx = kxAt(centre[1])
  const ky = 111320
  const segs: [number, number, number, number][] = []
  for (const ring of outerRings(shape))
    for (let i = 1; i < ring.length; i++)
      segs.push([(ring[i - 1][0] - centre[0]) * kx, (ring[i - 1][1] - centre[1]) * ky, (ring[i][0] - centre[0]) * kx, (ring[i][1] - centre[1]) * ky])
  const radii = new Float64Array(SECTORS)
  const ring: Position[] = []
  for (let s = 0; s < SECTORS; s++) {
    const a = (s / SECTORS) * Math.PI * 2
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    let far = 0
    for (const [x1, y1, x2, y2] of segs) {
      // ray (t·d) ∩ segment (p1 + u·(p2 − p1))
      const ex = x2 - x1
      const ey = y2 - y1
      const den = dx * ey - dy * ex
      if (Math.abs(den) < 1e-9) continue
      const t = (x1 * ey - y1 * ex) / den
      const u = (x1 * dy - y1 * dx) / den
      if (t > 0 && u >= 0 && u <= 1) far = Math.max(far, t)
    }
    const r = Math.min(maxRadiusM, far + DATA_BUFFER_M - COVER_MARGIN_M)
    radii[s] = r
    ring.push([centre[0] + (dx * r) / kx, centre[1] + (dy * r) / ky])
  }
  ring.push(ring[0])
  return { centre, polygon: { type: 'Polygon', coordinates: [ring] }, radii }
}

/** Polar point-in-coverage test (linear between sector radii). */
export function inCoverage(cov: Coverage, p: Position): boolean {
  const kx = kxAt(cov.centre[1])
  const x = (p[0] - cov.centre[0]) * kx
  const y = (p[1] - cov.centre[1]) * 111320
  const a = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)
  const f = (a / (Math.PI * 2)) * SECTORS
  const i = Math.floor(f) % SECTORS
  const r = cov.radii[i] + (cov.radii[(i + 1) % SECTORS] - cov.radii[i]) * (f - Math.floor(f))
  return Math.hypot(x, y) < r
}

/** A building is ours if any of its outline vertices lies in the coverage (the basemap hides any building touching it). */
function touches(cov: Coverage, g: Polygon | MultiPolygon): boolean {
  const rings = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0])
  return rings.some((ring) => ring.some((p) => inCoverage(cov, p)))
}

async function getJson<T>(msiId: string, file: Osm3dLayerFile): Promise<T | null> {
  try {
    const res = await fetch(osm3dUrl(msiId as Osm3dAreaId, file))
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

const cache = new Map<string, Promise<AreaData | null>>()

/** True when the area is expected to have 3D files (list in lib/osm3d/paths.ts). */
export const areaHas3d = (msiId: string | undefined): msiId is string => !!msiId && hasOsm3d(msiId)

/**
 * Load (once) the 3D files of an area, clipped to `cov`. Resolves `null` when the area has no
 * buildings file (graceful fallback: the basemap extrusion stays).
 */
export function loadArea(msiId: string, cov: Coverage): Promise<AreaData | null> {
  const hit = cache.get(msiId)
  if (hit) return hit
  const p = (async (): Promise<AreaData | null> => {
    const [buildings, roads, green, traffic] = await Promise.all([
      getJson<AreaData['buildings']>(msiId, 'buildings.geojson'),
      getJson<AreaData['roads']>(msiId, 'roads.geojson'),
      getJson<NonNullable<AreaData['green']>>(msiId, 'green.geojson'),
      getJson<TrafficDoc>(msiId, 'traffic.json'),
    ])
    if (!buildings?.features?.length) return null
    const kept = buildings.features.filter((f) => f.geometry && touches(cov, f.geometry))
    const kindCounts: AreaData['kindCounts'] = {}
    for (const f of kept) kindCounts[f.properties.kind] = (kindCounts[f.properties.kind] ?? 0) + 1
    return {
      msiId,
      buildings: { type: 'FeatureCollection', features: kept },
      roads: roads ?? { type: 'FeatureCollection', features: [] },
      green: green?.features?.length ? green : null,
      traffic: traffic?.ways ? traffic : null,
      kindCounts,
    }
  })()
  // a failed load may be retried on the next visit
  p.then((d) => {
    if (!d) cache.delete(msiId)
  })
  cache.set(msiId, p)
  return p
}
