import type { FeaturedInfo, FeaturedSlug, LngLat, Profile } from './types'

/**
 * Featured osiedla — read from `src/mock/osiedla.ts` (slug, msiId, name, centre…), nothing hard-coded here.
 * Loaded loosely through `import.meta.glob` so the map builds whether or not the module exists.
 * Only presentation fields are taken from the mock: the match and the category scores come from
 * the real data (osiedla-scores.json) and are weighted on the client — no showcase boosts.
 */
type LooseFeatured = {
  slug?: string
  msiId?: string
  name?: string
  district?: string
  profile?: string
  tagline?: string
  center?: LngLat
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

const isProfile = (p: unknown): p is Profile => p === 'student' || p === 'rodzina' || p === 'senior'

/**
 * Featured list from the mock. `lookup(msiId)` returns the osiedle's name / district / label point from
 * the boundaries file, used when the mock leaves a field out.
 */
export function buildFeatured(
  lookup: (msiId: string) => { name: string; district: string; center: LngLat } | undefined,
): FeaturedInfo[] {
  const out: FeaturedInfo[] = []
  for (const m of loadMock()) {
    if (!m || typeof m.slug !== 'string') continue
    const msiId = typeof m.msiId === 'string' ? m.msiId : m.slug
    const base = lookup(msiId)
    if (!base) continue // not on the map
    const center = Array.isArray(m.center) && m.center.length === 2 ? m.center : base.center
    out.push({
      slug: m.slug as FeaturedSlug,
      msiId,
      name: m.name ?? base.name,
      district: m.district ?? base.district,
      profile: isProfile(m.profile) ? m.profile : 'rodzina',
      tagline: m.tagline ?? '',
      center,
      thumb: `/osiedla/${m.slug}/thumb.jpg`,
      thumbFallback: m.heroImages?.find((h) => typeof h?.src === 'string')?.src ?? null,
    })
  }
  return out
}
