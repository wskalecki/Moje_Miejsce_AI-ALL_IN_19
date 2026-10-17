/**
 * Road style for public/data/3d/<msiId>/roads.geojson (buffered bodies, part=curb|surface)
 * and roads-lines.geojson (centre lines for traffic colouring).
 *
 * Ported from feat/grid-tile-lab application/src/lib/localExtrudedRoads.ts
 * (asphalt surface + light grey curb, two thin fill-extrusion layers).
 */
import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
  LineLayerSpecification,
} from 'maplibre-gl'

export type RoadPart = 'curb' | 'surface'

export type RoadProps = {
  part: RoadPart
  highway: string
  way_id: number
  name?: string
  /** Congestion 0–1 for the selected hour, injected by withCongestion(); absent = no data. */
  cg?: number
}

export type RoadLineProps = {
  way_id: number
  highway: string
  name?: string
  lanes?: number
  /** 1 = tunnel (no road body drawn). */
  tn?: 1
  cg?: number
}

/** Small "slab" above the map plane (metres) — as in tile-lab. */
export const ROAD_EXTRUSION_BASE_M = 0.08
export const ROAD_CURB_HEIGHT_M = 0.42
export const ROAD_SURFACE_HEIGHT_M = 0.52

export const ROAD_CURB_COLOR = '#a8adb6'
export const ROAD_ASPHALT_COLOR = '#3c4249'

export const ROADS_MIN_ZOOM = 14

export const ROAD_CURB_FILTER: FilterSpecification = ['==', ['get', 'part'], 'curb']
export const ROAD_SURFACE_FILTER: FilterSpecification = ['==', ['get', 'part'], 'surface']

/** Uniform asphalt — avoids blotches from stacked transparency at junctions. */
export const ROAD_ASPHALT_COLOR_EXPR: ExpressionSpecification = [
  'match',
  ['get', 'highway'],
  ['motorway', 'motorway_link'],
  '#3a4048',
  ['trunk', 'trunk_link'],
  '#3c4249',
  ['primary', 'primary_link'],
  '#3f454d',
  ['secondary', 'secondary_link'],
  '#40464e',
  ROAD_ASPHALT_COLOR,
]

// --- traffic -------------------------------------------------------------

/** Congestion ramp (0 = free flow … 1 = slowest hour of the day). */
export const CONGESTION_STOPS: ReadonlyArray<readonly [value: number, color: string]> = [
  [0, '#3f9e6a'],
  [0.25, '#9cc65a'],
  [0.45, '#e8c547'],
  [0.65, '#e58a3a'],
  [0.85, '#c8413a'],
]

export const CONGESTION_LEGEND = [
  { label: 'Płynnie', color: '#3f9e6a' },
  { label: 'Lekkie spowolnienie', color: '#e8c547' },
  { label: 'Korek', color: '#c8413a' },
  { label: 'Brak danych', color: ROAD_ASPHALT_COLOR },
] as const

/** Colour for a `cg` property; features without it fall back to `fallback`. */
export function congestionColorExpr(fallback: string | ExpressionSpecification = ROAD_ASPHALT_COLOR): ExpressionSpecification {
  return [
    'case',
    ['has', 'cg'],
    ['interpolate', ['linear'], ['get', 'cg'], ...CONGESTION_STOPS.flat()],
    fallback,
  ] as ExpressionSpecification
}

// --- layers --------------------------------------------------------------

export const ROAD_CURB_PAINT = {
  'fill-extrusion-color': ROAD_CURB_COLOR,
  'fill-extrusion-height': ROAD_EXTRUSION_BASE_M + ROAD_CURB_HEIGHT_M,
  'fill-extrusion-base': ROAD_EXTRUSION_BASE_M,
  'fill-extrusion-opacity': 1,
} satisfies FillExtrusionLayerSpecification['paint']

export const ROAD_SURFACE_PAINT = {
  'fill-extrusion-color': ROAD_ASPHALT_COLOR_EXPR,
  'fill-extrusion-height': ROAD_EXTRUSION_BASE_M + ROAD_SURFACE_HEIGHT_M,
  'fill-extrusion-base': ROAD_EXTRUSION_BASE_M + ROAD_CURB_HEIGHT_M - 0.05,
  'fill-extrusion-opacity': 1,
} satisfies FillExtrusionLayerSpecification['paint']

export function roadSource(data: string | GeoJSON.FeatureCollection): GeoJSONSourceSpecification {
  return { type: 'geojson', data }
}

export function roadCurbLayer(id: string, source: string, minzoom = ROADS_MIN_ZOOM): FillExtrusionLayerSpecification {
  return { id, type: 'fill-extrusion', source, minzoom, filter: ROAD_CURB_FILTER, paint: { ...ROAD_CURB_PAINT } }
}

/** Asphalt surface; with `traffic: true` the surface itself is coloured by `cg`. */
export function roadSurfaceLayer(
  id: string,
  source: string,
  opts: { minzoom?: number; traffic?: boolean } = {},
): FillExtrusionLayerSpecification {
  return {
    id,
    type: 'fill-extrusion',
    source,
    minzoom: opts.minzoom ?? ROADS_MIN_ZOOM,
    filter: ROAD_SURFACE_FILTER,
    paint: {
      ...ROAD_SURFACE_PAINT,
      'fill-extrusion-color': opts.traffic ? congestionColorExpr(ROAD_ASPHALT_COLOR_EXPR) : ROAD_ASPHALT_COLOR_EXPR,
    },
  }
}

/**
 * Traffic overlay on centre lines (roads-lines.geojson after withCongestion): only ways
 * with data are drawn, width grows with zoom; tunnels dashed.
 */
export function trafficLineLayer(id: string, source: string, minzoom = 12.5): LineLayerSpecification {
  return {
    id,
    type: 'line',
    source,
    minzoom,
    filter: ['has', 'cg'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': congestionColorExpr(),
      'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12.5, 1.5, 15, 3.5, 17, 8],
      'line-opacity': ['case', ['has', 'tn'], 0.45, 0.9],
    },
  }
}

/**
 * Pure: copy of a roads/roads-lines collection with `cg` set from a way_id → value map
 * (e.g. trafficForHour(traffic, h)). Ways missing from the map / null get no `cg`.
 */
export function withCongestion<P extends { way_id: number }>(
  fc: GeoJSON.FeatureCollection<GeoJSON.Geometry, P>,
  congestionByWay: ReadonlyMap<number, number | null> | Readonly<Record<string, number | null>>,
): GeoJSON.FeatureCollection<GeoJSON.Geometry, P & { cg?: number }> {
  const get =
    congestionByWay instanceof Map
      ? (id: number) => congestionByWay.get(id)
      : (id: number) => (congestionByWay as Readonly<Record<string, number | null>>)[String(id)]
  return {
    type: 'FeatureCollection',
    features: fc.features.map((f) => {
      const props: P & { cg?: number } = { ...f.properties }
      const v = get(f.properties.way_id)
      if (v == null) delete props.cg
      else props.cg = v
      return { ...f, properties: props }
    }),
  }
}
