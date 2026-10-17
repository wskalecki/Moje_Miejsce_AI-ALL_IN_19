import assert from 'node:assert/strict'
import { test } from 'node:test'
import { categoriesFromPoiInterests, sanitizePoiInterests } from './poiInterests.ts'

test('sanitizePoiInterests keeps known subtypes only', () => {
  assert.deepEqual(sanitizePoiInterests(['pitch', 'nope', 'pitch', 'metro_station']), ['pitch', 'metro_station'])
})

test('sanitizePoiInterests maps legacy theatre/cinema to event', () => {
  assert.deepEqual(sanitizePoiInterests(['theatre', 'cinema']), ['event'])
})

test('categoriesFromPoiInterests maps subtypes to parent categories', () => {
  const cats = categoriesFromPoiInterests(['pitch', 'clinic', 'metro_station'])
  assert.ok(cats.includes('sport'))
  assert.ok(cats.includes('zdrowie'))
  assert.ok(cats.includes('komunikacja'))
  assert.equal(cats.length, 3)
})
