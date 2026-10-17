/** Demo scoring: organic islands instead of hard circular 1 km blocks. */

export const ISLAND_RADIUS_M = 2000
export const ISLAND_SCORE_PEAK = 92
export const ISLAND_SCORE_EDGE = 36

export type IslandAnchor = {
  anchor: [number, number]
  radiusM?: number
}

export function haversineM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const r = 6_371_000
  const p1 = (lat1 * Math.PI) / 180
  const p2 = (lat2 * Math.PI) / 180
  const dphi = ((lat2 - lat1) * Math.PI) / 180
  const dl = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * r * Math.asin(Math.sqrt(a))
}

/** Deterministic [-1, 1] noise from a stable cell id (subcell or parent). */
export function cellNoise01(cellId: string): number {
  let h = 2166136261
  for (let i = 0; i < cellId.length; i++) {
    h ^= cellId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h % 10_000) / 10_000 * 2 - 1
}

/** 0 at x=0, 1 at x=1 — higher score nearer the anchor. */
function smoothstep01(x: number): number {
  const t = Math.min(1, Math.max(0, x))
  return t * t * (3 - 2 * t)
}

function clampScore(n: number): number {
  return Math.min(ISLAND_SCORE_PEAK, Math.max(ISLAND_SCORE_EDGE, Math.round(n)))
}

/** Linear falloff inside a hard radius (legacy demo islands). */
export function scoreFromDistanceLinear(distanceM: number, radiusM = ISLAND_RADIUS_M): number | null {
  if (distanceM > radiusM) return null
  const t = distanceM / radiusM
  return clampScore(ISLAND_SCORE_PEAK - t * (ISLAND_SCORE_PEAK - ISLAND_SCORE_EDGE))
}

/**
 * Marek — komunikacja: elipsa wzdłuż korytarza E–W, miękka krawędź i szum per komórka 200 m.
 */
export function marekScoreAt(
  center: [number, number],
  cellId: string,
  island: IslandAnchor,
): number | null {
  const [anchorLon, anchorLat] = island.anchor
  const [lon, lat] = center
  const noise = cellNoise01(cellId)

  const cosLat = Math.cos((anchorLat * Math.PI) / 180)
  const mPerDegLat = 111_320
  const mPerDegLon = 111_320 * cosLat
  const dLon = (lon - anchorLon) * cosLat
  const dLat = lat - anchorLat
  // Rozciągnięcie wzdłuż osi wschód–zachód (linie tramwajowe), ściśnięcie N–S.
  const dx = dLon * mPerDegLon * 0.68
  const dy = dLat * mPerDegLat * 1.14
  let distanceM = Math.hypot(dx, dy)
  distanceM *= 1 - 0.1 * noise

  const radiusM = (island.radiusM ?? ISLAND_RADIUS_M) * (1 + 0.2 * noise)
  const outer = radiusM * (1.03 + 0.1 * Math.max(0, noise))
  if (distanceM > outer) return null

  const t = distanceM / radiusM
  const smooth = smoothstep01(1 - t)
  const raw = ISLAND_SCORE_EDGE + (ISLAND_SCORE_PEAK - ISLAND_SCORE_EDGE) * smooth + noise * 7
  return clampScore(raw)
}
