/**
 * Map-local types. Domain types come from the app shell (`src/app/types.ts`).
 */
import type { CategoryKey, FeaturedSlug, Horizon, Profile, ProfileId } from '../app/types'

export type { CategoryKey, FeaturedSlug, Horizon, Profile, ProfileId }
export type LngLat = [number, number]

export const PROFILES: Profile[] = ['student', 'rodzina', 'senior']

/** One osiedle with its real category scores (osiedla-scores.json); the match is weighted on the client. */
export interface OsiedleInfo {
  id: string
  name: string
  district: string
  /** Category scores 0–100 (percentile ranks among all osiedla). */
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
  tagline: string
  center: LngLat
  thumb: string
  /** Used when `thumb` is missing (first hero image from the mock). */
  thumbFallback: string | null
}
