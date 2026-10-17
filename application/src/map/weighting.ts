/**
 * Client-side weighting for the map filters (iteration 2, I2-4).
 *
 * - match of an osiedle = weighted mean of its category scores (0–100) by the user's weights (0–100);
 * - heat weight of a grid point = weighted mean of its per-category values (0–1), normalised so the
 *   top ~3 % of points reach 1 — or, in solo mode, the value of one category alone.
 *
 * Pure module (explicit `.ts` imports, no maplibre runtime) so `node --test` can load it.
 */
import type { ExpressionSpecification } from 'maplibre-gl'
import { CATEGORY_ORDER, FILTER_PANEL_CATEGORIES } from '../app/dictionary.ts'
import type { CategoryKey } from '../app/types.ts'

export type Weights = Record<CategoryKey, number>

function panelSet(scoreCategories: readonly CategoryKey[]): Set<CategoryKey> {
  return new Set(scoreCategories)
}

/** Sum of panel slider weights (0 = user turned off every criterion). */
export function panelWeightsSum(weights: Weights, scoreCategories: readonly CategoryKey[] = FILTER_PANEL_CATEGORIES): number {
  let sum = 0
  for (const c of scoreCategories) sum += Math.max(0, Number(weights[c]) || 0)
  return sum
}

export function isPanelMixActive(weights: Weights, scoreCategories: readonly CategoryKey[] = FILTER_PANEL_CATEGORIES): boolean {
  return panelWeightsSum(weights, scoreCategories) > 0
}

/** Share of each category in the mix (sums to 1, or all 0 when no criterion is on). */
export function shares(
  weights: Weights,
  solo: CategoryKey | null = null,
  scoreCategories: readonly CategoryKey[] = FILTER_PANEL_CATEGORIES,
): number[] {
  if (solo) return CATEGORY_ORDER.map((c) => (c === solo ? 1 : 0))
  const panel = panelSet(scoreCategories)
  const raw = CATEGORY_ORDER.map((c) => (panel.has(c) ? Math.max(0, Number(weights[c]) || 0) : 0))
  const sum = raw.reduce((a, b) => a + b, 0)
  if (sum > 0) return raw.map((w) => w / sum)
  return CATEGORY_ORDER.map(() => 0)
}

/** Weighted mean of category scores (0–100), rounded. All panel weights 0 → 0 (brak dopasowania). */
export function weightedMatch(
  cats: Record<CategoryKey, number>,
  weights: Weights,
  solo: CategoryKey | null = null,
  scoreCategories: readonly CategoryKey[] = FILTER_PANEL_CATEGORIES,
): number {
  if (!solo && !isPanelMixActive(weights, scoreCategories)) return 0
  const s = shares(weights, solo, scoreCategories)
  let v = 0
  CATEGORY_ORDER.forEach((c, i) => {
    v += s[i] * (Number(cats[c]) || 0)
  })
  return Math.round(Math.max(0, Math.min(100, v)))
}

export function quantile(sorted: readonly number[], t: number): number {
  if (!sorted.length) return 0
  return sorted[Math.max(0, Math.min(sorted.length - 1, Math.round(t * (sorted.length - 1))))]
}

/** Five strictly ascending stops (4 / 30 / 60 / 85 / 98 %) for a fill ramp. */
export function rampStops(values: readonly number[]): [number, number, number, number, number] {
  const v = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  const stops = v.length ? [0.04, 0.3, 0.6, 0.85, 0.98].map((t) => quantile(v, t)) : [50, 62, 74, 86, 98]
  for (let i = 1; i < stops.length; i++) if (stops[i] <= stops[i - 1]) stops[i] = stops[i - 1] + 0.5
  return stops as [number, number, number, number, number]
}

/** Property key of category `i` on the heat / osiedla features. */
export const catProp = (i: number) => `c${i}`

/**
 * Linear combination Σ kᵢ · get(cᵢ) as a MapLibre expression (only non-zero terms).
 * Returns a literal 0 when every coefficient is 0.
 */
export function linearExpr(coef: readonly number[]): ExpressionSpecification | number {
  const terms: ExpressionSpecification[] = []
  coef.forEach((k, i) => {
    if (k > 1e-6) terms.push(['*', Number(k.toFixed(6)), ['to-number', ['get', catProp(i)], 0]])
  })
  if (!terms.length) return 0
  if (terms.length === 1) return terms[0]
  return ['+', ...terms] as unknown as ExpressionSpecification
}

export interface HeatRange {
  lo: number
  hi: number
}

/**
 * Contrast window for the mixed heat value Σ sᵢ·cᵢ over all grid points (rows = per-category values 0–1):
 * points at or below the 35th percentile get weight 0, the top 3 % get 1 — so the colour marks where the
 * mix is *better than typical*, instead of an even fog over the whole city.
 */
export function heatRange(rows: readonly ArrayLike<number>[], s: readonly number[]): HeatRange {
  const v: number[] = new Array(rows.length)
  for (let p = 0; p < rows.length; p++) {
    let x = 0
    const r = rows[p]
    for (let i = 0; i < s.length; i++) if (s[i]) x += s[i] * r[i]
    v[p] = x
  }
  v.sort((a, b) => a - b)
  const lo = quantile(v, 0.35)
  const hi = Math.max(lo + 1e-3, quantile(v, 0.97))
  return { lo, hi }
}

/** `heatmap-weight` for the mix: clamp((Σ sᵢ·cᵢ − lo) / (hi − lo), 0, 1) ^ gamma. */
export function heatWeightExpr(s: readonly number[], range: HeatRange, gamma: number): number | ExpressionSpecification {
  if (!s.some((k) => k > 1e-6)) return 0
  const span = range.hi - range.lo
  const lin = linearExpr(s.map((k) => k / span))
  const shifted: ExpressionSpecification = ['-', lin as ExpressionSpecification, Number((range.lo / span).toFixed(6))]
  return ['^', ['max', 0, ['min', 1, shifted]], gamma] as ExpressionSpecification
}

/** Rank featured items by their weighted match (highest first; ties keep the input order). */
export function rankBy<T>(items: readonly T[], score: (t: T) => number): T[] {
  return items
    .map((t, i) => ({ t, i, s: score(t) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.t)
}
