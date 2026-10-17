// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PRIORITIES } from '../app/dictionary.ts'
import { buildSentence, othersLabel, sentenceToString } from './sentence.ts'

const s = (input: Parameters<typeof buildSentence>[0]) => sentenceToString(buildSentence(input))

test('rodzina with defaults matches acceptance criterion 4', () => {
  assert.equal(
    s({ profile: 'rodzina', priorities: [...DEFAULT_PRIORITIES.rodzina], horizon: 'stale' }),
    'Mamy rodzinę, liczą się dla nas zieleń, cisza i kultura, szukamy miejsca kupno.',
  )
})

test('0 priorities → empty slot, singular verb', () => {
  assert.equal(s({ profile: 'student', priorities: [], horizon: null }), 'Studiuję, liczy się dla mnie …, szukam miejsca ….')
})

test('nothing chosen yet', () => {
  assert.equal(s({ profile: null, priorities: [], horizon: null }), '…, liczy się dla mnie …, szukam miejsca ….')
})

test('1 priority → singular verb', () => {
  assert.equal(
    s({ profile: 'senior', priorities: ['cisza'], horizon: 'chwila' }),
    'Jestem na emeryturze, liczy się dla mnie cisza, szukam miejsca wynajem.',
  )
})

test('"zakupy" as the only priority → plural verb', () => {
  assert.equal(
    s({ profile: 'senior', priorities: ['zakupy'], horizon: 'stale' }),
    'Jestem na emeryturze, liczą się dla mnie zakupy, szukam miejsca kupno.',
  )
})

test('4 priorities (student defaults)', () => {
  assert.equal(
    s({ profile: 'student', priorities: [...DEFAULT_PRIORITIES.student], horizon: 'chwila' }),
    'Studiuję, liczą się dla mnie gastronomia, kultura i zieleń, szukam miejsca wynajem.',
  )
})

test('2 priorities joined with "i"', () => {
  assert.equal(
    s({ profile: 'student', priorities: ['gastronomia', 'kultura'], horizon: 'chwila' }),
    'Studiuję, liczą się dla mnie gastronomia i kultura, szukam miejsca wynajem.',
  )
})

test('maxNamed collapses long priority lists into "jeszcze N inne"', () => {
  const priorities = ['gastronomia', 'kultura', 'zielen', 'cisza', 'sport', 'komunikacja'] as const
  assert.equal(
    s({ profile: 'student', priorities: [...priorities], horizon: 'chwila', maxNamed: 4 }),
    'Studiuję, liczą się dla mnie gastronomia, kultura, zieleń i jeszcze 3 inne, szukam miejsca wynajem.',
  )
  assert.equal(
    s({ profile: 'rodzina', priorities: [...DEFAULT_PRIORITIES.rodzina], horizon: 'stale', maxNamed: 4 }),
    'Mamy rodzinę, liczą się dla nas zieleń, cisza i kultura, szukamy miejsca kupno.',
  )
})

test('othersLabel follows Polish numeral agreement', () => {
  assert.equal(othersLabel(2), 'jeszcze 2 inne')
  assert.equal(othersLabel(4), 'jeszcze 4 inne')
  assert.equal(othersLabel(5), 'jeszcze 5 innych')
  assert.equal(othersLabel(7), 'jeszcze 7 innych')
})
