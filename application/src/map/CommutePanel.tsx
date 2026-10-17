import type { Map as MlMap } from 'maplibre-gl'
import { useEffect, useState, type FormEvent, type MutableRefObject } from 'react'
import { commuteInfo, commuteMinutes, type CommuteInfo, type CommuteMode } from './commuteClient'
import { geocodeAddress, type Place } from './commuteGeocode'
import { hideCommute, reachableShare, showCommute } from './commuteLayer'
import './commute.css'

const LIMITS = [15, 30, 45, 60, 90] as const

type Status = { kind: 'idle' } | { kind: 'busy'; text: string } | { kind: 'error'; text: string } | { kind: 'done' }

interface CommutePanelProps {
  map: MlMap | null
  /** MapView calls this on a map click while the panel waits for a point (null = not picking). */
  pickRef: MutableRefObject<((lngLat: [number, number]) => void) | null>
}

const hhmm = (s: number) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}`
const fmtDay = (d: string) => `${d.slice(6, 8)}.${d.slice(4, 6)}.${d.slice(0, 4)}`

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Rejestr adresów: HTTP ${res.status}`)
  return res.json()
}

/** "Dojazd do…": travel time from every cell to a clicked point or a workplace address. */
export function CommutePanel({ map, pickRef }: CommutePanelProps) {
  const [active, setActive] = useState(false)
  const [mode, setMode] = useState<CommuteMode>('transit')
  const [limit, setLimit] = useState<number>(30)
  const [place, setPlace] = useState<Place | null>(null)
  const [picking, setPicking] = useState(false)
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [info, setInfo] = useState<CommuteInfo | null>(null)
  const [minutes, setMinutes] = useState<Float64Array | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  // load the timetable network only once the filter is switched on
  useEffect(() => {
    if (!active || info) return
    let stale = false
    setStatus({ kind: 'busy', text: 'Wczytuję rozkład ZTM…' })
    commuteInfo()
      .then((i) => !stale && (setInfo(i), setStatus({ kind: 'idle' })))
      .catch((e: Error) => !stale && setStatus({ kind: 'error', text: e.message }))
    return () => {
      stale = true
    }
  }, [active, info])

  // compute when the point or the mode changes (results are cached in commuteClient)
  useEffect(() => {
    if (!active || !info || !place) return
    let stale = false
    setStatus({ kind: 'busy', text: mode === 'transit' ? 'Liczę dojazd komunikacją…' : 'Pytam OSRM o czasy jazdy…' })
    commuteMinutes(mode, [place.lon, place.lat])
      .then((m) => !stale && (setMinutes(m), setStatus({ kind: 'done' })))
      .catch((e: Error) => !stale && (setMinutes(null), setStatus({ kind: 'error', text: e.message })))
    return () => {
      stale = true
    }
  }, [active, info, place, mode])

  // draw / hide the heatmap
  useEffect(() => {
    if (!map) return
    if (active && info && place && minutes) showCommute(map, info.cells, minutes, limit, [place.lon, place.lat])
    else hideCommute(map)
  }, [map, active, info, place, minutes, limit])

  // map click → point, while picking
  useEffect(() => {
    if (!picking || !active || !map) {
      pickRef.current = null
      return
    }
    const canvas = map.getCanvas()
    canvas.style.cursor = 'crosshair'
    pickRef.current = ([lon, lat]) => {
      setPlace({ lon, lat, label: `punkt ${lat.toFixed(4)}, ${lon.toFixed(4)}` })
      setPicking(false)
    }
    return () => {
      pickRef.current = null
      canvas.style.cursor = ''
    }
  }, [picking, active, map, pickRef])

  useEffect(() => () => void (map && hideCommute(map)), [map])

  const search = async (e: FormEvent) => {
    e.preventDefault()
    setStatus({ kind: 'busy', text: 'Szukam adresu w rejestrze miasta…' })
    try {
      setPlace(await geocodeAddress(street, number, fetchJson))
      setPicking(false)
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : String(err) })
    }
  }

  const share = minutes ? Math.round(100 * reachableShare(minutes, limit)) : null

  return (
    <section className="smap-commute" aria-labelledby="smap-commute-title">
      <header className="smap-commute__head">
        <h2 id="smap-commute-title">Dojazd do pracy</h2>
        <button
          type="button"
          role="switch"
          aria-checked={active}
          className={`smap-commute__switch${active ? ' is-on' : ''}`}
          onClick={() => (setActive((a) => !a), setPicking(false))}
        >
          <span className="sr-only">Pokaż czas dojazdu</span>
        </button>
      </header>
      {!active && <p className="smap-commute__copy">Zobacz, skąd dojedziesz do pracy albo dowolnego miejsca w wybranym czasie.</p>}

      {active && (
        <>
          <div className="smap-commute__seg" role="radiogroup" aria-label="Środek transportu">
            {(['transit', 'car'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : undefined} onClick={() => setMode(m)}>
                {m === 'transit' ? 'Komunikacja' : 'Samochód'}
              </button>
            ))}
          </div>

          <form className="smap-commute__addr" onSubmit={search}>
            <input aria-label="Ulica" placeholder="Ulica, np. Marszałkowska" value={street} onChange={(e) => setStreet(e.target.value)} />
            <input aria-label="Numer" placeholder="Nr" value={number} onChange={(e) => setNumber(e.target.value)} className="smap-commute__no" />
            <button type="submit">Szukaj</button>
          </form>
          <button type="button" className={`smap-commute__pick${picking ? ' is-on' : ''}`} onClick={() => setPicking((p) => !p)}>
            {picking ? 'Kliknij miejsce na mapie…' : 'Wskaż miejsce na mapie'}
          </button>

          <div className="smap-commute__limits" role="radiogroup" aria-label="Maksymalny czas dojazdu">
            {LIMITS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={limit === l} className={limit === l ? 'is-on' : undefined} onClick={() => setLimit(l)}>
                {l} min
              </button>
            ))}
          </div>

          <p className="smap-commute__status" role="status">
            {status.kind === 'busy' && status.text}
            {status.kind === 'error' && <span className="is-error">{status.text}</span>}
            {status.kind !== 'busy' && status.kind !== 'error' && !place && 'Wpisz adres pracy albo wskaż miejsce na mapie.'}
            {status.kind === 'done' && place && share !== null && (
              <>
                Do <strong>{place.label}</strong> w {limit} min: <strong>{share}%</strong> komórek miasta.
              </>
            )}
          </p>

          {place && minutes && (
            <div className="smap-commute__legend" aria-hidden>
              <span className="smap-commute__ramp" />
              <span>0</span>
              <span>{limit} min</span>
            </div>
          )}

          <p className="smap-commute__source">
            {mode === 'transit'
              ? info
                ? `Rozkład ZTM (GTFS ${info.feedVersion ?? ''}), dzień roboczy ${fmtDay(info.day)}, przyjazd ${hhmm(info.deadlines[0])}–${hhmm(info.deadlines.at(-1)!)}: średnia z ${info.deadlines.length} terminów, z dojściem pieszo, bez czekania na pierwszy pojazd.`
                : 'Rozkład ZTM (GTFS), przyjazd 7:30–9:00 w dzień roboczy.'
              : 'OSRM, sieć dróg OpenStreetMap: czas jazdy bez korków, liczony dla bloków 1 × 1 km.'}
          </p>
          {place && (
            <button type="button" className="smap-commute__clear" onClick={() => (setPlace(null), setMinutes(null), setStatus({ kind: 'idle' }))}>
              Wyczyść
            </button>
          )}
        </>
      )}
    </section>
  )
}
