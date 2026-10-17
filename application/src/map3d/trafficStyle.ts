/**
 * Display scale for the schedule-based congestion (traffic.json, lib/osm3d/traffic.ts).
 *
 * The values are "1 − scheduled speed / the way's fastest hour"; in the ZTM timetable they stay
 * within 0–0.5 (peak-hour medians ≈ 0.1–0.17, top ways ≈ 0.4). On the generic 0–1 ramp of
 * roadStyle.CONGESTION_STOPS everything would read green, so the map stretches the same colours
 * over 0–40 % slower — the legend says so in words.
 */
import type { ExpressionSpecification } from 'maplibre-gl'
import { CONGESTION_LEGEND, ROAD_ASPHALT_COLOR_EXPR } from '../lib/osm3d/roadStyle'
import type { TrafficDoc } from '../lib/osm3d/traffic'

export const TRAFFIC_CAPTION = 'Planowane spowolnienie komunikacji wg rozkładu ZTM (GTFS) — nie ruch na żywo'

export const TRAFFIC_STOPS: ReadonlyArray<readonly [value: number, color: string]> = [
  [0, '#3f9e6a'],
  [0.1, '#9cc65a'],
  [0.2, '#e8c547'],
  [0.3, '#e58a3a'],
  [0.4, '#c8413a'],
]

/** Legend: the ramp (gradient bar) and the "no data" asphalt swatch; labels from roadStyle.CONGESTION_LEGEND. */
export const TRAFFIC_LEGEND = {
  ramp: `linear-gradient(90deg, ${TRAFFIC_STOPS.map(([v, c]) => `${c} ${(v / 0.4) * 100}%`).join(', ')})`,
  labels: [CONGESTION_LEGEND[0].label, CONGESTION_LEGEND[1].label, CONGESTION_LEGEND[2].label] as const,
  noData: CONGESTION_LEGEND[3],
}

const CG: ExpressionSpecification = ['coalesce', ['feature-state', 'cg'], -1]

/** Road surface colour from the `cg` feature-state (set per way); ways without data stay asphalt. */
export const TRAFFIC_SURFACE_COLOR: ExpressionSpecification = [
  'case',
  ['>=', CG, 0],
  ['interpolate', ['linear'], CG, ...TRAFFIC_STOPS.flat()],
  ROAD_ASPHALT_COLOR_EXPR,
] as ExpressionSpecification

/** Congestion of every way at a (fractional) hour — linear between the hourly values, wraps 23 → 0. */
export function trafficAtHour(doc: TrafficDoc, hour: number): Map<number, number | null> {
  const h = ((hour % 24) + 24) % 24
  const h0 = Math.floor(h)
  const h1 = (h0 + 1) % 24
  const k = h - h0
  const out = new Map<number, number | null>()
  for (const [id, v] of Object.entries(doc.ways)) {
    const a = v[h0] ?? null
    const b = v[h1] ?? null
    // a way without data in one of the two hours: keep the nearer hour's value (no fake fade from 0)
    out.set(Number(id), a == null || b == null ? (k < 0.5 ? a : b) : a + (b - a) * k)
  }
  return out
}
