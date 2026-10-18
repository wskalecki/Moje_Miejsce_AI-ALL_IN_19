import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OSIEDLA, type Osiedle, type TimelineEvent } from '../mock/osiedla.ts'
import {
  LAST_YEAR,
  LATEST_DATED_YEAR,
  TIMELINE_STOPS,
  buildStops,
  effectYear,
  effectiveEvents,
  eventsAtStop,
  eventsUpTo,
  groupByStop,
  isInProgress,
  isUndated,
  matchAtYear,
  statDeltasAtYear,
  statsAtYear,
  stopLabel,
  stopRangeLabel,
  toStop,
  undatedEvents,
  yearLabel,
} from './timelineMath.ts'

const ev = (id: string, year: number, statDeltas: TimelineEvent['statDeltas'], matchDelta?: number, extra: Partial<TimelineEvent> = {}): TimelineEvent => ({
  id,
  year,
  title: id,
  description: '',
  category: 'zielen',
  status: 'planowana',
  statDeltas,
  matchDelta,
  ...extra,
})

const base = OSIEDLA[0]
const fixture: Osiedle = {
  ...base,
  stats: { ...base.stats, zielen: 60, cisza: 98, komunikacja: 40 },
  match: { ...base.match, rodzina: 90, senior: 50 },
  timeline: [
    ev('c', 2029, { zielen: 4 }),
    ev('a', 2026, { zielen: 3 }, 1),
    ev('b', 2027, { cisza: 5 }, 2),
    ev('d', 2031, { komunikacja: 10 }, 1, { yearUncertain: true }),
    ev('e', 2044, { komunikacja: 15 }, 1, { yearUncertain: true, matchDeltas: { senior: 4 } }),
    ev('u', 2040, { zielen: 20 }, 5, { yearUncertain: true, yearPlacement: 'bez terminu' }),
  ],
}

test('stops: today, then round 5-year years up to the latest dated investment', () => {
  assert.deepEqual([...TIMELINE_STOPS], [2026, 2030, 2035, 2040, 2045])
  assert.equal(LAST_YEAR, 2045)
  assert.deepEqual(buildStops(2026, 2030), [2026, 2030])
  assert.deepEqual(buildStops(2026, 2031), [2026, 2030, 2035])
  assert.deepEqual(buildStops(2025, 2035), [2025, 2030, 2035])
  assert.deepEqual(TIMELINE_STOPS.map(stopLabel), ['Dziś', '2030', '2035', '2040', '2045'])
  assert.deepEqual(TIMELINE_STOPS.map(stopRangeLabel), ['Dziś', '2027–2030', '2031–2035', '2036–2040', '2041–2045'])
})

test('the last stop covers every dated event in the data', () => {
  const dated = OSIEDLA.flatMap((o) => o.timeline.filter((e) => !isUndated(e)).map((e) => e.year))
  assert.equal(Math.max(...dated), LATEST_DATED_YEAR)
  assert.ok(dated.every((y) => y <= LAST_YEAR))
})

test('every event in the data links to its cited source (card and map pin open it)', () => {
  for (const e of OSIEDLA.flatMap((o) => o.timeline)) {
    assert.match(e.sourceUrl ?? '', /^https:\/\/\S+$/, e.id)
    assert.ok(e.sourceTitle, e.id)
  }
})

test('any year snaps to the stop it belongs to (first stop ≥ year, clamped)', () => {
  assert.equal(toStop(2020), 2026)
  assert.equal(toStop(2026), 2026)
  assert.equal(toStop(2027), 2030)
  assert.equal(toStop(2028), 2030) // a stored yearly value from an older session
  assert.equal(toStop(2030), 2030)
  assert.equal(toStop(2031), 2035)
  assert.equal(toStop(2044), 2045)
  assert.equal(toStop(2060), 2045)
})

