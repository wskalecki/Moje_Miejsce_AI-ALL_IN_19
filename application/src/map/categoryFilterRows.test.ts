import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveWeights, uiToWeight } from '../app/weights.ts'
import {
  applyFilterDrop,
  categoryHasDetailFilters,
  DEFAULT_FILTER_SECTIONS,
  filterMapPreviewSubtypes,
  moveCategoryToSection,
  poiSubtypesVisibleOnMap,
  sanitizeFilterSections,
  sectionMembershipChanges,
  shiftCategoryInSection,
} from './categoryFilterRows.ts'

test('categoryHasDetailFilters is false for slider-only categories', () => {
  assert.equal(categoryHasDetailFilters('cisza'), false)
  assert.equal(categoryHasDetailFilters('gastronomia'), true)
  assert.equal(categoryHasDetailFilters('sport'), true)
})

test('sanitizeFilterSections repairs missing categories', () => {
  const s = sanitizeFilterSections({ score: ['sport'], preview: ['zakupy'] })
  assert.ok(s.score.includes('sport'))
  assert.ok(s.preview.includes('zakupy'))
  assert.equal(s.score.length + s.preview.length, DEFAULT_FILTER_SECTIONS.score.length + DEFAULT_FILTER_SECTIONS.preview.length)
})

test('applyFilterDrop moves category between sections', () => {
  const start = { ...DEFAULT_FILTER_SECTIONS }
  const next = applyFilterDrop(start, 'sport', 'preview', { section: 'score', index: start.score.length })
  assert.ok(next.score.includes('sport'))
  assert.ok(!next.preview.includes('sport'))
})

test('sectionMembershipChanges detects promote and demote', () => {
  const next = applyFilterDrop(DEFAULT_FILTER_SECTIONS, 'sport', 'preview', { section: 'score', index: 4 })
  const { promoted, demoted } = sectionMembershipChanges(DEFAULT_FILTER_SECTIONS, next)
  assert.deepEqual(promoted, ['sport'])
  assert.deepEqual(demoted, [])
})

test('shiftCategoryInSection swaps order', () => {
  const s = shiftCategoryInSection(DEFAULT_FILTER_SECTIONS, 'score', 'gastronomia', -1)
  const i = s.score.indexOf('gastronomia')
  assert.ok(i >= 0 && i < DEFAULT_FILTER_SECTIONS.score.indexOf('gastronomia'))
})

test('moveCategoryToSection matches applyFilterDrop to end', () => {
  const a = moveCategoryToSection(DEFAULT_FILTER_SECTIONS, 'sport', 'preview', 'score')
  const b = applyFilterDrop(DEFAULT_FILTER_SECTIONS, 'sport', 'preview', { section: 'score', index: DEFAULT_FILTER_SECTIONS.score.length })
  assert.deepEqual(a, b)
})

test('poiSubtypesVisibleOnMap empty when no interests checked', () => {
  const w = deriveWeights('student', [])
  assert.deepEqual(poiSubtypesVisibleOnMap([], DEFAULT_FILTER_SECTIONS, w), [])
})

test('poiSubtypesVisibleOnMap score kultura needs weight and checked subtype', () => {
  const w = { ...deriveWeights('student', []), kultura: uiToWeight(3) }
  assert.deepEqual(poiSubtypesVisibleOnMap(['event'], DEFAULT_FILTER_SECTIONS, w), ['event'])
  const wOff = { ...deriveWeights('student', []), kultura: 0 }
  assert.deepEqual(poiSubtypesVisibleOnMap(['event'], DEFAULT_FILTER_SECTIONS, wOff), [])
})

test('poiSubtypesVisibleOnMap preview sport without check stays off map', () => {
  const w = deriveWeights('student', [])
  assert.deepEqual(poiSubtypesVisibleOnMap([], DEFAULT_FILTER_SECTIONS, w), [])
})

test('poiSubtypesVisibleOnMap preview sport with subtype on', () => {
  const w = deriveWeights('student', [])
  assert.deepEqual(poiSubtypesVisibleOnMap(['playground'], DEFAULT_FILTER_SECTIONS, w), ['playground'])
})

test('filterMapPreviewSubtypes only keeps preview-section categories', () => {
  const sections = applyFilterDrop(DEFAULT_FILTER_SECTIONS, 'sport', 'preview', { section: 'score', index: 4 })
  const subs = filterMapPreviewSubtypes(['pitch', 'metro_station'], sections)
  assert.ok(!subs.includes('pitch'))
  assert.ok(subs.includes('metro_station'))
})
