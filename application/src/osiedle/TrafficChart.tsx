import { Lightbulb } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useElementWidth, useSeenOnce } from './shared'
import { SectionHead } from './ui'
import { TRAFFIC_LEVEL_LABEL, formatClock, monotonePath, trafficAt, trafficHint, trafficLevel, trafficTooltip } from './traffic'

interface TrafficChartProps {
  traffic: number[]
  road: string
}

const H = 172
const M = { top: 30, right: 6, bottom: 24, left: 26 }
const TICKS = [0, 6, 12, 18, 24]
/** Status thresholds (spec §4.5 pkt 7). */
const T_LOW = 35
const T_HIGH = 65

function useNowHour(): number {
  const read = () => {
    const d = new Date()
    return d.getHours() + d.getMinutes() / 60
  }
  const [h, setH] = useState(read)
  useEffect(() => {
    const t = window.setInterval(() => setH(read()), 60_000)
    return () => window.clearInterval(t)
  }, [])
  return h
}

/**
 * "Korki w ciągu doby": one smooth area series (typical weekday, index 0–100). The line and its
 * 10 % wash take the status colour of the band they're in (płynnie / umiarkowanie / duże korki),
 * with the thresholds drawn as hairlines and named in the legend, so colour is never the only cue.
 * Hover / focus + arrows give a per-hour readout; a visually hidden table carries every value.
 */
