/**
 * Cinematic transition into a featured osiedle and back (spec 4.4 / 4.5 "Powrót").
 *
 * Timeline of the full shot (first visit, t = click):
 *   0      lock the map, UI chrome fades, the city goes to night, other overlays fade out
 *   0      flyTo → pitch 60 over the osiedle (3.6 s, ease-in-out cubic)
 *   ~      3D buildings rise with the camera (zoom-driven height, GPU-only) and fade in
 *   900    the osiedle outline draws itself, then a glint keeps running along it
 *   2400   letterbox bars slide in
 *   3000   title card: kicker, staggered letters, rule, tagline
 *   3600   slow orbit starts; the flyover clip crossfades in (photos if it cannot play)
 *   ~      under the clip the map turns to daylight 3D
 *   ~9.5 s clip hands back to the live orbiting map, bars retract, panel slides in, pins drop
 *
 * Skip (button, Esc, Space, Enter, click) jumps to the panel. Second visit / `?szybko=1`: fly-in
 * without the interlude. Deep link and `prefers-reduced-motion`: jump straight to the end state.
 */
import { AnimatePresence } from 'motion/react'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { back } from '../app/router'
import type { CategoryKey, Horizon, ProfileId } from '../app/types'
import { ACCENTS } from '../design/tokens'
import type { MapApi } from '../map/MapView'
import { homeCamera, homePadding } from '../map/camera'
import { OSIEDLA, OSIEDLA_BY_SLUG, type LngLat, type Osiedle, type OsiedleSlug, type Route } from '../mock/osiedla'
import { Interlude } from './Interlude'
import { loadPanel } from './panelLoader'
import { PlacePins, type Pin } from './PlacePins'
import { CinemaScene, easeInOutCubic, type SceneTarget } from './scene'
import './cinematic.css'

const Panel = lazy(loadPanel)

type Stage = 'idle' | 'flying' | 'interlude' | 'panel' | 'leaving'
type Mode = 'full' | 'quick' | 'instant'

const PITCH = 60
const ORBIT_DEG_S = 1.5
const FLY_MS = 3600
const QUICK_FLY_MS = 2600
const BACK_MS = 1800
const ZERO = { top: 0, bottom: 0, left: 0, right: 0 }

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function panelWidth() {
  const w = window.innerWidth
  return w >= 1600 ? 560 : w >= 1280 ? 520 : 440
}
function panelPadding() {
  return { top: 40, bottom: 40, left: 40, right: panelWidth() + 16 + 24 }
}

function buildTargets(shapes: FeatureCollection<Polygon | MultiPolygon>): SceneTarget[] {
  return OSIEDLA.flatMap((o) => {
    const shape =
      shapes.features.find((f) => f.properties?.featured_slug === o.slug) ??
      shapes.features.find((f) => f.properties?.id === o.msiId)
    if (!shape) return []
    return [{ slug: o.slug, owner: o.profile, center: o.center, bearing: o.cameraBearing, zoom: o.cameraZoom ?? 16, shape }]
  })
}

export interface CinematicLayerProps {
  api: MapApi
  slug: string | null
  profile: ProfileId
  horizon: Horizon
  priorities: readonly CategoryKey[]
  visited: readonly string[]
  /** `?szybko=1`: never play the interlude. */
  quick?: boolean
  markVisited: (slug: string) => void
  /** True while the map is in (or flying out of) the cinematic look — the app hides its chrome. */
  onBusyChange: (busy: boolean) => void
}

/** Owns the map-side scene (layers are added on mount and removed on unmount, StrictMode-safe). */
export function CinematicLayer(props: CinematicLayerProps) {
  const { map, shapes } = props.api
  const [scene, setScene] = useState<CinemaScene | null>(null)
  useEffect(() => {
    const s = new CinemaScene(map, buildTargets(shapes))
    // the scene is an external system (map layers); React only needs a handle to it
    // eslint-disable-next-line react/set-state-in-effect
    setScene(s)
    if (import.meta.env.DEV) (window as unknown as { __cin?: unknown }).__cin = { map, scene: s }
    return () => {
      s.destroy()
      setScene(null)
    }
  }, [map, shapes])
  return scene ? <CinematicStage {...props} scene={scene} /> : null
}

