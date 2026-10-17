import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cityDiffLabel, formatFlatPrice } from './priceFormat.ts'

test('flat price in mln / tys.', () => {
  assert.equal(formatFlatPrice(19_900 * 55), '1,09 mln zł')
  assert.equal(formatFlatPrice(1_000_000), '1 mln zł')
  assert.equal(formatFlatPrice(1_250_000), '1,25 mln zł')
  assert.equal(formatFlatPrice(15_800 * 55), '869 tys. zł')
})

test('city diff pill', () => {
  assert.equal(cityDiffLabel(19_900, 17_975), '+11% vs Warszawa')
  assert.equal(cityDiffLabel(80, 84), '−5% vs Warszawa')
  assert.equal(cityDiffLabel(84.2, 84), 'jak średnia Warszawy')
})
