import { Marker, type Map as MlMap } from 'maplibre-gl'
import { Crown } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ACCENTS } from './tokens'
import type { FeaturedInfo, FeaturedSlug, Profile } from './types'

/**
 * Pill side per osiedle — Powiśle and Saska Kępa sit ~2 km apart (≈ 70 px at the overview zoom),
 * so their pills point away from each other: Powiśle to the west, Saska Kępa to the east.
 */
const PILL_SIDE: Record<FeaturedSlug, 'top' | 'right' | 'left'> = {
  powisle: 'left',
  'saska-kepa': 'right',
  'miasteczko-wilanow': 'top',
}

interface FeaturedMarkersProps {
  map: MlMap
  featured: FeaturedInfo[]
  profile: Profile
  highlighted: FeaturedSlug | null
  selectedSlug: string | null
  onSelect: (slug: FeaturedSlug) => void
  onHover: (slug: FeaturedSlug | null) => void
}

/**
 * Pulsing HTML markers at each featured centre (spec 4.3). MapLibre owns the marker elements;
 * React renders their content through portals so state changes don't recreate markers.
 */
export function FeaturedMarkers({ map, featured, profile, highlighted, selectedSlug, onSelect, onHover }: FeaturedMarkersProps) {
  const [els, setEls] = useState<Record<string, HTMLDivElement>>({})

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
        const isOwn = f.profile === profile
        const a = ACCENTS[f.profile]
        const cls = [
          'smap-fm',
          `is-${PILL_SIDE[f.slug] ?? 'top'}`,
          isOwn ? 'is-own' : '',
          highlighted === f.slug ? 'is-hl' : '',
          selectedSlug && selectedSlug !== f.slug ? 'is-muted' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return createPortal(
          <div
            className={cls}
            style={{ '--fm': a.base, '--fm-soft': a.soft, '--fm-deep': a.deep } as CSSProperties}
          >
            <button
              type="button"
              className="smap-fm__pill"
              data-slug={f.slug}
              onClick={() => onSelect(f.slug)}
              onMouseEnter={() => onHover(f.slug)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(f.slug)}
              onBlur={() => onHover(null)}
              aria-label={`${f.name}, dopasowanie ${f.match[profile]}%${isOwn ? ', najlepsze dopasowanie' : ''}. Otwórz profil osiedla`}
            >
              {isOwn && <span className="smap-fm__rank">#1</span>}
              <span className="smap-fm__text">
                <span className="smap-fm__name">
                  {f.name}
                  <span className="smap-fm__pct tabular">{f.match[profile]}%</span>
                </span>
                {isOwn && (
                  <span className="smap-fm__best">
                    <Crown size={11} strokeWidth={2.4} aria-hidden />
                    Najlepsze dopasowanie
                  </span>
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
