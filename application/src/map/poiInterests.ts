/**
 * Optional map interests: checkboxes in the filter panel (not weight sliders).
 * Subtype keys match POI files (`public/data/poi/*.json`); labels are UI-only until
 * grouped catalog data ships from the data pipeline.
 */
import type { CategoryKey } from './types'

export type PoiSubtypeKey = string

export interface PoiInterestOption {
  subtype: PoiSubtypeKey
  label: string
}

export interface PoiInterestGroup {
  id: string
  title: string
  /** Used for default marker colour when no special style applies. */
  category: CategoryKey
  options: readonly PoiInterestOption[]
}

/** Expandable section in the filter panel — off by default (nothing checked). */
export const POI_INTEREST_GROUPS: readonly PoiInterestGroup[] = [
  {
    id: 'sport',
    title: 'Sport i rekreacja',
    category: 'sport',
    options: [
      { subtype: 'pitch', label: 'Boiska i orliki' },
      { subtype: 'playground', label: 'Place zabaw' },
    ],
  },
  {
    id: 'zdrowie',
    title: 'Zdrowie',
    category: 'zdrowie',
    options: [
      { subtype: 'clinic', label: 'Przychodnie i kliniki' },
      { subtype: 'pharmacy', label: 'Apteki' },
    ],
  },
  {
    id: 'zakupy',
    title: 'Zakupy',
    category: 'zakupy',
    options: [{ subtype: 'supermarket', label: 'Supermarkety i sklepy' }],
  },
  {
    id: 'kultura',
    title: 'Kultura',
    category: 'kultura',
    options: [
      { subtype: 'event', label: 'Wydarzenia i spektakle' },
      { subtype: 'library', label: 'Biblioteki' },
      { subtype: 'utw', label: 'Uniwersytety III wieku' },
    ],
  },
  {
    id: 'komunikacja',
    title: 'Komunikacja',
    category: 'komunikacja',
    options: [
      { subtype: 'metro_station', label: 'Wejścia do metra' },
      { subtype: 'tram_stop', label: 'Przystanki tramwajowe' },
      { subtype: 'stop', label: 'Przystanki autobusowe' },
    ],
  },
  {
    id: 'edukacja',
    title: 'Edukacja',
    category: 'edukacja',
    options: [
      { subtype: 'kindergarten', label: 'Przedszkola' },
      { subtype: 'school', label: 'Szkoły podstawowe' },
      { subtype: 'high_school', label: 'Licea i szkoły średnie' },
      { subtype: 'university', label: 'Uczelnie' },
    ],
  },
]

const KNOWN = new Set<string>(
  POI_INTEREST_GROUPS.flatMap((g) => g.options.map((o) => o.subtype)),
)

/** Stare klucze UI → subtypy z `public/data/poi/kultura.json`. */
const LEGACY_SUBTYPE_ALIASES: Record<string, PoiSubtypeKey> = {
  theatre: 'event',
  cinema: 'event',
}

export function isKnownPoiSubtype(v: unknown): v is PoiSubtypeKey {
  return typeof v === 'string' && KNOWN.has(v)
}

function normalizePoiSubtype(raw: string): PoiSubtypeKey | null {
  const key = LEGACY_SUBTYPE_ALIASES[raw] ?? raw
  return isKnownPoiSubtype(key) ? key : null
}

export function poiInterestGroupForCategory(cat: CategoryKey): PoiInterestGroup | undefined {
  return POI_INTEREST_GROUPS.find((g) => g.category === cat)
}

export function sanitizePoiInterests(raw: unknown): PoiSubtypeKey[] {
  if (!Array.isArray(raw)) return []
  const out: PoiSubtypeKey[] = []
  for (const x of raw) {
    if (typeof x !== 'string') continue
    const key = normalizePoiSubtype(x)
    if (key && !out.includes(key)) out.push(key)
  }
  return out
}

/** Category keys implied by checked interests — hook for future scoring / grouped data. */
export function categoriesFromPoiInterests(selected: readonly PoiSubtypeKey[]): CategoryKey[] {
  const cats = new Set<CategoryKey>()
  for (const g of POI_INTEREST_GROUPS) {
    if (g.options.some((o) => selected.includes(o.subtype))) cats.add(g.category)
  }
  return [...cats]
}
