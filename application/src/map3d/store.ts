/**
 * Tiny shared state for the osiedle 3D view, readable from any component without a provider
 * (module-level store + `useSyncExternalStore`):
 *
 *   - traffic hour (0–23) shown by the road congestion colours and the hour slider;
 *   - building focus: kinds highlighted on the 3D buildings (others muted).
 *
 * Panel integration (e.g. the "Korki w ciągu doby" chart in src/osiedle):
 *
 *   import { useTrafficHour, focusCategory } from '../map3d'
 *   const [hour, setHour] = useTrafficHour()      // sync the chart cursor with the map slider
 *   onMouseEnter={() => focusCategory('edukacja')} onMouseLeave={() => focusCategory(null)}
 */
import { useSyncExternalStore } from 'react'
import type { CategoryKey } from '../app/types'
import type { BuildingKind } from '../lib/osm3d/buildingStyle'
import { categoryKinds } from './kinds'

type Listener = () => void

function createStore<T>(initial: T) {
  let value = initial
  const listeners = new Set<Listener>()
  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(next, value)) return
      value = next
      listeners.forEach((l) => l())
    },
    subscribe: (l: Listener) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

// ------------------------------------------------------------------ traffic hour

const normHour = (h: number) => ((Math.round(h) % 24) + 24) % 24
const hourStore = createStore<number>(normHour(new Date().getHours()))

/** Current traffic hour (integer 0–23; defaults to the local hour on load). */
export const getTrafficHour = hourStore.get
/** Set the traffic hour (rounded and wrapped into 0–23). */
export const setTrafficHour = (h: number) => hourStore.set(normHour(h))
export const subscribeTrafficHour = hourStore.subscribe

/** `[hour, setHour]` — re-renders on change, from the map slider or any other caller. */
export function useTrafficHour(): [number, (h: number) => void] {
  const hour = useSyncExternalStore(hourStore.subscribe, hourStore.get, hourStore.get)
  return [hour, setTrafficHour]
}

// ------------------------------------------------------------------ building focus

const focusStore = createStore<readonly BuildingKind[] | null>(null)

/** Highlight these building kinds on the 3D map (`null` = no focus, all in their colours). */
export const setBuildingFocus = (kinds: readonly BuildingKind[] | null) => focusStore.set(kinds && kinds.length ? kinds : null)
/** Highlight the buildings that belong to a place category (no-op focus for categories without buildings). */
export const focusCategory = (category: CategoryKey | null) => setBuildingFocus(category ? categoryKinds(category) : null)
export const getBuildingFocus = focusStore.get
export const subscribeBuildingFocus = focusStore.subscribe

export function useBuildingFocus(): readonly BuildingKind[] | null {
  return useSyncExternalStore(focusStore.subscribe, focusStore.get, focusStore.get)
}
