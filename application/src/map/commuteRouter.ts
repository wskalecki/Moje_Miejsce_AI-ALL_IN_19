/**
 * Public-transport travel time from every grid cell TO a chosen point, in the browser.
 *
 * Port of data/scripts/transit_router.py (reverse Connection Scan, `latest_departures` +
 * `latest_leave`) and of the averaging in data/scripts/etl_czasy_przejazdu.py: for each arrival
 * deadline (07:30–09:00 every 10 min on a weekday) the latest time to leave a cell centre and still
 * arrive; travel time = deadline − leave; the cell value is the mean over the reachable deadlines.
 * Walking is straight-line distance × DETOUR at WALK_MPS, access ≤ ACCESS_M, transfers ≤ TRANSFER_M.
 * The network comes from data/scripts/build_transit_net.py (rozkład ZTM, GTFS).
 */

export interface CommuteNetMeta {
  day: string
  feedVersion: string | null
  source: string
  start: number
  deadlines: number[]
  modes: string[]
  gridVersion: number
  counts: { stops: number; connections: number; cells: number }
  constants: {
    WALK_MPS: number
    DETOUR: number
    ACCESS_M: number
    TRANSFER_M: number
    MIN_TRANSFER_S: number
    MAX_RIDE_S: number
  }
  layout: { name: string; type: 'Float64' | 'Uint32' | 'Uint16' | 'Uint8'; length: number }[]
}

export interface CommuteNet {
  meta: CommuteNetMeta
  stopCount: number
  cellCount: number
  stopLon: Float64Array
  stopLat: Float64Array
  cellLon: Float64Array
  cellLat: Float64Array
  cellRow: Uint16Array
  cellCol: Uint16Array
  trip: Uint32Array
  depStop: Uint16Array
  arrStop: Uint16Array
  /** Seconds after midnight of the service day. */
  dep: Int32Array
  arr: Int32Array
  maxTrip: number
}

const ARRAY_TYPES = { Float64: Float64Array, Uint32: Uint32Array, Uint16: Uint16Array, Uint8: Uint8Array }

export function parseCommuteNet(meta: CommuteNetMeta, buffer: ArrayBuffer): CommuteNet {
  const views: Record<string, ArrayLike<number>> = {}
  let offset = 0
  for (const { name, type, length } of meta.layout) {
    const Ctor = ARRAY_TYPES[type]
    views[name] = new Ctor(buffer, offset, length)
    offset += length * Ctor.BYTES_PER_ELEMENT
  }
  if (offset !== buffer.byteLength) throw new Error(`commute-net.bin: ${buffer.byteLength} bytes, layout expects ${offset}`)
  const rel = (a: ArrayLike<number>) => Int32Array.from(a as Uint16Array, (v) => v + meta.start)
  const trip = views.trip as Uint32Array
  let maxTrip = 0
  for (let i = 0; i < trip.length; i++) if (trip[i] > maxTrip) maxTrip = trip[i]
  return {
    meta,
    stopCount: meta.counts.stops,
    cellCount: meta.counts.cells,
    stopLon: views.stopLon as Float64Array,
    stopLat: views.stopLat as Float64Array,
    cellLon: views.cellLon as Float64Array,
    cellLat: views.cellLat as Float64Array,
    cellRow: views.cellRow as Uint16Array,
    cellCol: views.cellCol as Uint16Array,
    trip,
    depStop: views.depStop as Uint16Array,
    arrStop: views.arrStop as Uint16Array,
    dep: rel(views.dep),
    arr: rel(views.arr),
    maxTrip,
  }
}

export function commuteCellId(net: CommuteNet, i: number): string {
  return `cell_r${String(net.cellRow[i]).padStart(3, '0')}_c${String(net.cellCol[i]).padStart(3, '0')}`
}

// ---------------------------------------------------------------- geometry (as in transit_router.py)

function metres(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const dx = (lon2 - lon1) * 111_320 * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180))
  const dy = (lat2 - lat1) * 110_540
  return Math.hypot(dx, dy)
}

/** Python's round(): halves go to the even neighbour. */
function pyRound(x: number): number {
  const r = Math.round(x)
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r
}

interface Index {
  buckets: Map<string, number[]>
  transfers: Map<number, [number, number][]>
  cellAccess: [number, number][][]
}

const indexes = new WeakMap<CommuteNet, Index>()
const BUCKET = 0.01 // ~1 km

function bucketKey(lon: number, lat: number): [number, number] {
  return [Math.trunc(lon / BUCKET), Math.trunc(lat / BUCKET)]
}

function stopsNear(net: CommuteNet, buckets: Map<string, number[]>, lon: number, lat: number, radius: number): [number, number][] {
  const [kx, ky] = bucketKey(lon, lat)
  const out: [number, number][] = []
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (const i of buckets.get(`${kx + dx},${ky + dy}`) ?? []) {
        const d = metres(lon, lat, net.stopLon[i], net.stopLat[i])
        if (d <= radius) out.push([i, d])
      }
    }
  }
  return out
}

