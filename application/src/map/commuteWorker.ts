/// <reference lib="webworker" />
/**
 * Runs the public-transport router off the main thread: loads the network once (only when the
 * "Dojazd do…" filter is first used) and answers travel-time requests.
 */
import { parseCommuteNet, travelTimesTo, type CommuteNet, type CommuteNetMeta } from './commuteRouter'

export type CommuteRequestBody = { type: 'init'; base: string } | { type: 'transit'; target: [number, number] }
export type CommuteRequest = CommuteRequestBody & { id: number }

export type CommuteResponse =
  | {
      id: number
      type: 'ready'
      cells: { lon: Float64Array; lat: Float64Array; row: Uint16Array; col: Uint16Array }
      meta: Pick<CommuteNetMeta, 'day' | 'feedVersion' | 'source' | 'deadlines'>
    }
  | { id: number; type: 'transit'; mean: Float64Array; reached: Uint8Array }
  | { id: number; type: 'error'; message: string }

let netP: Promise<CommuteNet> | null = null

async function load(base: string): Promise<CommuteNet> {
  const [metaRes, binRes] = await Promise.all([fetch(`${base}commute-net.json`), fetch(`${base}commute-net.bin`)])
  if (!metaRes.ok || !binRes.ok) throw new Error(`Nie udało się wczytać rozkładu (HTTP ${metaRes.status}/${binRes.status})`)
  return parseCommuteNet((await metaRes.json()) as CommuteNetMeta, await binRes.arrayBuffer())
}

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = async (event: MessageEvent<CommuteRequest>) => {
  const msg = event.data
  try {
    if (msg.type === 'init') {
      netP ??= load(msg.base)
      const net = await netP
      const { day, feedVersion, source, deadlines } = net.meta
      const reply: CommuteResponse = {
        id: msg.id,
        type: 'ready',
        cells: { lon: net.cellLon.slice(), lat: net.cellLat.slice(), row: net.cellRow.slice(), col: net.cellCol.slice() },
        meta: { day, feedVersion, source, deadlines },
      }
      ctx.postMessage(reply)
      return
    }
    if (!netP) throw new Error('Rozkład nie został wczytany')
    const { mean, reached } = travelTimesTo(await netP, msg.target)
    const reply: CommuteResponse = { id: msg.id, type: 'transit', mean, reached }
    ctx.postMessage(reply, [mean.buffer, reached.buffer])
  } catch (err) {
    netP = msg.type === 'init' ? null : netP
    ctx.postMessage({ id: msg.id, type: 'error', message: err instanceof Error ? err.message : String(err) } satisfies CommuteResponse)
  }
}
