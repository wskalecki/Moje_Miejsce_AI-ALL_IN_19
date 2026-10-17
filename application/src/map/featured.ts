import type { FeaturedInfo, FeaturedSlug, LngLat, Profile } from './types'

/**
 * Featured osiedla — fallback config. Rich content lives in `src/mock/osiedla.ts` (another task);
 * if that module exists we read name/tagline/center/thumb/match from it, loosely, through `import.meta.glob`
 * so the map builds and runs whether or not the file is there yet.
 */
interface FeaturedBase {
  slug: FeaturedSlug
  msiId: string
  name: string
  district: string
  profile: Profile
  tagline: string
  center: LngLat
}

const BASE: FeaturedBase[] = [
  {
    slug: 'powisle',
    msiId: 'powisle',
    name: 'Powiśle',
    district: 'Śródmieście',
    profile: 'student',
    tagline: 'Bulwary, BUW i kawiarnie — miasto tuż za drzwiami.',
    center: [21.0283, 52.2398],
  },
  {
    slug: 'miasteczko-wilanow',
    msiId: 'blonia-wilanowskie',
    name: 'Miasteczko Wilanów',
    district: 'Wilanów',
    profile: 'rodzina',
    tagline: 'Przedszkola za rogiem, park i ciche wieczory.',
    center: [21.0862, 52.1628],
  },
  {
    slug: 'saska-kepa',
    msiId: 'saska-kepa',
    name: 'Saska Kępa',
    district: 'Praga-Południe',
    profile: 'senior',
    tagline: 'Kameralne uliczki, przychodnie i kawiarnie na Francuskiej.',
    center: [21.0546, 52.2331],
  },
]

type LooseFeatured = {
  slug?: string
  name?: string
  district?: string
  tagline?: string
  center?: LngLat
  match?: Partial<Record<Profile, number>>
  heroImages?: { src?: string }[]
}

function loadMock(): LooseFeatured[] {
  const mods = import.meta.glob('../mock/osiedla.ts', { eager: true }) as Record<string, Record<string, unknown>>
  const mod = Object.values(mods)[0]
  if (!mod) return []
  const candidate = (mod.FEATURED ?? mod.featured ?? mod.OSIEDLA ?? mod.osiedla ?? mod.default) as unknown
  if (Array.isArray(candidate)) return candidate as LooseFeatured[]
  if (candidate && typeof candidate === 'object') return Object.values(candidate) as LooseFeatured[]
  return []
}

const MOCK = loadMock()

/** Build featured info; `scoreMatch` comes from osiedla-scores.json for the MSI polygon. */
export function buildFeatured(scoreMatch: (msiId: string) => Record<Profile, number> | undefined): FeaturedInfo[] {
  return BASE.map((b) => {
    const m = MOCK.find((x) => x?.slug === b.slug)
    const scored = scoreMatch(b.msiId) ?? { student: 60, rodzina: 60, senior: 60 }
    const match = { ...scored, ...(m?.match ?? {}) } as Record<Profile, number>
    const thumb = m?.heroImages?.[0]?.src ?? `/osiedla/${b.slug}/01.jpg`
    return {
      ...b,
      name: m?.name ?? b.name,
      district: m?.district ?? b.district,
      tagline: m?.tagline ?? b.tagline,
      center: Array.isArray(m?.center) && m.center.length === 2 ? m.center : b.center,
      thumb,
      match,
    }
  })
}

export const FEATURED_SLUGS: FeaturedSlug[] = BASE.map((b) => b.slug)
export const FEATURED_BY_MSI: Record<string, FeaturedSlug> = Object.fromEntries(BASE.map((b) => [b.msiId, b.slug]))

/** Sort for the "Polecane" panel: the profile's own osiedle first, then by match for the profile. */
export function sortFeatured(list: FeaturedInfo[], profile: Profile): FeaturedInfo[] {
  return [...list].sort((a, b) => {
    if (a.profile === profile) return -1
    if (b.profile === profile) return 1
    return b.match[profile] - a.match[profile]
  })
}
