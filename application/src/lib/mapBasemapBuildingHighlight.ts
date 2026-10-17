import type {
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson'
import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  Map,
  MapGeoJSONFeature,
} from 'maplibre-gl'
import { MAP_POI_DETAIL_MIN_ZOOM } from './mapDetailZoom'
import { POI_BUILDING_EXTRUSION_OPACITY_EXPR } from './mapPoiBuildingHighlights'

export const POI_BASEMAP_HIGHLIGHT_LAYER = 'siatka-poi-basemap-highlight'
export const BASEMAP_3D_BUILDINGS_LAYER = '3d-buildings'
export const POI_PICK_MIN_ZOOM = MAP_POI_DETAIL_MIN_ZOOM

const BUILDING_SOURCE_LAYER = 'building'

const CARTO_EXTRUDE_FILTER: FilterSpecification = ['==', ['get', 'extrude'], 'true']
const MAPTILER_3D_FILTER: FilterSpecification = ['!', ['has', 'hide_3d']]

export const BUILDING_HIGHLIGHT_ID_EXPR: ExpressionSpecification = [
  'to-string',
  ['coalesce', ['get', 'osm_id'], ['get', 'id'], ['id']],
]

export type BuildingLayerMeta = {
  source: string
  sourceLayer: string
}

export type BasemapBuildingStack = BuildingLayerMeta & {
  fillLayerId: string | null
  extrusionLayerId: string
  render3dFilter: FilterSpecification
  queryLayerIds: string[]
}

/** Id do filtra warstwy (Carto: `osm_id`; MapTiler: często tylko MVT feature id). */
export type PickedServiceBuilding = {
  highlightId: string
  category: string
}

const CATEGORY_COLORS: Record<string, string> = {
  transit: '#2f6fd4',
  education: '#4a9fe8',
  environment: '#5ec4f0',
  amenity: '#6a9fff',
  sport: '#4a9fd9',
  culture: '#6b8fd4',
  manual: '#d946ef',
  default: '#4a9fe8',
}

export const MANUAL_PAINT_CATEGORIES: { id: string; label: string }[] = [
  { id: 'manual', label: 'Ręczny (fiolet)' },
  { id: 'education', label: 'Edukacja' },
  { id: 'transit', label: 'Komunikacja' },
  { id: 'environment', label: 'Zieleń' },
  { id: 'amenity', label: 'Usługa' },
]

export const BUILDING_EXTRUSION_HEIGHT_EXPR: ExpressionSpecification = [
  'coalesce',
  ['get', 'height'],
  ['get', 'render_height'],
  14,
]

export const BUILDING_EXTRUSION_BASE_EXPR: ExpressionSpecification = [
  'coalesce',
  ['get', 'min_height'],
  ['get', 'render_min_height'],
  0,
]

const EMPTY_HIGHLIGHT_FILTER: FilterSpecification = [
  '==',
  BUILDING_HIGHLIGHT_ID_EXPR,
  '__siatka_brak__',
]

type VectorLayerRef = {
  id: string
  type: string
  source?: string
  'source-layer'?: string
  filter?: FilterSpecification
}

function isBuildingVectorLayer(l: VectorLayerRef): boolean {
  return l['source-layer'] === BUILDING_SOURCE_LAYER && Boolean(l.source)
}

/** MapTiler / starsze style używają skrótu `!has`; MapLibre wymaga `['!', ['has', key]]`. */
export function normalizeBuildingRender3dFilter(
  filter: FilterSpecification | undefined,
): FilterSpecification | undefined {
  if (!filter || !Array.isArray(filter)) return filter

  if (filter[0] === '!has' && typeof filter[1] === 'string') {
    return ['!', ['has', filter[1]]]
  }
  if (filter[0] === 'has' && typeof filter[1] === 'string') {
    return ['has', filter[1]]
  }
  if (filter[0] === 'all' || filter[0] === 'any') {
    return [
      filter[0],
      ...filter.slice(1).map((part) =>
        normalizeBuildingRender3dFilter(part as FilterSpecification),
      ),
    ] as FilterSpecification
  }

  return filter
}

export function render3dFilterForExtrusionLayer(
  layer: VectorLayerRef | undefined,
): FilterSpecification {
  if (layer?.filter) {
    return (
      normalizeBuildingRender3dFilter(layer.filter) ?? MAPTILER_3D_FILTER
    )
  }
  if (layer?.id === BASEMAP_3D_BUILDINGS_LAYER) return CARTO_EXTRUDE_FILTER
  if (layer?.source === 'maptiler_planet') return MAPTILER_3D_FILTER
  return CARTO_EXTRUDE_FILTER
}

