/**
 * Timeline maths (spec §4.6, decision log §16). The slider moves over round 5-year stops:
 * "Dziś" (2026, the baseline) → 2030 → 2035 → … up to the first round year that covers the latest
 * dated investment. At stop S the panel shows every dated event with year ≤ S (events between two
 * stops belong to the later one but keep their own year), and the forecast adds the deltas of the
 * events whose effect year ≤ S. 2026 is the plain `stats`: an investment dated 2026 is a "w toku"
 * card there and changes the numbers from 2027 (effect year = max(event.year, 2027)).
 * Events without a date ("bez terminu") never get a stop and never count in the forecast.
 */
import type { CategoryId, Osiedle, ProfileId, TimelineEvent } from '../mock/osiedla'

/** Today — the baseline stop. */
export const FIRST_YEAR = 2026
/** Latest dated investment in the data (Metro M4 to Wilanów, "do 2044 r."); a test keeps it in sync. */
export const LATEST_DATED_YEAR = 2044
export const STOP_STEP = 5

/** `[base, first multiple of step after base, …]` until a stop reaches `last`. */
export function buildStops(base: number, last: number, step: number = STOP_STEP): number[] {
  const out = [base]
  for (let y = Math.ceil((base + 1) / step) * step; out[out.length - 1] < last; y += step) out.push(y)
  return out
}

/** 2026, 2030, 2035, 2040, 2045. */
export const TIMELINE_STOPS: readonly number[] = buildStops(FIRST_YEAR, LATEST_DATED_YEAR)
export const LAST_YEAR = TIMELINE_STOPS[TIMELINE_STOPS.length - 1]
/** A year that is one of `TIMELINE_STOPS`. */
export type TimelineYear = number

/** The stop a year belongs to: the first stop ≥ year (clamped to the range). */
export function toStop(y: number): TimelineYear {
  const v = Math.round(y)
  return TIMELINE_STOPS.find((s) => s >= v) ?? LAST_YEAR
}

export function stopIndex(year: number): number {
  return TIMELINE_STOPS.indexOf(toStop(year))
}

/** Slider label of a stop: "Dziś" for the baseline, else the year. */
export function stopLabel(stop: number): string {
  return stop <= FIRST_YEAR ? 'Dziś' : String(stop)
}

/** Years a stop gathers: "Dziś", "2027–2030", "2031–2035", … */
export function stopRangeLabel(stop: number): string {
  const i = stopIndex(stop)
  if (i <= 0) return 'Dziś'
  const from = TIMELINE_STOPS[i - 1] + 1
  return from === stop ? String(stop) : `${from}–${stop}`
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** No official date: the source gives none and `year` is only a placeholder. */
export function isUndated(e: TimelineEvent): boolean {
  return /bez terminu/i.test(e.yearPlacement ?? '')
}

/** Year shown on a card: "2028", "ok. 2044" when the year is only a horizon, "bez terminu". */
export function yearLabel(e: TimelineEvent): string {
  if (isUndated(e)) return 'bez terminu'
  return e.yearUncertain ? `ok. ${e.year}` : String(e.year)
}

const byYear = (a: TimelineEvent, b: TimelineEvent) => a.year - b.year

/** Events with a date, in chronological order. */
export function datedEvents(o: Osiedle): TimelineEvent[] {
  return o.timeline.filter((e) => !isUndated(e)).sort(byYear)
}

/** Events without a date (shown apart, never counted). */
export function undatedEvents(o: Osiedle): TimelineEvent[] {
  return o.timeline.filter(isUndated)
}

/** First year in which the event changes the numbers (never the 2026 baseline). */
export function effectYear(e: TimelineEvent): number {
  return Math.max(e.year, FIRST_YEAR + 1)
}

/** True for an event that is visible at `year` but doesn't count yet ("w toku"). */
export function isInProgress(e: TimelineEvent, year: number): boolean {
  return e.year <= year && year < effectYear(e)
}

/** Dated events visible as cards (and map markers) at `year` — year ≤ Y, in chronological order. */
export function eventsUpTo(o: Osiedle, year: number): TimelineEvent[] {
  return datedEvents(o).filter((e) => e.year <= year)
}

/** Dated events that first appear at `stop` (year in the stop's range). */
export function eventsAtStop(o: Osiedle, stop: number): TimelineEvent[] {
  const s = toStop(stop)
  return datedEvents(o).filter((e) => toStop(e.year) === s)
}

/** Visible events at `stop`, grouped by the stop they belong to (empty groups dropped). */
export function groupByStop(o: Osiedle, stop: number): { stop: TimelineYear; events: TimelineEvent[] }[] {
  const upTo = toStop(stop)
  return TIMELINE_STOPS.filter((s) => s <= upTo)
    .map((s) => ({ stop: s, events: eventsAtStop(o, s) }))
    .filter((g) => g.events.length > 0)
}

/** Dated events whose effect counts at `year` (effect year ≤ Y). */
export function effectiveEvents(o: Osiedle, year: number): TimelineEvent[] {
  return datedEvents(o).filter((e) => effectYear(e) <= year)
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
 * `base + Σ matchDelta` over effective events (the profile's own `matchDeltas` entry when given), clamped to 0–99. `base` is today's match — the live
 * ranking of the map (the osiedle's pill); defaults to the `match[profile]` snapshot of the mock.
 */
export function matchAtYear(o: Osiedle, profile: ProfileId, year: number, base: number = o.match[profile]): number {
  const sum = effectiveEvents(o, year).reduce((s, e) => s + (e.matchDeltas?.[profile] ?? e.matchDelta ?? 0), 0)
  return clamp(base + sum, 0, 99)
}
