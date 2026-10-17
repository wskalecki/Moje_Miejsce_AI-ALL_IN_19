// Run: npm test  (node --test, native TS type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSentence, othersLabel, sentenceToString } from './sentence.ts'

const s = (input: Parameters<typeof buildSentence>[0]) => sentenceToString(buildSentence(input))

test('rodzina with defaults matches acceptance criterion 4', () => {
  assert.equal(
    s({ profile: 'rodzina', priorities: ['edukacja', 'zielen', 'cisza', 'zakupy'], horizon: 'stale' }),
    'Mamy rodzinę, liczą się dla nas przedszkola i szkoły, zieleń, cisza i zakupy, szukamy miejsca na stałe.',
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
    s({ profile: 'senior', priorities: ['zdrowie'], horizon: 'chwila' }),
    'Jestem na emeryturze, liczy się dla mnie zdrowie, szukam miejsca na chwilę.',
  )
})

test('"zakupy" as the only priority → plural verb', () => {
  assert.equal(
    s({ profile: 'senior', priorities: ['zakupy'], horizon: 'stale' }),
    'Jestem na emeryturze, liczą się dla mnie zakupy, szukam miejsca na stałe.',
  )
})

test('4 priorities (student defaults)', () => {
  assert.equal(
    s({ profile: 'student', priorities: ['komunikacja', 'gastronomia', 'zycieNocne', 'sport'], horizon: 'chwila' }),
    'Studiuję, liczą się dla mnie komunikacja, gastronomia, życie nocne i sport, szukam miejsca na chwilę.',
  )
})

test('2 priorities joined with "i"', () => {
  assert.equal(
    s({ profile: 'student', priorities: ['komunikacja', 'gastronomia'], horizon: 'chwila' }),
    'Studiuję, liczą się dla mnie komunikacja i gastronomia, szukam miejsca na chwilę.',
  )
})

test('maxNamed collapses long priority lists into "jeszcze N inne"', () => {
  const priorities = ['komunikacja', 'gastronomia', 'zycieNocne', 'sport', 'cisza', 'zielen'] as const
  assert.equal(
    s({ profile: 'student', priorities: [...priorities], horizon: 'chwila', maxNamed: 4 }),
    'Studiuję, liczą się dla mnie komunikacja, gastronomia, życie nocne i jeszcze 3 inne, szukam miejsca na chwilę.',
  )
  // exactly maxNamed → all named
  assert.equal(
    s({ profile: 'rodzina', priorities: ['edukacja', 'zielen', 'cisza', 'zakupy'], horizon: 'stale', maxNamed: 4 }),
    'Mamy rodzinę, liczą się dla nas przedszkola i szkoły, zieleń, cisza i zakupy, szukamy miejsca na stałe.',
  )
})

test('othersLabel follows Polish numeral agreement', () => {
  assert.equal(othersLabel(2), 'jeszcze 2 inne')
  assert.equal(othersLabel(4), 'jeszcze 4 inne')
  assert.equal(othersLabel(5), 'jeszcze 5 innych')
  assert.equal(othersLabel(7), 'jeszcze 7 innych')
})
