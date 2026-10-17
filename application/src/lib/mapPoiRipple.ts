import type { FeatureCollection, Point } from 'geojson'

/** Kotwice wysp demo: szkoła, komunikacja, park (bez punktów usługowych). */
export const POI_RIPPLE_CATEGORIES = new Set(['education', 'transit', 'environment'])

export type RippleAnchor = { lon: number; lat: number; id: string }

export function poiRippleAnchorsFromCollections(
  collections: FeatureCollection[],
): RippleAnchor[] {
  const anchors: RippleAnchor[] = []
  for (const fc of collections) {
    for (const f of fc.features) {
      const category = f.properties?.category as string | undefined
      if (!category || !POI_RIPPLE_CATEGORIES.has(category)) continue
      if (f.geometry.type !== 'Point') continue
      const [lon, lat] = (f.geometry as Point).coordinates
      const id = (f.properties?.id as string) ?? f.id?.toString() ?? `${lon},${lat}`
      anchors.push({ lon, lat, id })
    }
  }
  return anchors
}

/** ~200 m komórka; opóźnienie rośnie z odległością od najbliższej kotwicy. */
export const RIPPLE_RING_SPACING_M = 200
export const RIPPLE_MS_PER_RING = 64

export function distanceMeters(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a
  const [lon2, lat2] = b
  const toRad = (d: number) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function rippleDelayMs(
  cellCenter: [number, number],
  anchors: RippleAnchor[],
): number {
  if (anchors.length === 0) return 0
  let minM = Infinity
  for (const a of anchors) {
    const d = distanceMeters(cellCenter, [a.lon, a.lat])
    if (d < minM) minM = d
  }
  const rings = Math.max(0, Math.floor(minM / RIPPLE_RING_SPACING_M))
  return rings * RIPPLE_MS_PER_RING
}
