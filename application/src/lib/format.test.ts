import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatKm, formatMin, formatPerM2, formatPercent, formatPLN } from './format.ts'

test('formatting', () => {
  assert.equal(formatPLN(12450), '12 450 zł')
  assert.equal(formatPLN(4500), '4 500 zł')
  assert.equal(formatPerM2(18900), '18 900 zł/m²')
  assert.equal(formatMin(14.2), '14 min')
  assert.equal(formatKm(2310), '2,3 km')
  assert.equal(formatPercent(87.4), '87%')
})
