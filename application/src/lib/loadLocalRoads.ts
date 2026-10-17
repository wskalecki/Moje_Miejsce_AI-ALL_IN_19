import type { FeatureCollection } from 'geojson'
import osmRoadsSampleUrl from '@data/samples/osm_roads_sample.geojson?url'

const LOCAL_ROADS_URL_BY_PATH: Record<string, string> = {
  'samples/osm_roads_sample.geojson': osmRoadsSampleUrl,
}

export function resolveLocalRoadsUrl(manifestPath: string | undefined): string | null {
  if (!manifestPath) return null
  return LOCAL_ROADS_URL_BY_PATH[manifestPath] ?? null
}

export async function fetchLocalRoads(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Nie udało się załadować lokalnych dróg (${res.status})`)
  }
  return (await res.json()) as FeatureCollection
}
