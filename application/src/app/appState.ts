/**
 * App state shape, reducer and (de)serialisation (spec §9 "Stan").
 * Pure module (explicit `.ts` imports) so `node --test` can load it;
 * React context + sessionStorage live in `storeCore.ts`.
 */
import { DEFAULT_PRIORITIES, PROFILES, isCategoryKey, isHorizon, isProfileId } from './dictionary.ts'
import { TIMELINE_FIRST_YEAR, TIMELINE_LAST_YEAR } from './config.ts'
import type { AppState, CategoryKey, Horizon, ProfileId } from './types.ts'
import { ALL_GASTRONOMY_CUISINES, sanitizeGastronomyCuisines, type GastronomyCuisine } from '../map/gastronomyCuisine.ts'
import {
  DEFAULT_FILTER_SECTIONS,
  sanitizeFilterSections,
  sectionMembershipChanges,
  sectionsEqual,
  type FilterSections,
} from '../map/categoryFilterRows.ts'
import { isKnownPoiSubtype, sanitizePoiInterests } from '../map/poiInterests.ts'
import { PRIORITY_WEIGHT, baseWeights, clampWeight, deriveWeights, sanitizeWeights, uiToWeight, weightToUi } from './weights.ts'

export const INITIAL_STATE: AppState = {
  profile: null,
  priorities: [],
  weights: deriveWeights(null, []),
  horizon: null,
  timelineYear: TIMELINE_FIRST_YEAR,
  visited: [],
  poiInterests: [],
  gastronomyCuisines: [],
  filterSections: { score: [...DEFAULT_FILTER_SECTIONS.score], preview: [...DEFAULT_FILTER_SECTIONS.preview] },
}

export type Action =
  | { type: 'setProfile'; profile: ProfileId; keepChoices?: boolean }
  | { type: 'togglePriority'; category: CategoryKey }
  | { type: 'setPriorities'; priorities: CategoryKey[] }
  | { type: 'setWeight'; category: CategoryKey; value: number }
  | { type: 'resetWeights' }
  | { type: 'setHorizon'; horizon: Horizon }
  | { type: 'setYear'; year: number }
  | { type: 'markVisited'; slug: string }
  | { type: 'togglePoiInterest'; subtype: string }
  | { type: 'toggleGastronomyCuisine'; cuisine: string }
  | { type: 'setFilterSections'; sections: FilterSections }
  | { type: 'reset' }

function unique(list: readonly CategoryKey[]): CategoryKey[] {
  return list.filter((c, i) => isCategoryKey(c) && list.indexOf(c) === i)
}

