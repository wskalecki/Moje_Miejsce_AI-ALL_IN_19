import type { Map } from 'maplibre-gl'

const GREEN_SOURCE_LAYERS = new Set([
  'landcover',
  'landuse',
  'park',
  'grass',
])

const GREEN_LAYER_ID_HINTS = ['park', 'grass', 'green', 'landcover', 'landuse']

/**
 * Ukrywa płaską zieleń basemapu, gdy renderujemy lokalne parki / boiska.
 */
export function setBasemapGreenLayersVisible(map: Map, visible: boolean) {
  const visibility = visible ? 'visible' : 'none'
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'fill' && layer.type !== 'line') continue
    const spec = layer as { 'source-layer'?: string; id?: string }
    const sl = spec['source-layer']
    const id = layer.id.toLowerCase()
    const matchesSource = sl && GREEN_SOURCE_LAYERS.has(sl)
    const matchesId = GREEN_LAYER_ID_HINTS.some((hint) => id.includes(hint))
    if (!matchesSource && !matchesId) continue
    if (!map.getLayer(layer.id)) continue
    map.setLayoutProperty(layer.id, 'visibility', visibility)
  }
}
