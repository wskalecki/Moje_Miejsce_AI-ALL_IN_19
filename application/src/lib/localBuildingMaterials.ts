import type { ExpressionSpecification } from 'maplibre-gl'
import type { Feature, Polygon } from 'geojson'
import type { LocalBuildingProps } from './localServiceBuildings'

export type BuildingStyleTier = 'tower' | 'block' | 'detached'

const DETACHED_BUILDING_TAGS = new Set([
  'house',
  'detached',
  'bungalow',
  'cabin',
  'static_caravan',
  'ger',
])

const TOWER_BUILDING_TAGS = new Set([
  'skyscraper',
  'commercial',
  'office',
  'hotel',
  'apartments',
  'high_rise',
])

function ringAreaDeg2(ring: number[][]): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(sum / 2)
}

export function footprintAreaM2(geometry: Polygon): number {
  const lat = geometry.coordinates[0][0]?.[1] ?? 52.2
  const mPerDegLat = 111_320
  const mPerDegLon = 111_320 * Math.cos((lat * Math.PI) / 180)
  return ringAreaDeg2(geometry.coordinates[0]) * mPerDegLat * mPerDegLon
}

export function inferBuildingStyleTier(
  props: LocalBuildingProps,
  geometry: Feature['geometry'],
): BuildingStyleTier {
  const height = Number(props.height) || 12
  const tag = (props.building || 'yes').toLowerCase()

  if (height >= 32 || (height >= 24 && TOWER_BUILDING_TAGS.has(tag))) {
    return 'tower'
  }
  if (DETACHED_BUILDING_TAGS.has(tag)) {
    return 'detached'
  }
  if (geometry?.type === 'Polygon') {
    const areaM2 = footprintAreaM2(geometry as Polygon)
    if (height < 14 && areaM2 < 340) return 'detached'
    if (height < 9 && areaM2 < 520) return 'detached'
  }
  return 'block'
}

const BUILDING_HEIGHT_EXPR: ExpressionSpecification = [
  'coalesce',
  ['get', 'height'],
  12,
]

const MATERIAL_BY_TIER_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'style_tier'],
  'tower',
  [
    'interpolate',
    ['linear'],
    BUILDING_HEIGHT_EXPR,
    24,
    '#9ec3e8',
    55,
    '#c5ddf5',
    120,
    '#8eb5dc',
  ],
  'block',
  [
    'interpolate',
    ['linear'],
    ['%', ['to-number', ['coalesce', ['get', 'osm_id'], 0]], 9],
    0,
    '#c4b6a4',
    4,
    '#d0c2b0',
    8,
    '#b8a992',
  ],
  'detached',
  [
    'match',
    ['%', ['to-number', ['coalesce', ['get', 'osm_id'], 0]], 3],
    0,
    '#e8dcc8',
    1,
    '#f0e6d4',
    '#e2d4be',
  ],
  '#c5c0b8',
]

/**
 * Znane kategorie POI → kolor usługi; wszystko inne (null, puste, nieznane) → materiał.
 * MapLibre wymaga poprawnego koloru — bez pustego stringa w default.
 */
export const LOCAL_BUILDING_MATERIAL_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'category'],
  'transit',
  '#2f6fd4',
  'education',
  '#4a9fe8',
  'environment',
  '#5ec4f0',
  'amenity',
  '#6a9fff',
  'sport',
  '#4a9fd9',
  'culture',
  '#6b8fd4',
  'manual',
  '#d946ef',
  MATERIAL_BY_TIER_EXPR,
]

export const LOCAL_BUILDING_EXTRUSION_HEIGHT_EXPR = BUILDING_HEIGHT_EXPR

/** MapLibre: opacity i vertical-gradient bez data expressions (tylko kolor/wysokość). */
export const LOCAL_BUILDING_EXTRUSION_PAINT = {
  'fill-extrusion-color': LOCAL_BUILDING_MATERIAL_COLOR_EXPR,
  'fill-extrusion-height': ['max', BUILDING_HEIGHT_EXPR, 3],
  'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
  'fill-extrusion-opacity': 0.92,
  'fill-extrusion-vertical-gradient': true,
}
