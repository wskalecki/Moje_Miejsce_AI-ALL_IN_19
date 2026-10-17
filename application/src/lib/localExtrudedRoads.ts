import type { ExpressionSpecification } from 'maplibre-gl'

export const LOCAL_ROADS_SOURCE = 'siatka-local-roads'
export const LOCAL_ROADS_CURB_LAYER = 'siatka-local-roads-curb-extrusion'
export const LOCAL_ROADS_SURFACE_LAYER = 'siatka-local-roads-surface-extrusion'
/** Niewielki „płytowy” podest nad płaszczyzną mapy (metry). */
export const ROAD_EXTRUSION_BASE_M = 0.08
export const ROAD_CURB_HEIGHT_M = 0.42
export const ROAD_SURFACE_HEIGHT_M = 0.52

export const ROAD_PART_CURB = 'curb'
export const ROAD_PART_SURFACE = 'surface'

export const ROAD_CURB_COLOR = '#a8adb6'
export const ROAD_ASPHALT_COLOR = '#3c4249'

export const ROAD_CURB_FILTER: ExpressionSpecification = [
  '==',
  ['get', 'part'],
  ROAD_PART_CURB,
]

export const ROAD_SURFACE_FILTER: ExpressionSpecification = [
  '==',
  ['get', 'part'],
  ROAD_PART_SURFACE,
]

/** Jednolity asfalt — unikamy „plam” ze składania przezroczystości na skrzyżowaniach. */
export const ROAD_ASPHALT_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'highway'],
  'motorway',
  '#3a4048',
  'trunk',
  '#3c4249',
  'primary',
  '#3f454d',
  'secondary',
  '#40464e',
  ROAD_ASPHALT_COLOR,
]

export const LOCAL_ROADS_CURB_PAINT = {
  'fill-extrusion-color': ROAD_CURB_COLOR,
  'fill-extrusion-height': ROAD_EXTRUSION_BASE_M + ROAD_CURB_HEIGHT_M,
  'fill-extrusion-base': ROAD_EXTRUSION_BASE_M,
  'fill-extrusion-opacity': 1,
} as const

export const LOCAL_ROADS_SURFACE_PAINT = {
  'fill-extrusion-color': ROAD_ASPHALT_COLOR_EXPR,
  'fill-extrusion-height': ROAD_EXTRUSION_BASE_M + ROAD_SURFACE_HEIGHT_M,
  'fill-extrusion-base': ROAD_EXTRUSION_BASE_M + ROAD_CURB_HEIGHT_M - 0.05,
  'fill-extrusion-opacity': 1,
} as const
