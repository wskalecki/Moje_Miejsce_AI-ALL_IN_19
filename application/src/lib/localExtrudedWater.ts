import type { ExpressionSpecification } from 'maplibre-gl'

export const LOCAL_WATER_SOURCE = 'siatka-local-water'
export const LOCAL_WATER_SURFACE_LAYER = 'siatka-local-water-surface-extrusion'
export const LOCAL_WATER_SHORE_LAYER = 'siatka-local-water-shore-extrusion'

export const WATER_KIND_LAKE = 'lake'
export const WATER_KIND_POND = 'pond'
export const WATER_KIND_RESERVOIR = 'reservoir'
export const WATER_KIND_OTHER = 'water'
export const WATER_KIND_SHORE = 'shore'

/** Nad płytą trawnika (~0.53 m) — jeziora/stawy „leżą” na trawie. */
export const WATER_SURFACE_BASE_M = 0.52
export const WATER_SURFACE_HEIGHT_M = 0.22
export const WATER_SHORE_EXTRA_M = 0.35

export const WATER_SURFACE_FILTER: ExpressionSpecification = [
  'any',
  ['==', ['get', 'kind'], WATER_KIND_LAKE],
  ['==', ['get', 'kind'], WATER_KIND_POND],
  ['==', ['get', 'kind'], WATER_KIND_RESERVOIR],
  ['==', ['get', 'kind'], WATER_KIND_OTHER],
]

export const WATER_SHORE_FILTER: ExpressionSpecification = [
  '==',
  ['get', 'kind'],
  WATER_KIND_SHORE,
]

export const WATER_SURFACE_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'kind'],
  WATER_KIND_POND,
  '#3d8fbf',
  WATER_KIND_LAKE,
  '#2f7aa8',
  WATER_KIND_RESERVOIR,
  '#286d9a',
  '#3389b5',
]

export const LOCAL_WATER_SHORE_PAINT = {
  'fill-extrusion-color': '#6a9a72',
  'fill-extrusion-height': WATER_SURFACE_BASE_M + WATER_SURFACE_HEIGHT_M + 0.05,
  'fill-extrusion-base': WATER_SURFACE_BASE_M - 0.06,
  'fill-extrusion-opacity': 1,
}

export const LOCAL_WATER_SURFACE_PAINT = {
  'fill-extrusion-color': WATER_SURFACE_COLOR_EXPR,
  'fill-extrusion-height': WATER_SURFACE_BASE_M + WATER_SURFACE_HEIGHT_M,
  'fill-extrusion-base': WATER_SURFACE_BASE_M,
  'fill-extrusion-opacity': 1,
}
