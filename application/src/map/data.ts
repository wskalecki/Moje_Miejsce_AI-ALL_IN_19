import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson'
import { buildFeatured } from './featured'
import { DATA_URLS } from '../app/config'
import { CATEGORY_ORDER } from './tokens'
import type { CategoryKey, FeaturedInfo, LngLat, OsiedleInfo, Profile } from './types'
import { PROFILES } from './types'

interface HeatFile {
  bbox: [number, number, number, number]
  spacing_m: number
  profiles: Profile[]
  points: [number, number, ...number[]][]
}

type ScoreEntry = Record<Profile, number> & {
  cats: Record<string, number>
  blurb: Record<Profile, string>
}

export interface MapData {
  heat: FeatureCollection<Point>
  heatSpacingM: number
  osiedla: FeatureCollection<Polygon | MultiPolygon>
  labels: FeatureCollection<Point>
  featuredShapes: FeatureCollection<Polygon | MultiPolygon>
  info: Map<string, OsiedleInfo>
  featured: FeaturedInfo[]
}

function normCats(raw: Record<string, number> | undefined): Record<CategoryKey, number> {
  const out = {} as Record<CategoryKey, number>
  for (const k of CATEGORY_ORDER) {
    const v = raw?.[k] ?? (k === 'zycieNocne' ? raw?.['zycie_nocne'] : undefined)
    out[k] = typeof v === 'number' ? v : 50
  }
  return out
}

// ---------- geometry helpers (label points) ----------

type Ring = number[][]

function rings(geom: Polygon | MultiPolygon): Ring[][] {
  return geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
}

function inRing(x: number, y: number, ring: Ring): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPoly(x: number, y: number, poly: Ring[]): boolean {
  if (!inRing(x, y, poly[0])) return false
  for (let h = 1; h < poly.length; h++) if (inRing(x, y, poly[h])) return false
  return true
}

function segDist2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const len = dx * dx + dy * dy
  let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0
  t = Math.max(0, Math.min(1, t))
  const qx = ax + t * dx - px
  const qy = ay + t * dy - py
  return qx * qx + qy * qy
}

/** Cheap "pole of inaccessibility": coarse grid search, then one refinement pass. */
function labelPoint(geom: Polygon | MultiPolygon): LngLat {
  const polys = rings(geom)
  // pick the largest polygon by bbox area
  let best = polys[0]
  let bestArea = -1
  for (const p of polys) {
    const xs = p[0].map((c) => c[0])
    const ys = p[0].map((c) => c[1])
    const a = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
    if (a > bestArea) {
      bestArea = a
      best = p
    }
  }
  const xs = best[0].map((c) => c[0])
  const ys = best[0].map((c) => c[1])
  let minX = Math.min(...xs)
  let maxX = Math.max(...xs)
  let minY = Math.min(...ys)
  let maxY = Math.max(...ys)
  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180) // lng scale
  const score = (x: number, y: number) => {
    if (!inPoly(x, y, best)) return -1
    let d = Infinity
    for (const ring of best)
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
        d = Math.min(d, segDist2(x * k, y, ring[j][0] * k, ring[j][1], ring[i][0] * k, ring[i][1]))
    return d
  }
  let bx = (minX + maxX) / 2
  let by = (minY + maxY) / 2
  let bs = score(bx, by)
  for (let pass = 0; pass < 2; pass++) {
    const N = 12
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const x = minX + ((maxX - minX) * i) / N
        const y = minY + ((maxY - minY) * j) / N
        const s = score(x, y)
        if (s > bs) {
          bs = s
          bx = x
          by = y
        }
      }
    const w = (maxX - minX) / 6
    const h = (maxY - minY) / 6
    minX = bx - w
    maxX = bx + w
    minY = by - h
    maxY = by + h
  }
  return [Math.round(bx * 1e5) / 1e5, Math.round(by * 1e5) / 1e5]
}

// ---------- loader ----------

let cache: Promise<MapData> | null = null

export function loadMapData(): Promise<MapData> {
  if (!cache) cache = load()
  return cache
}

async function load(): Promise<MapData> {
  const [heatFile, scores, osiedla] = await Promise.all([
    fetch(DATA_URLS.heat).then((r) => r.json() as Promise<HeatFile>),
    fetch(DATA_URLS.osiedlaScores).then((r) => r.json() as Promise<Record<string, ScoreEntry>>),
    fetch(DATA_URLS.osiedlaGeojson).then((r) => r.json() as Promise<FeatureCollection<Polygon | MultiPolygon>>),
  ])

  // Heat points → GeoJSON with short props s / r / n (0–1).
  const idx = PROFILES.map((p) => heatFile.profiles.indexOf(p))
  const heat: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: heatFile.points.map((pt) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pt[0], pt[1]] },
      properties: {
        s: (pt[2 + idx[0]] as number) ?? 0,
        r: (pt[2 + idx[1]] as number) ?? 0,
        n: (pt[2 + idx[2]] as number) ?? 0,
      },
    })),
  }

  const scoreMatch = (id: string) => {
    const s = scores[id]
    return s ? { student: s.student, rodzina: s.rodzina, senior: s.senior } : undefined
  }
  const featured = buildFeatured(scoreMatch)
  const featuredByMsi = new Map(featured.map((f) => [f.msiId, f]))

  // Spec 6.3: non-featured match ≤ (featured #1 for P).match[P] − 5, so #1 is always the top.
  const cap: Record<Profile, number> = { student: 99, rodzina: 99, senior: 99 }
  for (const f of featured) cap[f.profile] = f.match[f.profile] - 5

  const info = new Map<string, OsiedleInfo>()
  const labels: Feature<Point>[] = []
  const featuredShapes: Feature<Polygon | MultiPolygon>[] = []

  for (const f of osiedla.features) {
    const p = (f.properties ?? {}) as { id: string; name: string; district: string }
    const s = scores[p.id]
    const fi = featuredByMsi.get(p.id)
    const match = {} as Record<Profile, number>
    for (const pr of PROFILES) {
      const raw = fi ? fi.match[pr] : (s?.[pr] ?? 50)
      match[pr] = fi ? raw : Math.min(raw, cap[pr])
    }
    const lp = fi ? fi.center : labelPoint(f.geometry)
    const entry: OsiedleInfo = {
      id: p.id,
      name: fi?.name ?? p.name,
      district: fi?.district ?? p.district,
      match,
      cats: normCats(s?.cats),
      blurb: s?.blurb ?? { student: '', rodzina: '', senior: '' },
      featuredSlug: fi?.slug ?? null,
      labelPoint: lp,
    }
    info.set(p.id, entry)
    f.properties = {
      id: p.id,
      name: entry.name,
      district: entry.district,
      m_student: match.student,
      m_rodzina: match.rodzina,
      m_senior: match.senior,
      featured: fi ? 1 : 0,
      ...(fi ? { featured_slug: fi.slug, owner: fi.profile } : {}),
    }
    if (fi) featuredShapes.push({ type: 'Feature', geometry: f.geometry, properties: { ...f.properties } })
    else
      labels.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: lp },
        properties: { id: p.id, name: entry.name },
      })
  }

  return {
    heat,
    heatSpacingM: heatFile.spacing_m ?? 250,
    osiedla,
    labels: { type: 'FeatureCollection', features: labels },
    featuredShapes: { type: 'FeatureCollection', features: featuredShapes },
    info,
    featured,
  }
}
