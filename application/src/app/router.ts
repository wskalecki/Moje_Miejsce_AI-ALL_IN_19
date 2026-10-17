/**
 * Mini router on the History API (spec §9). No dependencies.
 *
 *   /                 → { name: 'intro' }
 *   /ankieta?krok=N   → { name: 'survey', step: N }
 *   /mapa             → { name: 'map', slug: null }
 *   /mapa/:slug       → { name: 'map', slug }
 *   /dev/ui           → { name: 'devUi' } (DEV only)
 */
import { useSyncExternalStore } from 'react'

export type SurveyStep = 1 | 2 | 3

export type Route =
  | { name: 'intro' }
  | { name: 'survey'; step: SurveyStep }
  | { name: 'map'; slug: string | null }
  | { name: 'devUi' }

export interface Location {
  pathname: string
  search: string
}

export function parseRoute(pathname: string, search = ''): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/ankieta') {
    const k = Number(new URLSearchParams(search).get('krok'))
    const step: SurveyStep = k === 2 || k === 3 ? k : 1
    return { name: 'survey', step }
  }
  if (path === '/mapa') return { name: 'map', slug: null }
  const m = /^\/mapa\/([a-z0-9-]+)$/.exec(path)
  if (m) return { name: 'map', slug: m[1] }
  if (path === '/dev/ui' && import.meta.env.DEV) return { name: 'devUi' }
  return { name: 'intro' }
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case 'intro':
      return '/'
    case 'survey':
      return `/ankieta?krok=${route.step}`
    case 'map':
      return route.slug ? `/mapa/${route.slug}` : '/mapa'
    case 'devUi':
      return '/dev/ui'
  }
}

/** Direction hint for screen transitions: +1 forward, -1 back (popstate). */
let lastDirection: 1 | -1 = 1
let snapshot: Location = readLocation()
const listeners = new Set<() => void>()

function readLocation(): Location {
  return { pathname: window.location.pathname, search: window.location.search }
}

function emit() {
  const next = readLocation()
  if (next.pathname === snapshot.pathname && next.search === snapshot.search) return
  snapshot = next
  listeners.forEach((l) => l())
}

window.addEventListener('popstate', () => {
  lastDirection = -1
  emit()
})

export interface NavigateOptions {
  replace?: boolean
  /** Override transition direction (defaults to forward). */
  direction?: 1 | -1
}

export function navigate(to: string | Route, opts: NavigateOptions = {}): void {
  const href = typeof to === 'string' ? to : routeToPath(to)
  const current = window.location.pathname + window.location.search
  if (href === current) return
  lastDirection = opts.direction ?? 1
  if (opts.replace) window.history.replaceState(null, '', href)
  else window.history.pushState(null, '', href)
  emit()
}

export function back(fallback: string | Route = '/'): void {
  if (window.history.length > 1) window.history.back()
  else navigate(fallback, { replace: true, direction: -1 })
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot() {
  return snapshot
}

export interface RouterState {
  route: Route
  location: Location
  query: URLSearchParams
  /** +1 after navigate(), -1 after browser back / navigate(..., { direction: -1 }). */
  direction: 1 | -1
}

export function useRouter(): RouterState {
  const location = useSyncExternalStore(subscribe, getSnapshot)
  return {
    route: parseRoute(location.pathname, location.search),
    location,
    query: new URLSearchParams(location.search),
    direction: lastDirection,
  }
}

/** Convenience: just the parsed route. */
export function useRoute(): Route {
  return useRouter().route
}
