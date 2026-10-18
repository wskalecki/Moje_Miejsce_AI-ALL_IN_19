/**
 * Loader for the osiedle panel (`src/osiedle/OsiedlePanel.tsx`, built separately).
 * `import.meta.glob` resolves to an empty object while the file is missing, so the transition
 * builds and runs with or without the panel.
 */
import type { ComponentType } from 'react'
import type { Horizon, ProfileId, CategoryKey } from '../app/types'
import type { LngLat, Osiedle, Route, TimelineEvent } from '../mock/osiedla'

/** Rank and match of an osiedle for the current weights — the numbers on its map pill. */
export interface PlaceFit {
  rank: number
  match: number
  /** Number of ranked osiedla. */
  total: number
}

export interface OsiedlePanelProps {
  osiedle: Osiedle
  /** Same ranking as the map pills; without it the panel ranks with the store weights (`useMatch`). */
  fit?: PlaceFit | null
  profile: ProfileId
  horizon: Horizon
  priorities?: CategoryKey[]
  layout?: 'overlay' | 'page'
  onBack: () => void
  onFocusPlace?: (lngLat: LngLat) => void
  onHoverPlace?: (id: string | null) => void
  onShowRoute?: (route: Route | null) => void
  activePlaceId?: string | null
  /** Controlled timeline year (store `timelineYear`). */
  timelineYear?: number
  /** Timeline year (spec 4.6) with the events of year ≤ Y — investments with a coordinate get a pin on the map. */
  onTimelineYear?: (year: number, events: TimelineEvent[]) => void
}

type PanelModule = { default?: ComponentType<OsiedlePanelProps>; OsiedlePanel?: ComponentType<OsiedlePanelProps> }

const modules = import.meta.glob<PanelModule>('../osiedle/OsiedlePanel.tsx')
const loader = modules['../osiedle/OsiedlePanel.tsx'] as (() => Promise<PanelModule>) | undefined

export const hasPanel = Boolean(loader)

export async function loadPanel(): Promise<{ default: ComponentType<OsiedlePanelProps> }> {
  if (!loader) return { default: () => null }
  const mod = await loader()
  return { default: mod.OsiedlePanel ?? mod.default ?? (() => null) }
}
