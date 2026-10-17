import { MapPin } from 'lucide-react'
import { CATEGORY_ICONS } from '../app/icons'
import type { Highlight } from '../mock/osiedla'
import { formatMin } from '../lib/format'
import { SectionHead } from './shared'

interface PlacesProps {
  places: Highlight[]
  activeId: string | null
  onSelect: (place: Highlight) => void
  onHover?: (id: string | null) => void
  /** Whether a map is listening (changes the action hint). */
  hasMap: boolean
}

function distanceLabel(p: Highlight): string | null {
  const parts: string[] = []
  if (p.distanceM != null) parts.push(p.distanceM >= 1000 ? `${(p.distanceM / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(p.distanceM / 10) * 10} m`)
  if (p.walkMin != null) parts.push(`${formatMin(p.walkMin)} pieszo`)
  return parts.length ? parts.join(' · ') : null
}

/** "Ważne miejsca" (spec §4.5 pkt 4). Click flies the map to the place. */
export function Places({ places, activeId, onSelect, onHover, hasMap }: PlacesProps) {
  return (
    <section className="op-sec" aria-labelledby="op-places-title" data-section="Ważne miejsca">
      <SectionHead id="op-places-title" title="Ważne miejsca" />
      <ul className="op-places">
        {places.map((p) => {
          const Icon = CATEGORY_ICONS[p.category]
          const dist = distanceLabel(p)
          const active = p.id === activeId
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`op-place${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onSelect(p)}
                onPointerEnter={() => onHover?.(p.id)}
                onPointerLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(p.id)}
                onBlur={() => onHover?.(null)}
              >
                <span className="op-place__icon" aria-hidden>
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="op-place__body">
                  <span className="op-place__name">{p.name}</span>
                  <span className="op-place__desc">{p.description}</span>
                  {dist && <span className="op-place__meta">{dist}</span>}
                </span>
                {hasMap && (
                  <span className="op-place__go" aria-hidden>
                    <MapPin size={15} strokeWidth={2.2} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
