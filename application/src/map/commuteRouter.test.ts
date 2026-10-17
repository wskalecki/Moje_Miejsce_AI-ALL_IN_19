import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { commuteCellId, parseCommuteNet, travelTimesTo, type CommuteNetMeta } from './commuteRouter.ts'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url))

function loadNet() {
  const meta = JSON.parse(read('../../public/data/transit/commute-net.json').toString()) as CommuteNetMeta
  const bin = read('../../public/data/transit/commute-net.bin')
  return parseCommuteNet(meta, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength))
}

type Summary = [mean: number, min: number, max: number, reached: number] | null

/** Python's round(x, 1): decimal rounding of the exact binary value, halves to the even digit. */
function pyRound1(x: number): number {
  const [whole, frac] = Math.abs(x).toFixed(20).split('.')
  let tenths = Number(whole) * 10 + Number(frac[0])
  const rest = frac.slice(1)
  const half = '5'.padEnd(rest.length, '0')
  if (rest > half || (rest === half && tenths % 2 === 1)) tenths += 1
  return (Math.sign(x) * tenths) / 10
}

test('travel times to Rondo Dmowskiego match the Python router for every grid cell', () => {
  const net = loadNet()
  // Oracle: data/scripts/etl_czasy_przejazdu.py on the same network (committed output).
  const etl = JSON.parse(read('../../../data/grid/czasy_przejazdu.geojson').toString()) as {
    features: { properties: { id: string; t: { centrum: { wszystkie: Summary } } } }[]
  }
  const expected = new Map(etl.features.map((f) => [f.properties.id, f.properties.t.centrum.wszystkie]))

  const { mean, reached } = travelTimesTo(net, [21.0122, 52.2297])

  const mismatches: string[] = []
  for (let i = 0; i < net.cellCount; i++) {
    const id = commuteCellId(net, i)
    const want = expected.get(id)
    const got = reached[i] === 0 ? null : [pyRound1(mean[i]), reached[i]]
    const wantPair = want ? [want[0], want[3]] : null
    if (JSON.stringify(got) !== JSON.stringify(wantPair)) mismatches.push(`${id}: ${JSON.stringify(got)} ≠ ${JSON.stringify(wantPair)}`)
  }
  assert.equal(expected.size, net.cellCount)
  assert.deepEqual(mismatches.slice(0, 5), [])
})
