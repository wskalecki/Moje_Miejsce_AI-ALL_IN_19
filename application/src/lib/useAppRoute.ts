import { useEffect, useState } from 'react'

/** Path-based routes (lab is a separate page from the map). */
export function useAppRoute(): string {
  const [route, setRoute] = useState(() => normalizePath(window.location.pathname))

  useEffect(() => {
    const onPopState = () => setRoute(normalizePath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return route
}

export const GRID_TILE_LAB_PATH = '/lab/grid'

export function isGridTileLabRoute(path: string): boolean {
  return path === GRID_TILE_LAB_PATH || path.startsWith(`${GRID_TILE_LAB_PATH}/`)
}

function normalizePath(pathname: string): string {
  const raw = pathname.replace(/\/+$/, '') || '/'
  return raw.startsWith('/') ? raw : `/${raw}`
}
