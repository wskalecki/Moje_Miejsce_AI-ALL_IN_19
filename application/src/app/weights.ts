/**
 * Category weights (0–100) — groundwork for the map filter panel (iteration 2).
 *
 * - Profile defaults = `PROFILE_WEIGHTS` normalised so the profile's top category is 100.
 * - Every priority picked in the survey is boosted to at least `PRIORITY_WEIGHT`.
 * - Before a profile is chosen all categories sit at `NEUTRAL_WEIGHT`.
 *
 * Pure module (explicit `.ts` imports) so `node --test` can load it.
 */
import { CATEGORY_ORDER, PROFILE_WEIGHTS } from './dictionary.ts'
import type { CategoryKey, ProfileId } from './types.ts'

export type Weights = Record<CategoryKey, number>

export const WEIGHT_MIN = 0
export const WEIGHT_MAX = 100
/** Minimum weight of a category the user marked as a priority. */
export const PRIORITY_WEIGHT = 80
export const NEUTRAL_WEIGHT = 50

export function clampWeight(value: number): number {
  if (!Number.isFinite(value)) return WEIGHT_MIN
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(value)))
}

function fill(fn: (c: CategoryKey) => number): Weights {
  const out = {} as Weights
  for (const c of CATEGORY_ORDER) out[c] = fn(c)
  return out
}

/** Profile defaults, normalised so the max = 100 (rounded to integers). */
export function baseWeights(profile: ProfileId | null): Weights {
  if (!profile) return fill(() => NEUTRAL_WEIGHT)
  const raw = PROFILE_WEIGHTS[profile]
  const max = Math.max(...CATEGORY_ORDER.map((c) => raw[c]))
  return fill((c) => (max > 0 ? clampWeight((raw[c] / max) * WEIGHT_MAX) : NEUTRAL_WEIGHT))
}

/** Profile defaults with the given priorities boosted to ≥ `PRIORITY_WEIGHT`. */
export function deriveWeights(profile: ProfileId | null, priorities: readonly CategoryKey[]): Weights {
  const base = baseWeights(profile)
  for (const c of priorities) base[c] = Math.max(base[c], PRIORITY_WEIGHT)
  return base
}

/** Validates persisted weights; any missing / invalid entry falls back to `fallback`. */
export function sanitizeWeights(raw: unknown, fallback: Weights): Weights {
  if (!raw || typeof raw !== 'object') return { ...fallback }
  const obj = raw as Record<string, unknown>
  return fill((c) => {
    const v = obj[c]
    return typeof v === 'number' && Number.isFinite(v) ? clampWeight(v) : fallback[c]
  })
}

/** Categories sorted by weight, highest first (ties keep the survey tile order). */
export function categoriesByWeights(weights: Weights): CategoryKey[] {
  return [...CATEGORY_ORDER].sort((a, b) => weights[b] - weights[a])
}
