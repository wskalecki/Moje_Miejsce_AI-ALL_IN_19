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

interface PeakBest {
  peak: number
  best: number
  pct: number
}

/**
 * Peak = argmax over [peakFrom..peakTo]; best = argmin over [bestFrom..bestTo] without the
 * peak, ties resolved towards the hour closest to the peak (spec §7.4).
 */
function peakAndBest(t: number[], peakFrom: number, peakTo: number, bestFrom: number, bestTo: number): PeakBest {
  let peak = peakFrom
  for (let h = peakFrom; h <= peakTo; h++) if (t[h] > t[peak]) peak = h
  let best = -1
  for (let h = bestFrom; h <= bestTo; h++) {
    if (h === peak) continue
    if (best < 0 || t[h] < t[best] || (t[h] === t[best] && Math.abs(h - peak) < Math.abs(best - peak))) best = h
  }
  const pct = t[peak] > 0 ? Math.round(((t[peak] - t[best]) / t[peak]) * 100) : 0
  return { peak, best, pct }
}

export interface TrafficHint {
  morning: string
  afternoon: string | null
  /** Best morning departure hour, or null when traffic is light all morning. */
  bestHour: number | null
  peakHour: number | null
}

export function trafficHint(t: number[]): TrafficHint {
  const am = peakAndBest(t, 6, 10, 5, 11)
  if (t[am.peak] < 35) {
    return {
      morning: 'Tu rzadko stoi się w korkach — możesz wyjeżdżać, kiedy chcesz.',
      afternoon: null,
      bestHour: null,
      peakHour: null,
    }
  }
  const pm = peakAndBest(t, 14, 20, 14, 20)
  return {
    morning: `Rano korki są największe około ${am.peak}:00. Wyjedź o ${am.best}:00 — będzie o ok. ${am.pct}% luźniej.`,
    afternoon: t[pm.peak] >= 35 ? `Po południu szczyt około ${pm.peak}:00, najlepiej wracać o ${pm.best}:00.` : null,
    bestHour: am.best,
    peakHour: am.peak,
  }
}

/**
 * Monotone cubic (Fritsch–Carlson) path through points — smooth, but never overshoots
 * the data, so a 0–100 index never dips below 0 on screen.
 */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length
  if (n < 2) return ''
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0]
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]
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
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const h = dx[i] / 3
    d += `C${(x0 + h).toFixed(2)},${(y0 + tan[i] * h).toFixed(2)} ${(x1 - h).toFixed(2)},${(y1 - tan[i + 1] * h).toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`
  }
  return d
}
