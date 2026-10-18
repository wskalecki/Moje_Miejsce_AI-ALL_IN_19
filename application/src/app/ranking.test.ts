// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORY_ORDER, DEFAULT_PRIORITIES } from './dictionary.ts'
import { normCats, rankOsiedla, type ScoresFile } from './ranking.ts'
import { deriveWeights } from './weights.ts'
import { weightedMatch } from '../map/weighting.ts'

const cats = (v: number, over: Partial<Record<(typeof CATEGORY_ORDER)[number], number>> = {}) => ({
  cats: Object.fromEntries(CATEGORY_ORDER.map((c) => [c, over[c] ?? v])),
})

test('ranks by the weighted match, best first, ties by id', () => {
  const scores: ScoresFile = { b: cats(50), a: cats(50), c: cats(40, { zielen: 100 }), d: cats(90) }
  const w = deriveWeights(null, [])
  const r = rankOsiedla(scores, w)
  assert.deepEqual(r.order, ['d', 'c', 'a', 'b'])
  assert.equal(r.total, 4)
  assert.equal(r.rank.get('d'), 1)
  assert.equal(r.match.get('d'), 90)
  // only zieleń counts → c jumps to #1
  const green = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, c === 'zielen' ? 100 : 0])) as typeof w
  assert.equal(rankOsiedla(scores, green).order[0], 'c')
})

test('match equals the map weighting (src/map/weighting.ts)', () => {
  const scores: ScoresFile = { x: cats(30, { komunikacja: 95, gastronomia: 80 }) }
  const w = deriveWeights('student', DEFAULT_PRIORITIES.student)
  assert.equal(rankOsiedla(scores, w).match.get('x'), weightedMatch(normCats(scores.x.cats), w))
})

test('missing categories fall back to 50; zycie_nocne alias is read', () => {
  const n = normCats({ cisza: 10, zycie_nocne: 70 })
  assert.equal(n.cisza, 10)
  assert.equal(n.zycieNocne, 70)
  assert.equal(n.zielen, 50)
})

test('real data: the featured osiedla hold their documented places (docs/core/mock-iteracja-2.md)', () => {
  const scores = JSON.parse(readFileSync(new URL('../../public/data/osiedla-scores.json', import.meta.url), 'utf8')) as ScoresFile
  const rankFor = (p: 'student' | 'rodzina' | 'senior', id: string) => rankOsiedla(scores, deriveWeights(p, DEFAULT_PRIORITIES[p])).rank.get(id)
  // pinned to the data: a data fix that moves them should update these numbers on purpose
  // (18.10.2026: OSM multipolygon forests counted, greener osiedla rose)
  assert.equal(rankFor('student', 'muranow'), 15)
  assert.equal(rankFor('senior', 'stare-bielany'), 11)
  assert.equal(rankFor('rodzina', 'natolin'), 24)
})
