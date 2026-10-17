import { useMemo } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import type { Route, TravelMode } from '../mock/osiedla'
import { formatKm, formatMin } from '../lib/format'
import { MODE_META, MODE_ORDER, SectionHead, useElementWidth } from './shared'

interface RoutesProps {
  routes: Route[]
  selectedId: string
  mode: TravelMode
  onSelect: (route: Route) => void
  onMode: (mode: TravelMode) => void
}

export function availableModes(route: Route): TravelMode[] {
  return MODE_ORDER.filter((m) => route.minutes[m] != null)
}

/** Default tab for a destination: walking when it's a short walk (≤ 15 min), otherwise the fastest mode. */
export function defaultMode(route: Route): TravelMode {
  const walk = route.minutes.pieszo
  if (walk != null && walk <= 15) return 'pieszo'
  const modes = availableModes(route)
  return modes.reduce((best, m) => ((route.minutes[m] ?? Infinity) < (route.minutes[best] ?? Infinity) ? m : best), modes[0] ?? 'pieszo')
}

const SKETCH_H = 132
const PAD = 22

/** Route drawn without a map: equirectangular projection fitted to the box, start "Ty" → destination. */
function RouteSketch({ route }: { route: Route }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const Icon = CATEGORY_ICONS[route.category]
  const geo = useMemo(() => {
    const coords = route.geometry.coordinates as [number, number][]
    if (!width || coords.length < 2) return null
    const lat0 = (coords[0][1] * Math.PI) / 180
    const k = Math.cos(lat0)
    const xs = coords.map(([lng]) => lng * k)
    const ys = coords.map(([, lat]) => -lat)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const spanX = maxX - minX || 1e-6
    const spanY = maxY - minY || 1e-6
    const s = Math.min((width - PAD * 2 - 60) / spanX, (SKETCH_H - PAD * 2) / spanY)
    const offX = (width - spanX * s) / 2
    const offY = (SKETCH_H - spanY * s) / 2
    const pts = xs.map((x, i) => [offX + (x - minX) * s, offY + (ys[i] - minY) * s] as [number, number])
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
    return { d, start: pts[0], end: pts[pts.length - 1] }
  }, [route.geometry, width])

  return (
    <div ref={ref} className="op-sketch" aria-hidden>
      {geo && (
        <svg width={width} height={SKETCH_H} viewBox={`0 0 ${width} ${SKETCH_H}`}>
          <defs>
            <pattern id="op-sketch-dots" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(22,22,29,0.09)" />
            </pattern>
          </defs>
          <rect width={width} height={SKETCH_H} fill="url(#op-sketch-dots)" />
          <path d={geo.d} className="op-sketch__casing" />
          <path key={route.id} d={geo.d} pathLength={1} className="op-sketch__line" />
          <g transform={`translate(${geo.start[0]} ${geo.start[1]})`}>
            <circle r="9" className="op-sketch__start" />
            <text className="op-sketch__you" textAnchor="middle" dy="3.5">
              Ty
            </text>
          </g>
          <g key={`${route.id}-end`} className="op-sketch__end" transform={`translate(${geo.end[0]} ${geo.end[1]})`}>
            <circle r="13" />
            <Icon x={-7} y={-7} width={14} height={14} strokeWidth={2.2} color="#fff" />
          </g>
        </svg>
      )}
    </div>
  )
}

/** "Najkrótsza droga do…" (spec §4.5 pkt 5). */
export function Routes({ routes, selectedId, mode, onSelect, onMode }: RoutesProps) {
  const route = routes.find((r) => r.id === selectedId) ?? routes[0]
  if (!route) return null
  const modes = availableModes(route)
  const activeMode = modes.includes(mode) ? mode : defaultMode(route)
  const minutes = route.minutes[activeMode]

  return (
    <section className="op-sec" aria-labelledby="op-routes-title" data-section="Najkrótsza droga do…">
      <SectionHead id="op-routes-title" title="Najkrótsza droga do…" />
      <div className="op-pills" role="radiogroup" aria-label="Cel">
        {routes.map((r) => {
          const Icon = CATEGORY_ICONS[r.category]
          const on = r.id === route.id
          return (
            <button key={r.id} type="button" role="radio" aria-checked={on} className={`op-pill${on ? ' is-on' : ''}`} onClick={() => onSelect(r)}>
              <Icon size={15} strokeWidth={2.1} aria-hidden />
              {r.label}
            </button>
          )
        })}
      </div>

      <div className="op-route">
        <RouteSketch route={route} />
        <div className="op-modes" role="tablist" aria-label="Sposób dojazdu">
          {modes.map((m) => {
            const { icon: Icon, label } = MODE_META[m]
            const on = m === activeMode
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={on}
                className={`op-mode${on ? ' is-on' : ''}`}
                onClick={() => onMode(m)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                  e.preventDefault()
                  const i = modes.indexOf(m)
                  const next = modes[(i + (e.key === 'ArrowRight' ? 1 : modes.length - 1)) % modes.length]
                  onMode(next)
                  const parent = e.currentTarget.parentElement
                  requestAnimationFrame(() => (parent?.querySelector('[aria-selected="true"]') as HTMLElement | null)?.focus())
                }}
                tabIndex={on ? 0 : -1}
              >
                <Icon size={16} strokeWidth={2.1} aria-hidden />
                <span className="op-mode__label">{label}</span>
                <span className="op-mode__min">{formatMin(route.minutes[m] ?? 0)}</span>
              </button>
            )
          })}
        </div>
        <p className="op-route__summary" aria-live="polite">
          <strong>{route.destinationName}</strong>
          <span>
            {formatKm(route.distanceM)}
            {minutes != null && ` · ${formatMin(minutes)} ${MODE_META[activeMode].adverb}`}
          </span>
        </p>
      </div>
    </section>
  )
}
