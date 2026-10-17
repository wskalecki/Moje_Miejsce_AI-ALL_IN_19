import type { GridFeature200 } from './grid200m'
import { rippleDelayMs, type RippleAnchor } from './mapPoiRipple'

export type WavePlanItem = {
  id: string
  fromScore: number | null
  toScore: number | null
  delayMs: number
}

/** Fala pierścieniowa od kotwic POI — komórka zmienia kolor, gdy „dotrze” do niej front. */
export function planPersonaScoreWave(
  features: GridFeature200[],
  fromScores: Record<string, number | null>,
  toScores: Record<string, number | null>,
  anchors: RippleAnchor[],
): WavePlanItem[] {
  return features.map((f) => {
    const id = f.properties.id
    const fromScore = fromScores[id] ?? null
    const toScore = toScores[id] ?? null
    const changes = fromScore !== toScore
    const center = f.properties.center
    const delayMs = changes ? rippleDelayMs(center, anchors) : 0
    return { id, fromScore, toScore, delayMs }
  })
}

export function maxWaveDelay(plan: WavePlanItem[]) {
  return plan.reduce((max, p) => Math.max(max, p.delayMs), 0)
}
