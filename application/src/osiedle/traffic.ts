/** Traffic helpers for the "Korki w ciągu doby" chart (spec §4.5 pkt 7, §7.4). */

export type TrafficLevel = 'ok' | 'warn' | 'bad'

export function trafficLevel(v: number): TrafficLevel {
  if (v < 35) return 'ok'
  if (v <= 65) return 'warn'
  return 'bad'
}

export const TRAFFIC_LEVEL_LABEL: Record<TrafficLevel, string> = {
  ok: 'płynnie',
  warn: 'umiarkowanie',
  bad: 'duże korki',
}

/** "8:00 · duże korki (78)" */
export function trafficTooltip(hour: number, v: number): string {
  return `${hour}:00 · ${TRAFFIC_LEVEL_LABEL[trafficLevel(v)]} (${Math.round(v)})`
}

/** "7:15" from fractional hours (7.25). */
export function formatClock(hours: number): string {
  const total = Math.round(hours * 60)
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Fritsch–Carlson tangents for points with increasing x. Shared by the drawn curve and by
 * `trafficAt`, so a marker placed at a fractional hour sits exactly on the line.
 */
function monotoneTangents(xs: number[], ys: number[]): number[] {
  const n = xs.length
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i]
    m[i] = (ys[i + 1] - ys[i]) / dx[i]
  }
  const tan: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) tan[i] = 0
    else {
      const w1 = 2 * dx[i] + dx[i - 1]
      const w2 = dx[i] + 2 * dx[i - 1]
      tan[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i])
    }
  }
  tan[n - 1] = m[n - 2]
  return tan
}

/** Traffic index at a fractional hour, read off the same smooth curve the chart draws (24:00 = 0:00). */
export function trafficAt(t: number[], hour: number): number {
  const ys = [...t, t[0]]
  const xs = ys.map((_, i) => i)
  const tan = monotoneTangents(xs, ys)
  const x = Math.min(24, Math.max(0, hour))
  const i = Math.min(23, Math.floor(x))
  const s = x - i
  const s2 = s * s
  const s3 = s2 * s
  return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * tan[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * tan[i + 1]
}

export interface Departure {
  /** Rush-hour peak (whole hour). */
  peak: number
  /** Suggested departure, fractional hours in 15-minute steps (7.25 = 7:15). */
  best: number
  /** Gain vs the peak in %, rounded to 5 ("ok. 30%"). */
  pct: number
}

/** Departure must differ from the peak by at least this much to be worth suggesting. */
const MIN_SHIFT = 0.5
/** "Noticeably lighter" — the smallest gain we look for before going further from the peak. */
const GOOD_GAIN = 0.25
/** Below this a tip is not worth showing. */
const MIN_GAIN = 0.1
/** How far from the peak we are willing to send people (hours). */
const MAX_SHIFT = 2

/**
 * Peak = argmax over whole hours in [from..to]. Best departure is searched in 15-minute steps on
 * the drawn curve, only inside [from..to] ∩ [peak − 2 h, peak + 2 h] (a realistic window — nobody
 * leaves at 5:00 with kids): the time closest to the peak that is at least 25 % lighter
 * (ties → the larger gain, then the earlier time); if none is, the lightest time in the window.
 * Null when even that is < 10 % lighter (spec §7.4, decision log §16).
 */
export function bestDeparture(t: number[], from: number, to: number): Departure | null {
  let peak = from
  for (let h = from; h <= to; h++) if (t[h] > t[peak]) peak = h
  const top = t[peak]
  if (top <= 0) return null
  const lo = Math.max(from, peak - MAX_SHIFT)
  const hi = Math.min(to, peak + MAX_SHIFT)
  const cands: { x: number; gain: number }[] = []
  for (let q = Math.round(lo * 4); q <= Math.round(hi * 4); q++) {
    const x = q / 4
    if (Math.abs(x - peak) < MIN_SHIFT) continue
    cands.push({ x, gain: (top - trafficAt(t, x)) / top })
  }
  const dist = (c: { x: number }) => Math.abs(c.x - peak)
  const good = cands.filter((c) => c.gain >= GOOD_GAIN)
  const pick = good.length
    ? good.reduce((a, b) => (dist(b) < dist(a) || (dist(b) === dist(a) && (b.gain > a.gain || (b.gain === a.gain && b.x < a.x))) ? b : a))
    : cands.reduce((a, b) => (b.gain > a.gain || (b.gain === a.gain && dist(b) < dist(a)) ? b : a), cands[0])
  if (!pick || pick.gain < MIN_GAIN) return null
  return { peak, best: pick.x, pct: Math.round((pick.gain * 100) / 5) * 5 }
}

export interface TrafficHint {
  morning: string
  afternoon: string | null
  /** Suggested morning departure (fractional hours), or null when there's no worthwhile tip. */
  bestHour: number | null
  peakHour: number | null
}

/** Morning window 6:00–10:00, evening 15:00–19:00 (spec §7.4). */
export const MORNING: [number, number] = [6, 10]
export const EVENING: [number, number] = [15, 19]
/** Below this the morning peak isn't a real jam. */
const JAM = 35

export function trafficHint(t: number[]): TrafficHint {
  let amPeak = MORNING[0]
  for (let h = MORNING[0]; h <= MORNING[1]; h++) if (t[h] > t[amPeak]) amPeak = h
  if (t[amPeak] < JAM) {
    return {
      morning: 'Tu rzadko stoi się w korkach — możesz wyjeżdżać, kiedy chcesz.',
      afternoon: null,
      bestHour: null,
      peakHour: null,
    }
  }
  const am = bestDeparture(t, MORNING[0], MORNING[1])
  const pm = bestDeparture(t, EVENING[0], EVENING[1])
  const morning = am
    ? `Rano korki są największe około ${formatClock(am.peak)}. Wyjedź o ${formatClock(am.best)} zamiast ${formatClock(am.peak)} — będzie ok. ${am.pct}% luźniej.`
    : `Rano korki są największe około ${formatClock(amPeak)} i trzymają się przez cały poranek.`
  const afternoon =
    pm && t[pm.peak] >= JAM
      ? `Po południu szczyt około ${formatClock(pm.peak)} — wracaj o ${formatClock(pm.best)}, będzie ok. ${pm.pct}% luźniej.`
      : null
  return { morning, afternoon, bestHour: am?.best ?? null, peakHour: am?.peak ?? amPeak }
}

/**
 * Monotone cubic (Fritsch–Carlson) path through points — smooth, but never overshoots
 * the data, so a 0–100 index never dips below 0 on screen.
 */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length
  if (n < 2) return ''
  const tan = monotoneTangents(
    pts.map((p) => p[0]),
    pts.map((p) => p[1]),
  )
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const h = (x1 - x0) / 3
    d += `C${(x0 + h).toFixed(2)},${(y0 + tan[i] * h).toFixed(2)} ${(x1 - h).toFixed(2)},${(y1 - tan[i + 1] * h).toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`
  }
  return d
}
