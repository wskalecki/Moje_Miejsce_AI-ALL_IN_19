/**
 * Team grid cells as real 250 m squares (data/scripts/generate_grid.py, gridVersion 3) and the
 * time bands of the "Dojazd do…" map.
 *
 * A cell is a square in EPSG:2180 (PUWG 1992), so in lon/lat it is a slightly rotated
 * quadrilateral; corners come from the inverse transverse Mercator (Krüger series, GRS80), which
 * matches pyproj to well under 1 cm, so neighbouring cells tile without gaps.
 */

/** Same constants as generate_grid.py. */
const ORIGIN_E = 620_000
const ORIGIN_N = 470_000
const CELL_SIZE_M = 250

// EPSG:2180: transverse Mercator on GRS80, lon0 19°, k0 0.9993, FE 500 000, FN −5 300 000
const A_GRS80 = 6_378_137
const F_GRS80 = 1 / 298.257222101
const K0 = 0.9993
const LON0 = (19 * Math.PI) / 180
const FE = 500_000
const FN = -5_300_000

const n = F_GRS80 / (2 - F_GRS80)
const RECT = (A_GRS80 / (1 + n)) * (1 + n ** 2 / 4 + n ** 4 / 64)
const BETA = [n / 2 - (2 / 3) * n ** 2 + (37 / 96) * n ** 3, n ** 2 / 48 + n ** 3 / 15, (17 / 480) * n ** 3]
const DELTA = [2 * n - (2 / 3) * n ** 2 - 2 * n ** 3, (7 / 3) * n ** 2 - (8 / 5) * n ** 3, (56 / 15) * n ** 3]

/** EPSG:2180 easting/northing → [lon, lat] in degrees. */
export function puwg92ToLonLat(e: number, nn: number): [number, number] {
  const xi = (nn - FN) / (K0 * RECT)
  const eta = (e - FE) / (K0 * RECT)
  let xi1 = xi
  let eta1 = eta
  for (let j = 1; j <= 3; j++) {
    xi1 -= BETA[j - 1] * Math.sin(2 * j * xi) * Math.cosh(2 * j * eta)
    eta1 -= BETA[j - 1] * Math.cos(2 * j * xi) * Math.sinh(2 * j * eta)
  }
  const chi = Math.asin(Math.sin(xi1) / Math.cosh(eta1))
  let lat = chi
  for (let j = 1; j <= 3; j++) lat += DELTA[j - 1] * Math.sin(2 * j * chi)
  const lon = LON0 + Math.atan2(Math.sinh(eta1), Math.cos(xi1))
  return [(lon * 180) / Math.PI, (lat * 180) / Math.PI]
}

/** Closed ring of a grid cell in lon/lat (SW, SE, NE, NW, SW), like generate_grid.cell_polygon. */
export function cellRing(row: number, col: number): [number, number][] {
  const corner = (dx: number, dy: number) =>
    puwg92ToLonLat(ORIGIN_E + (col + dx) * CELL_SIZE_M, ORIGIN_N + (row + dy) * CELL_SIZE_M)
  const sw = corner(0, 0)
  return [sw, corner(1, 0), corner(1, 1), corner(0, 1), sw]
}

/** Upper bounds (minutes) of the colour bands for a time limit: 5-min steps up to 15, 10 up to 30, then 15. */
export function timeBands(limit: number): number[] {
  const step = limit <= 15 ? 5 : limit <= 30 ? 10 : 15
  const bands: number[] = []
  for (let b = step; b < limit; b += step) bands.push(b)
  bands.push(limit)
  return bands
}
