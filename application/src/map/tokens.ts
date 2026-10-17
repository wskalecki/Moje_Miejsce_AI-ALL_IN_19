import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER } from '../app/dictionary'
import { categoriesByWeights } from '../app/weights'
import { ACCENTS as DESIGN_ACCENTS } from '../design/tokens'
import type { CategoryKey, Profile } from './types'

export { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER }

/** Profile accents (spec 8.1) with an `rgb` triplet for rgba() in paint expressions. */
export const ACCENTS: Record<Profile, { base: string; soft: string; mid: string; deep: string; rgb: string }> = (
  ['student', 'rodzina', 'senior'] as Profile[]
).reduce(
  (acc, p) => {
    const a = DESIGN_ACCENTS[p]
    const n = parseInt(a.accent.slice(1), 16)
    acc[p] = { base: a.accent, soft: a.soft, mid: a.mid, deep: a.deep, rgb: `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}` }
    return acc
  },
  {} as Record<Profile, { base: string; soft: string; mid: string; deep: string; rgb: string }>,
)

/** Colour tones used by the map ramps (soft → deep) with an `rgb` triplet. */
export interface Tones {
  base: string
  soft: string
  mid: string
  deep: string
  rgb: string
}

function mixHex(hex: string, to: number, t: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t))
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

const TONES = {} as Record<CategoryKey, Tones>
for (const c of CATEGORY_ORDER) {
  const base = CATEGORY_COLORS[c]
  const n = parseInt(base.slice(1), 16)
  TONES[c] = {
    base,
    soft: mixHex(base, 255, 0.72),
    mid: mixHex(base, 255, 0.38),
    deep: mixHex(base, 0, 0.28),
    rgb: `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`,
  }
}

/** Ramp tones of a category colour (CATEGORY_COLORS). */
export function categoryTones(c: CategoryKey): Tones {
  return TONES[c]
}

export const PROFILE_LABEL: Record<Profile, string> = {
  student: 'Student',
  rodzina: 'Rodzina',
  senior: 'Senior',
}

/** Short labels for compact UI (hover bars). */
export function categoryLabel(c: CategoryKey): string {
  return c === 'edukacja' ? 'Edukacja' : CATEGORIES[c].label
}

/** Solo category first, then the highest-weighted ones (ties keep the survey order). */
export function topCategories(weights: Record<CategoryKey, number>, solo: CategoryKey | null, n = 3): CategoryKey[] {
  const out: CategoryKey[] = solo ? [solo] : []
  for (const c of categoriesByWeights(weights)) {
    if (out.length >= n) break
    if (!out.includes(c)) out.push(c)
  }
  return out
}

/** Warm day palette for the basemap (spec 5.1 / 5.4). */
export const BASEMAP = {
  background: '#F4F0EA',
  water: '#D6E2EA',
  waterLine: '#C9D8E2',
  park: '#E4EADB',
  wood: '#DDE5D3',
  residential: '#EFEAE2',
  building: '#EAE4DB',
  buildingOutline: '#E0D9CE',
  roadMajor: '#FFFFFF',
  roadMinor: '#FBF8F3',
  roadCasing: '#E6DFD4',
  rail: '#E2DBD0',
  labelInk: 'rgba(22,22,29,0.45)',
  halo: 'rgba(250,247,242,0.9)',
}
