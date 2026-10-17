import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OSIEDLA, type Osiedle, type TimelineEvent } from '../mock/osiedla.ts'
import { effectYear, effectiveEvents, eventsUpTo, isInProgress, matchAtYear, statDeltasAtYear, statsAtYear } from './timelineMath.ts'

const ev = (id: string, year: TimelineEvent['year'], statDeltas: TimelineEvent['statDeltas'], matchDelta?: number): TimelineEvent => ({
  id,
  year,
  title: id,
  description: '',
  category: 'zielen',
  status: 'planowana',
  statDeltas,
  matchDelta,
})

const base = OSIEDLA[0]
const fixture: Osiedle = {
  ...base,
  stats: { ...base.stats, zielen: 60, cisza: 98 },
  match: { ...base.match, rodzina: 97 },
  timeline: [ev('c', 2029, { zielen: 4 }), ev('a', 2026, { zielen: 3 }, 1), ev('b', 2027, { cisza: 5 }, 2)],
}

test('2026 is the baseline: plain stats, no deltas, no match change', () => {
  assert.deepEqual(statsAtYear(fixture, 2026), fixture.stats)
  assert.deepEqual(statDeltasAtYear(fixture, 2026), {})
  assert.equal(matchAtYear(fixture, 'rodzina', 2026), 97)
  for (const o of OSIEDLA) assert.deepEqual(statDeltasAtYear(o, 2026), {}, o.slug)
})

test('events dated 2026 are visible but "w toku" in 2026 and count from 2027', () => {
  const a = fixture.timeline[1]
  assert.equal(effectYear(a), 2027)
  assert.deepEqual(
    eventsUpTo(fixture, 2026).map((e) => e.id),
    ['a'],
  )
  assert.deepEqual(effectiveEvents(fixture, 2026), [])
  assert.ok(isInProgress(a, 2026))
  assert.ok(!isInProgress(a, 2027))
  assert.deepEqual(statDeltasAtYear(fixture, 2027), { zielen: 3, cisza: 2 }) // cisza 98 + 5 clamps to 100
})

test('cumulative sums by year, clamped', () => {
  assert.equal(statsAtYear(fixture, 2028).zielen, 63)
  assert.equal(statsAtYear(fixture, 2030).zielen, 67)
  assert.equal(statsAtYear(fixture, 2030).cisza, 100)
  assert.equal(matchAtYear(fixture, 'rodzina', 2027), 99) // 97 + 1 + 2 clamps to 99
  assert.deepEqual(
    eventsUpTo(fixture, 2030).map((e) => e.id),
    ['a', 'b', 'c'],
  )
})
