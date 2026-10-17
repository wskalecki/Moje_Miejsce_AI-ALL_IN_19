import { test } from 'node:test'
import assert from 'node:assert/strict'
import { carTimesTo, type CarCells, type OsrmTable } from './commuteCar.ts'

/** n cells in one row of 250 m cells: cols 0..n-1, i.e. ceil(n / 4) blocks of 1 km. */
function rowOfCells(n: number): CarCells {
  return {
    lon: Float64Array.from({ length: n }, (_, i) => 21 + i * 0.0036),
    lat: new Float64Array(n).fill(52.2),
    row: new Uint16Array(n).fill(40),
    col: Uint16Array.from({ length: n }, (_, i) => i),
  }
}

const TARGET: [number, number] = [21.01, 52.23]

function fakeOsrm(durationFor: (sourceIndex: number) => number | null) {
  const urls: string[] = []
  const fetchTable = async (url: string): Promise<OsrmTable> => {
    urls.push(url)
    const sources = new URL(url).searchParams.get('sources')!.split(';')
    return { code: 'Ok', durations: sources.map((s) => [durationFor(Number(s))]) }
  }
  return { urls, fetchTable }
}

test('cells of one 1 km block share its car time, in requests of at most 100 coordinates', async () => {
  const cells = rowOfCells(4 * 150) // 150 blocks -> 2 requests (99 + 51 sources)
  const osrm = fakeOsrm((s) => 600 + s * 60) // 10 min + 1 min per source index

  const { minutes, requests } = await carTimesTo(cells, TARGET, osrm.fetchTable)

  assert.equal(requests, 2)
  for (const url of osrm.urls) {
    const coords = new URL(url).pathname.split('/').pop()!.split(';')
    assert.ok(coords.length <= 100)
    assert.equal(new URL(url).searchParams.get('destinations'), String(coords.length - 1))
    assert.equal(coords.at(-1), '21.01000,52.23000')
  }
  assert.deepEqual([...minutes.slice(0, 5)], [10, 10, 10, 10, 11])
})

test('a block the server cannot route stays without data', async () => {
  const cells = rowOfCells(8)
  const osrm = fakeOsrm((s) => (s === 1 ? null : 300))

  const { minutes } = await carTimesTo(cells, TARGET, osrm.fetchTable)

  assert.deepEqual([...minutes].map((m) => (Number.isNaN(m) ? null : m)), [5, 5, 5, 5, null, null, null, null])
})

test('a failing OSRM request stops the whole computation', async () => {
  const fetchTable = async (): Promise<OsrmTable> => ({ code: 'TooBig', durations: [] })

  await assert.rejects(carTimesTo(rowOfCells(8), TARGET, fetchTable), /OSRM/)
})
