/**
 * Car travel time from every grid cell TO a chosen point, from the OSRM table service
 * (road network of OpenStreetMap, free-flow speeds: no traffic jams).
 *
 * To keep it to a handful of requests per click, cells are grouped into 1 km blocks (4 × 4 cells
 * of 250 m); the block point is the mean of its cell centres and every cell of the block gets the
 * block's time. A block OSRM cannot route stays NaN; a failed request rejects the whole result
 * (no partial maps).
 */

export const OSRM_BASE = 'https://router.project-osrm.org'
/** 4 × 250 m = 1 km blocks. */
const BLOCK_CELLS = 4
/** OSRM table limit is 100 coordinates: 99 sources + the target. */
const SOURCES_PER_REQUEST = 99

export interface CarCells {
  lon: Float64Array
  lat: Float64Array
  row: Uint16Array
  col: Uint16Array
}

export interface OsrmTable {
  code: string
  message?: string
  /** durations[source][destination] in seconds, null when not routable. */
  durations: (number | null)[][]
}

export interface CarTimes {
  /** Minutes per cell; NaN when OSRM could not route the cell's block. */
  minutes: Float64Array
  blocks: number
  requests: number
}

export async function carTimesTo(
  cells: CarCells,
  target: [number, number],
  fetchTable: (url: string) => Promise<OsrmTable>,
  base: string = OSRM_BASE,
): Promise<CarTimes> {
  const blockOf = new Int32Array(cells.lon.length)
  const index = new Map<string, number>()
  const sums: [lon: number, lat: number, n: number][] = []
  for (let i = 0; i < cells.lon.length; i++) {
    const key = `${Math.floor(cells.row[i] / BLOCK_CELLS)},${Math.floor(cells.col[i] / BLOCK_CELLS)}`
    let b = index.get(key)
    if (b === undefined) {
      b = sums.length
      index.set(key, b)
      sums.push([0, 0, 0])
    }
    sums[b][0] += cells.lon[i]
    sums[b][1] += cells.lat[i]
    sums[b][2] += 1
    blockOf[i] = b
  }
  const points = sums.map(([lon, lat, n]) => [lon / n, lat / n] as [number, number])
  const blockMinutes = new Float64Array(points.length).fill(NaN)
  const fmt = ([lon, lat]: [number, number]) => `${lon.toFixed(5)},${lat.toFixed(5)}`
  let requests = 0
  for (let from = 0; from < points.length; from += SOURCES_PER_REQUEST) {
    const batch = points.slice(from, from + SOURCES_PER_REQUEST)
    const coords = [...batch, target].map(fmt).join(';')
    const sources = batch.map((_, i) => i).join(';')
    const url = `${base}/table/v1/driving/${coords}?sources=${sources}&destinations=${batch.length}&annotations=duration`
    const table = await fetchTable(url)
    requests++
    if (table.code !== 'Ok' || table.durations.length !== batch.length) {
      throw new Error(`OSRM: ${table.code}${table.message ? ` (${table.message})` : ''}`)
    }
    table.durations.forEach((row, i) => {
      const seconds = row[0]
      if (seconds !== null && seconds !== undefined) blockMinutes[from + i] = seconds / 60
    })
  }
  const minutes = Float64Array.from(blockOf, (b) => blockMinutes[b])
  return { minutes, blocks: points.length, requests }
}
