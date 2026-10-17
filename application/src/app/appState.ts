/**
 * App state shape, reducer and (de)serialisation (spec §9 "Stan").
 * Pure module (explicit `.ts` imports) so `node --test` can load it;
 * React context + sessionStorage live in `storeCore.ts`.
 */
import { DEFAULT_PRIORITIES, PROFILES, isCategoryKey, isHorizon, isProfileId } from './dictionary.ts'
import type { AppState, CategoryKey, Horizon, ProfileId } from './types.ts'
import { PRIORITY_WEIGHT, baseWeights, clampWeight, deriveWeights, sanitizeWeights } from './weights.ts'

export const INITIAL_STATE: AppState = {
  profile: null,
  priorities: [],
  weights: deriveWeights(null, []),
  horizon: null,
  timelineYear: 2026,
  visited: [],
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
  | { type: 'reset' }

function unique(list: readonly CategoryKey[]): CategoryKey[] {
  return list.filter((c, i) => isCategoryKey(c) && list.indexOf(c) === i)
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
      }
    }
    case 'togglePriority': {
      const c = action.category
      if (state.priorities.includes(c)) {
        // Back to the profile default (other hand-tuned weights stay).
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
      // Invariant: every priority weighs ≥ PRIORITY_WEIGHT — turning one down below drops it.
      const priorities = value < PRIORITY_WEIGHT && state.priorities.includes(c) ? state.priorities.filter((p) => p !== c) : state.priorities
      return { ...state, priorities, weights: { ...state.weights, [c]: value } }
    }
    case 'resetWeights':
      return { ...state, weights: deriveWeights(state.profile, state.priorities) }
    case 'setHorizon':
      return { ...state, horizon: action.horizon }
    case 'setYear':
      return { ...state, timelineYear: Math.min(2030, Math.max(2026, Math.round(action.year))) }
    case 'markVisited':
      return state.visited.includes(action.slug) ? state : { ...state, visited: [...state.visited, action.slug] }
    case 'reset':
      return INITIAL_STATE
  }
}

/** Rebuilds a valid state from untrusted JSON (sessionStorage). */
export function parseState(raw: string | null): AppState {
  if (!raw) return INITIAL_STATE
  try {
    const p = JSON.parse(raw) as Partial<Record<keyof AppState, unknown>> | null
    if (!p || typeof p !== 'object') return INITIAL_STATE
    const profile = isProfileId(p.profile) ? p.profile : null
    const priorities = Array.isArray(p.priorities) ? unique(p.priorities as CategoryKey[]) : []
    const weights = sanitizeWeights(p.weights, deriveWeights(profile, priorities))
    return {
      profile,
      // keep the invariant even for hand-edited storage
      priorities: priorities.filter((c) => weights[c] >= PRIORITY_WEIGHT),
      weights,
      horizon: isHorizon(p.horizon) ? p.horizon : null,
      timelineYear: typeof p.timelineYear === 'number' ? p.timelineYear : 2026,
      visited: Array.isArray(p.visited) ? p.visited.filter((s): s is string => typeof s === 'string') : [],
    }
  } catch {
    return INITIAL_STATE
  }
}
