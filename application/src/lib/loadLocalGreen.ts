import type { FeatureCollection } from 'geojson'
import osmGreenSampleUrl from '@data/samples/osm_green_sample.geojson?url'

const LOCAL_GREEN_URL_BY_PATH: Record<string, string> = {
  'samples/osm_green_sample.geojson': osmGreenSampleUrl,
}

export function resolveLocalGreenUrl(manifestPath: string | undefined): string | null {
  if (!manifestPath) return null
  return LOCAL_GREEN_URL_BY_PATH[manifestPath] ?? null
}

export async function fetchLocalGreen(url: string): Promise<FeatureCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Nie udało się załadować zieleni lokalnej (${res.status})`)
  }
  return (await res.json()) as FeatureCollection
}
