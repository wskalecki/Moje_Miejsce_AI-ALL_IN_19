import { Marker, type Map as MlMap } from 'maplibre-gl'
import { Crown } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ACCENTS } from './tokens'
import type { FeaturedInfo, FeaturedSlug } from './types'

type Side = 'top' | 'right' | 'left'

/** Markers closer than this (≈ 70 px at the overview zoom) point their pills away from each other. */
const NEAR_DEG = 0.045

/** Pill side per marker, from the data: close pairs split west/east, the rest sit on top. */
function pillSides(featured: readonly FeaturedInfo[]): Record<string, Side> {
  const out: Record<string, Side> = {}
  for (const f of featured) out[f.slug] = 'top'
  for (let i = 0; i < featured.length; i++)
    for (let j = i + 1; j < featured.length; j++) {
      const a = featured[i]
      const b = featured[j]
      const dx = (a.center[0] - b.center[0]) * Math.cos((52.23 * Math.PI) / 180)
      const dy = a.center[1] - b.center[1]
      if (Math.hypot(dx, dy) > NEAR_DEG) continue
      const [west, east] = a.center[0] <= b.center[0] ? [a, b] : [b, a]
      out[west.slug] = 'left'
      out[east.slug] = 'right'
    }
  return out
}

export interface FeaturedRank {
  /** Rank among all osiedla for the current weights (1 = best). */
  rank: number
  match: number
}

interface FeaturedMarkersProps {
  map: MlMap
  featured: FeaturedInfo[]
  ranks: Record<string, FeaturedRank>
  highlighted: FeaturedSlug | null
  selectedSlug: string | null
  onSelect: (slug: FeaturedSlug) => void
  onHover: (slug: FeaturedSlug | null) => void
}

/**
 * Pulsing HTML markers at each featured centre — the "polecane" of the map. The rank is honest:
 * "#1 · Najlepsze dopasowanie" only when the osiedle really ranks first under the current weights,
 * otherwise "#k dla Twoich wag". React renders their content through portals so state changes
 * don't recreate markers.
 */
export function FeaturedMarkers({ map, featured, ranks, highlighted, selectedSlug, onSelect, onHover }: FeaturedMarkersProps) {
  const [els, setEls] = useState<Record<string, HTMLDivElement>>({})
  const sides = useMemo(() => pillSides(featured), [featured])

  useEffect(() => {
    const created: Record<string, HTMLDivElement> = {}
    const markers = featured.map((f) => {
      const el = document.createElement('div')
      el.className = 'smap-fm-host'
      created[f.slug] = el
      return new Marker({ element: el, anchor: 'center' }).setLngLat(f.center).addTo(map)
    })
    // marker hosts exist only after MapLibre creates them — syncing with an external system
    // eslint-disable-next-line react/set-state-in-effect
    setEls(created)
    return () => markers.forEach((m) => m.remove())
  }, [map, featured])

  return (
    <>
      {featured.map((f) => {
        const host = els[f.slug]
        if (!host) return null
        const r = ranks[f.slug]
        const best = r?.rank === 1
        const a = ACCENTS[f.profile]
        const cls = [
          'smap-fm',
          `is-${sides[f.slug] ?? 'top'}`,
          best ? 'is-own' : '',
          highlighted === f.slug ? 'is-hl' : '',
          selectedSlug && selectedSlug !== f.slug ? 'is-muted' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return createPortal(
          <div className={cls} style={{ '--fm': a.base, '--fm-soft': a.soft, '--fm-deep': a.deep } as CSSProperties}>
            <button
              type="button"
              className="smap-fm__pill"
              data-slug={f.slug}
              onClick={() => onSelect(f.slug)}
              onMouseEnter={() => onHover(f.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(f.slug)}
              onBlur={() => onHover(null)}
              aria-label={`${f.name}, dopasowanie ${r?.match ?? '–'}%, miejsce ${r?.rank ?? '–'} dla Twoich wag. Otwórz profil osiedla`}
            >
              {r && <span className={['smap-fm__rank', best ? '' : 'is-plain'].filter(Boolean).join(' ')}>#{r.rank}</span>}
              <span className="smap-fm__text">
                <span className="smap-fm__name">
                  {f.name}
                  {r && <span className="smap-fm__pct tabular">{r.match}%</span>}
                </span>
                {best ? (
                  <span className="smap-fm__best">
                    <Crown size={11} strokeWidth={2.4} aria-hidden />
                    Najlepsze dopasowanie
                  </span>
                ) : (
                  r && <span className="smap-fm__sub">dla Twoich wag</span>
                )}
              </span>
            </button>
            <span className="smap-fm__dot" aria-hidden onClick={() => onSelect(f.slug)}>
              <i />
            </span>
          </div>,
          host,
          f.slug,
        )
      })}
    </>
  )
}
