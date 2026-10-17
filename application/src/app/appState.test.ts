// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_STATE, parseState, reducer, type Action } from './appState.ts'
import { CATEGORY_ORDER, DEFAULT_PRIORITIES } from './dictionary.ts'
import { baseWeights, deriveWeights } from './weights.ts'
import type { AppState } from './types.ts'

const run = (...actions: Action[]): AppState => actions.reduce(reducer, INITIAL_STATE)

test('setProfile initialises priorities, weights and horizon from the profile', () => {
  const s = run({ type: 'setProfile', profile: 'rodzina' })
  assert.deepEqual(s.priorities, DEFAULT_PRIORITIES.rodzina)
  assert.deepEqual(s.weights, deriveWeights('rodzina', DEFAULT_PRIORITIES.rodzina))
  assert.equal(s.horizon, 'stale')
})

test('setProfile with keepChoices keeps tuned weights for the same profile', () => {
  const tuned = run({ type: 'setProfile', profile: 'student' }, { type: 'setWeight', category: 'cisza', value: 33 })
  assert.equal(reducer(tuned, { type: 'setProfile', profile: 'student', keepChoices: true }), tuned)
  assert.equal(reducer(tuned, { type: 'setProfile', profile: 'student' }).weights.cisza, baseWeights('student').cisza)
})

test('togglePriority has no limit', () => {
  let s = run({ type: 'setProfile', profile: 'senior' })
  for (const c of CATEGORY_ORDER) if (!s.priorities.includes(c)) s = reducer(s, { type: 'togglePriority', category: c })
  assert.equal(s.priorities.length, CATEGORY_ORDER.length)
  for (const c of CATEGORY_ORDER) assert.ok(s.weights[c] >= 80, c)
})

test('togglePriority off returns the weight to the profile default, keeps other tuning', () => {
  const s = run(
    { type: 'setProfile', profile: 'rodzina' },
    { type: 'setWeight', category: 'sport', value: 5 },
    { type: 'togglePriority', category: 'cisza' }, // was a default priority → off
  )
  assert.ok(!s.priorities.includes('cisza'))
  assert.equal(s.weights.cisza, baseWeights('rodzina').cisza)
  assert.equal(s.weights.sport, 5)
  const on = reducer(s, { type: 'togglePriority', category: 'zycieNocne' })
  assert.deepEqual(on.priorities.at(-1), 'zycieNocne')
  assert.equal(on.weights.zycieNocne, 80)
})

test('setWeight clamps; turning a priority below 80 drops it, raising does not add one', () => {
  let s = run({ type: 'setProfile', profile: 'student' })
  s = reducer(s, { type: 'setWeight', category: 'gastronomia', value: 40 })
  assert.equal(s.weights.gastronomia, 40)
  assert.ok(!s.priorities.includes('gastronomia'))
  s = reducer(s, { type: 'setWeight', category: 'cisza', value: 140 })
  assert.equal(s.weights.cisza, 100)
  assert.ok(!s.priorities.includes('cisza'))
  assert.equal(reducer(s, { type: 'setWeight', category: 'cisza', value: 100 }), s, 'no-op returns same state')
})

test('resetWeights re-derives from profile + current priorities', () => {
  const s = run(
    { type: 'setProfile', profile: 'senior' },
    { type: 'setWeight', category: 'sport', value: 99 },
    { type: 'setWeight', category: 'zielen', value: 1 },
    { type: 'resetWeights' },
  )
  assert.deepEqual(s.weights, deriveWeights('senior', s.priorities))
})

test('setPriorities dedupes and re-derives weights', () => {
  const s = run({ type: 'setProfile', profile: 'student' }, { type: 'setPriorities', priorities: ['cisza', 'cisza', 'zielen', 'sport', 'kultura', 'zdrowie'] })
  assert.deepEqual(s.priorities, ['cisza', 'zielen', 'sport', 'kultura', 'zdrowie'])
  assert.deepEqual(s.weights, deriveWeights('student', s.priorities))
})

test('parseState round-trips and repairs bad storage', () => {
  const s = run({ type: 'setProfile', profile: 'rodzina' }, { type: 'setWeight', category: 'kultura', value: 64 })
  assert.deepEqual(parseState(JSON.stringify(s)), s)
  assert.equal(parseState(null), INITIAL_STATE)
  assert.equal(parseState('{oops'), INITIAL_STATE)
  // v1-shaped state (no weights) → derived from profile + priorities
  const v1 = parseState(JSON.stringify({ profile: 'student', priorities: ['cisza', 'nope'], horizon: 'chwila', timelineYear: 2028, visited: ['powisle'] }))
  assert.deepEqual(v1.priorities, ['cisza'])
  assert.deepEqual(v1.weights, deriveWeights('student', ['cisza']))
  // priorities whose stored weight is < 80 are dropped (invariant)
  const bad = parseState(JSON.stringify({ ...s, weights: { ...s.weights, edukacja: 10 } }))
  assert.ok(!bad.priorities.includes('edukacja'))
})
