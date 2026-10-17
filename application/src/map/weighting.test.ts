// Run: node --test src/map/weighting.test.ts  (native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CATEGORY_ORDER } from '../app/dictionary.ts'
import type { CategoryKey } from '../app/types.ts'
import { heatRange, rampStops, rankBy, shares, weightedMatch, type Weights } from './weighting.ts'

const fill = (fn: (c: CategoryKey, i: number) => number) =>
  Object.fromEntries(CATEGORY_ORDER.map((c, i) => [c, fn(c, i)])) as Weights

test('shares sum to 1; all-zero weights fall back to equal shares; solo isolates one category', () => {
  const s = shares(fill((_, i) => i * 10))
  assert.ok(Math.abs(s.reduce((a, b) => a + b, 0) - 1) < 1e-9)
  assert.equal(s[0], 0)
  const eq = shares(fill(() => 0))
  assert.ok(eq.every((x) => Math.abs(x - 0.1) < 1e-9))
  const solo = shares(fill(() => 50), 'zielen')
  assert.equal(solo[CATEGORY_ORDER.indexOf('zielen')], 1)
  assert.equal(solo.reduce((a, b) => a + b, 0), 1)
})

test('weighted match = weighted mean of category scores', () => {
  const cats = fill((c) => (c === 'zielen' ? 100 : 0))
  const w = fill((c) => (c === 'zielen' ? 50 : c === 'cisza' ? 50 : 0))
  assert.equal(weightedMatch(cats, w), 50)
  assert.equal(weightedMatch(cats, w, 'zielen'), 100)
  assert.equal(weightedMatch(cats, w, 'cisza'), 0)
})

test('ramp stops are strictly ascending even for flat data', () => {
  const st = rampStops([5, 5, 5, 5])
  for (let i = 1; i < st.length; i++) assert.ok(st[i] > st[i - 1])
})

test('heat range brackets the mixed values', () => {
  const rows = Array.from({ length: 100 }, (_, i) => Float32Array.from(CATEGORY_ORDER, () => i / 99))
  const r = heatRange(rows, shares(fill(() => 50)))
  assert.ok(r.lo > 0.3 && r.lo < 0.4, `lo ${r.lo}`)
  assert.ok(r.hi > 0.95 && r.hi <= 1, `hi ${r.hi}`)
})

test('rankBy sorts by score, ties keep input order', () => {
  assert.deepEqual(
    rankBy(['a', 'b', 'c'], (x) => (x === 'c' ? 2 : 1)),
    ['c', 'a', 'b'],
  )
})