/** Pure resolver — używany w testach i przez `resolveBasemapBuildingStack`. */
export function resolveBasemapBuildingStackFromLayers(
  layers: VectorLayerRef[],
  layerExists: (id: string) => boolean = () => true,
): BasemapBuildingStack | null {
  const buildingLayers = layers.filter(isBuildingVectorLayer)
  if (buildingLayers.length === 0) return null

  const fillLayer = buildingLayers.find((l) => l.type === 'fill')
  const styleExtrusion = buildingLayers.find(
    (l) =>
      l.type === 'fill-extrusion' &&
      l.id !== POI_BASEMAP_HIGHLIGHT_LAYER &&
      l.id !== BASEMAP_3D_BUILDINGS_LAYER,
  )

  const source = fillLayer?.source ?? styleExtrusion?.source
  const sourceLayer = fillLayer?.['source-layer'] ?? styleExtrusion?.['source-layer']
  if (!source || !sourceLayer) return null

  let extrusionLayerId: string | null = null
  if (styleExtrusion && layerExists(styleExtrusion.id)) {
    extrusionLayerId = styleExtrusion.id
  } else if (layerExists(BASEMAP_3D_BUILDINGS_LAYER)) {
    extrusionLayerId = BASEMAP_3D_BUILDINGS_LAYER
  }

  const extrusionLayerDef =
    extrusionLayerId === styleExtrusion?.id
      ? styleExtrusion
      : extrusionLayerId === BASEMAP_3D_BUILDINGS_LAYER
        ? buildingLayers.find((l) => l.id === BASEMAP_3D_BUILDINGS_LAYER)
        : undefined

  const fillLayerId =
    fillLayer && layerExists(fillLayer.id) ? fillLayer.id : null

  const queryLayerIds: string[] = []
  if (extrusionLayerId && layerExists(extrusionLayerId)) {
    queryLayerIds.push(extrusionLayerId)
  }
  if (fillLayerId && !queryLayerIds.includes(fillLayerId)) {
    queryLayerIds.push(fillLayerId)
  }
  for (const legacyId of ['building', 'building-top', 'Building', 'Building 3D']) {
    if (layerExists(legacyId) && !queryLayerIds.includes(legacyId)) {
      queryLayerIds.push(legacyId)
    }
  }

  if (!extrusionLayerId && queryLayerIds.length === 0) return null

  return {
    source,
    sourceLayer,
    fillLayerId,
    extrusionLayerId: extrusionLayerId ?? queryLayerIds[0],
    render3dFilter: render3dFilterForExtrusionLayer(extrusionLayerDef),
    queryLayerIds,
  }
}

export function resolveBasemapBuildingStack(map: Map): BasemapBuildingStack | null {
  const layers = (map.getStyle().layers ?? []) as VectorLayerRef[]
  return resolveBasemapBuildingStackFromLayers(layers, (id) => Boolean(map.getLayer(id)))
}

export function resolveBuildingLayerMeta(map: Map): BuildingLayerMeta | null {
  const stack = resolveBasemapBuildingStack(map)
  if (!stack) return null
  return { source: stack.source, sourceLayer: stack.sourceLayer }
}

export function buildingQueryLayerIds(map: Map): string[] {
  const stack = resolveBasemapBuildingStack(map)
  if (!stack) return []
  return stack.queryLayerIds.filter((id) => map.getLayer(id))
}

export function raiseBuildingLayersAboveGrid(map: Map) {
  const stack = resolveBasemapBuildingStack(map)
  const ids = new Set<string>([POI_BASEMAP_HIGHLIGHT_LAYER])
  if (stack?.extrusionLayerId) ids.add(stack.extrusionLayerId)
  if (map.getLayer(BASEMAP_3D_BUILDINGS_LAYER)) {
    ids.add(BASEMAP_3D_BUILDINGS_LAYER)
  }
  for (const id of ids) {
    if (map.getLayer(id)) map.moveLayer(id)
  }
}

export function styleHasBuildingExtrusionLayer(layers: LayerSpecification[]): boolean {
  return layers.some(
    (l) =>
      l.type === 'fill-extrusion' &&
      (l as { 'source-layer'?: string })['source-layer'] === BUILDING_SOURCE_LAYER &&
      l.id !== POI_BASEMAP_HIGHLIGHT_LAYER &&
      l.id !== BASEMAP_3D_BUILDINGS_LAYER,
  )
}

type FeatureWithHighlightId = {
  properties?: Record<string, unknown> | null
  id?: string | number | undefined
}

export function highlightIdFromFeature(f: FeatureWithHighlightId): string | null {
  const props = f.properties ?? {}
  const raw = props.osm_id ?? props.id ?? f.id
  if (raw == null || raw === '') return null
  return String(raw)
}

