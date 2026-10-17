/**
 * Domain dictionary — spec §3.1–3.4 as typed constants.
 * Pure data (no React / icon imports) so it can be used by tests and by
 * the map code. Icons live in `./icons.ts`.
 */
import type { CategoryKey, FeaturedSlug, Horizon, ProfileId } from './types'

export interface ProfileDef {
  id: ProfileId
  title: string
  /** Opening fragment of the survey sentence ("Studiuję"). */
  fragment: string
  description: string
  /** Pronoun forms used in the sentence. */
  pronoun: 'mnie' | 'nas'
  verb: 'szukam' | 'szukamy'
  defaultHorizon: Horizon
  featured: FeaturedSlug
  /** Name of the featured osiedle (display). */
  featuredName: string
}

export const PROFILE_ORDER: readonly ProfileId[] = ['student', 'rodzina', 'senior']

export const PROFILES: Record<ProfileId, ProfileDef> = {
  student: {
    id: 'student',
    title: 'Student',
    fragment: 'Studiuję',
    description: 'Uczelnia, znajomi i miasto po zajęciach.',
    pronoun: 'mnie',
    verb: 'szukam',
    defaultHorizon: 'chwila',
    featured: 'powisle',
    featuredName: 'Powiśle',
  },
  rodzina: {
    id: 'rodzina',
    title: 'Rodzina',
    fragment: 'Mamy rodzinę',
    description: 'Przedszkole, park i spokojne wieczory.',
    pronoun: 'nas',
    verb: 'szukamy',
    defaultHorizon: 'stale',
    featured: 'miasteczko-wilanow',
    featuredName: 'Miasteczko Wilanów',
  },
  senior: {
    id: 'senior',
    title: 'Senior',
    fragment: 'Jestem na emeryturze',
    description: 'Lekarz blisko, zieleń i kultura na co dzień.',
    pronoun: 'mnie',
    verb: 'szukam',
    defaultHorizon: 'stale',
    featured: 'saska-kepa',
    featuredName: 'Saska Kępa',
  },
}

export interface CategoryDef {
  id: CategoryKey
  label: string
  /** Lower-case form used inside the survey sentence. */
  sentenceLabel: string
  /** Strength phrase for the hover "AI" template (spec §7.2). */
  strong: string
  /** Weakness phrase for the hover "AI" template. */
  weak: string
  /** Grammatical number of `sentenceLabel` (drives "liczy się / liczą się"). */
  plural: boolean
}

/** Order = order of tiles in survey step 2. */
export const CATEGORY_ORDER: readonly CategoryKey[] = [
  'cisza',
  'zielen',
  'komunikacja',
  'gastronomia',
  'sport',
  'kultura',
  'edukacja',
  'zdrowie',
  'zakupy',
  'zycieNocne',
]

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  cisza: { id: 'cisza', label: 'Cisza', sentenceLabel: 'cisza', strong: 'spokojne ulice', weak: 'bywa głośno', plural: false },
  zielen: { id: 'zielen', label: 'Zieleń', sentenceLabel: 'zieleń', strong: 'dużo zieleni', weak: 'mniej zieleni', plural: false },
  komunikacja: { id: 'komunikacja', label: 'Komunikacja', sentenceLabel: 'komunikacja', strong: 'świetny dojazd', weak: 'dojazd z przesiadkami', plural: false },
  gastronomia: { id: 'gastronomia', label: 'Gastronomia', sentenceLabel: 'gastronomia', strong: 'bogata gastronomia', weak: 'skromny wybór lokali', plural: false },
  sport: { id: 'sport', label: 'Sport', sentenceLabel: 'sport', strong: 'miejsca do sportu', weak: 'mało miejsc do sportu', plural: false },
  kultura: { id: 'kultura', label: 'Kultura', sentenceLabel: 'kultura', strong: 'kultura pod ręką', weak: 'do kultury trzeba dojechać', plural: false },
  edukacja: { id: 'edukacja', label: 'Edukacja i przedszkola', sentenceLabel: 'przedszkola i szkoły', strong: 'szkoły i przedszkola blisko', weak: 'szkoły dalej', plural: true },
  zdrowie: { id: 'zdrowie', label: 'Zdrowie', sentenceLabel: 'zdrowie', strong: 'przychodnie i apteki obok', weak: 'do lekarza dalej', plural: false },
  zakupy: { id: 'zakupy', label: 'Zakupy', sentenceLabel: 'zakupy', strong: 'sklepy na co dzień', weak: 'zakupy wymagają dojazdu', plural: true },
  zycieNocne: { id: 'zycieNocne', label: 'Życie nocne', sentenceLabel: 'życie nocne', strong: 'życie po zmroku', weak: 'wieczorami cicho', plural: false },
}

/** Profile weights (spec §3.3). Used offline for scores; online for ordering. */
export const PROFILE_WEIGHTS: Record<ProfileId, Record<CategoryKey, number>> = {
  student: { cisza: 0.02, zielen: 0.04, komunikacja: 0.22, gastronomia: 0.16, sport: 0.1, kultura: 0.12, edukacja: 0.12, zdrowie: 0.02, zakupy: 0.06, zycieNocne: 0.14 },
  rodzina: { cisza: 0.14, zielen: 0.18, komunikacja: 0.1, gastronomia: 0.02, sport: 0.1, kultura: 0.04, edukacja: 0.22, zdrowie: 0.1, zakupy: 0.1, zycieNocne: 0 },
  senior: { cisza: 0.16, zielen: 0.14, komunikacja: 0.12, gastronomia: 0.04, sport: 0.02, kultura: 0.12, edukacja: 0, zdrowie: 0.22, zakupy: 0.16, zycieNocne: 0.02 },
}

/** Default step-2 selection per profile, in this order (spec §3.3). */
export const DEFAULT_PRIORITIES: Record<ProfileId, readonly CategoryKey[]> = {
  student: ['komunikacja', 'gastronomia', 'zycieNocne', 'sport'],
  rodzina: ['edukacja', 'zielen', 'cisza', 'zakupy'],
  senior: ['zdrowie', 'zakupy', 'cisza', 'kultura'],
}

/** Categories sorted by profile weight, highest first (ties keep tile order). */
export function categoriesByWeight(profile: ProfileId): CategoryKey[] {
  const w = PROFILE_WEIGHTS[profile]
  return [...CATEGORY_ORDER].sort((a, b) => w[b] - w[a])
}

export interface HorizonDef {
  id: Horizon
  title: string
  fragment: string
  description: string
}

export const HORIZON_ORDER: readonly Horizon[] = ['chwila', 'stale']

export const HORIZONS: Record<Horizon, HorizonDef> = {
  chwila: {
    id: 'chwila',
    title: 'Na chwilę',
    fragment: 'na chwilę',
    description: 'Wynajem — pokażemy ceny najmu.',
  },
  stale: {
    id: 'stale',
    title: 'Na stałe',
    fragment: 'na stałe',
    description: 'Kupno — pokażemy ceny zakupu i to, jak okolica zmieni się do 2030 roku.',
  },
}

export function isProfileId(v: unknown): v is ProfileId {
  return v === 'student' || v === 'rodzina' || v === 'senior'
}

export function isHorizon(v: unknown): v is Horizon {
  return v === 'chwila' || v === 'stale'
}

export function isCategoryKey(v: unknown): v is CategoryKey {
  return typeof v === 'string' && (CATEGORY_ORDER as readonly string[]).includes(v)
}
