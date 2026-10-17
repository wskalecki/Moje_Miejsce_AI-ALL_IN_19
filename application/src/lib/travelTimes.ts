import type { FeatureCollection, Polygon } from 'geojson'
import type { ExpressionSpecification } from 'maplibre-gl'

/** [mean, min, max, reachable deadlines] in minutes, or null when the destination is out of reach. */
export type TravelValue = [number, number, number, number] | null

export type TravelTimesFile = FeatureCollection<
  Polygon,
  { id: string; district: string | null; t: Record<string, Record<string, TravelValue>> }
> & {
  metadata: {
    dzien: string
    przyjazd: { od: string; do: string; co_min: number; terminow: number }
    cele: Record<string, { nazwa: string; lon: number; lat: number }>
    tryby: string[]
  }
}

export const MODE_LABELS: Record<string, string> = {
  wszystkie: 'Wszystkie środki',
  autobus: 'Tylko autobus',
  tramwaj: 'Tylko tramwaj',
  metro: 'Tylko metro',
  kolej: 'Tylko SKM',
}

/** Minutes → colour, green (close) to red (far); shared by the map layer and the scale legend. */
export const TRAVEL_SCALE: [number, string][] = [
  [15, '#1a9850'],
  [30, '#91cf60'],
  [45, '#fee08b'],
  [60, '#fc8d59'],
  [90, '#d73027'],
]
export const UNREACHABLE_COLOR = '#6b6b78'

export const travelColorExpression = [
  'case',
  ['<', ['get', 'minutes'], 0],
  UNREACHABLE_COLOR,
  ['interpolate', ['linear'], ['get', 'minutes'], ...TRAVEL_SCALE.flat()],
] as unknown as ExpressionSpecification

/** One flat `minutes` property per cell for the chosen destination and mode (−1 = unreachable). */
export function travelLayerData(file: TravelTimesFile, target: string, mode: string) {
  return {
    type: 'FeatureCollection' as const,
    features: file.features.map((f) => ({
      type: 'Feature' as const,
      geometry: f.geometry,
      properties: { id: f.properties.id, minutes: f.properties.t[target]?.[mode]?.[0] ?? -1 },
    })),
  }
}

export function formatTravel(value: TravelValue, deadlines: number): string {
  if (!value) return '—'
  const [mean, low, high, n] = value
  const range = Math.round(low) === Math.round(high) ? '' : ` (${Math.round(low)}–${Math.round(high)})`
  const partial = n < deadlines ? `, ${n}/${deadlines} terminów` : ''
  return `${Math.round(mean)} min${range}${partial}`
}
