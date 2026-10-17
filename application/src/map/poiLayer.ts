import type { ExpressionSpecification, FilterSpecification, Map as MlMap } from 'maplibre-gl'
import { LAYER } from './layers'
import type { PoiData } from './poi'
import { CATEGORY_COLORS, CATEGORY_ORDER } from './tokens'
import type { CategoryKey } from './types'

/** POI points of the filter categories (I2-4). Two layers: solo (any zoom) and priorities (zoom ≥ 12). */
export const POI_LAYER = {
  solo: 'poi-solo',
  pri: 'poi-priorities',
} as const
export const POI_SOURCE = 'poi'
export const POI_MIN_ZOOM = 12

const none: FilterSpecification = ['==', ['get', 'c'], -1]

/** Each point in its category colour (CATEGORY_COLORS). */
const catColor = ['match', ['get', 'c'], ...CATEGORY_ORDER.flatMap((c, i) => [i, CATEGORY_COLORS[c]]), '#8a8a99'] as unknown as ExpressionSpecification

export function addPoiLayers(map: MlMap, poi: PoiData) {
  if (map.getSource(POI_SOURCE)) return
  map.addSource(POI_SOURCE, { type: 'geojson', data: poi.geojson })
  const before = map.getLayer(LAYER.label) ? LAYER.label : undefined
  map.addLayer(
    {
      id: POI_LAYER.pri,
      type: 'circle',
      source: POI_SOURCE,
      minzoom: POI_MIN_ZOOM,
      filter: none,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2.2, 14, 3.4, 17, 5.5],
        'circle-color': catColor,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 15, 1.2],
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.4, 0.85],
        'circle-stroke-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.4, 0.9],
      },
    },
    before,
  )
  map.addLayer(
    {
      id: POI_LAYER.solo,
      type: 'circle',
      source: POI_SOURCE,
      filter: none,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 1.6, 11, 2.6, 13, 4, 16, 6.5],
        'circle-color': catColor,
        'circle-stroke-color': '#fff',
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 9, 0.4, 12, 1, 15, 1.6],
        'circle-opacity': 0.92,
      },
    },
    before,
  )
}

/**
 * Which POIs are shown: the solo category at any zoom; otherwise the priority categories from zoom 12.
 * `visible = false` hides both (e.g. while the cinematic runs).
 */
export function applyPoi(map: MlMap, opts: { solo: CategoryKey | null; priorities: readonly CategoryKey[]; visible: boolean }) {
  if (!map.getLayer(POI_LAYER.solo)) return
  const idx = (c: CategoryKey) => CATEGORY_ORDER.indexOf(c)
  const soloFilter: FilterSpecification = opts.solo ? ['==', ['get', 'c'], idx(opts.solo)] : none
  const pri = opts.solo ? [] : opts.priorities.map(idx)
  const priFilter: FilterSpecification = pri.length ? ['in', ['get', 'c'], ['literal', pri]] : none
  map.setFilter(POI_LAYER.solo, soloFilter)
  map.setFilter(POI_LAYER.pri, priFilter)
  const vis = opts.visible ? 'visible' : 'none'
  map.setLayoutProperty(POI_LAYER.solo, 'visibility', vis)
  map.setLayoutProperty(POI_LAYER.pri, 'visibility', vis)
}
