/** Timeline maths (spec §4.6): cumulative statDeltas / matchDelta of events with year ≤ Y. */
import type { CategoryId, Osiedle, ProfileId, TimelineEvent } from '../mock/osiedla'

export const TIMELINE_YEARS = [2026, 2027, 2028, 2029, 2030] as const
export type TimelineYear = (typeof TIMELINE_YEARS)[number]
export const FIRST_YEAR: TimelineYear = 2026
export const LAST_YEAR: TimelineYear = 2030

export function toTimelineYear(y: number): TimelineYear {
  return Math.min(LAST_YEAR, Math.max(FIRST_YEAR, Math.round(y))) as TimelineYear
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Events that have happened (or started) by `year`, in chronological order. */
export function eventsUpTo(o: Osiedle, year: number): TimelineEvent[] {
  return o.timeline.filter((e) => e.year <= year).sort((a, b) => a.year - b.year)
}

/** `stats[c] + Σ statDeltas[c]` for events with year ≤ Y, clamped to 0–100. */
export function statsAtYear(o: Osiedle, year: number): Record<CategoryId, number> {
  const out = { ...o.stats }
  for (const e of eventsUpTo(o, year)) {
    for (const [c, d] of Object.entries(e.statDeltas) as [CategoryId, number][]) out[c] += d
  }
  for (const c of Object.keys(out) as CategoryId[]) out[c] = clamp(out[c], 0, 100)
  return out
}

/** Visible change vs the base `stats` (after clamping); only non-zero entries. */
export function statDeltasAtYear(o: Osiedle, year: number): Partial<Record<CategoryId, number>> {
  const at = statsAtYear(o, year)
  const out: Partial<Record<CategoryId, number>> = {}
  for (const c of Object.keys(at) as CategoryId[]) {
    const d = at[c] - o.stats[c]
    if (d !== 0) out[c] = d
  }
  return out
}

/** `match[profile] + Σ matchDelta`, clamped to 0–99. */
export function matchAtYear(o: Osiedle, profile: ProfileId, year: number): number {
  const sum = eventsUpTo(o, year).reduce((s, e) => s + (e.matchDelta ?? 0), 0)
  return clamp(o.match[profile] + sum, 0, 99)
}
