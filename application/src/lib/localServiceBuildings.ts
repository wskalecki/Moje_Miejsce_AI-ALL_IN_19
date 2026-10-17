import type { Feature, FeatureCollection, Geometry, Point, Polygon } from 'geojson'
import type { ExpressionSpecification } from 'maplibre-gl'
import type { PickedServiceBuilding } from './mapBasemapBuildingHighlight'
import { inferBuildingStyleTier } from './localBuildingMaterials'

export const LOCAL_BUILDINGS_SOURCE = 'siatka-local-buildings'
export const LOCAL_BUILDINGS_LAYER = 'siatka-local-buildings-extrusion'

export const LOCAL_BUILDING_DEFAULT_COLOR = '#c5c0b8'

export const LOCAL_BUILDING_COLOR_EXPR: ExpressionSpecification = [
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
  LOCAL_BUILDING_DEFAULT_COLOR,
]

export type LocalBuildingProps = {
  osm_id: string
  building?: string
  name?: string | null
  height?: number | null
  min_height?: number
  category?: string | null
  poi_id?: string | null
  style_tier?: 'tower' | 'block' | 'detached'
}

function ringArea(ring: number[][]): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  }
  return Math.abs(sum / 2)
}

function polygonArea(geometry: Polygon): number {
  return ringArea(geometry.coordinates[0])
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
  if (geometry.type !== 'Polygon') return false
  const poly = geometry as Polygon
  if (!pointInRing(lon, lat, poly.coordinates[0])) return false
  for (let h = 1; h < poly.coordinates.length; h++) {
    if (pointInRing(lon, lat, poly.coordinates[h])) return false
  }
  return true
}

function buildingId(feature: Feature): string | null {
  const props = feature.properties as LocalBuildingProps | null
  const raw = props?.osm_id ?? feature.id
  if (raw == null || raw === '') return null
  return String(raw)
}

/** Najmniejszy budynek zawierający punkt POI (lub null). */
export function matchPoiToLocalBuilding(
  poiLon: number,
  poiLat: number,
  buildings: FeatureCollection,
): Feature | null {
  let best: Feature | null = null
  let bestArea = Infinity

  for (const f of buildings.features) {
    if (!f.geometry || f.geometry.type !== 'Polygon') continue
    if (!geometryContainsPoint(f.geometry, poiLon, poiLat)) continue
    const area = polygonArea(f.geometry as Polygon)
    if (area >= bestArea) continue
    best = f
    bestArea = area
  }

  return best
}

export function autoMatchPoisToLocalBuildings(
  poi: FeatureCollection,
  buildings: FeatureCollection,
): PickedServiceBuilding[] {
  const picks: PickedServiceBuilding[] = []
  const seen = new Set<string>()

  for (const f of poi.features) {
    if (f.geometry.type !== 'Point') continue
    const [lon, lat] = (f.geometry as Point).coordinates
    const category = (f.properties?.category as string) ?? 'default'
    const hit = matchPoiToLocalBuilding(lon, lat, buildings)
    const osmId = hit ? buildingId(hit) : null
    if (!osmId || seen.has(osmId)) continue
    seen.add(osmId)
    picks.push({ highlightId: osmId, category })
  }

  return picks
}

export function pickLocalBuildingAtLngLat(
  lon: number,
  lat: number,
  buildings: FeatureCollection,
  category: string,
): PickedServiceBuilding | null {
  const hit = matchPoiToLocalBuilding(lon, lat, buildings)
  const osmId = hit ? buildingId(hit) : null
  if (!osmId) return null
  return { highlightId: osmId, category }
}

export function mergeLocalBuildingPicks(
  fromPoi: PickedServiceBuilding[],
  manual: PickedServiceBuilding[],
): Map<string, string> {
  const byId = new Map<string, string>()
  for (const p of fromPoi) byId.set(p.highlightId, p.category)
  for (const p of manual) byId.set(p.highlightId, p.category)
  return byId
}

/**
 * Kopiuje kolekcję, ustawia `style_tier` i opcjonalnie `category` (podświetlenie POI).
 * Budynki są zawsze na mapie — `showPoiHighlights` tylko steruje kolorami usług.
 */
export function localBuildingsForMap(
  buildings: FeatureCollection,
  categoryByOsmId: Map<string, string>,
  showPoiHighlights: boolean,
): FeatureCollection {
  const features = buildings.features.map((f) => {
    const osmId = buildingId(f)
    const fromPick = osmId ? categoryByOsmId.get(osmId) : undefined
    const fromFile = (f.properties as LocalBuildingProps | null)?.category
    const props = { ...(f.properties ?? {}) } as LocalBuildingProps
    props.style_tier = inferBuildingStyleTier(props, f.geometry)
    if (showPoiHighlights) {
      props.category = fromPick ?? fromFile ?? null
    } else {
      props.category = null
    }
    return { ...f, properties: props }
  })

  return { type: 'FeatureCollection', features }
}
