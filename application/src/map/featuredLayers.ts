import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl'
import type { MapData } from './data'
import { hover, LAYER, SOURCE } from './layers'
import { ACCENTS } from './tokens'
import type { Profile } from './types'

/**
 * The "top 3" marking: a thin outline (+ a faint tint on hover) around the 3 osiedla that rank best
 * under the current weights. Every osiedle keeps the same score fill as the rest of the map — the
 * marking only outlines the live top 3 and moves with the ranking (`setTopShapes`).
 *
 * The layer ids stay `featured-*` because the cinematic transition fades them with the other overlays.
 */
const fillOpacity: ExpressionSpecification = ['case', hover, 0.16, 0]
const glowOpacity: ExpressionSpecification = ['case', hover, 0.32, 0]

export function addFeaturedLayers(map: MlMap, profile: Profile) {
  const a = ACCENTS[profile]
  const before = map.getLayer(LAYER.label) ? LAYER.label : undefined
  map.addSource(SOURCE.top, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id' })
  map.addLayer(
    {
      id: LAYER.featuredFill,
      type: 'fill',
      source: SOURCE.top,
      paint: { 'fill-color': a.base, 'fill-opacity': fillOpacity },
    },
    before,
  )
  map.addLayer(
    {
      id: LAYER.featuredGlow,
      type: 'line',
      source: SOURCE.top,
      layout: { 'line-join': 'round' },
      paint: { 'line-color': a.base, 'line-blur': 4, 'line-width': 8, 'line-opacity': glowOpacity },
    },
    before,
  )
  map.addLayer(
    {
      id: LAYER.featuredLine,
      type: 'line',
      source: SOURCE.top,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': a.deep,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, ['case', hover, 2, 1.4], 15, ['case', hover, 2.6, 2]],
        'line-opacity': 0.72,
      },
    },
    before,
  )
}

/** Outline exactly these osiedla (MSI ids, best first). */
export function setTopShapes(map: MlMap, data: MapData, ids: readonly string[]) {
  const src = map.getSource(SOURCE.top) as GeoJSONSource | undefined
  if (!src) return
  const want = new Set(ids)
  src.setData({ type: 'FeatureCollection', features: data.osiedla.features.filter((f) => want.has(f.properties?.id as string)) })
}

/** The marking follows the profile accent of the map chrome. */
export function applyFeaturedProfile(map: MlMap, profile: Profile) {
  if (!map.getLayer(LAYER.featuredFill)) return
  const a = ACCENTS[profile]
  map.setPaintProperty(LAYER.featuredFill, 'fill-color', a.base)
  map.setPaintProperty(LAYER.featuredGlow, 'line-color', a.base)
  map.setPaintProperty(LAYER.featuredLine, 'line-color', a.deep)
}