function CinematicStage({
  api,
  scene,
  slug,
  profile,
  horizon,
  priorities,
  visited,
  quick,
  markVisited,
  onBusyChange,
}: CinematicLayerProps & { scene: CinemaScene }) {
  const map = api.map

  const [stage, setStage] = useState<Stage>('idle')
  const [active, setActive] = useState<Osiedle | null>(null)
  const [bars, setBars] = useState(false)
  const [title, setTitle] = useState(false)
  const [playMedia, setPlayMedia] = useState(false)
  const [interludeKey, setInterludeKey] = useState(0)
  /** The interlude stays mounted a little after it closes so bars and media can fade out. */
  const [interludeOn, setInterludeOn] = useState(false)
  const [pinsOn, setPinsOn] = useState(false)
  const [veil, setVeil] = useState(false)
  const [route, setRoute] = useState<Route | null>(null)
  const [activePin, setActivePin] = useState<string | null>(null)
  const [hoverPin, setHoverPin] = useState<string | null>(null)
  const [year, setYear] = useState(2026)

  const timers = useRef<number[]>([])
  const finishRef = useRef<((skipped: boolean) => void) | null>(null)
  const savedCam = useRef<{ center: LngLat; zoom: number } | null>(null)
  const stageRef = useRef<Stage>('idle')
  const hadOverview = useRef(!slug)
  const busyRef = useRef(onBusyChange)
  useEffect(() => {
    busyRef.current = onBusyChange
    stageRef.current = stage
  })

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  const at = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const setStageBoth = (s: Stage) => {
    stageRef.current = s
    setStage(s)
  }

  // ------------------------------------------------------------------ enter
  const enter = useCallback(
    (o: Osiedle, mode: Mode) => {
      const t = scene.target(o.slug)
      if (!t) return
      clearTimers()
      map.stop()
      const reduce = reducedMotion()
      const fromOverview = stageRef.current === 'idle' || stageRef.current === 'leaving'
      if (stageRef.current === 'idle') {
        const c = map.getCenter()
        savedCam.current = { center: [c.lng, c.lat], zoom: map.getZoom() }
      }
      busyRef.current(true)
      api.setInteractive(false)
      scene.lock()
      scene.director.stopOrbit(true)
      setActive(o)
      setInterludeOn(false)
      setRoute(null)
      setActivePin(null)
      setPinsOn(false)
      setYear(2026)
      scene.showRoute(null, o.profile)
      const camera = { center: t.center, zoom: t.zoom, pitch: PITCH, bearing: t.bearing }

      let finished = false
      const finish = (skipped: boolean) => {
        if (finished) return
        finished = true
        clearTimers()
        finishRef.current = null
        setPlayMedia(false)
        setTitle(false)
        setBars(false)
        if (skipped && map.isMoving()) {
          map.stop()
          map.easeTo({ ...camera, padding: ZERO, duration: 900, easing: easeInOutCubic, essential: true })
        }
        if (scene.state.look !== 'day') scene.setLook('day', o.slug, skipped ? 700 : 1400)
        if (skipped) scene.traceOutline(0)
        at(1300, () => setInterludeOn(false))
        at(skipped ? 250 : 500, () => {
          setStageBoth('panel')
          markVisited(o.slug)
          scene.unlockExplore()
          scene.director.tweenPadding(panelPadding(), 1300)
          if (!reduce) scene.director.startOrbit(ORBIT_DEG_S)
        })
        at(skipped ? 650 : 900, () => setPinsOn(true))
      }
      finishRef.current = finish

      if (mode === 'instant' || reduce) {
        setStageBoth('flying')
        setVeil(true)
        map.jumpTo({ ...camera, padding: panelPadding() })
        scene.setLook('day', o.slug, 0)
        scene.traceOutline(0, { glint: !reduce })
        at(60, () => setVeil(false))
        setStageBoth('panel')
        markVisited(o.slug)
        scene.unlockExplore()
        if (!reduce) scene.director.startOrbit(ORBIT_DEG_S)
        at(450, () => setPinsOn(true))
        finishRef.current = null
        return
      }

      setStageBoth('flying')
      const flyMs = mode === 'full' ? FLY_MS : fromOverview ? QUICK_FLY_MS : 2000
      scene.setLook(mode === 'full' ? 'night' : 'day', o.slug, 1200)
      map.flyTo({ ...camera, padding: ZERO, duration: flyMs, curve: 1.42, easing: easeInOutCubic, essential: true })
      at(mode === 'full' ? 900 : 500, () => scene.traceOutline(mode === 'full' ? 1800 : 1200))

      if (mode === 'quick') {
        at(flyMs - 300, () => finish(false))
        return
      }
      at(2400, () => {
        setInterludeKey((k) => k + 1)
        setInterludeOn(true)
        setStageBoth('interlude')
        setBars(true)
      })
      at(3000, () => setTitle(true))
      at(FLY_MS, () => {
        scene.director.startOrbit(ORBIT_DEG_S)
        setPlayMedia(true)
      })
      // safety net: never get stuck in the interlude
      at(14000, () => finish(false))
    },
    [api, map, scene, markVisited],
  )

  // ------------------------------------------------------------------ exit
  const exit = useCallback(() => {
    clearTimers()
    finishRef.current = null
    const reduce = reducedMotion()
    setStageBoth('leaving')
    setInterludeOn(false)
    setBars(false)
    setTitle(false)
    setPlayMedia(false)
    setPinsOn(false)
    setRoute(null)
    setActivePin(null)
    scene.showRoute(null, 'student')
    scene.director.stopAll()
    scene.lock()
    map.stop()
    const el = map.getContainer()
    const home = homeCamera(map, homePadding(true, el.clientWidth))
    const cam = savedCam.current ?? { center: home.center, zoom: home.zoom }
    scene.setLook('overview', null, reduce ? 0 : 1100)
    const dur = reduce ? 0 : BACK_MS
    map.flyTo({ center: cam.center, zoom: cam.zoom, pitch: 0, bearing: 0, padding: ZERO, duration: dur, curve: 1.3, easing: easeInOutCubic, essential: true })
    at(dur + 60, () => {
      scene.restoreInteraction()
      scene.parkBuildings()
      api.setInteractive(true)
      setStageBoth('idle')
      setActive(null)
      busyRef.current(false)
      savedCam.current = null
    })
  }, [api, map, scene])

  // ------------------------------------------------------------------ route ↔ transition
  // Driven by the route. `shownSlug` makes the effect idempotent (StrictMode re-runs effects).
  const shownSlug = useRef<string | null>(null)
  useEffect(() => {
    const o = slug ? OSIEDLA_BY_SLUG[slug as OsiedleSlug] : undefined
    const want = o ? o.slug : null
    if (shownSlug.current === want) {
      hadOverview.current = true
      return
    }
    shownSlug.current = want
    if (o) {
      const deep = !hadOverview.current
      hadOverview.current = true
      const mode: Mode = deep ? 'instant' : quick || visited.includes(o.slug) ? 'quick' : 'full'
      enter(o, mode)
      return
    }
    hadOverview.current = true
    if (stageRef.current !== 'idle') exit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  // ------------------------------------------------------------------ keyboard
  const skip = useCallback(() => finishRef.current?.(true), [])
  // the panel and this layer may both react to the same Esc / click — leave only once
  const goBack = useCallback(() => {
    if (stageRef.current !== 'panel') return
    stageRef.current = 'leaving'
    back('/mapa')
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stageRef.current
      if (s === 'flying' || s === 'interlude') {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          skip()
        }
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [skip])

  // ------------------------------------------------------------------ panel callbacks
  // pins and routes belong to the panel, so they take the accent of the active profile like the panel
  const owner = ACCENTS[profile]

  const focusPlace = useCallback(
    (lngLat: LngLat) => {
      scene.director.nudge()
      const h = active?.highlights.find((x) => Math.abs(x.coord[0] - lngLat[0]) < 1e-6 && Math.abs(x.coord[1] - lngLat[1]) < 1e-6)
      setActivePin(h?.id ?? null)
      map.easeTo({ center: lngLat, zoom: 16.5, pitch: Math.max(map.getPitch(), 50), duration: 900, easing: easeInOutCubic, essential: true })
    },
    [active, map, scene],
  )

  const showRoute = useCallback(
    (r: Route | null) => {
      setRoute(r)
      if (!active) return
      scene.showRoute(r?.geometry ?? null, profile)
      if (!r) {
        scene.director.hold(false)
        return
      }
      scene.director.hold(true)
      setActivePin(null)
      const coords = r.geometry.coordinates
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const [x, y] of coords) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      // padding is on top of the panel padding already set on the camera
      map.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: { top: 80, bottom: 80, left: 80, right: 48 }, pitch: 45, bearing: map.getBearing(), duration: 1000, maxZoom: 16.6, essential: true },
      )
    },
    [active, map, scene, profile],
  )

  const pins = useMemo<Pin[]>(() => {
    if (!active) return []
    const out: Pin[] = active.highlights.map((h) => ({ id: h.id, coord: h.coord, label: h.name, category: h.category, kind: 'place' }))
    if (route) {
      const c = route.geometry.coordinates
      out.push({ id: `route-start`, coord: c[0] as LngLat, label: 'Ty', kind: 'start' })
      out.push({ id: `route-end`, coord: c[c.length - 1] as LngLat, label: route.destinationName, category: route.category, kind: 'end' })
    }
    for (const ev of active.timeline) {
      if (ev.coord && ev.year <= year && year > 2026) out.push({ id: `inv-${ev.id}`, coord: ev.coord, label: `${ev.year} · ${ev.title}`, kind: 'investment' })
    }
    return out
  }, [active, route, year])

  const onPick = useCallback(
    (p: Pin) => {
      if (p.kind === 'place') focusPlace(p.coord)
    },
    [focusPlace],
  )

  const cinema = stage === 'flying' || stage === 'interlude'
  const showPanel = stage === 'panel' && active

  return (
    <div className={`cin-root is-${stage}`}>
      <div className={`cin-vignette${cinema ? ' is-on' : ''}`} aria-hidden />
      <div className={`cin-veil${veil ? ' is-on' : ''}`} aria-hidden />

      {active && pinsOn && (
        <PlacePins map={map} pins={pins} accent={owner.accent} deep={owner.deep} activeId={hoverPin ?? activePin} onPick={onPick} />
      )}

      {active && interludeOn && (
        <Interlude
          key={interludeKey}
          osiedle={active}
          profile={profile}
          open={bars}
          showTitle={title}
          playMedia={playMedia}
          onCovered={() => {
            if (scene.state.look === 'night') scene.setLook('day', active.slug, 1200)
          }}
          onDone={() => finishRef.current?.(false)}
          onSkip={skip}
        />
      )}

      {cinema && stage === 'flying' && (
        <button type="button" className="cin-skip cin-skip--floating" onClick={skip}>
          Pomiń
        </button>
      )}

      <AnimatePresence>
        {showPanel && (
          <Suspense key={active.slug} fallback={null}>
            <Panel
              osiedle={active}
              profile={profile}
              horizon={horizon}
              priorities={[...priorities]}
              layout="overlay"
              onBack={goBack}
              onFocusPlace={focusPlace}
              onHoverPlace={setHoverPin}
              onShowRoute={showRoute}
              activePlaceId={activePin}
              onTimelineYear={setYear}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CinematicLayer
