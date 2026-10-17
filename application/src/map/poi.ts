/**
 * Per-category POI files (`public/data/poi/<category>.json`, built by data/scripts/build_poi_layers.py)
 * and what the map derives from them: counts around an osiedle and — until the data team ships
 * `heat-categories.json` — a temporary per-category heat (kernel density of the points).
 */
import type { Feature, FeatureCollection, Point } from 'geojson'
import { fetchJson } from '../app/mapLoader'
import { classifyGastronomyName } from './gastronomyCuisine'
import { CATEGORY_ORDER } from './tokens'
import type { CategoryKey, LngLat } from './types'

export const POI_URL = (c: CategoryKey) => `/data/poi/${c}.json`

interface PoiSource {
  id: string
  label: string
  licence?: string
  url?: string
}

/** File format; a bare `[[lng, lat, name, subtype], …]` array is accepted too. */
interface PoiFile {
  category?: string
  sources?: PoiSource[]
  subtypes?: Record<string, string>
  points: [number, number, string?, string?, number?][]
}

export interface PoiPoint {
  lng: number
  lat: number
  name: string
  subtype: string
  /** Index into `PoiData.sources`. */
  source: number
  /** Heuristic cuisine tag (`gastronomia` only). */
  cuisine?: string
}

export interface PoiData {
  byCat: Record<CategoryKey, PoiPoint[]>
  sources: PoiSource[]
  subtypeLabel: (subtype: string) => string
  /** All points; props: `c` category index, `n` name, `t` subtype label, `s` source label. */
  geojson: FeatureCollection<Point>
}

const FALLBACK_LABELS: Record<string, string> = {
  park: 'Park',
  forest: 'Las',
  stop: 'Przystanek',
  tram_stop: 'Przystanek tramwajowy',
  metro_station: 'Wejście do metra',
  gastronomy: 'Lokal gastronomiczny',
  late_venue: 'Lokal otwarty po 23:00',
  pitch: 'Otwarte boisko',
  playground: 'Plac zabaw',
  library: 'Biblioteka',
  event: 'Wydarzenie',
  utw: 'Uniwersytet Trzeciego Wieku',
  kindergarten: 'Przedszkole',
  school: 'Szkoła podstawowa',
  high_school: 'Szkoła średnia',
  university: 'Uczelnia',
  clinic: 'Przychodnia',
  pharmacy: 'Apteka',
  hospital: 'Szpital',
  optician: 'Okulista',
  cinema: 'Kino',
  theatre: 'Teatr',
  supermarket: 'Supermarket',
  sports_class: 'Zajęcia sportowe',
}

/** Short source names for the UI. */
export function shortSource(label: string): string {
  if (/openstreetmap/i.test(label)) return 'OpenStreetMap'
  if (/wfs/i.test(label)) return 'WFS m.st. Warszawy'
  if (/dane\.um|um\.warszawa/i.test(label)) return 'dane.um.warszawa.pl'
  return label
}

let cache: Promise<PoiData> | null = null

/** Loads all 10 category files (missing ones count as empty). */
export function loadPoi(): Promise<PoiData> {
  if (!cache) cache = load()
  return cache
}

