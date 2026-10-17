/** App store provider: Context + useReducer + sessionStorage (spec §9). */
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { AppStoreContext, loadState, reducer, saveState, type AppStore, type TogglePriorityResult } from './storeCore'

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
    saveState(state)
  }, [state])

  // Tint the whole UI with the active profile accent (before paint, so a
  // reload does not animate from the neutral accent).
  useLayoutEffect(() => {
    document.documentElement.dataset.profile = state.profile ?? 'none'
  }, [state.profile])

  const store = useMemo<AppStore>(
    () => ({
      state,
      setProfile: (profile, opts) => dispatch({ type: 'setProfile', profile, keepChoices: opts?.keepChoices }),
      togglePriority: (category): TogglePriorityResult => {
        const result: TogglePriorityResult = stateRef.current.priorities.includes(category) ? 'removed' : 'added'
        // Keep the ref in sync immediately so rapid toggles see fresh state.
        stateRef.current = reducer(stateRef.current, { type: 'togglePriority', category })
        dispatch({ type: 'togglePriority', category })
        return result
      },
      setPriorities: (priorities) => dispatch({ type: 'setPriorities', priorities }),
      setWeight: (category, value) => dispatch({ type: 'setWeight', category, value }),
      resetWeights: () => dispatch({ type: 'resetWeights' }),
      setHorizon: (horizon) => dispatch({ type: 'setHorizon', horizon }),
      setYear: (year) => dispatch({ type: 'setYear', year }),
      markVisited: (slug) => dispatch({ type: 'markVisited', slug }),
      togglePoiInterest: (subtype) => dispatch({ type: 'togglePoiInterest', subtype }),
      toggleGastronomyCuisine: (cuisine) => dispatch({ type: 'toggleGastronomyCuisine', cuisine }),
      setFilterSections: (sections) => dispatch({ type: 'setFilterSections', sections }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state],
  )

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
}