export function TrafficChart({ traffic, road }: TrafficChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>()
  const [seenRef, seen] = useSeenOnce<HTMLElement>(0.35)
  const [hover, setHover] = useState<number | null>(null)
  const now = useNowHour()
  const hint = useMemo(() => trafficHint(traffic), [traffic])

  const iw = Math.max(0, width - M.left - M.right)
  const ih = H - M.top - M.bottom
  const band = iw / 24 // px per hour
  const x = (h: number) => M.left + h * band
  const y = (v: number) => M.top + ih * (1 - v / 100)

  let line = ''
  let area = ''
  if (iw) {
    // One point per full hour; 24:00 repeats midnight (the day wraps around).
    const pts: [number, number][] = [...traffic.map((v, h) => [x(h), y(v)] as [number, number]), [x(24), y(traffic[0])]]
    line = monotonePath(pts)
    area = `${line}L${x(24).toFixed(2)},${y(0).toFixed(2)}L${x(0).toFixed(2)},${y(0).toFixed(2)}Z`
  }

  const nowHour = Math.floor(now) % 24
  const focusHour = hover
  const readout = focusHour != null ? trafficTooltip(focusHour, traffic[focusHour]) : null

  const pickHour = (clientX: number, el: Element) => {
    const r = el.getBoundingClientRect()
    const h = Math.round((clientX - r.left - M.left) / band)
    return ((h % 24) + 24) % 24
  }

  // Gradient offsets: 0 at y(100), 1 at y(0).
  const oHigh = 1 - T_HIGH / 100
  const oLow = 1 - T_LOW / 100
  const stops = (opacity: number) => (
    <>
      <stop offset={0} stopColor="var(--color-bad, #D9534F)" stopOpacity={opacity} />
      <stop offset={oHigh - 0.015} stopColor="var(--color-bad, #D9534F)" stopOpacity={opacity} />
      <stop offset={oHigh + 0.015} stopColor="var(--color-warn, #E3A33B)" stopOpacity={opacity} />
      <stop offset={oLow - 0.015} stopColor="var(--color-warn, #E3A33B)" stopOpacity={opacity} />
      <stop offset={oLow + 0.015} stopColor="var(--color-ok, #2E9E6A)" stopOpacity={opacity} />
      <stop offset={1} stopColor="var(--color-ok, #2E9E6A)" stopOpacity={opacity} />
    </>
  )

  const tipX = focusHour != null ? Math.max(70, Math.min(width - 70, x(focusHour))) : 0

  return (
    <section ref={seenRef} className="op-sec" aria-labelledby="op-traffic-title" data-section="Korki w ciągu doby">
      <SectionHead id="op-traffic-title" title="Korki w ciągu doby" />
      <p className="op-sec__lede">{road}, typowy dzień roboczy</p>

      <div
        ref={wrapRef}
        className={`op-traffic${seen ? ' is-seen' : ''}`}
        tabIndex={0}
        role="group"
        aria-label="Wykres korków w ciągu doby. Strzałki w lewo i w prawo zmieniają godzinę."
        onPointerMove={(e) => setHover(pickHour(e.clientX, e.currentTarget))}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover((h) => h ?? nowHour)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault()
            setHover((h) => ((h ?? nowHour) + (e.key === 'ArrowRight' ? 1 : 23)) % 24)
          } else if (e.key === 'Home') setHover(0)
          else if (e.key === 'End') setHover(23)
        }}
      >
        {width > 0 && (
          <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} aria-hidden>
            <defs>
              <linearGradient id="op-traffic-stroke" gradientUnits="userSpaceOnUse" x1="0" y1={y(100)} x2="0" y2={y(0)}>
                {stops(1)}
              </linearGradient>
              <linearGradient id="op-traffic-fill" gradientUnits="userSpaceOnUse" x1="0" y1={y(100)} x2="0" y2={y(0)}>
                {stops(0.14)}
              </linearGradient>
            </defs>

            {/* Threshold hairlines + baseline */}
            {[T_HIGH, T_LOW].map((t) => (
              <g key={t}>
                <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} className="op-traffic__grid" />
                <text x={M.left - 6} y={y(t)} dy="3.5" textAnchor="end" className="op-traffic__tick">
                  {t}
                </text>
              </g>
            ))}
            <line x1={M.left} x2={width - M.right} y1={y(0)} y2={y(0)} className="op-traffic__base" />
            {TICKS.map((h) => (
              <text key={h} x={x(h)} y={H - 6} textAnchor={h === 0 ? 'start' : h === 24 ? 'end' : 'middle'} className="op-traffic__tick">
                {h}:00
              </text>
            ))}

            <g className="op-traffic__plot">
              <path d={area} fill="url(#op-traffic-fill)" />
              <path d={line} fill="none" stroke="url(#op-traffic-stroke)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </g>

            {/* Best morning departure */}
            {hint.bestHour != null && (
              <g className="op-traffic__best" transform={`translate(${x(hint.bestHour)} ${y(trafficAt(traffic, hint.bestHour))})`}>
                <circle r={5} />
                <text y={-12} textAnchor="middle">
                  wyjedź {formatClock(hint.bestHour)}
                </text>
              </g>
            )}

            {/* Current hour */}
            <g className={`op-traffic__now${focusHour != null && Math.abs(focusHour - now) < 3 ? ' is-muted' : ''}`} transform={`translate(${x(now)} 0)`}>
              <line y1={M.top - 4} y2={y(0)} />
              <rect x={-17} y={M.top - 22} width={34} height={17} rx={8.5} />
              <text y={M.top - 10} textAnchor="middle">
                teraz
              </text>
            </g>

            {/* Crosshair */}
            {focusHour != null && (
              <g className="op-traffic__cross" transform={`translate(${x(focusHour)} 0)`}>
                <line y1={M.top} y2={y(0)} />
                <circle cy={y(traffic[focusHour])} r={4.5} stroke="var(--color-surface, #fff)" strokeWidth={2} fill={`var(--color-${trafficLevel(traffic[focusHour])})`} />
              </g>
            )}
          </svg>
        )}
        {focusHour != null && (
          <div className="op-traffic__tip" style={{ transform: `translateX(${tipX}px) translateX(-50%)` }}>
            <strong>{focusHour}:00</strong>
            <span>
              {TRAFFIC_LEVEL_LABEL[trafficLevel(traffic[focusHour])]} ({traffic[focusHour]})
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {readout}
        </span>
      </div>

      <ul className="op-legend" aria-label="Legenda">
        <li>
          <i className="is-ok" aria-hidden />
          płynnie <span>poniżej {T_LOW}</span>
        </li>
        <li>
          <i className="is-warn" aria-hidden />
          umiarkowanie <span>
            {T_LOW}–{T_HIGH}
          </span>
        </li>
        <li>
          <i className="is-bad" aria-hidden />
          duże korki <span>powyżej {T_HIGH}</span>
        </li>
      </ul>

      <div className="op-hint">
        <Lightbulb size={18} strokeWidth={2} aria-hidden />
        <div>
          <p>{hint.morning}</p>
          {hint.afternoon && <p>{hint.afternoon}</p>}
        </div>
      </div>

      <table className="sr-only">
        <caption>Natężenie ruchu w ciągu doby (indeks 0–100)</caption>
        <thead>
          <tr>
            <th scope="col">Godzina</th>
            <th scope="col">Indeks</th>
            <th scope="col">Ocena</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((v, h) => (
            <tr key={h}>
              <th scope="row">{h}:00</th>
              <td>{v}</td>
              <td>{TRAFFIC_LEVEL_LABEL[trafficLevel(v)]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
