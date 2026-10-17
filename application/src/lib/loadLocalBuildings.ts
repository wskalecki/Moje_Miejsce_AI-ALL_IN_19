import type { FeatureCollection } from 'geojson'
import osmBuildingsSampleUrl from '@data/samples/osm_buildings_sample.geojson?url'

const LOCAL_BUILDINGS_URL_BY_PATH: Record<string, string> = {
  'samples/osm_buildings_sample.geojson': osmBuildingsSampleUrl,
}

export function resolveLocalBuildingsUrl(manifestPath: string | undefined): string | null {
  if (!manifestPath) return null
  return LOCAL_BUILDINGS_URL_BY_PATH[manifestPath] ?? null
}

export async function fetchLocalBuildings(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Nie udało się załadować budynków lokalnych (${res.status})`)
  }
  return (await res.json()) as FeatureCollection
}