export function pickedFromMapFeature(
  f: MapGeoJSONFeature,
  category: string,
): PickedServiceBuilding | null {
  const highlightId = highlightIdFromFeature(f)
  if (!highlightId) return null
  return { highlightId, category }
}

function pointInRing(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function geometryContainsPoint(geometry: Geometry, lon: number, lat: number): boolean {
  if (geometry.type === 'Polygon') {
    const poly = geometry as Polygon
    if (!pointInRing(lon, lat, poly.coordinates[0])) return false
    for (let h = 1; h < poly.coordinates.length; h++) {
      if (pointInRing(lon, lat, poly.coordinates[h])) return false
    }
    return true
  }
  if (geometry.type === 'MultiPolygon') {
    const mp = geometry as MultiPolygon
    return mp.coordinates.some((poly) =>
      geometryContainsPoint({ type: 'Polygon', coordinates: poly }, lon, lat),
    )
  }
  return false
}

function ringArea(ring: number[][]): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(sum / 2)
}

function geometryArea(geometry: Geometry): number {
  if (geometry.type === 'Polygon') return ringArea(geometry.coordinates[0])
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce(
      (acc, poly) => acc + ringArea(poly[0]),
      0,
    )
  }
  return Infinity
}

function pickFromRendered(
  map: Map,
  lon: number,
  lat: number,
  layerIds: string[],
  category: string,
): PickedServiceBuilding | null {
  const p = map.project([lon, lat])
  for (const radius of [8, 20, 40, 72, 120]) {
    const box: [[number, number], [number, number]] = [
      [p.x - radius, p.y - radius],
      [p.x + radius, p.y + radius],
    ]
    const hits = map.queryRenderedFeatures(box, { layers: layerIds })
    const pick = chooseSmallestBuilding(hits, category)
    if (pick) return pick
  }

  const top = map.queryRenderedFeatures(p, { layers: layerIds })
  return chooseSmallestBuilding(top, category)
}

function chooseSmallestBuilding(
  hits: MapGeoJSONFeature[],
  category: string,
): PickedServiceBuilding | null {
  if (hits.length === 0) return null

  const sorted = [...hits].sort((a, b) => {
    const areaA = a.geometry ? geometryArea(a.geometry as Geometry) : Infinity
    const areaB = b.geometry ? geometryArea(b.geometry as Geometry) : Infinity
    return areaA - areaB
  })

  for (const f of sorted) {
    const pick = pickedFromMapFeature(f, category)
    if (pick) return pick
  }
  return null
}

function pickFromSourceTiles(
  map: Map,
  lon: number,
  lat: number,
  meta: BuildingLayerMeta,
  category: string,
): PickedServiceBuilding | null {
  const features = map.querySourceFeatures(meta.source, {
    sourceLayer: meta.sourceLayer,
  })

  let bestId: string | null = null
  let bestArea = Infinity

  for (const f of features) {
    if (!f.geometry) continue
    if (!geometryContainsPoint(f.geometry as Geometry, lon, lat)) continue
    const area = geometryArea(f.geometry as Geometry)
    if (area >= bestArea) continue
    const highlightId = highlightIdFromFeature(f)
    if (!highlightId) continue
    bestId = highlightId
    bestArea = area
  }

  if (!bestId) return null
  return { highlightId: bestId, category }
}

export function pickBuildingAtCoordinate(
  map: Map,
  lon: number,
  lat: number,
  category: string,
): PickedServiceBuilding | null {
  const layerIds = buildingQueryLayerIds(map)
  const meta = resolveBuildingLayerMeta(map)

  if (layerIds.length > 0) {
    const rendered = pickFromRendered(map, lon, lat, layerIds, category)
    if (rendered) return rendered
  }

  if (meta) {
    const fromTiles = pickFromSourceTiles(map, lon, lat, meta, category)
    if (fromTiles) return fromTiles
  }

  return null
}

export function pickBuildingAtClick(
  map: Map,
  e: {
    lngLat: { lng: number; lat: number }
    point: { x: number; y: number }
    features?: MapGeoJSONFeature[]
  },
  category: string,
): PickedServiceBuilding | null {
  const layerIds = new Set(buildingQueryLayerIds(map))

  if (e.features?.length) {
    const buildingHits = e.features.filter((f) => f.layer && layerIds.has(f.layer.id))
    const fromEvent = chooseSmallestBuilding(buildingHits.length ? buildingHits : e.features, category)
    if (fromEvent) return fromEvent
  }

  if (layerIds.size > 0) {
    const atPoint = map.queryRenderedFeatures([e.point.x, e.point.y], {
      layers: [...layerIds],
    })
    const fromPoint = chooseSmallestBuilding(atPoint, category)
    if (fromPoint) return fromPoint
  }

  return pickBuildingAtCoordinate(map, e.lngLat.lng, e.lngLat.lat, category)
}

