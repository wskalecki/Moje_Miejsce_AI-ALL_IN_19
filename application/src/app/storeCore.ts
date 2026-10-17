/** Store core: state shape, reducer, persistence (spec §9 "Stan"). */
import { createContext } from 'react'
import { STORAGE_KEY, MAX_PRIORITIES } from './config'
import { DEFAULT_PRIORITIES, PROFILES, isCategoryKey, isHorizon, isProfileId } from './dictionary'
import type { AppState, CategoryKey, Horizon, ProfileId } from './types'

export const INITIAL_STATE: AppState = {
  profile: null,
  priorities: [],
  horizon: null,
  timelineYear: 2026,
  visited: [],
}

export type Action =
  | { type: 'setProfile'; profile: ProfileId; keepChoices?: boolean }
  | { type: 'togglePriority'; category: CategoryKey }
  | { type: 'setPriorities'; priorities: CategoryKey[] }
  | { type: 'setHorizon'; horizon: Horizon }
  | { type: 'setYear'; year: number }
  | { type: 'markVisited'; slug: string }
  | { type: 'reset' }

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'setProfile': {
      if (action.keepChoices && state.profile === action.profile) return state
      return {
        ...state,
        profile: action.profile,
        priorities: [...DEFAULT_PRIORITIES[action.profile]],
        horizon: PROFILES[action.profile].defaultHorizon,
      }
    }
    case 'togglePriority': {
      const has = state.priorities.includes(action.category)
      if (has) return { ...state, priorities: state.priorities.filter((c) => c !== action.category) }
      if (state.priorities.length >= MAX_PRIORITIES) return state
      return { ...state, priorities: [...state.priorities, action.category] }
    }
    case 'setPriorities':
      return { ...state, priorities: action.priorities.slice(0, MAX_PRIORITIES) }
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

export function loadState(): AppState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_STATE
    const p = JSON.parse(raw) as Partial<AppState>
    return {
      profile: isProfileId(p.profile) ? p.profile : null,
      priorities: Array.isArray(p.priorities) ? p.priorities.filter(isCategoryKey).slice(0, MAX_PRIORITIES) : [],
      horizon: isHorizon(p.horizon) ? p.horizon : null,
      timelineYear: typeof p.timelineYear === 'number' ? p.timelineYear : 2026,
      visited: Array.isArray(p.visited) ? p.visited.filter((s): s is string => typeof s === 'string') : [],
    }
  } catch {
    return INITIAL_STATE
  }
}

export function saveState(state: AppState): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode) — state stays in memory */
  }
}

export type TogglePriorityResult = 'added' | 'removed' | 'blocked'

export interface AppStore {
  state: AppState
  /** Sets profile and resets priorities + horizon to the profile defaults.
   *  With `keepChoices`, re-selecting the current profile keeps the user's picks. */
  setProfile: (profile: ProfileId, opts?: { keepChoices?: boolean }) => void
  togglePriority: (category: CategoryKey) => TogglePriorityResult
  setPriorities: (priorities: CategoryKey[]) => void
  setHorizon: (horizon: Horizon) => void
  setYear: (year: number) => void
  markVisited: (slug: string) => void
  reset: () => void
}

export const AppStoreContext = createContext<AppStore | null>(null)
