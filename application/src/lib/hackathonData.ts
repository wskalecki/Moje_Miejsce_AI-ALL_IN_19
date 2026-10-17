import type { FeatureCollection, Polygon } from 'geojson'
import manifest from '@data/manifest.json'
import metricsSample from '@data/samples/cell_metrics_sample.json'
import gridSampleRaw from '@data/samples/warsaw_grid_sample.geojson?raw'
import poiSampleRaw from '@data/samples/poi_sample.geojson?raw'
import poiBuildingsSampleRaw from '@data/samples/poi_buildings_sample.geojson?raw'

const gridSample = JSON.parse(gridSampleRaw) as GridFeatureCollection
const poiSample = JSON.parse(poiSampleRaw) as FeatureCollection
const poiBuildingsSample = JSON.parse(poiBuildingsSampleRaw) as FeatureCollection

export type PersonaId = 'kasia' | 'marek' | 'ania_tomek'

export type DataManifest = {
  schemaVersion: number
  files: {
    grid: string
    cellMetrics: string
    poi: string[]
    poiBuildings?: string
    localBuildings?: string
    localRoads?: string
    localGreen?: string
    localWater?: string
  }
  bbox: [number, number, number, number]
}

export type CellMetricsFile = {
  schemaVersion: number
  personas: PersonaId[]
  islands?: Partial<
    Record<
      PersonaId,
      {
        anchor: [number, number]
        radiusM: number
        label?: string
      }
    >
  >
  cells: Record<
    string,
    {
      scores: Record<PersonaId, number | null>
      metrics: Record<string, number | null>
      narrative?: { pl?: string[] }
      commute_heuristic_min?: Record<string, number>
    }
  >
}

export type GridFeatureCollection = FeatureCollection<
  Polygon,
  {
    id: string
    row: number
    col: number
    center: [number, number]
    score?: number
    parentId?: string
    fineRow?: number
    fineCol?: number
    displayScore?: number
    lift?: number
  }
>

const GRID_BY_PATH: Record<string, GridFeatureCollection> = {
  'samples/warsaw_grid_sample.geojson': gridSample as GridFeatureCollection,
}

const METRICS_BY_PATH: Record<string, CellMetricsFile> = {
  'samples/cell_metrics_sample.json': metricsSample as CellMetricsFile,
}

const POI_BY_PATH: Record<string, FeatureCollection> = {
  'samples/poi_sample.geojson': poiSample as FeatureCollection,
}

const POI_BUILDINGS_BY_PATH: Record<string, FeatureCollection> = {
  'samples/poi_buildings_sample.geojson': poiBuildingsSample as FeatureCollection,
}

export function loadHackathonData() {
  const m = manifest as unknown as DataManifest
  const grid = GRID_BY_PATH[m.files.grid]
  const cellMetrics = METRICS_BY_PATH[m.files.cellMetrics]
  const poiLayers = m.files.poi.map((p) => POI_BY_PATH[p]).filter(Boolean)
  const poiBuildings =
    (m.files.poiBuildings && POI_BUILDINGS_BY_PATH[m.files.poiBuildings]) ||
    ({ type: 'FeatureCollection', features: [] } as FeatureCollection)
  if (!grid || !cellMetrics) {
    throw new Error('Manifest paths not registered in hackathonData.ts')
  }
  return { manifest: m, grid, cellMetrics, poiLayers, poiBuildings }
}
