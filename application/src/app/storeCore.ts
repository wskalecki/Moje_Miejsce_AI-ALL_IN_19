/** Store core: context, persistence and the public store API (spec §9 "Stan"). */
import { createContext } from 'react'
import { STORAGE_KEY } from './config'
import { parseState } from './appState'
import type { AppState, CategoryKey, Horizon, ProfileId } from './types'

export { INITIAL_STATE, reducer, parseState, type Action } from './appState'

export function loadState(): AppState {
  try {
    return parseState(window.sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return parseState(null)
  }
}

export function saveState(state: AppState): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable (private mode) — state stays in memory */
  }
}

export type TogglePriorityResult = 'added' | 'removed'

export interface AppStore {
  state: AppState
  /** Sets profile and resets priorities, weights and horizon to the profile defaults.
   *  With `keepChoices`, re-selecting the current profile keeps the user's picks. */
  setProfile: (profile: ProfileId, opts?: { keepChoices?: boolean }) => void
  /** Adds / removes a priority (no limit). Adding boosts its weight to ≥ 80,
   *  removing returns it to the profile default. */
  togglePriority: (category: CategoryKey) => TogglePriorityResult
  /** Replaces priorities and re-derives all weights from the profile. */
  setPriorities: (priorities: CategoryKey[]) => void
  /** Sets one category weight (0–100, rounded). Below 80 the category stops being a priority. */
  setWeight: (category: CategoryKey, value: number) => void
  /** Weights back to profile defaults + current priorities boosted. */
  resetWeights: () => void
  setHorizon: (horizon: Horizon) => void
  setYear: (year: number) => void
  markVisited: (slug: string) => void
  reset: () => void
}

export const AppStoreContext = createContext<AppStore | null>(null)
