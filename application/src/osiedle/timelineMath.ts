/**
 * Timeline maths (spec §4.6, decision log §16). 2026 is the baseline: at 2026 the panel shows the
 * plain `stats`. At year Y an event counts once Y ≥ its effect year = max(event.year, 2027), so an
 * investment dated 2026 is shown as a "w toku" card in 2026 and changes the numbers from 2027.
 */
import type { CategoryId, Osiedle, ProfileId, TimelineEvent } from '../mock/osiedla'

export const TIMELINE_YEARS = [2026, 2027, 2028, 2029, 2030] as const
export type TimelineYear = (typeof TIMELINE_YEARS)[number]
export const FIRST_YEAR: TimelineYear = 2026
export const LAST_YEAR: TimelineYear = 2030

export function toTimelineYear(y: number): TimelineYear {
  return Math.min(LAST_YEAR, Math.max(FIRST_YEAR, Math.round(y))) as TimelineYear
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** First year in which the event changes the numbers (never the 2026 baseline). */
export function effectYear(e: TimelineEvent): number {
  return Math.max(e.year, FIRST_YEAR + 1)
}

/** True for an event that is visible at `year` but doesn't count yet ("w toku"). */
export function isInProgress(e: TimelineEvent, year: number): boolean {
  return e.year <= year && year < effectYear(e)
}

/** Events visible as cards (and map markers) at `year` — year ≤ Y, in chronological order. */
export function eventsUpTo(o: Osiedle, year: number): TimelineEvent[] {
  return o.timeline.filter((e) => e.year <= year).sort((a, b) => a.year - b.year)
}

/** Events whose effect counts at `year` (effect year ≤ Y). */
export function effectiveEvents(o: Osiedle, year: number): TimelineEvent[] {
  return o.timeline.filter((e) => effectYear(e) <= year).sort((a, b) => a.year - b.year)
}

/** `stats[c] + Σ statDeltas[c]` over effective events, clamped to 0–100. */
export function statsAtYear(o: Osiedle, year: number): Record<CategoryId, number> {
  const out = { ...o.stats }
  for (const e of effectiveEvents(o, year)) {
    for (const [c, d] of Object.entries(e.statDeltas) as [CategoryId, number][]) out[c] += d
  }
  for (const c of Object.keys(out) as CategoryId[]) out[c] = clamp(out[c], 0, 100)
  return out
}

/** Visible change vs the base `stats` (after clamping); only non-zero entries. Empty at 2026. */
export function statDeltasAtYear(o: Osiedle, year: number): Partial<Record<CategoryId, number>> {
  const at = statsAtYear(o, year)
  const out: Partial<Record<CategoryId, number>> = {}
  for (const c of Object.keys(at) as CategoryId[]) {
    const d = at[c] - o.stats[c]
    if (d !== 0) out[c] = d
  }
  return out
}

/**
 * `base + Σ matchDelta` over effective events, clamped to 0–99. `base` is today's match — the live
 * ranking of the map (the osiedle's pill); defaults to the `match[profile]` snapshot of the mock.
 */
export function matchAtYear(o: Osiedle, profile: ProfileId, year: number, base: number = o.match[profile]): number {
  const sum = effectiveEvents(o, year).reduce((s, e) => s + (e.matchDelta ?? 0), 0)
  return clamp(base + sum, 0, 99)
}
