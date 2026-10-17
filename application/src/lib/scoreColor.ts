/** Score 0–100 → RGBA for grid fill (see docs/design/visual-system.md) */

const STOPS: { score: number; rgb: [number, number, number] }[] = [
  { score: 0, rgb: [61, 79, 111] },
  { score: 25, rgb: [90, 122, 140] },
  { score: 50, rgb: [74, 155, 127] },
  { score: 75, rgb: [155, 180, 100] },
  { score: 100, rgb: [201, 226, 101] },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function scoreToRgba(score: number | null | undefined, alpha = 0.55): [number, number, number, number] {
  if (score == null || Number.isNaN(score)) {
    return [74, 74, 74, 0.35]
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

export function rgbaToCss([r, g, b, a]: [number, number, number, number]) {
  return `rgba(${r},${g},${b},${a})`
}
