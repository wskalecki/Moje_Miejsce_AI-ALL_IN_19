/**
 * Building extrusion style for public/data/3d/<msiId>/buildings.geojson.
 *
 * Adapted from feat/grid-tile-lab (application/src/lib/localBuildingMaterials.ts,
 * localServiceBuildings.ts: colour by category, then warm "material" neutrals by
 * height tier). Here the colour comes from the precomputed `kind` property
 * (see data/scripts/osm3d/build_osm3d.py), so no client-side POI matching is needed.
 *
 * Feature properties: id (number), h (m), mh (m), kind, name?, poi?
 */
import type {
  ExpressionSpecification,
  FillExtrusionLayerSpecification,
  FilterSpecification,
  GeoJSONSourceSpecification,
} from 'maplibre-gl'

export const BUILDING_KINDS = [
  'kindergarten',
  'school',
  'college',
  'university',
  'clinic',
  'hospital',
  'church',
  'culture',
  'public',
  'office',
  'retail',
  'residential',
  'other',
] as const
export type BuildingKind = (typeof BUILDING_KINDS)[number]

export type BuildingProps = {
  id: number
  h: number
  mh: number
  kind: BuildingKind
  name?: string
  /** POI subtype (data/poi) whose point lies in the footprint, even if kind stayed residential. */
  poi?: 'kindergarten' | 'school' | 'university' | 'clinic'
}

export type BuildingGroup = 'education' | 'health' | 'culture' | 'civic' | 'commerce' | 'housing'

export type BuildingLegendItem = {
  kind: BuildingKind
  label: string
  color: string
  group: BuildingGroup
}

/** Residential/other colours step with height (houses light → blocks → towers), like tile-lab tiers. */
export const RESIDENTIAL_TIERS: ReadonlyArray<readonly [heightM: number, color: string]> = [
  [0, '#efe6d6'],
  [9, '#e4d5bf'],
  [18, '#d6c3a7'],
  [32, '#c7b294'],
  [60, '#b8a487'],
]

/** Legend in display order (PL labels). `color` is the swatch used on the map. */
export const BUILDING_LEGEND: readonly BuildingLegendItem[] = [
  { kind: 'kindergarten', label: 'Przedszkole', color: '#8cbcf0', group: 'education' },
  { kind: 'school', label: 'Szkoła', color: '#4a8fe0', group: 'education' },
  { kind: 'college', label: 'Szkoła wyższa / kolegium', color: '#3570c4', group: 'education' },
  { kind: 'university', label: 'Uczelnia', color: '#2a55a3', group: 'education' },
  { kind: 'clinic', label: 'Przychodnia', color: '#4cc1b3', group: 'health' },
  { kind: 'hospital', label: 'Szpital', color: '#16928a', group: 'health' },
  { kind: 'church', label: 'Kościół / świątynia', color: '#8b6fc6', group: 'culture' },
  { kind: 'culture', label: 'Kultura (biblioteka, teatr, muzeum)', color: '#b08ce0', group: 'culture' },
  { kind: 'public', label: 'Urząd / budynek publiczny', color: '#8fa1b5', group: 'civic' },
  { kind: 'office', label: 'Biura / hotel', color: '#b4bcc8', group: 'commerce' },
  { kind: 'retail', label: 'Handel i usługi', color: '#d6a77a', group: 'commerce' },
  { kind: 'residential', label: 'Mieszkalny', color: '#d6c3a7', group: 'housing' },
  { kind: 'other', label: 'Inny / gospodarczy', color: '#cdc8c0', group: 'housing' },
]

export const BUILDING_KIND_COLOR: Readonly<Record<BuildingKind, string>> = Object.fromEntries(
  BUILDING_LEGEND.map((i) => [i.kind, i.color]),
) as Record<BuildingKind, string>

export const BUILDING_KIND_LABEL: Readonly<Record<BuildingKind, string>> = Object.fromEntries(
  BUILDING_LEGEND.map((i) => [i.kind, i.label]),
) as Record<BuildingKind, string>

export const PUBLIC_BUILDING_KINDS: readonly BuildingKind[] = BUILDING_LEGEND.filter(
  (i) => i.group !== 'commerce' && i.group !== 'housing',
).map((i) => i.kind)

