/**
 * Honest ranking of all osiedla for a set of category weights — the pure core of `useMatch` /
 * `useRanking` (src/app/useMatch.ts). Uses the map's weighting (src/map/weighting.ts), so the map
 * colours, the featured pills, the sentence bar, the cinematic and the osiedle panel all agree.
 *
 * Pure module (explicit `.ts` imports, no React) so `node --test` can load it.
 */
import { CATEGORY_ORDER, FILTER_PANEL_CATEGORIES } from './dictionary.ts'
import type { CategoryKey } from './types.ts'
import { shares, weightedMatch, type Weights } from '../map/weighting.ts'

/** One entry of public/data/osiedla-scores.json (only the fields the ranking needs). */
export interface ScoreEntry {
  /** Category scores 0–100 (percentile ranks among all osiedla). */
  cats: Partial<Record<CategoryKey | 'zycie_nocne', number>>
}

export type ScoresFile = Record<string, ScoreEntry>

export interface Ranking {
  /** Weighted match 0–100 (rounded) per osiedle id. */
  match: ReadonlyMap<string, number>
  /** 1-based place per osiedle id (1 = best for these weights). */
  rank: ReadonlyMap<string, number>
  /** Osiedle ids, best first. */
  order: readonly string[]
  /** Number of ranked osiedla. */
  total: number
}

/** Category scores with the same fallbacks as the map (missing → 50, `zycie_nocne` alias). */
export function normCats(raw: ScoreEntry['cats'] | undefined): Record<CategoryKey, number> {
  const out = {} as Record<CategoryKey, number>
  for (const c of CATEGORY_ORDER) {
    const v = raw?.[c] ?? (c === 'zycieNocne' ? raw?.zycie_nocne : undefined)
    out[c] = typeof v === 'number' && Number.isFinite(v) ? v : 50
  }
  return out
}

/**
 * Ranks every osiedle by its weighted match. Sorting uses the unrounded weighted mean (so two
 * osiedla showing the same rounded % still get distinct places); ties fall back to the id.
 */
export function rankOsiedla(
  scores: ScoresFile,
  weights: Weights,
  scoreCategories: readonly CategoryKey[] = FILTER_PANEL_CATEGORIES,
): Ranking {
  const sh = shares(weights, null, scoreCategories)
  const rows = Object.entries(scores).map(([id, e]) => {
    const cats = normCats(e?.cats)
    const exact = CATEGORY_ORDER.reduce((v, c, i) => v + sh[i] * cats[c], 0)
    return { id, exact, match: weightedMatch(cats, weights, null, scoreCategories) }
  })
  rows.sort((a, b) => b.exact - a.exact || a.id.localeCompare(b.id))
  return {
    match: new Map(rows.map((r) => [r.id, r.match])),
    rank: new Map(rows.map((r, i) => [r.id, i + 1])),
    order: rows.map((r) => r.id),
    total: rows.length,
  }
}
