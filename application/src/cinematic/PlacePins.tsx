import { Marker, type Map as MlMap } from 'maplibre-gl'
import { Diamond, Navigation } from 'lucide-react'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORY_ICONS } from '../app/icons'
import type { CategoryKey } from '../app/types'
import type { LngLat } from '../mock/osiedla'

export interface Pin {
  id: string
  coord: LngLat
  label: string
  category?: CategoryKey
  kind?: 'place' | 'start' | 'end' | 'investment'
}

interface PlacePinsProps {
  map: MlMap
  pins: Pin[]
  accent: string
  deep: string
  activeId?: string | null
  /** Stagger between pins (ms). */
  stagger?: number
  onPick?: (pin: Pin) => void
}

/**
 * HTML pins standing on the 3D map: a disc with the category icon on a short stem, dropping in
 * one after another. MapLibre owns the marker elements; React renders into them via portals.
 */
export function PlacePins({ map, pins, accent, deep, activeId, stagger = 80, onPick }: PlacePinsProps) {
  const [hosts, setHosts] = useState<Record<string, HTMLDivElement>>({})
  const key = pins.map((p) => `${p.id}@${p.coord.join(',')}`).join('|')

  useEffect(() => {
    const created: Record<string, HTMLDivElement> = {}
    const markers = pins.map((p) => {
      const el = document.createElement('div')
      el.className = 'cin-pin-host'
      created[p.id] = el
      return new Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' })
        .setLngLat(p.coord)
        .addTo(map)
    })
    // marker hosts exist only after MapLibre creates them — syncing with an external system
    // eslint-disable-next-line react/set-state-in-effect
    setHosts(created)
    return () => markers.forEach((m) => m.remove())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])

  return (
    <>
      {pins.map((p, i) => {
        const host = hosts[p.id]
        if (!host) return null
        const kind = p.kind ?? 'place'
        const Icon = p.category ? CATEGORY_ICONS[p.category] : null
        let glyph: ReactNode = Icon ? <Icon size={16} strokeWidth={2.2} aria-hidden /> : null
        if (kind === 'start') glyph = <span className="cin-pin__you">Ty</span>
        if (kind === 'investment') glyph = <Diamond size={14} strokeWidth={2.4} aria-hidden />
        if (!glyph) glyph = <Navigation size={15} strokeWidth={2.2} aria-hidden />
        return createPortal(
          <button
            type="button"
            className={`cin-pin is-${kind}${activeId === p.id ? ' is-active' : ''}`}
            style={{ '--pin': accent, '--pin-deep': deep, '--d': `${i * stagger}ms` } as CSSProperties}
            onClick={() => onPick?.(p)}
            aria-label={p.label}
          >
            <span className="cin-pin__head">{glyph}</span>
            <span className="cin-pin__stem" aria-hidden />
            <span className="cin-pin__foot" aria-hidden />
            <span className="cin-pin__label">{p.label}</span>
          </button>,
          host,
          p.id,
        )
      })}
    </>
  )
}
