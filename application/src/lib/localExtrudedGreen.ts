import type { ExpressionSpecification } from 'maplibre-gl'

export const LOCAL_GREEN_SOURCE = 'siatka-local-green'
export const LOCAL_GREEN_PARK_FLOOR_LAYER = 'siatka-local-green-park-floor'
export const LOCAL_GREEN_PARK_LAYER = 'siatka-local-green-park-extrusion'
export const LOCAL_GREEN_PITCH_LAYER = 'siatka-local-green-pitch-extrusion'
export const LOCAL_GREEN_TREE_TRUNK_LAYER = 'siatka-local-green-tree-trunk-extrusion'
export const LOCAL_GREEN_TREE_CANOPY_LAYER = 'siatka-local-green-tree-canopy-extrusion'
export const LOCAL_GREEN_PITCH_LINE_LAYER = 'siatka-local-green-pitch-lines'

export const GREEN_KIND_PARK = 'park'
export const GREEN_KIND_PITCH_FOOTBALL = 'pitch_football'
export const GREEN_KIND_PITCH_BASKETBALL = 'pitch_basketball'
export const GREEN_KIND_PITCH_OTHER = 'pitch_other'
export const GREEN_KIND_TREE_TRUNK = 'tree_trunk'
export const GREEN_KIND_TREE_CANOPY = 'tree_canopy'
export const GREEN_KIND_PITCH_LINE = 'pitch_line'

export const GREEN_PARK_BASE_M = 0.05
export const GREEN_PARK_HEIGHT_M = 0.48

export const GREEN_PITCH_BASE_M = 0.32
export const GREEN_PITCH_HEIGHT_M = 0.38

export const kindFilter = (kind: string): ExpressionSpecification => ['==', ['get', 'kind'], kind]

/** `grass_floor` — stary błędny eksport; zostawiamy dla kompatybilności cache. */
export const GREEN_PARK_FILTER: ExpressionSpecification = [
  'any',
  ['==', ['get', 'kind'], GREEN_KIND_PARK],
  ['==', ['get', 'kind'], 'grass_floor'],
]
export const GREEN_PITCH_FILTER: ExpressionSpecification = [
  'any',
  ['==', ['get', 'kind'], GREEN_KIND_PITCH_FOOTBALL],
  ['==', ['get', 'kind'], GREEN_KIND_PITCH_BASKETBALL],
  ['==', ['get', 'kind'], GREEN_KIND_PITCH_OTHER],
]
export const GREEN_TREE_TRUNK_FILTER = kindFilter(GREEN_KIND_TREE_TRUNK)
export const GREEN_TREE_CANOPY_FILTER = kindFilter(GREEN_KIND_TREE_CANOPY)
export const GREEN_PITCH_LINE_FILTER = kindFilter(GREEN_KIND_PITCH_LINE)

export const GREEN_PITCH_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'kind'],
  GREEN_KIND_PITCH_FOOTBALL,
  '#4caf63',
  GREEN_KIND_PITCH_BASKETBALL,
  '#d4894a',
  GREEN_KIND_PITCH_OTHER,
  '#6a9f72',
  '#5a9f62',
]

export const GREEN_PARK_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'park_class'],
  'grass',
  '#5fbf6a',
  'garden',
  '#5fa868',
  'recreation',
  '#52a05c',
  'park',
  '#4fa85c',
  '#4aab58',
]

/** Płaska trawa — lekko podniesiona base w extrusion; fill jako zapas przy niskim pitch. */
export const LOCAL_GREEN_PARK_FLOOR_PAINT = {
  'fill-color': GREEN_PARK_COLOR_EXPR,
  'fill-opacity': 1,
  'fill-outline-color': '#3a8a44',
}

export const LOCAL_GREEN_PARK_TURF_PAINT = {
  'fill-extrusion-color': GREEN_PARK_COLOR_EXPR,
  'fill-extrusion-height': GREEN_PARK_BASE_M + GREEN_PARK_HEIGHT_M,
  'fill-extrusion-base': GREEN_PARK_BASE_M,
  'fill-extrusion-opacity': 1,
}

export const LOCAL_GREEN_PARK_PAINT = LOCAL_GREEN_PARK_TURF_PAINT

export const LOCAL_GREEN_PITCH_PAINT = {
  'fill-extrusion-color': GREEN_PITCH_COLOR_EXPR,
  'fill-extrusion-height': GREEN_PITCH_BASE_M + GREEN_PITCH_HEIGHT_M,
  'fill-extrusion-base': GREEN_PITCH_BASE_M,
  'fill-extrusion-opacity': 1,
}

export const LOCAL_GREEN_TREE_TRUNK_PAINT = {
  'fill-extrusion-color': '#6b4f3a',
  'fill-extrusion-height': ['coalesce', ['get', 'trunk_top_m'], 4.8],
  'fill-extrusion-base': ['coalesce', ['get', 'trunk_base_m'], GREEN_PARK_BASE_M],
  'fill-extrusion-opacity': 1,
}

export const LOCAL_GREEN_TREE_CANOPY_PAINT = {
  'fill-extrusion-color': [
    'match',
    ['%', ['to-number', ['coalesce', ['get', 'osm_id'], 0]], 5],
    0,
    '#2f7d44',
    1,
    '#358a4a',
    2,
    '#2a7340',
    3,
    '#3d9154',
    '#327e48',
  ],
  'fill-extrusion-height': ['coalesce', ['get', 'canopy_top_m'], 13.5],
  'fill-extrusion-base': ['coalesce', ['get', 'canopy_base_m'], 4.5],
  'fill-extrusion-opacity': 1,
}