function applySectionWeightChanges(
  state: AppState,
  prev: FilterSections,
  next: FilterSections,
): Pick<AppState, 'weights' | 'priorities'> {
  const { promoted, demoted } = sectionMembershipChanges(prev, next)
  if (!promoted.length && !demoted.length) return { weights: state.weights, priorities: state.priorities }

  let weights = { ...state.weights }
  let priorities = [...state.priorities]

  for (const c of promoted) {
    if (weightToUi(weights[c]) === 0) weights = { ...weights, [c]: uiToWeight(1) }
  }
  for (const c of demoted) {
    weights = { ...weights, [c]: 0 }
    if (priorities.includes(c)) priorities = priorities.filter((p) => p !== c)
  }

  return { weights, priorities: priorities.filter((c) => weights[c] >= PRIORITY_WEIGHT) }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setProfile': {
      if (action.keepChoices && state.profile === action.profile) return state
      const priorities = [...DEFAULT_PRIORITIES[action.profile]]
      return {
        ...state,
        profile: action.profile,
        priorities,
        weights: deriveWeights(action.profile, priorities),
        horizon: PROFILES[action.profile].defaultHorizon,
        filterSections: { score: [...DEFAULT_FILTER_SECTIONS.score], preview: [...DEFAULT_FILTER_SECTIONS.preview] },
        poiInterests: [],
        gastronomyCuisines: [],
      }
    }
    case 'togglePriority': {
      const c = action.category
      if (state.priorities.includes(c)) {
        return {
          ...state,
          priorities: state.priorities.filter((p) => p !== c),
          weights: { ...state.weights, [c]: baseWeights(state.profile)[c] },
        }
      }
      return {
        ...state,
        priorities: [...state.priorities, c],
        weights: { ...state.weights, [c]: Math.max(state.weights[c], PRIORITY_WEIGHT) },
      }
    }
    case 'setPriorities': {
      const priorities = unique(action.priorities)
      return { ...state, priorities, weights: deriveWeights(state.profile, priorities) }
    }
    case 'setWeight': {
      const value = clampWeight(action.value)
      const c = action.category
      if (state.weights[c] === value) return state
      const priorities = value < PRIORITY_WEIGHT && state.priorities.includes(c) ? state.priorities.filter((p) => p !== c) : state.priorities
      return { ...state, priorities, weights: { ...state.weights, [c]: value } }
    }
    case 'resetWeights':
      return {
        ...state,
        weights: deriveWeights(state.profile, state.priorities),
        filterSections: { score: [...DEFAULT_FILTER_SECTIONS.score], preview: [...DEFAULT_FILTER_SECTIONS.preview] },
      }
    case 'setHorizon':
      return { ...state, horizon: action.horizon }
    case 'setYear':
      return { ...state, timelineYear: Math.min(TIMELINE_LAST_YEAR, Math.max(TIMELINE_FIRST_YEAR, Math.round(action.year))) }
    case 'markVisited':
      return state.visited.includes(action.slug) ? state : { ...state, visited: [...state.visited, action.slug] }
    case 'toggleGastronomyCuisine': {
      const id = action.cuisine
      if (!sanitizeGastronomyCuisines([id]).length) return state
      const has = state.gastronomyCuisines.includes(id)
      const next = has
        ? state.gastronomyCuisines.filter((c) => c !== id)
        : [...state.gastronomyCuisines, id]
      return { ...state, gastronomyCuisines: sanitizeGastronomyCuisines(next) }
    }
    case 'togglePoiInterest': {
      const k = action.subtype
      if (!isKnownPoiSubtype(k)) return state
      const has = state.poiInterests.includes(k)
      const poiInterests = has ? state.poiInterests.filter((s) => s !== k) : [...state.poiInterests, k]
      return { ...state, poiInterests }
    }
    case 'setFilterSections': {
      const next = sanitizeFilterSections(action.sections)
      if (sectionsEqual(state.filterSections, next)) return state
      const weightPatch = applySectionWeightChanges(state, state.filterSections, next)
      return { ...state, filterSections: next, ...weightPatch }
    }
    case 'reset':
      return INITIAL_STATE
  }
}

/** Stary domyślny „wszystkie kuchnie” → brak krop na mapie do czasu wyboru. */
function migrateGastronomyCuisines(cuisines: GastronomyCuisine[]): GastronomyCuisine[] {
  if (cuisines.length === ALL_GASTRONOMY_CUISINES.length) return []
  return cuisines
}

/** Rebuilds a valid state from untrusted JSON (sessionStorage). */
export function parseState(raw: string | null): AppState {
  if (!raw) return INITIAL_STATE
  try {
    const p = JSON.parse(raw) as Partial<Record<keyof AppState, unknown>> & { filterRowOrder?: unknown } | null
    if (!p || typeof p !== 'object') return INITIAL_STATE
    const profile = isProfileId(p.profile) ? p.profile : null
    const priorities = Array.isArray(p.priorities) ? unique(p.priorities as CategoryKey[]) : []
    const weights = sanitizeWeights(p.weights, deriveWeights(profile, priorities))
    const filterSections = sanitizeFilterSections(p.filterSections, p.filterRowOrder)
    return {
      profile,
      priorities: priorities.filter((c) => weights[c] >= PRIORITY_WEIGHT),
      weights,
      horizon: isHorizon(p.horizon) ? p.horizon : null,
      timelineYear:
        typeof p.timelineYear === 'number' && Number.isFinite(p.timelineYear)
          ? Math.min(TIMELINE_LAST_YEAR, Math.max(TIMELINE_FIRST_YEAR, Math.round(p.timelineYear)))
          : TIMELINE_FIRST_YEAR,
      visited: Array.isArray(p.visited) ? p.visited.filter((s): s is string => typeof s === 'string') : [],
      poiInterests: sanitizePoiInterests(p.poiInterests),
      gastronomyCuisines: migrateGastronomyCuisines(sanitizeGastronomyCuisines(p.gastronomyCuisines)),
      filterSections,
    }
  } catch {
    return INITIAL_STATE
  }
}