export function pickBuildingsForPois(
  map: Map,
  poi: FeatureCollection,
  layerIds: string[],
): PickedServiceBuilding[] {
  if (map.getZoom() < POI_PICK_MIN_ZOOM || layerIds.length === 0) return []

  const picks: PickedServiceBuilding[] = []
  const seen = new Set<string>()

  for (const f of poi.features) {
    if (f.geometry.type !== 'Point') continue
    const [lon, lat] = (f.geometry as Point).coordinates
    const category = (f.properties?.category as string) ?? 'default'
    const hit = pickFromRendered(map, lon, lat, layerIds, category)
    if (!hit) continue
    if (seen.has(hit.highlightId)) continue
    seen.add(hit.highlightId)
    picks.push(hit)
  }

  return picks
}

export function mergeBuildingPicks(
  fromPoi: PickedServiceBuilding[],
  manual: PickedServiceBuilding[],
): PickedServiceBuilding[] {
  const byId = new globalThis.Map<string, PickedServiceBuilding>()
  for (const p of fromPoi) byId.set(p.highlightId, p)
  for (const p of manual) byId.set(p.highlightId, p)
  return [...byId.values()]
}

function buildHighlightColorExpression(picks: PickedServiceBuilding[]): ExpressionSpecification {
  if (picks.length === 0) {
    return ['literal', CATEGORY_COLORS.default] as ExpressionSpecification
  }
  const stops: (string | ExpressionSpecification)[] = []
  for (const p of picks) {
    stops.push(p.highlightId, CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.default)
  }
  return ['match', BUILDING_HIGHLIGHT_ID_EXPR, ...stops, CATEGORY_COLORS.default] as ExpressionSpecification
}

function buildHighlightIdFilter(ids: string[]): FilterSpecification {
  if (ids.length === 0) return EMPTY_HIGHLIGHT_FILTER
  return ['in', BUILDING_HIGHLIGHT_ID_EXPR, ['literal', ids]]
}

export function applyBasemapBuildingHighlights(
  map: Map,
  stack: BasemapBuildingStack,
  picks: PickedServiceBuilding[],
): void {
  const ids = picks.map((p) => p.highlightId)
  const include = buildHighlightIdFilter(ids)
  const { extrusionLayerId } = stack
  const render3dFilter =
    normalizeBuildingRender3dFilter(stack.render3dFilter) ?? CARTO_EXTRUDE_FILTER

  const exclude: FilterSpecification =
    ids.length === 0
      ? render3dFilter
      : (['all', render3dFilter, ['!', include]] as FilterSpecification)

  if (map.getLayer(extrusionLayerId)) {
    map.setFilter(extrusionLayerId, exclude)
  }
  if (
    extrusionLayerId !== BASEMAP_3D_BUILDINGS_LAYER &&
    map.getLayer(BASEMAP_3D_BUILDINGS_LAYER)
  ) {
    map.setFilter(BASEMAP_3D_BUILDINGS_LAYER, exclude)
  }

  if (map.getLayer(POI_BASEMAP_HIGHLIGHT_LAYER)) {
    map.setFilter(
      POI_BASEMAP_HIGHLIGHT_LAYER,
      ['all', render3dFilter, include] as FilterSpecification,
    )
    map.setPaintProperty(
      POI_BASEMAP_HIGHLIGHT_LAYER,
      'fill-extrusion-color',
      buildHighlightColorExpression(picks),
    )
  }
}

export function addBasemapServiceBuildingLayer(map: Map, stack: BasemapBuildingStack) {
  if (map.getLayer(POI_BASEMAP_HIGHLIGHT_LAYER)) return

  map.addLayer({
    id: POI_BASEMAP_HIGHLIGHT_LAYER,
    type: 'fill-extrusion',
    source: stack.source,
    'source-layer': stack.sourceLayer,
    filter: EMPTY_HIGHLIGHT_FILTER,
    minzoom: POI_PICK_MIN_ZOOM,
    paint: {
      'fill-extrusion-color': CATEGORY_COLORS.default,
      'fill-extrusion-height': BUILDING_EXTRUSION_HEIGHT_EXPR,
      'fill-extrusion-base': BUILDING_EXTRUSION_BASE_EXPR,
      'fill-extrusion-opacity': POI_BUILDING_EXTRUSION_OPACITY_EXPR,
    },
  })
}
