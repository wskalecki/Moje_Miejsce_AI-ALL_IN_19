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

/** Persisted app state (sessionStorage `siatka.mock.v1`). */
export interface AppState {
  profile: ProfileId | null
  /** Selected categories in the order they were picked (max 4). */
  priorities: CategoryKey[]
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
