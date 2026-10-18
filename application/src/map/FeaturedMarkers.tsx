import { Marker, type Map as MlMap } from 'maplibre-gl'
import { memo, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FeaturedSlug, LngLat } from './types'

type Side = 'top' | 'right' | 'left'

/** Markers closer than this (≈ 70 px at the overview zoom) point their pills away from each other. */
const NEAR_DEG = 0.045

export interface FeaturedRank {
  /** Rank among all osiedla for the current weights (1 = best). */
  rank: number
  match: number
}

/** One of the live top 3 under the current weights. */
export interface TopItem {
  /** MSI id (public/data/osiedla.geojson). */
  id: string
  /** Set when the osiedle has full content (opens the osiedle view); null = "wkrótce". */
  slug: FeaturedSlug | null
  name: string
  center: LngLat
  rank: number
  match: number
}

/** Pill side per marker, from the data: close pairs split west/east, the rest sit on top. */
function pillSides(items: readonly TopItem[]): Record<string, Side> {
  const out: Record<string, Side> = {}
  for (const f of items) out[f.id] = 'top'
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      const dx = (a.center[0] - b.center[0]) * Math.cos((52.23 * Math.PI) / 180)
      const dy = a.center[1] - b.center[1]
      if (Math.hypot(dx, dy) > NEAR_DEG) continue
      const [west, east] = a.center[0] <= b.center[0] ? [a, b] : [b, a]
      out[west.id] = 'left'
      out[east.id] = 'right'
    }
  return out
}

interface FeaturedMarkersProps {
  map: MlMap
  /** The live top 3, best first. */
  items: readonly TopItem[]
  /** MSI id highlighted from the map hover. */
  highlighted: string | null
  selectedSlug: string | null
  onSelect: (item: TopItem) => void
  onHover: (id: string | null) => void
}

/**
 * The "top 3" pills of the map: a light badge with the osiedle's live place (#1–#3), name and match
 * at its centre. They follow the ranking — when the weights change and other osiedla come out on
 * top, the pills move to them. All three look the same; only the number differs. React renders the
 * content through portals, so a re-rank does not recreate markers that stay in the top 3.
 */
export const FeaturedMarkers = memo(function FeaturedMarkers({
  map,
  items,
  highlighted,
  selectedSlug,
  onSelect,
  onHover,
}: FeaturedMarkersProps) {
  const [els, setEls] = useState<Record<string, HTMLDivElement>>({})
  const sides = useMemo(() => pillSides(items), [items])
  // one marker per osiedle position; a re-rank among the same three keeps them
  const placesKey = items.map((f) => `${f.id}@${f.center.join(',')}`).sort().join('|')

  useEffect(() => {
    const created: Record<string, HTMLDivElement> = {}
    const markers = placesKey
      .split('|')
      .filter(Boolean)
      .map((entry) => {
        const [id, ll] = entry.split('@')
        const [lng, lat] = ll.split(',').map(Number)
        const el = document.createElement('div')
        el.className = 'smap-fm-host'
        created[id] = el
        return new Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map)
      })
    // marker hosts exist only after MapLibre creates them — syncing with an external system
    // eslint-disable-next-line react/set-state-in-effect
    setEls(created)
    return () => markers.forEach((m) => m.remove())
  }, [map, placesKey])

  return (
    <>
      {items.map((f) => {
        const host = els[f.id]
        if (!host) return null
        const cls = [
          'smap-fm',
          `is-${sides[f.id] ?? 'top'}`,
          `is-rank-${f.rank}`,
          f.slug ? '' : 'is-soon',
          highlighted === f.id ? 'is-hl' : '',
          selectedSlug && selectedSlug !== f.slug ? 'is-muted' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const label = `${f.name}: ${f.rank}. miejsce dla Twoich wag, dopasowanie ${f.match} procent. ${f.slug ? 'Otwórz szczegóły' : 'Pełny profil wkrótce'}`
        return createPortal(
          <div className={cls}>
            <button
              type="button"
              className="smap-fm__pill"
              data-slug={f.slug ?? undefined}
              data-id={f.id}
              onClick={() => onSelect(f)}
              onMouseEnter={() => onHover(f.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(f.id)}
              onBlur={() => onHover(null)}
              aria-label={label}
            >
              <span className="smap-fm__rank tabular">#{f.rank}</span>
              <span className="smap-fm__name">{f.name}</span>
              <span className="smap-fm__pct tabular">{f.match}%</span>
            </button>
            <span className="smap-fm__dot" aria-hidden onClick={() => onSelect(f)} />
          </div>,
          host,
          f.id,
        )
      })}
    </>
  )
})