test('events between stops are grouped into the next stop and keep their own year', () => {
  assert.deepEqual(
    groupByStop(fixture, 2026).map((g) => [g.stop, g.events.map((e) => e.id)]),
    [[2026, ['a']]],
  )
  assert.deepEqual(
    groupByStop(fixture, 2035).map((g) => [g.stop, g.events.map((e) => e.id)]),
    [
      [2026, ['a']],
      [2030, ['b', 'c']],
      [2035, ['d']],
    ],
  )
  // 2040 has no event: the group is dropped, the 2045 stop gathers the 2044 event
  assert.deepEqual(
    groupByStop(fixture, 2045).map((g) => g.stop),
    [2026, 2030, 2035, 2045],
  )
  assert.deepEqual(eventsAtStop(fixture, 2040), [])
  assert.deepEqual(
    eventsAtStop(fixture, 2045).map((e) => e.year),
    [2044],
  )
})

test('undated events never get a stop, a year label or a share of the forecast', () => {
  const u = fixture.timeline[5]
  assert.ok(isUndated(u))
  assert.equal(yearLabel(u), 'bez terminu')
  assert.equal(yearLabel(fixture.timeline[3]), 'ok. 2031')
  assert.equal(yearLabel(fixture.timeline[0]), '2029')
  assert.deepEqual(
    undatedEvents(fixture).map((e) => e.id),
    ['u'],
  )
  for (const s of TIMELINE_STOPS) {
    assert.ok(!eventsUpTo(fixture, s).includes(u), String(s))
    assert.ok(!effectiveEvents(fixture, s).includes(u), String(s))
  }
  assert.equal(statsAtYear(fixture, 2045).zielen, 67) // 60 + 3 + 4, not + 20
})

test('2026 is the baseline: plain stats, no deltas, no match change', () => {
  assert.deepEqual(statsAtYear(fixture, 2026), fixture.stats)
  assert.deepEqual(statDeltasAtYear(fixture, 2026), {})
  assert.equal(matchAtYear(fixture, 'rodzina', 2026), 90)
  for (const o of OSIEDLA) assert.deepEqual(statDeltasAtYear(o, 2026), {}, o.slug)
})

test('events dated 2026 are visible but "w toku" today and count from the 2030 stop', () => {
  const a = fixture.timeline[1]
  assert.equal(effectYear(a), 2027)
  assert.deepEqual(
    eventsUpTo(fixture, 2026).map((e) => e.id),
    ['a'],
  )
  assert.deepEqual(effectiveEvents(fixture, 2026), [])
  assert.ok(isInProgress(a, 2026))
  assert.ok(!isInProgress(a, 2030))
})

test('cumulative deltas per stop, clamped', () => {
  assert.deepEqual(statDeltasAtYear(fixture, 2030), { zielen: 7, cisza: 2 }) // cisza 98 + 5 clamps to 100
  assert.deepEqual(statDeltasAtYear(fixture, 2035), { zielen: 7, cisza: 2, komunikacja: 10 })
  assert.deepEqual(statDeltasAtYear(fixture, 2040), statDeltasAtYear(fixture, 2035))
  assert.deepEqual(statDeltasAtYear(fixture, 2045), { zielen: 7, cisza: 2, komunikacja: 25 })
  assert.equal(matchAtYear(fixture, 'rodzina', 2030), 93)
  assert.equal(matchAtYear(fixture, 'rodzina', 2035), 94)
  assert.equal(matchAtYear(fixture, 'rodzina', 2045), 95)
  assert.equal(matchAtYear(fixture, 'rodzina', 2045, 98), 99) // today's live match + 5 clamps to 99
  // the profile's own matchDeltas entry wins over the owner-profile matchDelta
  assert.equal(matchAtYear(fixture, 'senior', 2045), 50 + 1 + 2 + 1 + 4)
  assert.deepEqual(
    eventsUpTo(fixture, 2045).map((e) => e.id),
    ['a', 'b', 'c', 'd', 'e'],
  )
})

test('featured data: Wilanów gets the M4 effect only at the 2045 stop', () => {
  const w = OSIEDLA.find((o) => o.slug === 'wilanow-krolewski')!
  for (const s of [2026, 2030, 2035, 2040]) assert.deepEqual(statDeltasAtYear(w, s), {}, String(s))
  assert.deepEqual(statDeltasAtYear(w, 2045), { komunikacja: 15 })
  assert.equal(matchAtYear(w, 'senior', 2045, 70), 71)
  assert.equal(matchAtYear(w, 'student', 2045, 70), 74)
})
