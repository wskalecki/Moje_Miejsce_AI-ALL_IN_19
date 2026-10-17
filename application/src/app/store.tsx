/** App store provider: Context + useReducer + sessionStorage (spec §9). */
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { MAX_PRIORITIES } from './config'
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
        const current = stateRef.current.priorities
        let result: TogglePriorityResult
        if (current.includes(category)) result = 'removed'
        else if (current.length >= MAX_PRIORITIES) result = 'blocked'
        else result = 'added'
        if (result !== 'blocked') {
          // Keep the ref in sync immediately so rapid toggles see fresh state.
          stateRef.current = reducer(stateRef.current, { type: 'togglePriority', category })
          dispatch({ type: 'togglePriority', category })
        }
        return result
      },
      setPriorities: (priorities) => dispatch({ type: 'setPriorities', priorities }),
      setHorizon: (horizon) => dispatch({ type: 'setHorizon', horizon }),
      setYear: (year) => dispatch({ type: 'setYear', year }),
      markVisited: (slug) => dispatch({ type: 'markVisited', slug }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [state],
  )

  return <AppStoreContext.Provider value={store}>{children}</AppStoreContext.Provider>
}
