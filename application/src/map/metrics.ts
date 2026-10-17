/**
 * Concrete per-osiedle numbers for the hover card ("11 przedszkoli · 41 przystanków w 1 km").
 * Source: `osiedla-metrics.json` (data/scripts/build_osiedle_metrics.py) — loaded lazily, after the map.
 * Until it loads (or if it is missing) counts are taken from the POI files around the osiedle.
 */
import { fetchJson } from '../app/mapLoader'
import { COUNT_DEFS, COUNT_RADIUS_M, countNear, plural, type PoiData } from './poi'
import type { CategoryKey, LngLat } from './types'

export const OSIEDLA_METRICS_URL = '/data/osiedla-metrics.json'

interface MetricValue {
  value: number | null
  unit?: string
  source?: string
  method?: string
}

interface MetricsFile {
  meta?: { sources?: Record<string, { name?: string; license?: string }> }
  osiedla?: Record<string, { anchor?: LngLat; metrics?: Record<string, MetricValue> }>
}

export interface OsiedleMetrics {
  anchor: LngLat | null
  values: Record<string, number | null>
  sources: Record<string, string>
}

export type MetricsIndex = Map<string, OsiedleMetrics>

let cache: Promise<MetricsIndex> | null = null

export function loadMetrics(): Promise<MetricsIndex> {
  if (!cache)
    cache = fetchJson<MetricsFile>(OSIEDLA_METRICS_URL)
      .then((f) => {
        const out: MetricsIndex = new Map()
        for (const [id, e] of Object.entries(f?.osiedla ?? {})) {
          const values: Record<string, number | null> = {}
          const sources: Record<string, string> = {}
          for (const [k, v] of Object.entries(e?.metrics ?? {})) {
            values[k] = typeof v?.value === 'number' && Number.isFinite(v.value) ? v.value : null
            if (v?.source) sources[k] = v.source
          }
          out.set(id, { anchor: Array.isArray(e?.anchor) ? (e.anchor as LngLat) : null, values, sources })
        }
        return out
      })
      .catch(() => new Map())
  return cache
}

type Forms = [string, string, string]

interface FactDef {
  metric: string
  /** Count noun forms (1 / 2–4 / 5+) — or a custom formatter. */
  forms?: Forms
  format?: (v: number) => string
}

const n = (v: number) => Math.round(v).toLocaleString('pl-PL')

/** Most telling 1–2 facts per category, from osiedla-metrics.json keys. */
const FACTS: Record<CategoryKey, FactDef[]> = {
  cisza: [{ metric: 'noise_lden60_share', format: (v) => `${n(v)}% pod hałasem > 60 dB` }],
  zielen: [
    { metric: 'green_share', format: (v) => `${n(v)}% powierzchni to zieleń` },
    { metric: 'green_dist_m', format: (v) => `park lub las ${n(v)} m` },
  ],
  komunikacja: [
    { metric: 'stops_1km', forms: ['przystanek', 'przystanki', 'przystanków'] },
    { metric: 'travel_centrum_wszystkie_min', format: (v) => `${n(v)} min do centrum` },
  ],
  gastronomia: [{ metric: 'gastronomy_1km', forms: ['lokal', 'lokale', 'lokali'] }],
  sport: [
    { metric: 'pitches_1km', forms: ['otwarte boisko', 'otwarte boiska', 'otwartych boisk'] },
    { metric: 'playgrounds_1km', forms: ['plac zabaw', 'place zabaw', 'placów zabaw'] },
  ],
  kultura: [
    { metric: 'libraries_1km', forms: ['biblioteka', 'biblioteki', 'bibliotek'] },
    { metric: 'events_30d_1km', forms: ['wydarzenie w 30 dni', 'wydarzenia w 30 dni', 'wydarzeń w 30 dni'] },
  ],
  edukacja: [
    { metric: 'kindergartens_1km', forms: ['przedszkole', 'przedszkola', 'przedszkoli'] },
    { metric: 'schools_1km', forms: ['szkoła podstawowa', 'szkoły podstawowe', 'szkół podstawowych'] },
  ],
  zdrowie: [
    { metric: 'clinics_1km', forms: ['przychodnia', 'przychodnie', 'przychodni'] },
    { metric: 'pharmacies_1km', forms: ['apteka', 'apteki', 'aptek'] },
  ],
  zakupy: [{ metric: 'supermarkets_1km', forms: ['supermarket', 'supermarkety', 'supermarketów'] }],
  zycieNocne: [{ metric: 'bars_pubs_1km', forms: ['bar lub pub', 'bary lub puby', 'barów lub pubów'] }],
}

export interface Fact {
  cat: CategoryKey
  text: string
}

/**
 * Up to `max` facts for the given categories (in order, one per category first, then the second ones).
 * `from: 'metrics'` when the data team's numbers were used, else `'poi'` (counted from the POI files).
 */
export function factsFor(
  cats: readonly CategoryKey[],
  m: OsiedleMetrics | undefined,
  poi: PoiData | null,
  at: LngLat,
  max = 3,
): { facts: Fact[]; from: 'metrics' | 'poi' | null } {
  const facts: Fact[] = []
  if (m) {
    for (let round = 0; round < 2 && facts.length < max; round++)
      for (const c of cats) {
        if (facts.length >= max) break
        const def = FACTS[c][round]
        const v = def ? m.values[def.metric] : null
        if (def && v !== null && v !== undefined) facts.push({ cat: c, text: def.format ? def.format(v) : `${n(v)} ${plural(v, def.forms!)}` })
      }
    if (facts.length) return { facts, from: 'metrics' }
  }
  if (poi) {
    for (const c of cats) {
      if (facts.length >= max) break
      const def = COUNT_DEFS.find((d) => d.cat === c)
      if (!def) continue
      const v = countNear(poi, def, at, COUNT_RADIUS_M)
      facts.push({ cat: c, text: `${n(v)} ${plural(v, def.forms)}` })
    }
    if (facts.length) return { facts, from: 'poi' }
  }
  return { facts, from: null }
}
