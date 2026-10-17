import type { Map as MlMap } from 'maplibre-gl'
import { BASEMAP } from './tokens'

/**
 * Warm the Positron basemap (spec 5.1). Matching is by layer id / type, so the function is
 * tolerant of style revisions: missing layers are skipped.
 */
export function warmBasemap(map: MlMap) {
  const style = map.getStyle()
  const set = (id: string, prop: string, value: unknown) => {
    if (!map.getLayer(id)) return
    try {
      map.setPaintProperty(id, prop as never, value as never)
    } catch {
      /* property not applicable */
    }
  }
  const hide = (id: string) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', 'none')

  for (const layer of style.layers) {
    const id = layer.id
    const sl = 'source-layer' in layer ? layer['source-layer'] : undefined

    if (layer.type === 'background') set(id, 'background-color', BASEMAP.background)

    if (layer.type === 'fill') {
      if (id === 'water' || sl === 'water') set(id, 'fill-color', BASEMAP.water)
      else if (id === 'park' || sl === 'park') set(id, 'fill-color', BASEMAP.park)
      else if (id.includes('wood') || id.includes('grass')) set(id, 'fill-color', BASEMAP.wood)
      else if (id.includes('residential')) set(id, 'fill-color', BASEMAP.residential)
      else if (id === 'building' || sl === 'building') {
        set(id, 'fill-color', BASEMAP.building)
        set(id, 'fill-outline-color', BASEMAP.buildingOutline)
      } else if (id.startsWith('road_area') || id.startsWith('aeroway')) set(id, 'fill-color', BASEMAP.roadMinor)
    }

    if (layer.type === 'line') {
      if (id === 'waterway' || sl === 'waterway') set(id, 'line-color', BASEMAP.waterLine)
      else if (id.includes('casing')) set(id, 'line-color', BASEMAP.roadCasing)
      else if (id.includes('major_inner') || id.includes('motorway_inner') || id.includes('motorway_bridge_inner'))
        set(id, 'line-color', BASEMAP.roadMajor)
      else if (id.includes('subtle')) set(id, 'line-color', 'rgba(230,223,212,0.6)')
      else if (id.includes('minor') || id.includes('path') || id.startsWith('road_pier')) set(id, 'line-color', BASEMAP.roadMinor)
      else if (id.startsWith('railway') && !id.includes('dashline')) set(id, 'line-color', BASEMAP.rail)
      else if (id.startsWith('railway') && id.includes('dashline')) set(id, 'line-color', BASEMAP.roadMinor)
      else if (id.startsWith('boundary')) hide(id)
      else if (id.startsWith('aeroway')) set(id, 'line-color', BASEMAP.roadMinor)
    }

    if (layer.type === 'symbol') {
      // POI, shields, airports, minor street names: hidden. City name hidden (the whole map is Warsaw).
      if (
        id.includes('shield') ||
        id.includes('poi') ||
        id === 'airport' ||
        id === 'highway-name-path' ||
        id === 'highway-name-minor' ||
        id === 'label_city_capital' ||
        id.startsWith('label_country') ||
        id === 'label_state'
      ) {
        hide(id)
        continue
      }
      set(id, 'text-color', BASEMAP.labelInk)
      set(id, 'text-halo-color', BASEMAP.halo)
      set(id, 'text-halo-width', 1.2)
      if (id === 'label_other') {
        // neighbourhood names give way to our osiedla labels at zoom 13
        set(id, 'text-opacity', ['interpolate', ['linear'], ['zoom'], 12, 1, 12.8, 0])
      }
      if (id === 'label_village' || id === 'label_town') set(id, 'text-color', 'rgba(22,22,29,0.34)')
      if (id.startsWith('water_name') || id === 'waterway_line_label') set(id, 'text-color', 'rgba(70,96,120,0.55)')
    }
  }
}

/** First symbol layer id — our overlays go beneath basemap labels. */
export function firstSymbolId(map: MlMap): string | undefined {
  return map.getStyle().layers.find((l) => l.type === 'symbol')?.id
}
