/**
 * Heuristic cuisine tags from venue names (until POI pipeline ships OSM `cuisine=*`).
 * Used for map filters and personal gastronomia scoring per osiedle.
 */
import type { PoiData, PoiPoint } from './poi'
import type { LngLat } from './types'

export type GastronomyCuisine =
  | 'polish'
  | 'italian'
  | 'asian'
  | 'indian'
  | 'middle_eastern'
  | 'fastfood'
  | 'cafe'
  | 'other'

export interface GastronomyCuisineDef {
  id: GastronomyCuisine
  label: string
}

export const GASTRONOMY_CUISINES: readonly GastronomyCuisineDef[] = [
  { id: 'polish', label: 'Polska i regionalna' },
  { id: 'italian', label: 'Włoska i pizza' },
  { id: 'asian', label: 'Azjatycka (bez indyjskiej)' },
  { id: 'indian', label: 'Indyjska' },
  { id: 'middle_eastern', label: 'Bliskowschodnia i kebab' },
  { id: 'fastfood', label: 'Fast food i sieciówki' },
  { id: 'cafe', label: 'Kawiarnie' },
  { id: 'other', label: 'Inne / nie sklasyfikowane' },
]

export const ALL_GASTRONOMY_CUISINES: readonly GastronomyCuisine[] = GASTRONOMY_CUISINES.map((c) => c.id)

const RULES: { id: GastronomyCuisine; re: RegExp }[] = [
  { id: 'indian', re: /\b(indian|indyjsk|tandoor|masala|curry|biryani|samosa|punjab)\b/i },
  {
    id: 'asian',
    re: /\b(sushi|ramen|japan|korea|chinese|china town|wietnam|vietnam|thai|pho|horapa|indochina|ha long|so-an|binh minh|anh anh)\b/i,
  },
  { id: 'italian', re: /\b(pizza|pizzeria|trattoria|italiano|rimini|fabbrica|la fabbrica)\b/i },
  { id: 'middle_eastern', re: /\b(kebab|turk|liban|hummus|falafel|sultan|meze|shawarma|leban)\b/i },
  {
    id: 'fastfood',
    re: /\b(mcdonald|kfc|burger king|subway|pizza hut|domino|telepizza|da grasso|sphinx|north fish|kfc)\b/i,
  },
  { id: 'cafe', re: /\b(starbucks|costa|caff[eè]|coffee|kawiarn|green caff|nero|corner cafe|park cafe)\b/i },
  {
    id: 'polish',
    re: /\b(u szwejka|polonia|pierog|milk bar|bar mleczn|zapiecek|chłopsk|staropolsk|domowy)\b/i,
  },
]

/** Property `g` on gastronomia POI features. */
export function classifyGastronomyName(name: string): GastronomyCuisine {
  const n = name.trim()
  if (!n) return 'other'
  for (const { id, re } of RULES) if (re.test(n)) return id
  return 'other'
}

export function isGastronomyCuisine(v: unknown): v is GastronomyCuisine {
  return typeof v === 'string' && (ALL_GASTRONOMY_CUISINES as readonly string[]).includes(v)
}

export function sanitizeGastronomyCuisines(raw: unknown): GastronomyCuisine[] {
  if (!Array.isArray(raw)) return []
  const out: GastronomyCuisine[] = []
  for (const x of raw) if (isGastronomyCuisine(x) && !out.includes(x)) out.push(x)
  return out
}

const M_PER_DEG_LAT = 111_320
const COS_LAT = Math.cos((52.23 * Math.PI) / 180)

function dist2M(a: LngLat, p: PoiPoint): number {
  const dx = (a[0] - p.lng) * M_PER_DEG_LAT * COS_LAT
  const dy = (a[1] - p.lat) * M_PER_DEG_LAT
  return dx * dx + dy * dy
}

/** Count gastronomy POIs in radius whose cuisine is in `allowed`. */
export function countGastronomyNear(
  poi: PoiData,
  at: LngLat,
  allowed: ReadonlySet<GastronomyCuisine>,
  radiusM = 1000,
): number {
  const r2 = radiusM * radiusM
  let n = 0
  for (const p of poi.byCat.gastronomia ?? []) {
    const tag = (p.cuisine && isGastronomyCuisine(p.cuisine) ? p.cuisine : classifyGastronomyName(p.name)) as GastronomyCuisine
    if (!allowed.has(tag)) continue
    if (dist2M(at, p) <= r2) n++
  }
  return n
}

let maxGastroNear = 0

/** Call once after POI load to normalise personal gastronomia scores. */
export function resetGastronomyNorm(poi: PoiData, anchors: readonly LngLat[]): void {
  const all = new Set(ALL_GASTRONOMY_CUISINES)
  let max = 0
  for (const at of anchors) max = Math.max(max, countGastronomyNear(poi, at, all))
  maxGastroNear = Math.max(1, max)
}

/** 0–100 personal gastronomia from allowed cuisines near the point (fallback 50 if no POI). */
export function personalGastronomyScore(
  poi: PoiData | null,
  at: LngLat,
  allowed: ReadonlySet<GastronomyCuisine>,
  fallback: number,
): number {
  if (!poi || !allowed.size) return 0
  const n = countGastronomyNear(poi, at, allowed)
  if (n === 0 && allowed.size < ALL_GASTRONOMY_CUISINES.length) {
    return Math.max(0, Math.round(fallback * 0.35))
  }
  if (maxGastroNear <= 0) return fallback
  return Math.round(Math.min(100, (n / maxGastroNear) * 100))
}
