import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl'
import { hover, LAYER, SOURCE } from './layers'
import { ACCENTS } from './tokens'

/** Colour of the profile each featured osiedle is presented for (`profile` in src/mock/osiedla.ts). */
const ownerColor = (k: 'base' | 'mid' | 'deep'): ExpressionSpecification => [
  'match',
  ['get', 'owner'],
  'student',
  ACCENTS.student[k],
  'rodzina',
  ACCENTS.rodzina[k],
  ACCENTS.senior[k],
]

/** The featured osiedle that ranks #1 under the current weights (if any) is drawn a bit stronger. */
const isBest = (best: string | null): ExpressionSpecification => ['==', ['get', 'featured_slug'], best ?? '']

function fillOpacity(best: string | null): ExpressionSpecification {
  return ['case', hover, 0.24, isBest(best), 0.14, 0.08]
}
function glowWidth(best: string | null): ExpressionSpecification {
  return ['case', hover, 18, isBest(best), 14, 10]
}
function glowOpacity(best: string | null): ExpressionSpecification {
  return ['case', hover, 0.8, isBest(best), 0.6, 0.42]
}

/** Spec 5.2 #6–7: glow (wide blurred line) + crisp 2 px line, always visible, above osiedla outlines. */
export function addFeaturedLayers(map: MlMap, best: string | null) {
  const before = map.getLayer(LAYER.label) ? LAYER.label : undefined
  map.addLayer(
    {
      id: LAYER.featuredFill,
      type: 'fill',
      source: SOURCE.featured,
      paint: { 'fill-color': ownerColor('base'), 'fill-opacity': fillOpacity(best) },
    },
    before,
  )
  map.addLayer(
    {
      id: LAYER.featuredGlow,
      type: 'line',
      source: SOURCE.featured,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': ownerColor('base'),
        'line-blur': 6,
        'line-width': glowWidth(best),
        'line-opacity': glowOpacity(best),
      },
    },
    before,
  )
  map.addLayer(
    {
      id: LAYER.featuredLine,
      type: 'line',
      source: SOURCE.featured,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': ownerColor('deep'),
        'line-width': ['case', hover, 2.6, 2],
        'line-opacity': 0.95,
      },
    },
    before,
  )
}

export function applyFeaturedBest(map: MlMap, best: string | null) {
  if (!map.getLayer(LAYER.featuredFill)) return
  map.setPaintProperty(LAYER.featuredFill, 'fill-opacity', fillOpacity(best))
  map.setPaintProperty(LAYER.featuredGlow, 'line-width', glowWidth(best))
  map.setPaintProperty(LAYER.featuredGlow, 'line-opacity', glowOpacity(best))
}
