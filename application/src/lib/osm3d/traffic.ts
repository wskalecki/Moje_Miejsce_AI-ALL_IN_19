/**
 * Types + pure helpers for public/data/3d/<msiId>/traffic.json
 * (built by data/scripts/osm3d/build_traffic.py from the ZTM GTFS timetable).
 *
 * Values are a schedule-based congestion proxy (0 = the way's fastest scheduled hour,
 * higher = ZTM plans slower running), NOT live traffic. null = no bus/tram data.
 */
export type TrafficDoc = {
  hours: number[]
  /** way_id → 24 values (index = hour), 0–1 or null */
  ways: Record<string, (number | null)[]>
  area: {
    /** median congestion over ways with data, per hour */
    median: (number | null)[]
    /** median scheduled bus/tram speed (km/h), per hour */
    speedKmh: (number | null)[]
    /** number of ways with data, per hour */
    ways: number[]
  }
  serviceDate: string
  method: string
  source: string
  modes: { bus: number; tram: number }
  waysTotal: number
}

/** way_id → congestion for one hour (feed into roadStyle.withCongestion). */
export function trafficForHour(doc: TrafficDoc, hour: number): Map<number, number | null> {
  const h = ((Math.round(hour) % 24) + 24) % 24
  const out = new Map<number, number | null>()
  for (const [id, values] of Object.entries(doc.ways)) out.set(Number(id), values[h] ?? null)
  return out
}

/** Area curve as [{hour, value}] for a small chart (null hours kept as null). */
export function areaTrafficCurve(doc: TrafficDoc): { hour: number; value: number | null; speedKmh: number | null }[] {
  return doc.hours.map((hour) => ({ hour, value: doc.area.median[hour] ?? null, speedKmh: doc.area.speedKmh[hour] ?? null }))
}

/** Hour with the highest area median (ties → earliest). */
export function peakHour(doc: TrafficDoc): number {
  let best = 0
  doc.area.median.forEach((v, h) => {
    if ((v ?? -1) > (doc.area.median[best] ?? -1)) best = h
  })
  return best
}