function indexFor(net: CommuteNet): Index {
  let ix = indexes.get(net)
  if (ix) return ix
  const buckets = new Map<string, number[]>()
  for (let i = 0; i < net.stopCount; i++) {
    const [kx, ky] = bucketKey(net.stopLon[i], net.stopLat[i])
    const key = `${kx},${ky}`
    const list = buckets.get(key)
    if (list) list.push(i)
    else buckets.set(key, [i])
  }
  const { ACCESS_M } = net.meta.constants
  const cellAccess = Array.from({ length: net.cellCount }, (_, c) => stopsNear(net, buckets, net.cellLon[c], net.cellLat[c], ACCESS_M))
  ix = { buckets, transfers: new Map(), cellAccess }
  indexes.set(net, ix)
  return ix
}

// ---------------------------------------------------------------- routing

/** For every stop, the latest boarding time there that still reaches `target` by `deadline` (−1 = none). */
function latestDepartures(net: CommuteNet, ix: Index, target: [number, number], deadline: number): Int32Array {
  const { ACCESS_M, TRANSFER_M, MIN_TRANSFER_S, MAX_RIDE_S, DETOUR, WALK_MPS } = net.meta.constants
  const walk = (m: number) => pyRound((m * DETOUR) / WALK_MPS)
  const board = new Int32Array(net.stopCount).fill(-1)
  const ready = new Float64Array(net.stopCount).fill(-Infinity)
  let any = false
  for (const [s, d] of stopsNear(net, ix.buckets, target[0], target[1], ACCESS_M)) {
    ready[s] = Math.max(ready[s], deadline - walk(d))
    any = true
  }
  if (!any) return board
  const usable = new Uint8Array(net.maxTrip + 1)
  // last connection departing at or before the deadline (connections are sorted by departure)
  let lo = 0
  let hi = net.dep.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (net.dep[mid] <= deadline) lo = mid + 1
    else hi = mid
  }
  const startTime = deadline - MAX_RIDE_S
  for (let ci = lo - 1; ci >= 0; ci--) {
    const dep = net.dep[ci]
    if (dep < startTime) break
    if (net.arr[ci] > deadline) continue
    const trip = net.trip[ci]
    if (!usable[trip]) {
      if (net.arr[ci] > ready[net.arrStop[ci]]) continue
      usable[trip] = 1
    }
    const s = net.depStop[ci]
    if (dep > board[s]) board[s] = dep
    const latest = dep - MIN_TRANSFER_S
    if (latest > ready[s]) {
      ready[s] = latest
      let tr = ix.transfers.get(s)
      if (!tr) {
        tr = stopsNear(net, ix.buckets, net.stopLon[s], net.stopLat[s], TRANSFER_M)
          .filter(([j]) => j !== s)
          .map(([j, d]) => [j, walk(d)] as [number, number])
        ix.transfers.set(s, tr)
      }
      for (const [j, secs] of tr) {
        const t = dep - Math.max(secs, MIN_TRANSFER_S)
        if (t > ready[j]) ready[j] = t
      }
    }
  }
  return board
}

export interface TravelTimes {
  /** Mean minutes over the reachable deadlines; NaN when no deadline is reachable. */
  mean: Float64Array
  /** How many deadlines are reachable (0 … deadlines.length). */
  reached: Uint8Array
}

/** Travel time from every grid cell to `target` ([lon, lat]) by public transport. */
export function travelTimesTo(net: CommuteNet, target: [number, number]): TravelTimes {
  const ix = indexFor(net)
  const { ACCESS_M, DETOUR, WALK_MPS } = net.meta.constants
  const walk = (m: number) => pyRound((m * DETOUR) / WALK_MPS)
  // Neumaier-compensated sums, like Python's sum() of floats (3.12+), so means match the ETL exactly
  const sum = new Float64Array(net.cellCount)
  const comp = new Float64Array(net.cellCount)
  const reached = new Uint8Array(net.cellCount)
  const direct = Float64Array.from({ length: net.cellCount }, (_, c) => metres(net.cellLon[c], net.cellLat[c], target[0], target[1]))
  for (const deadline of net.meta.deadlines) {
    const board = latestDepartures(net, ix, target, deadline)
    for (let c = 0; c < net.cellCount; c++) {
      let best = direct[c] <= ACCESS_M * 2 ? deadline - walk(direct[c]) : -Infinity
      for (const [s, d] of ix.cellAccess[c]) {
        if (board[s] >= 0) best = Math.max(best, board[s] - walk(d))
      }
      if (best > -Infinity) {
        const x = (deadline - best) / 60
        const s = sum[c] + x
        comp[c] += Math.abs(sum[c]) >= Math.abs(x) ? sum[c] - s + x : x - s + sum[c]
        sum[c] = s
        reached[c]++
      }
    }
  }
  const mean = Float64Array.from(sum, (v, c) => (reached[c] ? (v + comp[c]) / reached[c] : NaN))
  return { mean, reached }
}
