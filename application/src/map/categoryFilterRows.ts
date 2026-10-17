import { FILTER_PANEL_CATEGORIES, isCategoryKey } from '../app/dictionary.ts'
import { weightToUi, type Weights } from '../app/weights.ts'
import { POI_INTEREST_GROUPS, poiInterestGroupForCategory } from './poiInterests.ts'
import type { CategoryKey } from './types.ts'

const POI_CAT_ORDER = [...new Set(POI_INTEREST_GROUPS.map((g) => g.category))]

/** Domyślne suwaki → heatmapa i wynik dopasowania. */
export const SCORE_FILTER_ROWS: readonly CategoryKey[] = [...FILTER_PANEL_CATEGORIES]

/**
 * Domyślnie tylko podgląd na mapie (checkboxy) — bez wpływu na heatmapę i ranking.
 */
export const MAP_PREVIEW_FILTER_ROWS: readonly CategoryKey[] = POI_CAT_ORDER.filter(
  (c) => !(FILTER_PANEL_CATEGORIES as readonly string[]).includes(c),
)

/** Wszystkie kategorie konfigurowalne w panelu (kolejność domyślna). */
export const CONFIGURABLE_FILTER_CATEGORIES: readonly CategoryKey[] = [...SCORE_FILTER_ROWS, ...MAP_PREVIEW_FILTER_ROWS]

/** @deprecated use filterSections */
export const FILTER_ROW_ORDER: readonly CategoryKey[] = CONFIGURABLE_FILTER_CATEGORIES

export const DEFAULT_FILTER_ROW_ORDER = FILTER_ROW_ORDER

export type FilterSectionId = 'score' | 'preview'

export interface FilterSections {
  score: CategoryKey[]
  preview: CategoryKey[]
}

export const DEFAULT_FILTER_SECTIONS: FilterSections = {
  score: [...SCORE_FILTER_ROWS],
  preview: [...MAP_PREVIEW_FILTER_ROWS],
}

const DEFAULT_SCORE_SET = new Set<string>(FILTER_PANEL_CATEGORIES)

function uniqueConfigurable(list: readonly CategoryKey[]): CategoryKey[] {
  const seen = new Set<string>()
  const out: CategoryKey[] = []
  for (const c of list) {
    if (!isCategoryKey(c) || seen.has(c)) continue
    if (!(CONFIGURABLE_FILTER_CATEGORIES as readonly string[]).includes(c)) continue
    seen.add(c)
    out.push(c)
  }
  return out
}

/** Naprawia brakujące kategorie i usuwa duplikaty między sekcjami. */
export function sanitizeFilterSections(raw: unknown, legacyOrder?: unknown): FilterSections {
  let score: CategoryKey[] = []
  let preview: CategoryKey[] = []

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as { score?: unknown; preview?: unknown }
    if (Array.isArray(o.score)) score = uniqueConfigurable(o.score as CategoryKey[])
    if (Array.isArray(o.preview)) preview = uniqueConfigurable(o.preview as CategoryKey[])
  }

  if (!score.length && !preview.length && Array.isArray(legacyOrder)) {
    const order = uniqueConfigurable(legacyOrder as CategoryKey[])
    for (const c of order) {
      if (DEFAULT_SCORE_SET.has(c)) score.push(c)
      else preview.push(c)
    }
  }

  if (!score.length && !preview.length) return { score: [...DEFAULT_FILTER_SECTIONS.score], preview: [...DEFAULT_FILTER_SECTIONS.preview] }

  const inScore = new Set(score)
  preview = preview.filter((c) => !inScore.has(c))
  const placed = new Set([...score, ...preview])
  for (const c of CONFIGURABLE_FILTER_CATEGORIES) {
    if (placed.has(c)) continue
    if (DEFAULT_SCORE_SET.has(c)) score.push(c)
    else preview.push(c)
  }

  return { score, preview }
}

/** @deprecated migrate to filterSections */
export function sanitizeFilterRowOrder(raw: unknown): CategoryKey[] {
  const { score, preview } = sanitizeFilterSections(null, raw)
  return [...score, ...preview]
}

export function sectionsEqual(a: FilterSections, b: FilterSections): boolean {
  return a.score.length === b.score.length && a.preview.length === b.preview.length && a.score.every((c, i) => c === b.score[i]) && a.preview.every((c, i) => c === b.preview[i])
}

export function categoryHasSlider(c: CategoryKey, sections: FilterSections): boolean {
  return sections.score.includes(c)
}

export function categoryIsMapPreviewOnly(c: CategoryKey, sections: FilterSections): boolean {
  return sections.preview.includes(c)
}

export function categoryHasGastronomyFilters(c: CategoryKey): boolean {
  return c === 'gastronomia'
}

export function categoryHasPoiFilters(c: CategoryKey): boolean {
  return poiInterestGroupForCategory(c) != null
}

