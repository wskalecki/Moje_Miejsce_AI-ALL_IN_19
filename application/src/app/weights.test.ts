// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORY_ORDER, DEFAULT_PRIORITIES, PROFILE_ORDER } from './dictionary.ts'
import {
  NEUTRAL_WEIGHT,
  PRIORITY_WEIGHT,
  UI_WEIGHT_MAX,
  baseWeights,
  categoriesByWeights,
  clampWeight,
  deriveWeights,
  sanitizeWeights,
  uiToWeight,
  weightToUi,
} from './weights.ts'

test('ui weight scale 0–5 maps to 0–100', () => {
  assert.equal(weightToUi(0), 0)
  assert.equal(weightToUi(20), 1)
  assert.equal(weightToUi(100), 5)
  assert.equal(uiToWeight(0), 0)
  assert.equal(uiToWeight(1), 20)
  assert.equal(uiToWeight(UI_WEIGHT_MAX), 100)
})

test('profile defaults are normalised so the top category = 100', () => {
  for (const p of PROFILE_ORDER) {
    const w = baseWeights(p)
    assert.equal(Math.max(...CATEGORY_ORDER.map((c) => w[c])), 100, p)
    for (const c of CATEGORY_ORDER) {
      assert.ok(Number.isInteger(w[c]) && w[c] >= 0 && w[c] <= 100, `${p}.${c} = ${w[c]}`)
    }
  }
  assert.equal(baseWeights('student').komunikacja, 100)
  assert.equal(baseWeights('student').gastronomia, 73) // 0.16 / 0.22
  assert.equal(baseWeights('rodzina').zycieNocne, 0)
  assert.equal(baseWeights('senior').zdrowie, 100)
})

test('no profile → every category neutral', () => {
  const w = baseWeights(null)
  for (const c of CATEGORY_ORDER) assert.equal(w[c], NEUTRAL_WEIGHT)
})

test('priorities are boosted to at least 80, the rest keep profile defaults', () => {
  const w = deriveWeights('student', ['cisza', 'komunikacja'])
  assert.equal(w.cisza, PRIORITY_WEIGHT) // 9 → 80
  assert.equal(w.komunikacja, 100) // already above, not lowered
  assert.equal(w.zielen, baseWeights('student').zielen)
})

test('profile default priorities all end up ≥ 80', () => {
  for (const p of PROFILE_ORDER) {
    const w = deriveWeights(p, DEFAULT_PRIORITIES[p])
    for (const c of DEFAULT_PRIORITIES[p]) assert.ok(w[c] >= PRIORITY_WEIGHT, `${p}.${c}`)
  }
})

test('clampWeight rounds and clamps', () => {
  assert.equal(clampWeight(-5), 0)
  assert.equal(clampWeight(120), 100)
  assert.equal(clampWeight(42.6), 43)
  assert.equal(clampWeight(Number.NaN), 0)
})

test('sanitizeWeights keeps valid numbers and falls back for the rest', () => {
  const fallback = baseWeights('rodzina')
  const w = sanitizeWeights({ cisza: 12, zielen: 'x', sport: 300, foo: 1 }, fallback)
  assert.equal(w.cisza, 12)
  assert.equal(w.zielen, fallback.zielen)
  assert.equal(w.sport, 100)
  assert.deepEqual(Object.keys(w).sort(), [...CATEGORY_ORDER].sort())
  assert.deepEqual(sanitizeWeights(null, fallback), fallback)
})

test('categoriesByWeights sorts highest first, ties in tile order', () => {
  const order = categoriesByWeights(baseWeights(null))
  assert.deepEqual(order, [...CATEGORY_ORDER])
  assert.equal(categoriesByWeights(baseWeights('rodzina'))[0], 'edukacja')
})
