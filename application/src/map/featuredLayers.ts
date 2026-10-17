import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl'
import { hover, LAYER, SOURCE } from './layers'
import { ACCENTS } from './tokens'
import type { Profile } from './types'

/** Colour of the profile each featured osiedle belongs to (Powiśle violet, Wilanów coral, Saska Kępa teal). */
const ownerColor = (k: 'base' | 'mid' | 'deep'): ExpressionSpecification => [
  'match',
  ['get', 'owner'],
  'student',
  ACCENTS.student[k],
  'rodzina',
  ACCENTS.rodzina[k],
  ACCENTS.senior[k],
]

const own = (p: Profile): ExpressionSpecification => ['==', ['get', 'owner'], p]

function fillOpacity(p: Profile): ExpressionSpecification {
  return ['case', hover, 0.24, own(p), 0.14, 0.08]
}
function glowWidth(p: Profile): ExpressionSpecification {
  return ['case', hover, 18, own(p), 14, 10]
}
function glowOpacity(p: Profile): ExpressionSpecification {
  return ['case', hover, 0.8, own(p), 0.6, 0.42]
}

/** Spec 5.2 #6–7: glow (wide blurred line) + crisp 2 px line, always visible, above osiedla outlines. */
export function addFeaturedLayers(map: MlMap, profile: Profile) {
  const before = map.getLayer(LAYER.label) ? LAYER.label : undefined
  map.addLayer(
    {
      id: LAYER.featuredFill,
      type: 'fill',
      source: SOURCE.featured,
      paint: { 'fill-color': ownerColor('base'), 'fill-opacity': fillOpacity(profile) },
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
        'line-width': glowWidth(profile),
        'line-opacity': glowOpacity(profile),
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

export function applyFeaturedProfile(map: MlMap, profile: Profile) {
  if (!map.getLayer(LAYER.featuredFill)) return
  map.setPaintProperty(LAYER.featuredFill, 'fill-opacity', fillOpacity(profile))
  map.setPaintProperty(LAYER.featuredGlow, 'line-width', glowWidth(profile))
  map.setPaintProperty(LAYER.featuredGlow, 'line-opacity', glowOpacity(profile))
}