/** Czy kategoria ma co doprecyzować w panelu szczegółów (kuchnie / typy POI). */
export function categoryHasDetailFilters(c: CategoryKey): boolean {
  return categoryHasGastronomyFilters(c) || categoryHasPoiFilters(c)
}

function previewCategorySet(sections: FilterSections): Set<string> {
  return new Set(sections.preview)
}

/** Subtypes for POI groups whose category is in „Podgląd na mapie”. */
export function filterMapPreviewSubtypes(subtypes: readonly string[], sections: FilterSections): string[] {
  const previewCats = previewCategorySet(sections)
  const allowed = new Set(
    POI_INTEREST_GROUPS.filter((g) => previewCats.has(g.category)).flatMap((g) => g.options.map((o) => o.subtype)),
  )
  return subtypes.filter((s) => allowed.has(s))
}

function poiSubtypeKeysAllowedOnMap(sections: FilterSections, weights: Weights): Set<string> {
  const previewCats = previewCategorySet(sections)
  const scoreOn = new Set(sections.score.filter((c) => weightToUi(weights[c]) > 0))
  const allowed = new Set<string>()
  for (const g of POI_INTEREST_GROUPS) {
    if (!previewCats.has(g.category) && !scoreOn.has(g.category)) continue
    for (const o of g.options) allowed.add(o.subtype)
  }
  return allowed
}

/** Zaznaczone subtypy POI do warstw mapy (score z włączonym suwakiem + podgląd). */
export function poiSubtypesVisibleOnMap(
  subtypes: readonly string[],
  sections: FilterSections,
  weights: Weights,
): string[] {
  const allowed = poiSubtypeKeysAllowedOnMap(sections, weights)
  return subtypes.filter((s) => allowed.has(s))
}

export type DropTarget = { section: FilterSectionId; index: number }

function removeFromSection(sections: FilterSections, cat: CategoryKey): FilterSections {
  return {
    score: sections.score.filter((c) => c !== cat),
    preview: sections.preview.filter((c) => c !== cat),
  }
}

function insertAt(list: CategoryKey[], cat: CategoryKey, index: number): CategoryKey[] {
  const next = list.filter((c) => c !== cat)
  const i = Math.max(0, Math.min(index, next.length))
  next.splice(i, 0, cat)
  return next
}

/** Zamiana miejsca w jednej sekcji (−1 = wyżej, +1 = niżej). */
export function shiftCategoryInSection(
  sections: FilterSections,
  section: FilterSectionId,
  cat: CategoryKey,
  delta: number,
): FilterSections {
  const list = [...sections[section]]
  const i = list.indexOf(cat)
  if (i < 0) return sections
  const j = i + delta
  if (j < 0 || j >= list.length) return sections
  list.splice(i, 1)
  list.splice(j, 0, cat)
  return { ...sections, [section]: list }
}

/** Przeniesienie do innej sekcji (domyślnie na koniec listy). */
export function moveCategoryToSection(
  sections: FilterSections,
  cat: CategoryKey,
  from: FilterSectionId,
  to: FilterSectionId,
  index?: number,
): FilterSections {
  return applyFilterDrop(sections, cat, from, { section: to, index: index ?? sections[to].length })
}

/** Przeniesienie kategorii między sekcjami lub reorder w tej samej sekcji. */
export function applyFilterDrop(
  sections: FilterSections,
  cat: CategoryKey,
  from: FilterSectionId,
  target: DropTarget,
): FilterSections {
  if (!(CONFIGURABLE_FILTER_CATEGORIES as readonly string[]).includes(cat)) return sections
  const stripped = removeFromSection(sections, cat)
  const list = target.section === 'score' ? stripped.score : stripped.preview
  const updated = insertAt(list, cat, target.index)
  return target.section === 'score' ? { ...stripped, score: updated } : { ...stripped, preview: updated }
}

/** Kategorie przeniesione preview → score (promote) i score → preview (demote). */
export function sectionMembershipChanges(prev: FilterSections, next: FilterSections): { promoted: CategoryKey[]; demoted: CategoryKey[] } {
  const prevScore = new Set(prev.score)
  const nextScore = new Set(next.score)
  const promoted = next.score.filter((c) => !prevScore.has(c))
  const demoted = prev.score.filter((c) => !nextScore.has(c))
  return { promoted, demoted }
}

/** Badge count when sub-filters are active (null = hide badge). */
export function categoryFilterBadgeCount(
  c: CategoryKey,
  sections: FilterSections,
  opts: { gastronomyCuisines: readonly string[]; poiInterests: readonly string[] },
): number | null {
  if (categoryHasGastronomyFilters(c)) {
    const n = opts.gastronomyCuisines.length
    return n > 0 ? n : null
  }
  const group = poiInterestGroupForCategory(c)
  if (!group) return null
  const on = group.options.filter((o) => opts.poiInterests.includes(o.subtype)).length
  return on > 0 ? on : null
}
