import type { Map } from 'maplibre-gl'

const ROAD_SOURCE_LAYERS = new Set([
  'transportation',
  'transportation_name',
  'road',
  'roads',
  'highway',
])

/**
 * Ukrywa płaskie drogi z kafelków basemapu, gdy renderujemy lokalne bryły 3D.
 */
export function setBasemapTransportLayersVisible(map: Map, visible: boolean) {
  const visibility = visible ? 'visible' : 'none'
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'line' && layer.type !== 'fill') continue
    const spec = layer as { 'source-layer'?: string }
    const sl = spec['source-layer']
    if (!sl || !ROAD_SOURCE_LAYERS.has(sl)) continue
    if (!map.getLayer(layer.id)) continue
    map.setLayoutProperty(layer.id, 'visibility', visibility)
  }
}