async function load(): Promise<PoiData> {
  const files = await Promise.all(
    CATEGORY_ORDER.map((c) =>
      fetchJson<PoiFile | PoiFile['points']>(POI_URL(c)).catch(() => ({ points: [] }) as PoiFile),
    ),
  )
  const sources: PoiSource[] = []
  const labels: Record<string, string> = { ...FALLBACK_LABELS }
  const byCat = {} as Record<CategoryKey, PoiPoint[]>
  const features: Feature<Point>[] = []

  files.forEach((raw, ci) => {
    const cat = CATEGORY_ORDER[ci]
    const file: PoiFile = Array.isArray(raw) ? { points: raw } : raw && Array.isArray(raw.points) ? raw : { points: [] }
    Object.assign(labels, file.subtypes ?? {})
    // remap the file's source indices onto one shared list
    const remap = (file.sources ?? []).map((s) => {
      let i = sources.findIndex((x) => x.id === s.id)
      if (i < 0) i = sources.push(s) - 1
      return i
    })
    let unknown = -1
    const out: PoiPoint[] = []
    for (const p of file.points) {
      if (!Array.isArray(p) || typeof p[0] !== 'number' || typeof p[1] !== 'number') continue
      let src = typeof p[4] === 'number' ? (remap[p[4]] ?? -1) : -1
      if (src < 0) {
        if (unknown < 0) unknown = sources.push({ id: 'unknown', label: 'nieznane źródło' }) - 1
        src = unknown
      }
      const name = (p[2] ?? '').trim()
      const pt: PoiPoint = {
        lng: p[0],
        lat: p[1],
        name,
        subtype: p[3] ?? '',
        source: src,
        ...(cat === 'gastronomia' ? { cuisine: classifyGastronomyName(name) } : {}),
      }
      out.push(pt)
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pt.lng, pt.lat] },
        properties: {
          c: ci,
          k: pt.subtype,
          ...(pt.cuisine ? { g: pt.cuisine } : {}),
          n: pt.name,
          t: labels[pt.subtype] ?? pt.subtype,
          s: shortSource(sources[src].label),
        },
      })
    }
    byCat[cat] = out
  })

  return {
    byCat,
    sources,
    subtypeLabel: (s) => labels[s] ?? s,
    geojson: { type: 'FeatureCollection', features },
  }
}

// ---------------------------------------------------------------- distances

const M_PER_DEG_LAT = 111_320
const COS_LAT = Math.cos((52.23 * Math.PI) / 180)
const M_PER_DEG_LNG = M_PER_DEG_LAT * COS_LAT

function dist2(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const dx = (aLng - bLng) * M_PER_DEG_LNG
  const dy = (aLat - bLat) * M_PER_DEG_LAT
  return dx * dx + dy * dy
}

/** Simple bucket index (cells ≈ `cellM` metres) for radius queries. */
class Buckets {
  private cells = new Map<string, PoiPoint[]>()
  private dLng: number
  private dLat: number
  constructor(points: readonly PoiPoint[], cellM: number) {
    this.dLng = cellM / M_PER_DEG_LNG
    this.dLat = cellM / M_PER_DEG_LAT
    for (const p of points) {
      const k = `${Math.floor(p.lng / this.dLng)}:${Math.floor(p.lat / this.dLat)}`
      const arr = this.cells.get(k)
      if (arr) arr.push(p)
      else this.cells.set(k, [p])
    }
  }
  /** Points in the 3×3 cells around (lng, lat) — callers filter by distance. */
  *near(lng: number, lat: number): Generator<PoiPoint> {
    const x = Math.floor(lng / this.dLng)
    const y = Math.floor(lat / this.dLat)
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++) {
        const arr = this.cells.get(`${x + i}:${y + j}`)
        if (arr) yield* arr
      }
  }
}

/**
 * Temporary per-category heat (values 0–1) from POI kernel density on the given grid points.
 * Gaussian kernel σ = 450 m, cut at 1.2 km; each category normalised by its 97th percentile.
 * Categories without points (cisza) use `fallback(lng, lat, cat)` (e.g. the osiedle's score / 100).
 */
export function deriveCategoryHeat(
  grid: readonly LngLat[],
  poi: PoiData,
  fallback: (lng: number, lat: number, cat: CategoryKey) => number,
): Float32Array[] {
  const SIGMA = 450
  const CUT2 = 1200 * 1200
  const rows = grid.map(() => new Float32Array(CATEGORY_ORDER.length))
  CATEGORY_ORDER.forEach((cat, ci) => {
    const pts = poi.byCat[cat] ?? []
    if (!pts.length) {
      grid.forEach(([lng, lat], g) => (rows[g][ci] = Math.max(0, Math.min(1, fallback(lng, lat, cat)))))
      return
    }
    const idx = new Buckets(pts, 1200)
    const v = new Float32Array(grid.length)
    grid.forEach(([lng, lat], g) => {
      let s = 0
      for (const p of idx.near(lng, lat)) {
        const d2 = dist2(lng, lat, p.lng, p.lat)
        if (d2 < CUT2) s += Math.exp(-d2 / (2 * SIGMA * SIGMA))
      }
      v[g] = s
    })
    const sorted = Array.from(v).sort((a, b) => a - b)
    const norm = Math.max(1e-6, sorted[Math.round(0.97 * (sorted.length - 1))])
    grid.forEach((_, g) => (rows[g][ci] = Math.min(1, v[g] / norm)))
  })
  return rows
}

