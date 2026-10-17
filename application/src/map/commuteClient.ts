/**
 * Main-thread side of the "Dojazd do…" filter: public transport via the router worker, car via
 * OSRM (free-flow, 1 km blocks). Results are cached per point and mode, so switching the time
 * limit or toggling the filter never recomputes.
 */
import { carTimesTo, type OsrmTable } from './commuteCar'
import type { CommuteRequest, CommuteRequestBody, CommuteResponse } from './commuteWorker'

export type CommuteMode = 'transit' | 'car'

export interface CommuteInfo {
  cells: { lon: Float64Array; lat: Float64Array; row: Uint16Array; col: Uint16Array }
  day: string
  feedVersion: string | null
  source: string
  deadlines: number[]
}

type Pending = { resolve: (r: CommuteResponse) => void; reject: (e: Error) => void }

let worker: Worker | null = null
let seq = 0
const pending = new Map<number, Pending>()
let infoP: Promise<CommuteInfo> | null = null
const cache = new Map<string, Promise<Float64Array>>()

function ask(req: CommuteRequestBody): Promise<CommuteResponse> {
  if (!worker) {
    worker = new Worker(new URL('./commuteWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<CommuteResponse>) => {
      const p = pending.get(e.data.id)
      if (!p) return
      pending.delete(e.data.id)
      if (e.data.type === 'error') p.reject(new Error(e.data.message))
      else p.resolve(e.data)
    }
  }
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    worker!.postMessage({ ...req, id } satisfies CommuteRequest)
  })
}

/** Loads the timetable network (≈ 3 MB) in the worker; called when the filter is switched on. */
export function commuteInfo(): Promise<CommuteInfo> {
  infoP ??= ask({ type: 'init', base: `${import.meta.env.BASE_URL}data/transit/` }).then((r) => {
    if (r.type !== 'ready') throw new Error('Nieoczekiwana odpowiedź routera')
    return { cells: r.cells, ...r.meta }
  })
  infoP.catch(() => (infoP = null))
  return infoP
}

async function fetchTable(url: string): Promise<OsrmTable> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM: HTTP ${res.status}`)
  return (await res.json()) as OsrmTable
}

/** Minutes from every grid cell to `target` (NaN = no connection / no route). */
export function commuteMinutes(mode: CommuteMode, target: [number, number]): Promise<Float64Array> {
  const key = `${mode}:${target[0].toFixed(5)},${target[1].toFixed(5)}`
  let p = cache.get(key)
  if (!p) {
    p =
      mode === 'transit'
        ? commuteInfo()
            .then(() => ask({ type: 'transit', target }))
            .then((r) => {
              if (r.type !== 'transit') throw new Error('Nieoczekiwana odpowiedź routera')
              return r.mean
            })
        : commuteInfo().then((info) => carTimesTo(info.cells, target, fetchTable).then((r) => r.minutes))
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return p
}
