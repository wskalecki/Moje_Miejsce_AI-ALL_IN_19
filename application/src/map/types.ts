/**
 * Map-local types. Domain types come from the app shell (`src/app/types.ts`).
 */
import type { CategoryKey, FeaturedSlug, Horizon, Profile, ProfileId } from '../app/types'

export type { CategoryKey, FeaturedSlug, Horizon, Profile, ProfileId }
export type LngLat = [number, number]

export const PROFILES: Profile[] = ['student', 'rodzina', 'senior']

/** One osiedle with all scores merged and featured overrides applied (spec 6.3). */
export interface OsiedleInfo {
  id: string
  name: string
  district: string
  match: Record<Profile, number>
  cats: Record<CategoryKey, number>
  blurb: Record<Profile, string>
  featuredSlug: FeaturedSlug | null
  labelPoint: LngLat
}

export interface FeaturedInfo {
  slug: FeaturedSlug
  msiId: string
  name: string
  district: string
  profile: Profile
  tagline: string
  center: LngLat
  thumb: string
  match: Record<Profile, number>
  /** Hand-made category stats from `src/mock/osiedla.ts` (override the computed ones). */
  stats?: Record<string, number>
}
