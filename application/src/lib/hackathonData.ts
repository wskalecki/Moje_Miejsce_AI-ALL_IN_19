import type { FeatureCollection, Geometry, Point, Polygon } from 'geojson'
import manifest from '@data/manifest.json'
import metricsSample from '@data/samples/cell_metrics_sample.json'
import gridSampleRaw from '@data/samples/warsaw_grid_sample.geojson?raw'
import poiSampleRaw from '@data/samples/poi_sample.geojson?raw'

const gridSample = JSON.parse(gridSampleRaw) as GridFeatureCollection
const poiSample = JSON.parse(poiSampleRaw) as PoiFeatureCollection

// ETL outputs are gitignored, so they may be absent; a lazy glob just finds nothing then.
const ETL_FILES = import.meta.glob<string>(['../../../data/poi/*.geojson', '../../../data/lines/*.geojson'], {
  query: '?raw',
  import: 'default',
})

export type PersonaId = 'kasia' | 'marek' | 'ania_tomek'

export type DataManifest = {
  schemaVersion: number
  files: {
    grid: string
    cellMetrics: string
    poi: string[]
    poiFallback?: string[]
    lines?: string[]
  }
  bbox: [number, number, number, number]
}

export type CellMetricsFile = {
  schemaVersion: number
  personas: PersonaId[]
  cells: Record<
    string,
    {
      scores: Record<PersonaId, number>
      metrics: Record<string, number | null>
      narrative?: { pl?: string[] }
      commute_heuristic_min?: Record<string, number>
    }
  >
}

export type GridFeatureCollection = FeatureCollection<
  Polygon,
  { id: string; row: number; col: number; center: [number, number]; score?: number }
>

const GRID_BY_PATH: Record<string, GridFeatureCollection> = {
  'samples/warsaw_grid_sample.geojson': gridSample as GridFeatureCollection,
}

const METRICS_BY_PATH: Record<string, CellMetricsFile> = {
  'samples/cell_metrics_sample.json': metricsSample as CellMetricsFile,
}

export type PoiProperties = {
  id: string
  category: string
  subtype: string
  name?: string | null
  source: string
  sourceId: string
  cell_id: string
  district?: string | null
  tags?: string[]
  meta?: Record<string, unknown>
}

export type PoiFeatureCollection = FeatureCollection<Point, PoiProperties>

/** Lines and areas (road works, tourist routes): every crossed cell instead of one cell_id. */
export type LineProperties = Omit<PoiProperties, 'cell_id' | 'district'> & {
  cell_ids: string[]
  districts: string[]
}

export type LineFeatureCollection = FeatureCollection<Geometry, LineProperties>

const SAMPLE_POI_BY_PATH: Record<string, PoiFeatureCollection> = {
  'samples/poi_sample.geojson': poiSample,
}

async function loadEtlFile<T>(path: string): Promise<T | null> {
  const load = ETL_FILES[`../../../data/${path}`]
  return load ? (JSON.parse(await load()) as T) : null
}

export function loadHackathonData() {
  const m = manifest as unknown as DataManifest
  const grid = GRID_BY_PATH[m.files.grid]
  const cellMetrics = METRICS_BY_PATH[m.files.cellMetrics]
  if (!grid || !cellMetrics) {
    throw new Error('Manifest paths not registered in hackathonData.ts')
  }
  return { manifest: m, grid, cellMetrics }
}

/** POI files listed in the manifest; the fallback samples when no ETL output is present. */
export async function loadPoiLayers(m: DataManifest): Promise<{ layers: PoiFeatureCollection[]; isSample: boolean }> {
  const found = await Promise.all(m.files.poi.map((path) => loadEtlFile<PoiFeatureCollection>(path)))
  const layers = found.filter((fc): fc is PoiFeatureCollection => fc !== null)
  if (layers.length > 0) return { layers, isSample: false }
  const fallback = (m.files.poiFallback ?? []).map((p) => SAMPLE_POI_BY_PATH[p]).filter(Boolean)
  return { layers: fallback, isSample: true }
}

/** Line files listed in the manifest that are present; there is no sample for lines. */
export async function loadLineLayers(m: DataManifest): Promise<LineFeatureCollection[]> {
  const found = await Promise.all((m.files.lines ?? []).map((path) => loadEtlFile<LineFeatureCollection>(path)))
  return found.filter((fc): fc is LineFeatureCollection => fc !== null)
}
