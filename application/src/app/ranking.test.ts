// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { CATEGORY_ORDER, DEFAULT_PRIORITIES, DEFAULT_PROFILE } from './dictionary.ts'
import { normCats, rankOsiedla, type ScoresFile } from './ranking.ts'
import { deriveWeights } from './weights.ts'
import { weightedMatch } from '../map/weighting.ts'
import { DEFAULT_FILTER_SECTIONS } from '../map/categoryFilterRows.ts'
import { OSIEDLA } from '../mock/osiedla.ts'

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

const realScores = () =>
  JSON.parse(readFileSync(new URL('../../public/data/osiedla-scores.json', import.meta.url), 'utf8')) as ScoresFile
const seniorDefaults = () => deriveWeights(DEFAULT_PROFILE, DEFAULT_PRIORITIES[DEFAULT_PROFILE])

test('real data: senior top 3 under the default weights (docs/core/mock-iteracja-2.md "Decyzja: top 3 dla seniora")', () => {
  const r = rankOsiedla(realScores(), seniorDefaults(), DEFAULT_FILTER_SECTIONS.score)
  assert.deepEqual(r.order.slice(0, 3), ['groszowka', 'wilanow-krolewski', 'stare-bielany'])
  assert.deepEqual(r.order.slice(0, 3).map((id) => r.match.get(id)), [84, 84, 75])
})

test('real data: the osiedla with full content are exactly that top 3, best first', () => {
  const r = rankOsiedla(realScores(), seniorDefaults(), DEFAULT_FILTER_SECTIONS.score)
  assert.deepEqual(
    OSIEDLA.map((o) => o.msiId),
    r.order.slice(0, 3),
  )
  for (const o of OSIEDLA) assert.equal(o.profile, 'senior')
})

test('real data: other weights put other osiedla on top (the #1–#3 pills move)', () => {
  const w = { ...seniorDefaults(), cisza: 0, zielen: 0, kultura: 100, gastronomia: 100 }
  const top = rankOsiedla(realScores(), w, DEFAULT_FILTER_SECTIONS.score).order.slice(0, 3)
  assert.equal(top.length, 3)
  assert.ok(!top.includes('groszowka') && !top.includes('wilanow-krolewski'), top.join(','))
})
