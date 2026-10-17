import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import type { BuildingKind } from '../lib/osm3d/buildingStyle'
import { KIND_LEGEND } from './kinds'

interface BuildingLegendProps {
  counts: Partial<Record<BuildingKind, number>>
  /** Kind under the pointer / keyboard focus (`null` when none). */
  onFocusKind: (kind: BuildingKind | null) => void
  defaultOpen?: boolean
}

/** Small collapsible legend of the 3D building colours; hovering a row highlights those buildings. */
export function BuildingLegend({ counts, onFocusKind, defaultOpen = true }: BuildingLegendProps) {
  const [open, setOpen] = useState(defaultOpen)
  const listId = useId()
  const items = KIND_LEGEND.filter((i) => (counts[i.kind] ?? 0) > 0)
  if (!items.length) return null
  return (
    <section className={`m3d-card m3d-legend${open ? ' is-open' : ''}`} aria-label="Legenda budynków">
      <button type="button" className="m3d-legend__head" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        <span className="m3d-legend__title">Budynki</span>
        <span className="m3d-legend__swatches" aria-hidden>
          {items.slice(0, 5).map((i) => (
            <i key={i.kind} style={{ background: i.color }} />
          ))}
        </span>
        <ChevronDown className="m3d-legend__chev" size={16} strokeWidth={2.2} aria-hidden />
      </button>
      <ul id={listId} className="m3d-legend__list" hidden={!open} onMouseLeave={() => onFocusKind(null)}>
        {items.map((i) => (
          <li key={i.kind}>
            <button
              type="button"
              className="m3d-legend__row"
              onMouseEnter={() => onFocusKind(i.kind)}
              onFocus={() => onFocusKind(i.kind)}
              onBlur={() => onFocusKind(null)}
            >
              <i className="m3d-legend__dot" style={{ background: i.color }} aria-hidden />
              <span className="m3d-legend__label">{i.label}</span>
              <span className="m3d-legend__count">{counts[i.kind]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
