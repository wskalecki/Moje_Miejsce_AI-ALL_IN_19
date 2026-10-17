import { CATEGORIES, CATEGORY_ORDER, categoriesByWeight, isCategoryKey } from '../app/dictionary'
import { ACCENTS as DESIGN_ACCENTS } from '../design/tokens'
import type { CategoryKey, Profile } from './types'

export { CATEGORIES, CATEGORY_ORDER }

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

export const PROFILE_LABEL: Record<Profile, string> = {
  student: 'Student',
  rodzina: 'Rodzina',
  senior: 'Senior',
}

/** Short labels for compact UI (hover bars). */
export function categoryLabel(c: CategoryKey): string {
  return c === 'edukacja' ? 'Edukacja' : CATEGORIES[c].label
}

/** First 3 priorities in selection order, topped up with the profile's highest-weight categories (spec 4.3). */
export function hoverCategories(profile: Profile, priorities: readonly string[] = []): CategoryKey[] {
  const out: CategoryKey[] = []
  for (const c of priorities) if (isCategoryKey(c) && !out.includes(c) && out.length < 3) out.push(c)
  for (const c of categoriesByWeight(profile)) {
    if (out.length >= 3) break
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
