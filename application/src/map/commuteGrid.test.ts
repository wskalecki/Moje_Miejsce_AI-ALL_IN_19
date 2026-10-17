import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cellRing, timeBands } from './commuteGrid.ts'

// Expected corners from data/scripts/generate_grid.py cell_polygon() (pyproj, EPSG:2180 -> 4326).
const PYPROJ: [row: number, col: number, corners: [number, number][]][] = [
  [67, 67, [[21.0029435, 52.2297926], [21.0066028, 52.2297305], [21.0067041, 52.2319774], [21.0030447, 52.2320396]]],
  [0, 0, [[20.7518213, 52.0831309], [20.755469, 52.0830766], [20.7555572, 52.085324], [20.7519093, 52.0853782]]],
  [130, 120, [[21.2038831, 52.3678797], [21.2075533, 52.3678111], [21.2076653, 52.3700577], [21.203995, 52.3701263]]],
]

test('cell corners match the team grid (pyproj) to ~1 cm', () => {
  for (const [row, col, corners] of PYPROJ) {
    const ring = cellRing(row, col)
    assert.equal(ring.length, 5)
    assert.deepEqual(ring[4], ring[0])
    corners.forEach(([lon, lat], i) => {
      assert.ok(Math.abs(ring[i][0] - lon) < 2e-7, `r${row} c${col} corner ${i} lon ${ring[i][0]} vs ${lon}`)
      assert.ok(Math.abs(ring[i][1] - lat) < 2e-7, `r${row} c${col} corner ${i} lat ${ring[i][1]} vs ${lat}`)
    })
  }
})

test('time bands split the limit into readable steps', () => {
  assert.deepEqual(timeBands(15), [5, 10, 15])
  assert.deepEqual(timeBands(30), [10, 20, 30])
  assert.deepEqual(timeBands(45), [15, 30, 45])
  assert.deepEqual(timeBands(60), [15, 30, 45, 60])
  assert.deepEqual(timeBands(90), [15, 30, 45, 60, 75, 90])
})
