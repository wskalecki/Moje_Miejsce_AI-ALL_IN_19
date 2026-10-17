import { Popup, type GeoJSONSource, type Map as MlMap, type MapLayerMouseEvent } from 'maplibre-gl'
import { cellRing, timeBands } from './commuteGrid'
import { LAYER } from './layers'
import { PROFILES } from './types'

/**
 * "Dojazd do…" filter: every 250 m grid cell coloured by its travel time to the chosen point,
 * in discrete bands (an isochrone map), drawn instead of the score heat. Cells over the limit
 * or without a connection are left uncoloured.
 */
export const COMMUTE = {
  source: 'commute',
  fill: 'commute-fill',
  anchorSource: 'commute-anchor',
  anchor: 'commute-anchor',
} as const

/** Short trips deep blue → trips near the limit pale (ColorBrewer Blues, reversed). */
const BLUES = ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1']

export interface CommuteBand {
  from: number
  to: number
  color: string
}

/** Colour bands for a time limit; the panel legend and the map use the same list. */
export function commuteBands(limit: number): CommuteBand[] {
  const tops = timeBands(limit)
  const last = BLUES.length - 1
  return tops.map((to, i) => ({
    from: i ? tops[i - 1] : 0,
    to,
    color: BLUES[tops.length === 1 ? 0 : Math.round((i * last) / (tops.length - 1))],
  }))
}

const EMPTY: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

export function addCommuteLayers(map: MlMap) {
  if (map.getSource(COMMUTE.source)) return
  const beforeLabels = map.getStyle().layers.find((l) => l.type === 'symbol')?.id
  map.addSource(COMMUTE.source, { type: 'geojson', data: EMPTY, maxzoom: 14 })
  map.addSource(COMMUTE.anchorSource, { type: 'geojson', data: EMPTY })
  map.addLayer(
    {
      id: COMMUTE.fill,
      type: 'fill',
      source: COMMUTE.source,
      layout: { visibility: 'none' },
      paint: {
        'fill-color': ['get', 'c'],
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0.62, 14, 0.5, 16, 0.38],
        // cells tile exactly; antialiased edges would draw a darker grid between them
        'fill-antialias': false,
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
      'circle-color': '#08306b',
      'circle-stroke-color': '#ffffff',
      'circle-stroke-width': 3,
    },
  })
}

export interface CommuteCells {
  row: Uint16Array
  col: Uint16Array
}

const rings = new WeakMap<CommuteCells, [number, number][][]>()

function cellRings(cells: CommuteCells): [number, number][][] {
  let r = rings.get(cells)
  if (!r) {
    r = Array.from(cells.row, (row, i) => cellRing(row, cells.col[i]))
    rings.set(cells, r)
  }
  return r
}

/** Zoom ranges of the score layers while the commute map replaces them. A zoom range, not
 *  visibility: the profile cross-fade in layers.ts switches visibility back on. */
const hidden = new WeakMap<MlMap, Map<string, [number, number]>>()

function hideScoreLayers(map: MlMap) {
  if (hidden.has(map)) return
  const prev = new Map<string, [number, number]>()
  for (const id of PROFILES.flatMap((p) => [LAYER.heat(p), LAYER.fill(p)])) {
    const layer = map.getLayer(id)
    if (!layer) continue
    prev.set(id, [layer.minzoom ?? 0, layer.maxzoom ?? 24])
    map.setLayerZoomRange(id, 24, 24)
  }
  hidden.set(map, prev)
}

/** Show minutes per cell (NaN = no connection); cells over `limit` are not drawn. */
export function showCommute(map: MlMap, cells: CommuteCells, minutes: Float64Array, limit: number, anchor: [number, number]) {
  addCommuteLayers(map)
  const bands = commuteBands(limit)
  const ring = cellRings(cells)
  const features: GeoJSON.Feature[] = []
  for (let i = 0; i < minutes.length; i++) {
    const t = minutes[i]
    if (!(t <= limit)) continue // NaN and over the limit
    const band = bands.find((b) => t <= b.to) ?? bands[bands.length - 1]
    features.push({
      type: 'Feature',
      properties: { t, c: band.color },
      geometry: { type: 'Polygon', coordinates: [ring[i]] },
    })
  }
  ;(map.getSource(COMMUTE.source) as GeoJSONSource).setData({ type: 'FeatureCollection', features })
  ;(map.getSource(COMMUTE.anchorSource) as GeoJSONSource).setData({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: anchor },
  })
  hideScoreLayers(map)
  map.setLayoutProperty(COMMUTE.fill, 'visibility', 'visible')
  map.setLayoutProperty(COMMUTE.anchor, 'visibility', 'visible')
}

/** Hide the commute map and bring the score layers back as they were. */
export function hideCommute(map: MlMap) {
  if (map.getLayer(COMMUTE.fill)) map.setLayoutProperty(COMMUTE.fill, 'visibility', 'none')
  if (map.getLayer(COMMUTE.anchor)) map.setLayoutProperty(COMMUTE.anchor, 'visibility', 'none')
  const prev = hidden.get(map)
  if (!prev) return
  for (const [id, [min, max]] of prev) if (map.getLayer(id)) map.setLayerZoomRange(id, min, max)
  hidden.delete(map)
}

/** Tooltip with the hovered cell's minutes; returns the cleanup. */
export function attachCommuteHover(map: MlMap, text: (minutes: number) => string): () => void {
  const popup = new Popup({ closeButton: false, closeOnClick: false, className: 'smap-commute-tip', offset: 12, maxWidth: 'none' })
  const move = (e: MapLayerMouseEvent) => {
    const t = Number(e.features?.[0]?.properties?.t)
    if (!Number.isFinite(t)) return
    popup.setLngLat(e.lngLat).setText(text(t)).addTo(map)
  }
  const leave = () => popup.remove()
  map.on('mousemove', COMMUTE.fill, move)
  map.on('mouseleave', COMMUTE.fill, leave)
  return () => {
    map.off('mousemove', COMMUTE.fill, move)
    map.off('mouseleave', COMMUTE.fill, leave)
    popup.remove()
  }
}

/** Share of the city's cells (equal 250 m squares, so: of its area) reachable within `limit`. */
export function reachableShare(minutes: Float64Array, limit: number): number {
  let n = 0
  for (let i = 0; i < minutes.length; i++) if (minutes[i] <= limit) n++
  return minutes.length ? n / minutes.length : 0
}
