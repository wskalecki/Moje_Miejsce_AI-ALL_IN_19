import type { Feature, FeatureCollection, Point, Polygon, MultiPolygon } from 'geojson'
import { buildFeatured } from './featured'
import { DATA_URLS } from '../app/config'
import { fetchJson } from '../app/mapLoader'
import { CATEGORY_ORDER } from './tokens'
import { deriveCategoryHeat, loadPoi, type PoiData } from './poi'
import type { CategoryKey, FeaturedInfo, LngLat, OsiedleInfo, Profile } from './types'
import { catProp } from './weighting'

/** Per-category heat from the data team (values 0–1, columns in `categories` order). */
export const HEAT_CATEGORIES_URL = '/data/heat-categories.json'

interface HeatCategoriesFile {
  categories: string[]
  points: number[][]
  spacing_m?: number
}

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
  /** Heat grid; props `c0…c9` = per-category values 0–1 in CATEGORY_ORDER. */
  heat: FeatureCollection<Point>
  /** Same values as plain rows (for the normalisers). */
  heatRows: ArrayLike<number>[]
  /** `data` = heat-categories.json, `poi` = temporary kernel density of the POI files. */
  heatSource: 'data' | 'poi'
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

/** `fetchJson`, but a missing / non-JSON file (Vite answers unknown paths with index.html) resolves to null. */
function optionalJson<T>(url: string): Promise<T | null> {
  return fetchJson<T>(url).catch(() => null)
}

function catIndex(keys: readonly string[]): number[] {
  return CATEGORY_ORDER.map((c) => keys.findIndex((k) => k === c || (c === 'zycieNocne' && k === 'zycie_nocne')))
}

function validHeatCategories(f: HeatCategoriesFile | null): f is HeatCategoriesFile {
  if (!f || !Array.isArray(f.categories) || !Array.isArray(f.points) || !f.points.length) return false
  return catIndex(f.categories).filter((i) => i >= 0).length >= CATEGORY_ORDER.length / 2
}

function bboxOf(geom: Polygon | MultiPolygon): [number, number, number, number] {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const poly of rings(geom))
    for (const [x, y] of poly[0]) {
      if (x < x0) x0 = x
      if (y < y0) y0 = y
      if (x > x1) x1 = x
      if (y > y1) y1 = y
    }
  return [x0, y0, x1, y1]
}

async function load(): Promise<MapData> {
  const [heatCats, scores, osiedla] = await Promise.all([
    optionalJson<HeatCategoriesFile>(HEAT_CATEGORIES_URL),
    fetchJson<Record<string, ScoreEntry>>(DATA_URLS.osiedlaScores),
    fetchJson<FeatureCollection<Polygon | MultiPolygon>>(DATA_URLS.osiedlaGeojson),
  ])

  const props = (f: Feature<Polygon | MultiPolygon>) => (f.properties ?? {}) as { id: string; name: string; district: string }
  const byId = new Map(osiedla.features.map((f) => [props(f).id, f]))
  const featured = buildFeatured((msiId) => {
    const f = byId.get(msiId)
    return f ? { name: props(f).name, district: props(f).district, center: labelPoint(f.geometry) } : undefined
  })
  const featuredByMsi = new Map(featured.map((f) => [f.msiId, f]))

  const info = new Map<string, OsiedleInfo>()
  const labels: Feature<Point>[] = []
  const featuredShapes: Feature<Polygon | MultiPolygon>[] = []
  const shapes: { bbox: [number, number, number, number]; geom: Ring[][]; cats: Record<CategoryKey, number> }[] = []

  for (const f of osiedla.features) {
    const p = props(f)
    const s = scores[p.id]
    const fi = featuredByMsi.get(p.id)
    const lp = fi ? fi.center : labelPoint(f.geometry)
    const cats = normCats(s?.cats)
    const entry: OsiedleInfo = {
      id: p.id,
      name: fi?.name ?? p.name,
      district: fi?.district ?? p.district,
      cats,
      blurb: s?.blurb ?? { student: '', rodzina: '', senior: '' },
      featuredSlug: fi?.slug ?? null,
      labelPoint: lp,
    }
    info.set(p.id, entry)
    shapes.push({ bbox: bboxOf(f.geometry), geom: rings(f.geometry), cats })
    const catProps: Record<string, number> = {}
    CATEGORY_ORDER.forEach((c, i) => (catProps[catProp(i)] = cats[c]))
    f.properties = {
      id: p.id,
      name: entry.name,
      district: entry.district,
      ...catProps,
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

  // ---- per-category heat: the data team's file, else a temporary density of the POI files ----
  let grid: LngLat[]
  let rows: ArrayLike<number>[]
  let heatSource: MapData['heatSource']
  let spacing = 250
  if (validHeatCategories(heatCats)) {
    const idx = catIndex(heatCats.categories)
    grid = heatCats.points.map((pt) => [pt[0], pt[1]] as LngLat)
    rows = heatCats.points.map((pt) => Float32Array.from(idx, (i) => (i >= 0 ? Math.max(0, Math.min(1, Number(pt[2 + i]) || 0)) : 0)))
    heatSource = 'data'
    spacing = heatCats.spacing_m ?? spacing
  } else {
    const [heatFile, poi] = await Promise.all([fetchJson<HeatFile>(DATA_URLS.heat), loadPoi().catch(() => null)])
    grid = heatFile.points.map((pt) => [pt[0], pt[1]] as LngLat)
    spacing = heatFile.spacing_m ?? spacing
    // categories without points use the score of the osiedle the grid point falls in
    const scoreAt = (lng: number, lat: number, cat: CategoryKey) => {
      for (const sh of shapes) {
        const [x0, y0, x1, y1] = sh.bbox
        if (lng < x0 || lng > x1 || lat < y0 || lat > y1) continue
        if (sh.geom.some((poly) => inPoly(lng, lat, poly))) return sh.cats[cat] / 100
      }
      return 0
    }
    const empty: PoiData = { byCat: {} as PoiData['byCat'], sources: [], subtypeLabel: (x) => x, geojson: { type: 'FeatureCollection', features: [] } }
    rows = deriveCategoryHeat(grid, poi ?? empty, scoreAt)
    heatSource = 'poi'
  }
  const heat: FeatureCollection<Point> = {
    type: 'FeatureCollection',
    features: grid.map((coords, g) => {
      const props: Record<string, number> = {}
      for (let i = 0; i < CATEGORY_ORDER.length; i++) props[catProp(i)] = Math.round(rows[g][i] * 1000) / 1000
      return { type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: props }
    }),
  }

  return {
    heat,
    heatRows: rows,
    heatSource,
    heatSpacingM: spacing,
    osiedla,
    labels: { type: 'FeatureCollection', features: labels },
    featuredShapes: { type: 'FeatureCollection', features: featuredShapes },
    info,
    featured,
  }
}
