import type { ExpressionSpecification, FilterSpecification, Map as MlMap } from 'maplibre-gl'
import { LAYER } from './layers'
import {
  EDUCATION_POI_SUBTYPE_SET,
  educationIconImage,
  ensurePoiIcons,
  POI_SYMBOL_ICON_SIZE,
  POI_SYMBOL_SUBTYPE_SET,
  TRANSIT_POI_SUBTYPE_SET,
  transitIconImage,
} from './poiIcons'
import type { PoiData } from './poi'
import { categoryHasDetailFilters } from './categoryFilterRows'
import { poiInterestGroupForCategory } from './poiInterests'
import { CATEGORY_COLORS, CATEGORY_ORDER } from './tokens'
import type { CategoryKey } from './types'

/** POI points of the filter categories (I2-4). Two layers: solo (any zoom) and priorities (zoom ≥ 12). */
export const POI_LAYER = {
  solo: 'poi-solo',
  pri: 'poi-priorities',
  /** Optional checkboxes in the filter panel — only selected subtypes. */
  interests: 'poi-interests',
  /** Tram / bus / metro stops as pictograms. */
  interestsTransit: 'poi-interests-transit',
  /** Schools, preschools, universities as pictograms. */
  interestsEdu: 'poi-interests-edu',
} as const
export const POI_SOURCE = 'poi'
export const POI_MIN_ZOOM = 12

const none: FilterSpecification = ['==', ['get', 'c'], -1]
/** Symbol interests (transit, edukacja) are not drawn as circles on solo/priority layers. */
const notSymbolPoi: FilterSpecification = [
  '!',
  ['in', ['get', 'k'], ['literal', [...POI_SYMBOL_SUBTYPE_SET]]],
]

function andFilter(a: FilterSpecification, b: FilterSpecification): FilterSpecification {
  return ['all', a, b] as FilterSpecification
}

/** Each point in its category colour (CATEGORY_COLORS). */
const catColor = ['match', ['get', 'c'], ...CATEGORY_ORDER.flatMap((c, i) => [i, CATEGORY_COLORS[c]]), '#8a8a99'] as unknown as ExpressionSpecification

const TRANSIT_BLUE = '#2a6fd6'
const SHOP_GREEN = '#3a8f2a'
const HEALTH_RED = '#e04040'

/** Marker colours for optional interest POIs (checkboxes, not weight sliders). */
const interestColor = [
  'match',
  ['get', 'k'],
  'metro_station',
  TRANSIT_BLUE,
  'tram_stop',
  TRANSIT_BLUE,
  'stop',
  TRANSIT_BLUE,
  'supermarket',
  SHOP_GREEN,
  'hospital',
  '#c62828',
  'clinic',
  HEALTH_RED,
  'pharmacy',
  '#e55c5c',
  'optician',
  HEALTH_RED,
  catColor,
] as unknown as ExpressionSpecification

function symbolInterestLayout(iconImage: readonly unknown[]): {
  visibility: 'none'
  'icon-image': ExpressionSpecification
  'icon-size': ExpressionSpecification
  'icon-allow-overlap': boolean
  'icon-ignore-placement': boolean
  'icon-padding': number
} {
  return {
    visibility: 'none',
    'icon-image': iconImage as unknown as ExpressionSpecification,
    'icon-size': POI_SYMBOL_ICON_SIZE as unknown as ExpressionSpecification,
    'icon-allow-overlap': true,
    'icon-ignore-placement': false,
    'icon-padding': 2,
  }
}

function addTransitSymbolLayer(map: MlMap, before?: string) {
  if (map.getLayer(POI_LAYER.interestsTransit)) return
  map.addLayer(
    {
      id: POI_LAYER.interestsTransit,
      type: 'symbol',
      source: POI_SOURCE,
      minzoom: 14,
      filter: none,
      layout: symbolInterestLayout([...transitIconImage]),
    },
    before,
  )
}

function addEducationSymbolLayer(map: MlMap, before?: string) {
  if (map.getLayer(POI_LAYER.interestsEdu)) return
  map.addLayer(
    {
      id: POI_LAYER.interestsEdu,
      type: 'symbol',
      source: POI_SOURCE,
      minzoom: 14,
      filter: none,
      layout: symbolInterestLayout([...educationIconImage]),
    },
    before,
  )
}

export function addPoiLayers(map: MlMap, poi: PoiData) {
  ensurePoiIcons(map)
  const before = map.getLayer(LAYER.label) ? LAYER.label : undefined

  if (!map.getSource(POI_SOURCE)) {
    map.addSource(POI_SOURCE, { type: 'geojson', data: poi.geojson })
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
    map.addLayer(
      {
        id: POI_LAYER.interests,
        type: 'circle',
        source: POI_SOURCE,
        minzoom: 10,
        filter: none,
        layout: { visibility: 'none' },
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.4, 13, 4.2, 16, 6.8],
          'circle-color': interestColor,
          'circle-stroke-color': '#fff',
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.4],
          'circle-opacity': 0.94,
        },
      },
      before,
    )
  } else {
    const src = map.getSource(POI_SOURCE) as { setData?: (d: PoiData['geojson']) => void }
    src.setData?.(poi.geojson)
  }

  addTransitSymbolLayer(map, before)
  addEducationSymbolLayer(map, before)
}

