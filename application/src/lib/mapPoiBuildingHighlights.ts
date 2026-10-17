import type { FeatureCollection } from 'geojson'
import type { ExpressionSpecification } from 'maplibre-gl'

import { MAP_POI_DETAIL_MIN_ZOOM } from './mapDetailZoom'

/** Zoom, od którego footprinty są widoczne. */
export const POI_BUILDING_MIN_ZOOM = MAP_POI_DETAIL_MIN_ZOOM

export const POI_BUILDING_COLOR_EXPR: ExpressionSpecification = [
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
  '#3d85e0',
]

/** Wysokość extrusion — zoom tylko w top-level interpolate (wymóg MapLibre). */
export const POI_BUILDING_HEIGHT_EXPR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13.5,
  3,
  15,
  10,
  16,
  18,
  17.5,
  ['coalesce', ['get', 'height'], 16],
]

export const POI_BUILDING_EXTRUSION_OPACITY_EXPR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  0,
  14,
  0.3,
  15,
  0.6,
  15.7,
  0.95,
  17.5,
  0.98,
]

export const POI_BUILDING_FILL_OPACITY_EXPR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  13,
  0,
  14.5,
  0.25,
  15.7,
  0.5,
  17.5,
  0.55,
]

/** Kółka znikają, gdy rosną niebieskie budynki. */
export const POI_CIRCLE_OPACITY_EXPR: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  11,
  1,
  14.7,
  1,
  15.5,
  0.35,
  16.1,
  0,
]

export function poiBuildingsForMap(
  buildings: FeatureCollection,
  visible: boolean,
): FeatureCollection {
  if (!visible) return { type: 'FeatureCollection', features: [] }
  return buildings
}