// ---------------------------------------------------------------- counts ("12 przedszkoli w 1 km")

export interface CountDef {
  key: string
  cat: CategoryKey
  subtypes: string[]
  /** Polish forms: 1 / 2–4 / 5+. */
  forms: [string, string, string]
}

export const COUNT_DEFS: CountDef[] = [
  { key: 'przedszkola', cat: 'edukacja', subtypes: ['kindergarten'], forms: ['przedszkole', 'przedszkola', 'przedszkoli'] },
  { key: 'szkoly', cat: 'edukacja', subtypes: ['school', 'high_school'], forms: ['szkoła', 'szkoły', 'szkół'] },
  { key: 'przystanki', cat: 'komunikacja', subtypes: ['stop', 'tram_stop'], forms: ['przystanek', 'przystanki', 'przystanków'] },
  { key: 'metro', cat: 'komunikacja', subtypes: ['metro_station'], forms: ['wejście do metra', 'wejścia do metra', 'wejść do metra'] },
  { key: 'zielen', cat: 'zielen', subtypes: ['park', 'forest'], forms: ['park lub las', 'parki i lasy', 'parków i lasów'] },
  { key: 'gastronomia', cat: 'gastronomia', subtypes: ['gastronomy'], forms: ['lokal', 'lokale', 'lokali'] },
  { key: 'boiska', cat: 'sport', subtypes: ['pitch'], forms: ['boisko', 'boiska', 'boisk'] },
  { key: 'place-zabaw', cat: 'sport', subtypes: ['playground'], forms: ['plac zabaw', 'place zabaw', 'placów zabaw'] },
  { key: 'biblioteki', cat: 'kultura', subtypes: ['library'], forms: ['biblioteka', 'biblioteki', 'bibliotek'] },
  { key: 'wydarzenia', cat: 'kultura', subtypes: ['event'], forms: ['wydarzenie', 'wydarzenia', 'wydarzeń'] },
  { key: 'przychodnie', cat: 'zdrowie', subtypes: ['clinic'], forms: ['przychodnia', 'przychodnie', 'przychodni'] },
  { key: 'apteki', cat: 'zdrowie', subtypes: ['pharmacy'], forms: ['apteka', 'apteki', 'aptek'] },
  { key: 'sklepy', cat: 'zakupy', subtypes: ['supermarket'], forms: ['supermarket', 'supermarkety', 'supermarketów'] },
  { key: 'nocne', cat: 'zycieNocne', subtypes: ['late_venue'], forms: ['lokal czynny po 23', 'lokale czynne po 23', 'lokali czynnych po 23'] },
]

export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(Math.round(n))
  if (a === 1) return forms[0]
  const d = a % 10
  const t = a % 100
  if (d >= 2 && d <= 4 && !(t >= 12 && t <= 14)) return forms[1]
  return forms[2]
}

export const COUNT_RADIUS_M = 1000

/** Number of POIs of the given subtypes within `radius` metres of a point. */
export function countNear(poi: PoiData, def: CountDef, at: LngLat, radius = COUNT_RADIUS_M): number {
  const r2 = radius * radius
  const set = new Set(def.subtypes)
  let n = 0
  for (const p of poi.byCat[def.cat] ?? []) if (set.has(p.subtype) && dist2(at[0], at[1], p.lng, p.lat) <= r2) n++
  return n
}