const HEIGHT_EXPR: ExpressionSpecification = ['coalesce', ['get', 'h'], 9]

const RESIDENTIAL_COLOR_EXPR = [
  'interpolate',
  ['linear'],
  HEIGHT_EXPR,
  ...RESIDENTIAL_TIERS.flat(),
] as ExpressionSpecification

/** Slightly cooler neutral for ancillary/unknown buildings so housing reads warmer. */
const OTHER_COLOR_EXPR = [
  'interpolate',
  ['linear'],
  HEIGHT_EXPR,
  0,
  '#d6d2cb',
  20,
  '#c6c1b9',
  60,
  '#b5b0a8',
] as ExpressionSpecification

/**
 * `fill-extrusion-color` expression. With `focusKinds`, every other kind is drawn in a
 * muted neutral (for "solo category" hover); service kinds keep their colour.
 */
export function buildingColorExpr(focusKinds?: readonly BuildingKind[]): ExpressionSpecification {
  const muted = '#d9d6d0'
  const pairs: (string | ExpressionSpecification)[] = []
  for (const item of BUILDING_LEGEND) {
    if (item.kind === 'residential' || item.kind === 'other') continue
    const on = !focusKinds || focusKinds.includes(item.kind)
    pairs.push(item.kind, on ? item.color : muted)
  }
  const residential = !focusKinds || focusKinds.includes('residential') ? RESIDENTIAL_COLOR_EXPR : muted
  const other = !focusKinds || focusKinds.includes('other') ? OTHER_COLOR_EXPR : muted
  return ['match', ['get', 'kind'], ...pairs, 'residential', residential, other] as unknown as ExpressionSpecification
}

export const BUILDING_COLOR_EXPR: ExpressionSpecification = buildingColorExpr()

export const BUILDING_PAINT = {
  'fill-extrusion-color': BUILDING_COLOR_EXPR,
  'fill-extrusion-height': ['max', HEIGHT_EXPR, 3] as ExpressionSpecification,
  'fill-extrusion-base': ['coalesce', ['get', 'mh'], 0] as ExpressionSpecification,
  'fill-extrusion-opacity': 0.94,
  'fill-extrusion-vertical-gradient': true,
} satisfies FillExtrusionLayerSpecification['paint']

/** Footprints appear at this zoom (tile-lab: MAP_LOCAL_BUILDINGS_MIN_ZOOM). */
export const BUILDINGS_MIN_ZOOM = 14.5

export function buildingSource(url: string): GeoJSONSourceSpecification {
  // promoteId lets the map use feature-state (hover/selection) keyed by OSM id.
  return { type: 'geojson', data: url, promoteId: 'id' }
}

export function buildingKindFilter(kinds: readonly BuildingKind[]): FilterSpecification {
  return ['in', ['get', 'kind'], ['literal', [...kinds]]]
}

export function buildingLayer(
  id: string,
  source: string,
  opts: { minzoom?: number; focusKinds?: readonly BuildingKind[]; filter?: FilterSpecification } = {},
): FillExtrusionLayerSpecification {
  return {
    id,
    type: 'fill-extrusion',
    source,
    minzoom: opts.minzoom ?? BUILDINGS_MIN_ZOOM,
    ...(opts.filter ? { filter: opts.filter } : {}),
    paint: {
      ...BUILDING_PAINT,
      'fill-extrusion-color': opts.focusKinds ? buildingColorExpr(opts.focusKinds) : BUILDING_COLOR_EXPR,
    },
  }
}

/**
 * Feature-state highlight (set `{ selected: true }` via map.setFeatureState) on top of
 * the kind colour — wraps any colour expression.
 */
export function withSelectedHighlight(color: ExpressionSpecification, highlight = '#f2b53a'): ExpressionSpecification {
  return ['case', ['boolean', ['feature-state', 'selected'], false], highlight, color]
}

export function isPublicBuilding(props: Pick<BuildingProps, 'kind'>): boolean {
  return PUBLIC_BUILDING_KINDS.includes(props.kind)
}
