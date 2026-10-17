import type { Map } from 'maplibre-gl'

const WATER_SOURCE_LAYERS = new Set(['water', 'waterway', 'water_name'])

const WATER_LAYER_ID_HINTS = ['water', 'ocean', 'river', 'lake']

export function setBasemapWaterLayersVisible(map: Map, visible: boolean) {
  const visibility = visible ? 'visible' : 'none'
  const layers = map.getStyle()?.layers ?? []
  for (const layer of layers) {
    if (layer.type !== 'fill' && layer.type !== 'line') continue
    const spec = layer as { 'source-layer'?: string; id?: string }
    const sl = spec['source-layer']
    const id = layer.id.toLowerCase()
    const matchesSource = sl && WATER_SOURCE_LAYERS.has(sl)
    const matchesId = WATER_LAYER_ID_HINTS.some((hint) => id.includes(hint))
    if (!matchesSource && !matchesId) continue
    if (!map.getLayer(layer.id)) continue
    map.setLayoutProperty(layer.id, 'visibility', visibility)
  }
}
