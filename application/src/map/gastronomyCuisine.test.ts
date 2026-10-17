import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyGastronomyName, countGastronomyNear, personalGastronomyScore, resetGastronomyNorm } from './gastronomyCuisine.ts'
import type { PoiData } from './poi.ts'

test('classifyGastronomyName detects indian and italian', () => {
  assert.equal(classifyGastronomyName('South Indian Flavours'), 'indian')
  assert.equal(classifyGastronomyName('Pizzeria Napoli'), 'italian')
})

test('countGastronomyNear respects allowed cuisines', () => {
  const poi: PoiData = {
    byCat: {
      gastronomia: [
        { lng: 21.01, lat: 52.23, name: 'Curry House', subtype: 'gastronomy', source: 0, cuisine: 'indian' },
        { lng: 21.011, lat: 52.231, name: 'Pizzeria', subtype: 'gastronomy', source: 0, cuisine: 'italian' },
      ],
    },
    sources: [{ id: 't', label: 'test' }],
    subtypeLabel: (s) => s,
    geojson: { type: 'FeatureCollection', features: [] },
  }
  const at: [number, number] = [21.01, 52.23]
  assert.equal(countGastronomyNear(poi, at, new Set(['indian', 'italian'])), 2)
  assert.equal(countGastronomyNear(poi, at, new Set(['italian'])), 1)
  assert.equal(countGastronomyNear(poi, at, new Set(['indian'])), 1)
})

test('personalGastronomyScore changes when indian is excluded', () => {
  const poi: PoiData = {
    byCat: {
      gastronomia: [
        { lng: 21.01, lat: 52.23, name: 'Curry House', subtype: 'gastronomy', source: 0, cuisine: 'indian' },
        { lng: 21.02, lat: 52.24, name: 'Curry 2', subtype: 'gastronomy', source: 0, cuisine: 'indian' },
      ],
    },
    sources: [{ id: 't', label: 'test' }],
    subtypeLabel: (s) => s,
    geojson: { type: 'FeatureCollection', features: [] },
  }
  resetGastronomyNorm(poi, [[21.01, 52.23]])
  const all = new Set(['indian', 'italian', 'asian', 'polish', 'middle_eastern', 'fastfood', 'cafe', 'other'] as const)
  const noIndian = new Set(['italian', 'asian', 'polish', 'middle_eastern', 'fastfood', 'cafe', 'other'] as const)
  const withIndian = personalGastronomyScore(poi, [21.01, 52.23], all, 80)
  const without = personalGastronomyScore(poi, [21.01, 52.23], noIndian, 80)
  assert.ok(withIndian > without)
})
