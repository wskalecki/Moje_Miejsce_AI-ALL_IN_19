/**
 * Shared domain types for the mock (spec §3, §6.2, §9).
 * Category keys follow the data files (`zycieNocne`, camelCase).
 */

export type ProfileId = 'student' | 'rodzina' | 'senior'
/** Alias kept for readability in components. */
export type Profile = ProfileId

export type CategoryKey =
  | 'cisza'
  | 'zielen'
  | 'komunikacja'
  | 'gastronomia'
  | 'sport'
  | 'kultura'
  | 'edukacja'
  | 'zdrowie'
  | 'zakupy'
  | 'zycieNocne'
/** Alias matching the spec wording (`CategoryId`). */
export type CategoryId = CategoryKey

export type Horizon = 'chwila' | 'stale'

export type FeaturedSlug = 'powisle' | 'miasteczko-wilanow' | 'saska-kepa'

/** Persisted app state (sessionStorage `okolica.mock.v2`). */
export interface AppState {
  profile: ProfileId | null
  /** Categories marked as priorities, in the order they were picked (no limit).
   *  Each one has `weights[c] >= 80`. */
  priorities: CategoryKey[]
  /** Category weights 0–100: profile defaults (max = 100), priorities boosted to ≥ 80. */
  weights: Record<CategoryKey, number>
  horizon: Horizon | null
  timelineYear: number
  /** Featured slugs whose cinematic interlude was already shown this session. */
  visited: string[]
}

/** Props contract for `src/map/MapView.tsx` (owned by the map agent). */
export interface MapViewProps {
  profile: ProfileId
  priorities: CategoryKey[]
  horizon: Horizon
  onSelectFeatured: (slug: string) => void
  /** Slug from `/mapa/:slug`, or null on `/mapa`. */
  selectedSlug: string | null
}
