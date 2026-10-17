import { Marker, type Map as MlMap } from 'maplibre-gl'
import { Navigation } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
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
  /** Investment pins: the year shown on the pin. */
  year?: number
}

interface PlacePinsProps {
  map: MlMap
  pins: Pin[]
  accent: string
  deep: string
  activeId?: string | null
  /** Stagger between pins of the first batch (ms). */
  stagger?: number
  onPick?: (pin: Pin) => void
}

/** Pins are ~70 px tall and ~40 px wide: two pins clash when their feet are closer than this on both axes. */
const CLEAR_X = 46
const CLEAR_Y = 74
/** Candidate nudges for a crowded investment pin, tried in order (sideways first: pins are tall). */
const NUDGES: [number, number][] = [
  [50, 0],
  [-50, 0],
  [100, 0],
  [-100, 0],
  [50, -78],
  [-50, -78],
  [0, -80],
  [150, 0],
  [-150, 0],
]

type Shift = Record<string, [number, number]>

/** Investment pins step aside (in screen space) from places, route ends and each other. */
function computeShifts(map: MlMap, pins: Pin[]): Shift {
  const fixed: { x: number; y: number }[] = []
  const inv: { id: string; x: number; y: number }[] = []
  for (const p of pins) {
    const s = map.project(p.coord)
    if (p.kind === 'investment') inv.push({ id: p.id, x: s.x, y: s.y })
    else fixed.push({ x: s.x, y: s.y })
  }
  const out: Shift = {}
  const free = (x: number, y: number) => fixed.every((f) => Math.abs(f.x - x) >= CLEAR_X || Math.abs(f.y - y) >= CLEAR_Y)
  for (const p of inv) {
    let d: [number, number] = [0, 0]
    if (!free(p.x, p.y)) d = NUDGES.find(([dx, dy]) => free(p.x + dx, p.y + dy)) ?? NUDGES[0]
    out[p.id] = d
    fixed.push({ x: p.x + d[0], y: p.y + d[1] })
  }
  return out
}

/**
 * HTML pins standing on the 3D map: a disc with the category icon on a short stem, dropping in
 * one after another; investments are diamonds with their year. Markers are diffed by id, so a pin
 * added later (timeline scrub, route ends) drops in alone and the others stay put.
 * MapLibre owns the marker elements; React renders into them via portals.
 */
export function PlacePins({ map, pins, accent, deep, activeId, stagger = 80, onPick }: PlacePinsProps) {
  const [hosts, setHosts] = useState<Record<string, HTMLDivElement>>({})
  const [shift, setShift] = useState<Shift>({})
  const markers = useRef(new Map<string, Marker>())
  /** Entry delay per pin, fixed when the pin first appears. */
  const delays = useRef(new Map<string, number>())
  const pinsRef = useRef(pins)
  const key = pins.map((p) => `${p.id}@${p.coord.join(',')}`).join('|')

  useEffect(() => {
    pinsRef.current = pins
    const ms = markers.current
    const want = new Set(pins.map((p) => p.id))
    for (const [id, m] of ms)
      if (!want.has(id)) {
        m.remove()
        ms.delete(id)
        delays.current.delete(id)
      }
    const firstBatch = ms.size === 0
    let fresh = 0
    for (const p of pins) {
      const m = ms.get(p.id)
      if (m) {
        m.setLngLat(p.coord)
        continue
      }
      const el = document.createElement('div')
      el.className = `cin-pin-host is-${p.kind ?? 'place'}`
      ms.set(p.id, new Marker({ element: el, anchor: 'bottom', pitchAlignment: 'viewport', rotationAlignment: 'viewport' }).setLngLat(p.coord).addTo(map))
      delays.current.set(p.id, firstBatch ? fresh * stagger : fresh * 90)
      fresh++
    }
    const next: Record<string, HTMLDivElement> = {}
    for (const [id, m] of ms) next[id] = m.getElement() as HTMLDivElement
    // marker hosts exist only after MapLibre creates them — syncing with an external system
    // eslint-disable-next-line react/set-state-in-effect
    setHosts(next)
    setShift(computeShifts(map, pins))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key])

  // keep investment pins clear of the others whenever the camera settles (zoom changes the spacing)
  useEffect(() => {
    const onEnd = () => setShift(computeShifts(map, pinsRef.current))
    map.on('moveend', onEnd)
    return () => {
      map.off('moveend', onEnd)
    }
  }, [map])

  useEffect(() => {
    const ms = markers.current
    return () => {
      for (const m of ms.values()) m.remove()
      ms.clear()
    }
  }, [map])

  return (
    <>
      {pins.map((p) => {
        const host = hosts[p.id]
        if (!host) return null
        const kind = p.kind ?? 'place'
        const Icon = p.category ? CATEGORY_ICONS[p.category] : null
        let glyph: ReactNode = Icon ? <Icon size={kind === 'investment' ? 13 : 16} strokeWidth={2.2} aria-hidden /> : null
        if (kind === 'start') glyph = <span className="cin-pin__you">Ty</span>
        if (!glyph) glyph = <Navigation size={15} strokeWidth={2.2} aria-hidden />
        const [dx, dy] = shift[p.id] ?? [0, 0]
        return createPortal(
          <div className="cin-pin-shift" style={{ transform: `translate(${dx}px, ${dy}px)` }}>
            <button
              type="button"
              className={`cin-pin is-${kind}${activeId === p.id ? ' is-active' : ''}${dx || dy ? ' is-nudged' : ''}`}
              style={{ '--pin': accent, '--pin-deep': deep, '--d': `${delays.current.get(p.id) ?? 0}ms` } as CSSProperties}
              onClick={() => onPick?.(p)}
              aria-label={p.label}
            >
              {kind === 'investment' ? (
                <>
                  <span className="cin-pin__year tabular">{p.year}</span>
                  <span className="cin-pin__diamond">
                    <span className="cin-pin__diamond-glyph">{glyph}</span>
                  </span>
                </>
              ) : (
                <span className="cin-pin__head">{glyph}</span>
              )}
              <span className="cin-pin__stem" aria-hidden />
              <span className="cin-pin__foot" aria-hidden />
              <span className="cin-pin__label">{p.label}</span>
            </button>
          </div>,
          host,
          p.id,
        )
      })}
    </>
  )
}
