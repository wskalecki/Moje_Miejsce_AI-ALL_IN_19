import { Pause, Play } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { TrafficDoc } from '../lib/osm3d/traffic'
import { useTrafficHour } from './store'
import { TRAFFIC_CAPTION, TRAFFIC_LEGEND } from './trafficStyle'

/** One hour of the day per this many ms while playing. */
const HOUR_MS = 900

interface TrafficControlProps {
  doc: TrafficDoc
  /** Fractional hour while playing (smooth colours), integer otherwise. */
  onHour: (hour: number) => void
  enabled: boolean
  onEnabled: (on: boolean) => void
  /** Inside the advanced panel (no absolute positioning). */
  nested?: boolean
}

/** Same clock format as the panel's traffic chart ("8:00"). */
const fmtHour = (h: number) => `${h}:00`
const fmtSpeed = (v: number) => v.toFixed(0)

/**
 * Hour slider (0–23, default = now) with a play button that runs through the day; drives the road
 * colours and the shared `useTrafficHour()` store (the panel's traffic chart can follow it).
 */
export function TrafficControl({ doc, onHour, enabled, nested = false }: TrafficControlProps) {
  const [hour, setHour] = useTrafficHour()
  const [playing, setPlaying] = useState(false)
  const sliderId = useId()
  const onHourRef = useRef(onHour)
  useEffect(() => {
    onHourRef.current = onHour
  })

  // static hour → map (again when the colours are switched back on)
  useEffect(() => {
    if (!playing && enabled) onHourRef.current(hour)
  }, [hour, playing, enabled])

  // play: smooth fractional hours on the map, the store (and slider) tick every full hour
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let h = hour
    let lastPaint = 0
    const step = (now: number) => {
      h = (h + (now - last) / HOUR_MS) % 24
      last = now
      if (now - lastPaint > 80) {
        lastPaint = now
        onHourRef.current(h)
      }
      setHour(Math.floor(h))
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // the loop owns the hour while it runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const speed = doc.area.speedKmh[hour]
  const median = doc.area.median[hour]
  const slower = median == null ? null : Math.round(median * 100)

  return (
    <section
      className={`${nested ? '' : 'm3d-card '}m3d-traffic${enabled ? '' : ' is-off'}${nested ? ' m3d-traffic--nested' : ''}`}
      aria-label="Korki na drogach"
    >
      <div className="m3d-traffic__row">
        <button
          type="button"
          className="m3d-traffic__play"
          aria-label={playing ? 'Zatrzymaj animację doby' : 'Odtwórz dobę'}
          aria-pressed={playing}
          disabled={!enabled}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause size={16} strokeWidth={2.4} aria-hidden /> : <Play size={16} strokeWidth={2.4} aria-hidden />}
        </button>
        <div className="m3d-traffic__time">
          <label htmlFor={sliderId} className="m3d-traffic__label">
            Korki o godzinie
          </label>
          <output className="m3d-traffic__hour" htmlFor={sliderId} aria-live="off">
            {fmtHour(hour)}
          </output>
        </div>
        <div className="m3d-traffic__slider">
          <input
            id={sliderId}
            type="range"
            min={0}
            max={23}
            step={1}
            value={hour}
            disabled={!enabled}
            aria-valuetext={fmtHour(hour)}
            onChange={(e) => {
              setPlaying(false)
              setHour(Number(e.target.value))
            }}
          />
          <div className="m3d-traffic__ticks" aria-hidden>
            {[0, 6, 12, 18, 23].map((t) => (
              <span key={t} style={{ left: `${(t / 23) * 100}%` }}>
                {fmtHour(t)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="m3d-traffic__legend">
        <div className="m3d-traffic__ramp">
          <span className="m3d-traffic__bar" style={{ background: TRAFFIC_LEGEND.ramp }} aria-hidden />
          <span className="m3d-traffic__ramp-labels">
            <span>{TRAFFIC_LEGEND.labels[0]}</span>
            <span>{TRAFFIC_LEGEND.labels[1]}</span>
            <span>{TRAFFIC_LEGEND.labels[2]} (40% wolniej)</span>
          </span>
        </div>
        <span className="m3d-traffic__nodata">
          <i style={{ background: TRAFFIC_LEGEND.noData.color }} aria-hidden />
          {TRAFFIC_LEGEND.noData.label}
        </span>
        {speed != null && (
          <span className="m3d-traffic__stat">
            Autobusy i tramwaje: <strong>{fmtSpeed(speed)} km/h</strong>
            {slower != null && slower > 0 ? <>, o {slower}% wolniej niż w najszybszej godzinie</> : null}
          </span>
        )}
      </div>

      <p className="m3d-traffic__caption-short">Rozkład ZTM (GTFS), nie ruch na żywo · © OpenStreetMap</p>
      <p className="m3d-traffic__caption">
        {TRAFFIC_CAPTION}. <span>Drogi i budynki © OpenStreetMap (ODbL)</span>
      </p>
    </section>
  )
}