function soloPoiFilter(
  solo: CategoryKey | null,
  visibleSubtypes: readonly string[],
): FilterSpecification {
  if (!solo) return none
  const catIdx = CATEGORY_ORDER.indexOf(solo)
  if (solo === 'gastronomia') return none
  const group = poiInterestGroupForCategory(solo)
  if (group) {
    const subs = visibleSubtypes.filter((s) => group.options.some((o) => o.subtype === s))
    if (!subs.length) return none
    return ['all', ['==', ['get', 'c'], catIdx], ['in', ['get', 'k'], ['literal', [...subs]]]] as FilterSpecification
  }
  if (categoryHasDetailFilters(solo)) return none
  return ['==', ['get', 'c'], catIdx]
}

/**
 * Punkty z sekcji „Liczy się” (suwak włączony) + podgląd solo przy najechaniu.
 * `visible = false` hides layers (e.g. cinematic).
 */
export function applyPoi(
  map: MlMap,
  opts: {
    solo: CategoryKey | null
    visibleSubtypes: readonly string[]
    visible: boolean
  },
) {
  if (!map.getLayer(POI_LAYER.solo)) return
  const soloFilter = andFilter(soloPoiFilter(opts.solo, opts.visibleSubtypes), notSymbolPoi)
  map.setFilter(POI_LAYER.solo, soloFilter)
  map.setFilter(POI_LAYER.pri, none)
  const soloOn = opts.visible && soloFilter !== none && opts.solo != null
  map.setLayoutProperty(POI_LAYER.solo, 'visibility', soloOn ? 'visible' : 'none')
  map.setLayoutProperty(POI_LAYER.pri, 'visibility', 'none')
}

/** Points for checked interest subtypes and/or gastronomy cuisines (`g` on feature). */
export function applyPoiInterests(
  map: MlMap,
  opts: { subtypes: readonly string[]; gastroCuisines: readonly string[]; visible: boolean },
) {
  if (!map.getLayer(POI_LAYER.interests)) return
  const otherSubs = opts.subtypes.filter((s) => !POI_SYMBOL_SUBTYPE_SET.has(s))
  // interests layer = tylko „Podgląd na mapie” (nie duplikuj punktów z sekcji wyniku)

  const circleParts: FilterSpecification[] = []
  if (otherSubs.length) circleParts.push(['in', ['get', 'k'], ['literal', [...otherSubs]]])
  if (opts.gastroCuisines.length) circleParts.push(['in', ['get', 'g'], ['literal', [...opts.gastroCuisines]]])
  const circleFilter: FilterSpecification =
    circleParts.length === 0
      ? none
      : circleParts.length === 1
        ? circleParts[0]
        : (['any', ...circleParts] as FilterSpecification)

  map.setFilter(POI_LAYER.interests, circleFilter)
  const showCircles = opts.visible && circleParts.length > 0
  map.setLayoutProperty(POI_LAYER.interests, 'visibility', showCircles ? 'visible' : 'none')
}

/** Bus / tram / metro pictograms — only when checked in the category filter panel (Podgląd na mapie). */
export function applyPoiTransit(
  map: MlMap,
  opts: {
    visible: boolean
    interestSubtypes: readonly string[]
  },
) {
  if (!map.getLayer(POI_LAYER.interestsTransit)) return

  const transitSubs = opts.interestSubtypes.filter((s) => TRANSIT_POI_SUBTYPE_SET.has(s))
  const filter: FilterSpecification =
    transitSubs.length === 0 ? none : ['in', ['get', 'k'], ['literal', [...transitSubs]]]
  const show = opts.visible && transitSubs.length > 0

  map.setFilter(POI_LAYER.interestsTransit, filter)
  map.setLayoutProperty(POI_LAYER.interestsTransit, 'visibility', show ? 'visible' : 'none')
}

/** Preschools / schools / universities — only when checked in the edukacja filter panel. */
export function applyPoiEducation(
  map: MlMap,
  opts: {
    visible: boolean
    interestSubtypes: readonly string[]
  },
) {
  if (!map.getLayer(POI_LAYER.interestsEdu)) return

  const eduSubs = opts.interestSubtypes.filter((s) => EDUCATION_POI_SUBTYPE_SET.has(s))
  const filter: FilterSpecification =
    eduSubs.length === 0 ? none : ['in', ['get', 'k'], ['literal', [...eduSubs]]]
  const show = opts.visible && eduSubs.length > 0

  map.setFilter(POI_LAYER.interestsEdu, filter)
  map.setLayoutProperty(POI_LAYER.interestsEdu, 'visibility', show ? 'visible' : 'none')
}
