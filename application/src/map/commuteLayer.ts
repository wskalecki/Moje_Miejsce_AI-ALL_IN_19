import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import { HEAT_RADIUS_SCALE, LAYER } from './layers'
import { PROFILES } from './types'

/** "Dojazd do…" filter: heatmap of travel time to a point, drawn instead of the score heat. */
export const COMMUTE = {
  source: 'commute',
  heat: 'commute-heat',
  anchorSource: 'commute-anchor',
  anchor: 'commute-anchor',
} as const

/** Grid spacing of the travel-time cells (team grid, gridVersion 3). */
const SPACING_M = 250
/** Same kernel/intensity relation as the score heat, so both read alike. */
const INTENSITY = 3.2 / (HEAT_RADIUS_SCALE * HEAT_RADIUS_SCALE)

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

/** Short trips → deep colour, trips close to the limit → pale; cells over the limit are not drawn. */
const COLOR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0,
  'rgba(14,116,144,0)',
  0.15,
  'rgba(186,230,253,0.45)',
  0.4,
  'rgba(56,189,248,0.6)',
  0.7,
  'rgba(2,132,199,0.72)',
  0.95,
  'rgba(12,74,110,0.85)',
]

export function addCommuteLayers(map: MlMap) {
  if (map.getSource(COMMUTE.source)) return
  const beforeLabels = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
  const spacingPxZ10 = SPACING_M / ((78271.5 * Math.cos((52.23 * Math.PI) / 180)) / 1024)
  const r = (z: number) => HEAT_RADIUS_SCALE * spacingPxZ10 * 2 ** (z - 10)
  map.addSource(COMMUTE.source, { type: 'geojson', data: EMPTY, maxzoom: 13 })
  map.addSource(COMMUTE.anchorSource, { type: 'geojson', data: EMPTY })
  map.addLayer(
    {
      id: COMMUTE.heat,
      type: 'heatmap',
      source: COMMUTE.source,
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': ['get', 'w'],
        'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 8, r(8), 13, r(13), 16, r(16)],
        'heatmap-intensity': INTENSITY,
        'heatmap-color': COLOR,
        'heatmap-opacity': 0.9,
      },
    },
    beforeLabels,
  )
  map.addLayer({
    id: COMMUTE.anchor,
    type: 'circle',
    source: COMMUTE.anchorSource,
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': 7,
      'circle-color': '#0c4a6e',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })
}

/** Layers the commute heat replaces while it is shown. */
function scoreLayers(): string[] {
  return PROFILES.flatMap((p) => [LAYER.heat(p), LAYER.fill(p)])
}

const hidden = new WeakMap<MlMap, Map<string, string>>()

export interface CommuteCells {
  lon: Float64Array
  lat: Float64Array
}

/**
 * Show travel times (minutes per cell, NaN = no data) as a heatmap; cells over `limit` minutes
 * are left out. Weight = 1 − t / limit, so the colour deepens towards the point.
 */
export function showCommute(map: MlMap, cells: CommuteCells, minutes: Float64Array, limit: number, anchor: [number, number]) {
  addCommuteLayers(map)
  const features: GeoJSON.Feature[] = []
  for (let i = 0; i < minutes.length; i++) {
    const t = minutes[i]
    if (!(t <= limit)) continue // NaN and over the limit
    features.push({
      type: 'Feature',
      properties: { t: Math.round(t), w: Math.max(0.06, 1 - t / limit) },
      geometry: { type: 'Point', coordinates: [cells.lon[i], cells.lat[i]] },
    })
  }
  ;(map.getSource(COMMUTE.source) as GeoJSONSource).setData({ type: 'FeatureCollection', features })
  ;(map.getSource(COMMUTE.anchorSource) as GeoJSONSource).setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: anchor },
  })
  if (!hidden.has(map)) {
    const prev = new Map<string, string>()
    for (const id of scoreLayers()) {
      if (!map.getLayer(id)) continue
      prev.set(id, (map.getLayoutProperty(id, 'visibility') as string | undefined) ?? 'visible')
      map.setLayoutProperty(id, 'visibility', 'none')
    }
    hidden.set(map, prev)
  }
  map.setLayoutProperty(COMMUTE.heat, 'visibility', 'visible')
  map.setLayoutProperty(COMMUTE.anchor, 'visibility', 'visible')
}

/** Hide the commute heat and bring the score heat back as it was. */
export function hideCommute(map: MlMap) {
  if (map.getLayer(COMMUTE.heat)) map.setLayoutProperty(COMMUTE.heat, 'visibility', 'none')
  if (map.getLayer(COMMUTE.anchor)) map.setLayoutProperty(COMMUTE.anchor, 'visibility', 'none')
  const prev = hidden.get(map)
  if (!prev) return
  for (const [id, vis] of prev) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis as 'visible' | 'none')
  hidden.delete(map)
}

/** Share of the city's cells reachable within `limit` minutes (for the panel summary). */
export function reachableShare(minutes: Float64Array, limit: number): number {
  let n = 0
  for (let i = 0; i < minutes.length; i++) if (minutes[i] <= limit) n++
  return minutes.length ? n / minutes.length : 0
}
