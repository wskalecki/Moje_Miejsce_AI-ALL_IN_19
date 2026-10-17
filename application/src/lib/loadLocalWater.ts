import type { FeatureCollection } from 'geojson'
import osmWaterSampleUrl from '@data/samples/osm_water_sample.geojson?url'

const LOCAL_WATER_URL_BY_PATH: Record<string, string> = {
  'samples/osm_water_sample.geojson': osmWaterSampleUrl,
}

export function resolveLocalWaterUrl(manifestPath: string | undefined): string | null {
  if (!manifestPath) return null
  return LOCAL_WATER_URL_BY_PATH[manifestPath] ?? null
}

export async function fetchLocalWater(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Nie udało się załadować lokalnej wody (${res.status})`)
  }
  return (await res.json()) as FeatureCollection
}
