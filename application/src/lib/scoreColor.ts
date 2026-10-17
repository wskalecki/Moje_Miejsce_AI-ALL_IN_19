/**
 * Score 0–100 → heatmap fill (Urban Arcade / courtyard pixel vibe).
 * See docs/design/visual-system.md
 */

/** MapLibre: brak metryki dla komórki */
export const NO_SCORE = -1

/** Blue → mint → yellow → coral → hot pink (low fit → strong fit) */
const STOPS: { score: number; rgb: [number, number, number] }[] = [
  { score: 0, rgb: [165, 216, 255] },
  { score: 20, rgb: [140, 188, 232] },
  { score: 40, rgb: [168, 213, 186] },
  { score: 55, rgb: [233, 213, 106] },
  { score: 72, rgb: [244, 163, 97] },
  { score: 88, rgb: [231, 111, 81] },
  { score: 100, rgb: [232, 93, 138] },
]

/** MapLibre `interpolate` stops (score → #hex) */
export const SCORE_RAMP_HEX: { score: number; color: string }[] = [
  { score: 0, color: '#a5d8ff' },
  { score: 25, color: '#a8d5ba' },
  { score: 50, color: '#e9d56a' },
  { score: 75, color: '#f4a261' },
  { score: 100, color: '#e85d8a' },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function scoreToRgba(score: number | null | undefined, alpha = 0.88): [number, number, number, number] {
  if (score == null || Number.isNaN(score)) {
    return [200, 214, 229, 0.45]
  }
  const s = Math.max(0, Math.min(100, score))
  let lower = STOPS[0]
  let upper = STOPS[STOPS.length - 1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (s >= STOPS[i].score && s <= STOPS[i + 1].score) {
      lower = STOPS[i]
      upper = STOPS[i + 1]
      break
    }
  }
  const t = upper.score === lower.score ? 0 : (s - lower.score) / (upper.score - lower.score)
  return [
    Math.round(lerp(lower.rgb[0], upper.rgb[0], t)),
    Math.round(lerp(lower.rgb[1], upper.rgb[1], t)),
    Math.round(lerp(lower.rgb[2], upper.rgb[2], t)),
    alpha,
  ]
}

export function scoreToGlowRgba(score: number, alpha = 0.55): string {
  const [r, g, b] = scoreToRgba(score, 1)
  return `rgba(${r},${g},${b},${alpha})`
}

export function rgbaToCss([r, g, b, a]: [number, number, number, number]) {
  return `rgba(${r},${g},${b},${a})`
}
