/**
 * Transition into a featured osiedle and back (spec 4.4 / 4.5 "Powrót"). The map keeps its normal
 * daylight style throughout — the osiedle is only softly highlighted.
 *
 * Timeline of the fly-in (first visit, t = click):
 *   0      lock the map, UI chrome fades, heat / fills fade out; the osiedle's highlight (light accent
 *          tint, gentle glow, crisp outline with a slow glint) fades in over 600 ms
 *   0      one continuous camera move straight to the panel framing (all places in the free map area,
 *          pitch 57; 1700 ms, gentle start and a long soft deceleration) — a pure zoom-in when the
 *          osiedle is in view, no pull-back
 *   1100   3D buildings fade in over the last 600 ms while they rise with the zoom (GPU-only)
 *   1600   the panel slides in (320 ms) as the camera settles; slow sway starts; pins drop 400 ms later
 *
 * Second visit / `?szybko=1`: the same move in 1300 ms; from another osiedle an arced flight (1700 ms).
 * Deep link and `prefers-reduced-motion`: jump straight to the end state. Esc / Space / Enter during
 * the flight jump to the panel.
 *
 * Way back: panel and pins leave, highlight and buildings fade (400 ms), labels hide during the climb,
 * the camera zooms out to the saved overview (pitch 0, 1200 ms), heat and labels return late, focus
 * goes back to the osiedle's card.
 */
import { AnimatePresence } from 'motion/react'
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import type { Map as MlMap } from 'maplibre-gl'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { back } from '../app/router'
import { useAppStore } from '../app/useAppStore'
import type { CategoryKey, Horizon, ProfileId } from '../app/types'
import { ACCENTS } from '../design/tokens'
import type { MapApi } from '../map/MapView'
import { homeCamera, homePadding } from '../map/camera'
import { OSIEDLA, OSIEDLA_BY_SLUG, type LngLat, type Osiedle, type OsiedleSlug, type Route, type TimelineEvent } from '../mock/osiedla'
import { allVisible, corePoints, frame, metersBetween, nearInView, LAND_PITCH, type Framing, type Pt } from './framing'
import { loadPanel, type OsiedlePanelProps, type PlaceFit } from './panelLoader'
import { PlacePins, type Pin } from './PlacePins'
import { prefetchTiles } from './prefetch'
import type { AreaLayers } from '../map3d/AreaLayers'
import { categoryKinds } from '../map3d/kinds'
import { CinemaScene, easeFlight, easeInOutCubic, type SceneTarget } from './scene'
import './cinematic.css'

const LazyPanel = lazy(loadPanel)
/**
 * The panel component once its chunk is in (preloaded at the click). Rendered directly, so the
 * mount at the landing never suspends — React holds a suspended reveal back by ~300 ms.
 */
let loadedPanel: ComponentType<OsiedlePanelProps> | null = null
const preloadPanel = () =>
  loadPanel()
    .then((m) => {
      loadedPanel = m.default
    })
    .catch(() => undefined)
const Osm3dOverlay = lazy(() => import('../map3d/Osm3dOverlay'))

type Stage = 'idle' | 'flying' | 'panel' | 'leaving'
type Mode = 'full' | 'quick' | 'instant'

const ORBIT_DEG_S = 1.5
/** First visit: camera flight to the panel framing. */
const FLY_MS = 1700
/** Second visit / `?szybko=1`. */
const QUICK_FLY_MS = 1300
/** From one osiedle straight to another (an arc over the city). */
const HOP_MS = 1700
/** Fade-in of the osiedle highlight, from the click. */
const HIGHLIGHT_MS = 600
/** The 3D buildings fade in over the last `BUILDINGS_MS` of the flight. */
const BUILDINGS_MS = 600
/** The panel starts sliding in this long before the camera lands. */
const PANEL_LEAD_MS = 100
const BACK_MS = 1200
/** Deep link: max wait for the tiles under the panel framing before lifting the veil anyway. */
const TILE_WAIT_MS = 2400
const ZERO = { top: 0, bottom: 0, left: 0, right: 0 }
/** Under the panel the camera sways ±SWAY° (instead of a full orbit) so the framed places stay in view. */
const SWAY = 16
/** Bearings (relative) the panel framing must hold for. */
const ORBIT_SWEEP = [-SWAY, -SWAY / 2, 0, SWAY / 2, SWAY]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True when the page was loaded straight on `/mapa/:slug` (deep link / reload). */
function openedOnSlug(): boolean {
  const nav = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined
  try {
    return /^\/mapa\/[^/]+/.test(new URL(nav?.name ?? window.location.href).pathname)
  } catch {
    return true
  }
}

function findShape(shapes: FeatureCollection<Polygon | MultiPolygon>, o: Osiedle) {
  return (
    shapes.features.find((f) => f.properties?.featured_slug === o.slug) ?? shapes.features.find((f) => f.properties?.id === o.msiId)
  )
}

/** What the panel framing has to show: every place, the centre and the core of the outline. */
function subjectPoints(o: Osiedle, t: SceneTarget): Pt[] {
  const places = o.highlights.map((h) => h.coord as Pt)
  // the outline only as far out as the places reach (the MSI areas are larger than the osiedla)
  const reach = Math.max(0, ...places.map((p) => metersBetween(p, o.center)))
  return [o.center, ...places, ...corePoints(t.shape, o.center, Math.min(1200, Math.max(500, reach * 0.8)))]
}

function landing(map: MlMap, o: Osiedle, t: SceneTarget, bearing: number, extra: Pt[] = []): Framing {
  return frame(map, [...subjectPoints(o, t), ...extra], { pitch: LAND_PITCH, bearing, sweep: ORBIT_SWEEP })
}

function buildTargets(map: MlMap, shapes: FeatureCollection<Polygon | MultiPolygon>): SceneTarget[] {
  return OSIEDLA.flatMap((o) => {
    const shape = findShape(shapes, o)
    if (!shape) return []
    const t: SceneTarget = {
      slug: o.slug,
      msiId: o.msiId,
      owner: o.profile,
      center: o.center,
      bearing: o.cameraBearing,
      zoom: o.cameraZoom ?? 16,
      shape,
    }
    // buildings reach full height by the panel framing zoom (the camera's destination)
    t.riseZoom = landing(map, o, t, o.cameraBearing).zoom - 0.1
    return [t]
  })
}

/** After the way back: focus the osiedle's card (or its map marker) instead of the map canvas. */
function focusCard(slug: string) {
  const vis = (el: HTMLElement | null) => el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
  const card = document.querySelector<HTMLElement>(`.smap-rec__card[data-slug="${slug}"]`)
  const pill = document.querySelector<HTMLElement>(`.smap-fm__pill[data-slug="${slug}"]`)
  const el = vis(card) ? card : vis(pill) ? pill : null
  el?.focus({ preventScroll: true })
}

export interface CinematicLayerProps {
  api: MapApi
  slug: string | null
  profile: ProfileId
  horizon: Horizon
  /** Categories that count in the score (filter panel "Liczy się dla mnie"), in panel order. */
  priorities: readonly CategoryKey[]
  /** Rank and match of the featured osiedla as the map pills show them (null until the map ranked). */
  ranks?: { bySlug: Readonly<Record<string, { rank: number; match: number }>>; total: number } | null
  visited: readonly string[]
  /** `?szybko=1`: always the daylight fly-in. */
  quick?: boolean
  markVisited: (slug: string) => void
  /** True while the map is in (or flying out of) the cinematic look — the app hides its chrome. */
  onBusyChange: (busy: boolean) => void
  /** True while the panel is up or the camera flies back from it (the app keeps its header pill). */
  onPanelChange?: (open: boolean) => void
}

/** Owns the map-side scene (layers are added on mount and removed on unmount, StrictMode-safe). */
export function CinematicLayer(props: CinematicLayerProps) {
  const { map, shapes } = props.api
  const [scene, setScene] = useState<CinemaScene | null>(null)
  useEffect(() => {
    const s = new CinemaScene(map, buildTargets(map, shapes), { osm3d: true })
    // the scene is an external system (map layers); React only needs a handle to it
    // eslint-disable-next-line react/set-state-in-effect
    setScene(s)
    if (import.meta.env.DEV) (window as unknown as { __cin?: unknown }).__cin = { map, scene: s }
    return () => {
      s.destroy()
      setScene(null)
    }
  }, [map, shapes])
  // the highlight takes the accent of the active profile, like the map chrome and the panel
  useEffect(() => {
    scene?.setOwner?.(props.profile)
  }, [scene, props.profile])
  return scene ? <CinematicStage {...props} scene={scene} /> : null
}

function CinematicStage({
  api,
  scene,
  slug,
  profile,
  horizon,
  priorities,
  ranks,
  visited,
  quick,
  markVisited,
  onBusyChange,
  onPanelChange,
}: CinematicLayerProps & { scene: CinemaScene }) {
  const map = api.map
  const store = useAppStore()
  const timelineYear = store.state.timelineYear

  const [stage, setStage] = useState<Stage>('idle')
  const [active, setActive] = useState<Osiedle | null>(null)
  const [pinsOn, setPinsOn] = useState(false)
  const [veil, setVeil] = useState(false)
  const [route, setRoute] = useState<Route | null>(null)
  const [activePin, setActivePin] = useState<string | null>(null)
  const [hoverPin, setHoverPin] = useState<string | null>(null)
  /** Timeline events of year ≤ Y reported by the panel (spec 4.6). */
  const [events, setEvents] = useState<TimelineEvent[]>([])
  /** OSM 3D layers of the active osiedle (null while loading or without 3D data). */
  const [area, setArea] = useState<{ slug: string; layers: AreaLayers } | null>(null)

  const timers = useRef<number[]>([])
  /** Jump to the end of the running fly-in (Esc / Space / Enter). */
  const finishRef = useRef<(() => void) | null>(null)
  const savedCam = useRef<{ center: LngLat; zoom: number } | null>(null)
  /** A route is on the map (its fit moved the camera off the osiedle framing). */
  const routeOn = useRef(false)
  const stageRef = useRef<Stage>('idle')
  // a real deep link is the document's first URL — not a click on the overview that beat the lazy
  // cinematic chunk (then `slug` is already set on mount, but the full shot must still play)
  const hadOverview = useRef(!slug || !openedOnSlug())
  const busyRef = useRef(onBusyChange)
  const storeRef = useRef(store)
  useEffect(() => {
    busyRef.current = onBusyChange
    stageRef.current = stage
    storeRef.current = store
  })

  /** Bumped on every `clearTimers`, so listeners of a cancelled step can tell they are stale. */
  const timerGen = useRef(0)
  const clearTimers = () => {
    timerGen.current++
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

  // ------------------------------------------------------------------ tile warm-up
  // The 3 featured osiedla are fetched into the HTTP cache once the overview is idle.
  useEffect(() => prefetchTiles(map, OSIEDLA.map((o) => o.center), () => stageRef.current !== 'idle'), [map])
  // the panel chunk too, so even the first fly-in (and a reduced-motion jump) mounts it without a wait
  useEffect(() => {
    const t = window.setTimeout(() => void preloadPanel(), 2500)
    return () => window.clearTimeout(t)
  }, [])

  /** Deep link: lift the veil once the tiles under the camera are in (or after `TILE_WAIT_MS`). */
  const whenTilesReady = useCallback(
    (fn: () => void) => {
      if (map.areTilesLoaded()) return fn()
      const gen = timerGen.current
      let done = false
      const go = () => {
        if (done) return
        done = true
        window.clearTimeout(timer)
        map.off('idle', go)
        map.off('render', check)
        // a skip / exit cleared the timers meanwhile: that path owns the reveal now
        if (gen !== timerGen.current) return
        fn()
      }
      // the outline glint repaints every frame, so the map never goes 'idle' — poll on render too
      const check = () => {
        if (map.areTilesLoaded()) go()
      }
      const timer = window.setTimeout(go, TILE_WAIT_MS)
      timers.current.push(timer)
      map.on('idle', go)
      map.on('render', check)
    },
    [map],
  )

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
      // the panel mounts the moment the camera lands: have its chunk parsed by then
      void preloadPanel()
      busyRef.current(true)
      api.setInteractive(false)
      scene.lock()
      scene.director.stopOrbit(true)
      setActive(o)
      setRoute(null)
      routeOn.current = false
      setActivePin(null)
      setPinsOn(false)
      setEvents([])
      storeRef.current.setYear(2026)
      scene.showRoute(null, profile)
      // own OSM buildings, roads and traffic for the osiedle (basemap extrusion stays when it has none)
      // (guarded: a scene instance from before a hot reload may lack the method)
      const load = typeof scene.ensureArea === 'function' ? scene.ensureArea(o.slug) : Promise.resolve(null)
      void load.then((layers) => setArea(layers ? { slug: o.slug, layers } : null)).catch(() => setArea(null))

      const openPanel = (delay: number) => {
        at(delay, () => {
          setStageBoth('panel')
          markVisited(o.slug)
          scene.unlockExplore()
          if (!reduce) scene.director.startOrbit(ORBIT_DEG_S, SWAY)
        })
        at(delay + 400, () => setPinsOn(true))
      }

      if (mode === 'instant' || reduce) {
        setStageBoth('flying')
        setVeil(true)
        const land = landing(map, o, t, t.bearing)
        map.jumpTo({ center: land.center, zoom: land.zoom, pitch: land.pitch, bearing: land.bearing, padding: land.padding })
        scene.setLook('day', o.slug, 0)
        scene.startOutline({ glint: !reduce })
        whenTilesReady(() => setVeil(false))
        setStageBoth('panel')
        markVisited(o.slug)
        scene.unlockExplore()
        if (!reduce) scene.director.startOrbit(ORBIT_DEG_S, SWAY)
        at(450, () => setPinsOn(true))
        finishRef.current = null
        return
      }

      setStageBoth('flying')
      const flyMs = !fromOverview ? HOP_MS : mode === 'full' ? FLY_MS : QUICK_FLY_MS
      const land = landing(map, o, t, t.bearing)
      // the highlight fades in at once; the buildings wait for the last stretch, where they rise
      scene.setLook('day', o.slug, HIGHLIGHT_MS, { buildingsDelay: flyMs - BUILDINGS_MS, buildingsMs: BUILDINGS_MS })
      scene.startOutline()
      // from the overview the camera zooms straight in (peak of the flight = where it starts) as long as
      // the osiedle is in view; otherwise (another osiedle, a far-off map) MapLibre's arc over the city
      const c = map.getCenter()
      const el = map.getContainer()
      const direct = fromOverview && nearInView([c.lng, c.lat], land.center, map.getZoom(), el.clientWidth, el.clientHeight)
      map.flyTo({
        center: land.center,
        zoom: land.zoom,
        pitch: land.pitch,
        bearing: land.bearing,
        padding: land.padding,
        duration: flyMs,
        ...(direct ? { minZoom: map.getZoom() } : { curve: 1.42 }),
        easing: easeFlight,
        essential: true,
      })
      // the panel comes in as the camera settles — no waiting on the street tiles: the parent tiles
      // stay drawn and the detail fills in under the panel (a cover here would only add dead time)
      at(flyMs - PANEL_LEAD_MS, () => {
        finishRef.current = null
        openPanel(0)
      })
      finishRef.current = () => {
        clearTimers()
        finishRef.current = null
        map.stop()
        map.easeTo({ center: land.center, zoom: land.zoom, pitch: land.pitch, bearing: land.bearing, padding: land.padding, duration: 450, easing: easeFlight, essential: true })
        scene.setLook('day', o.slug, 250)
        openPanel(120)
      }
    },
    [api, map, scene, markVisited, whenTilesReady, profile],
  )

  // ------------------------------------------------------------------ exit
  const exit = useCallback(() => {
    clearTimers()
    finishRef.current = null
    const reduce = reducedMotion()
    const leaving = active?.slug ?? null
    setStageBoth('leaving')
    setPinsOn(false)
    setRoute(null)
    routeOn.current = false
    setActivePin(null)
    setEvents([])
    scene.showRoute(null, 'student')
    scene.director.stopAll()
    scene.lock()
    map.stop()
    // focus must not fall onto the map canvas (full-screen focus ring) while the panel unmounts
    const ae = document.activeElement as HTMLElement | null
    if (ae && (ae.closest('.cin-root') || ae === map.getCanvas())) ae.blur()
    const el = map.getContainer()
    // (the home camera only without a saved one: fitted under the panel padding it can overflow the canvas)
    const cam =
      savedCam.current ??
      (() => {
        const home = homeCamera(map, homePadding(true, el.clientWidth))
        return { center: home.center, zoom: home.zoom }
      })()
    const dur = reduce ? 0 : BACK_MS
    // highlight and buildings fade (400 ms) as they sink with the zoom; labels hide for the climb;
    // heat + labels return late
    scene.setLook('overview', null, reduce ? 0 : 700, { fadeOut: reduce ? 0 : 400, overlayDelay: reduce ? 0 : Math.round(BACK_MS * 0.55) })
    // a straight zoom-out (never past the overview zoom) when the overview still frames this spot
    const c = map.getCenter()
    const direct = nearInView([c.lng, c.lat], cam.center, cam.zoom, el.clientWidth, el.clientHeight)
    map.flyTo({
      center: cam.center,
      zoom: cam.zoom,
      pitch: 0,
      bearing: 0,
      padding: ZERO,
      duration: dur,
      ...(direct ? { minZoom: Math.min(cam.zoom, map.getZoom()) } : { curve: 1.3 }),
      easing: easeFlight,
      essential: true,
    })
    at(dur + 60, () => {
      scene.restoreInteraction()
      api.setInteractive(true)
      setStageBoth('idle')
      setActive(null)
      busyRef.current(false)
      savedCam.current = null
      // the map chrome fades back in; focus the card once it is there
      if (leaving) at(120, () => focusCard(leaving))
    })
  }, [api, map, scene, active])

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
  const skip = useCallback(() => finishRef.current?.(), [])
  // the panel and this layer may both react to the same Esc / click — leave only once
  const goBack = useCallback(() => {
    if (stageRef.current !== 'panel') return
    stageRef.current = 'leaving'
    back('/mapa')
  }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stageRef.current === 'flying') {
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
        // the panel left its routes: back to the osiedle framing (not while flying off or leaving)
        const t = scene.target(active.slug)
        if (routeOn.current && t && stageRef.current === 'panel') {
          const land = landing(map, active, t, t.bearing)
          map.easeTo({ center: land.center, zoom: land.zoom, pitch: land.pitch, bearing: land.bearing, padding: land.padding, duration: 1000, easing: easeInOutCubic, essential: true })
        }
        routeOn.current = false
        return
      }
      routeOn.current = true
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

  // timeline: the panel reports the year and the events up to it; the year lives in the store
  const onTimelineYear = useCallback((y: number, evs: TimelineEvent[]) => {
    storeRef.current.setYear(y)
    setEvents(evs)
  }, [])

  const invPins = useMemo<Pin[]>(
    () =>
      events.flatMap((ev) =>
        ev.coord ? [{ id: `inv-${ev.id}`, coord: ev.coord, label: `${ev.year} · ${ev.title}`, category: ev.category, kind: 'investment' as const, year: ev.year }] : [],
      ),
    [events],
  )

  const pins = useMemo<Pin[]>(() => {
    if (!active) return []
    const out: Pin[] = active.highlights.map((h) => ({ id: h.id, coord: h.coord, label: h.name, category: h.category, kind: 'place' }))
    if (route) {
      const c = route.geometry.coordinates
      out.push({ id: `route-start`, coord: c[0] as LngLat, label: 'Ty', kind: 'start' })
      out.push({ id: `route-end`, coord: c[c.length - 1] as LngLat, label: route.destinationName, category: route.category, kind: 'end' })
    }
    return [...out, ...invPins]
  }, [active, route, invPins])

  // new investment pins outside the free map area: ease the camera so they come into view
  const seenInv = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!active) {
      seenInv.current = new Set()
      return
    }
    const fresh = invPins.filter((p) => !seenInv.current.has(p.id))
    seenInv.current = new Set(invPins.map((p) => p.id))
    if (!fresh.length || stageRef.current !== 'panel') return
    const t = scene.target(active.slug)
    if (!t) return
    const want: Pt[] = [...active.highlights.map((h) => h.coord as Pt), ...invPins.map((p) => p.coord as Pt)]
    const run = () => {
      if (stageRef.current !== 'panel' || allVisible(map, want)) return
      scene.director.nudge()
      const f = frame(map, [...want, active.center], { pitch: map.getPitch(), bearing: map.getBearing(), sweep: ORBIT_SWEEP })
      map.easeTo({ center: f.center, zoom: f.zoom, padding: f.padding, duration: 1200, easing: easeInOutCubic, essential: true })
    }
    // the panel reports the first year while the landing ease still runs: frame once it has settled
    if (!map.isMoving()) return run()
    map.once('moveend', run)
    return () => {
      map.off('moveend', run)
    }
  }, [invPins, active, map, scene])

  const onPick = useCallback(
    (p: Pin) => {
      if (p.kind === 'place') focusPlace(p.coord)
    },
    [focusPlace],
  )

  // the category of the place hovered in the panel (or its pin) highlights those buildings in 3D
  const hoverKinds = useMemo(() => {
    const id = hoverPin ?? activePin
    const h = id ? active?.highlights.find((x) => x.id === id) : undefined
    return h ? categoryKinds(h.category) : null
  }, [hoverPin, activePin, active])

  const panelOpen = stage === 'panel' || stage === 'leaving'
  const panelCb = useRef(onPanelChange)
  useEffect(() => {
    panelCb.current = onPanelChange
  })
  useEffect(() => {
    panelCb.current?.(panelOpen)
  }, [panelOpen])
  useEffect(() => () => panelCb.current?.(false), [])

  const fitOf = (slug: string | undefined): PlaceFit | null => {
    const r = slug ? ranks?.bySlug[slug] : undefined
    return r && ranks ? { rank: r.rank, match: r.match, total: ranks.total } : null
  }
  const activeFit = fitOf(active?.slug)

  const showPanel = stage === 'panel' && active
  const areaLayers = showPanel && area?.slug === active.slug ? area.layers : null
  const Panel = loadedPanel ?? LazyPanel

  return (
    <div className={`cin-root is-${stage}`}>
      <div className={`cin-veil${veil ? ' is-on' : ''}`} aria-hidden />

      {active && pinsOn && (
        <PlacePins map={map} pins={pins} accent={owner.accent} deep={owner.deep} activeId={hoverPin ?? activePin} onPick={onPick} />
      )}

      {areaLayers && (
        <Suspense fallback={null}>
          <Osm3dOverlay area={areaLayers} focusKinds={hoverKinds} />
        </Suspense>
      )}

      <AnimatePresence>
        {showPanel && (
          <Suspense key={active.slug} fallback={null}>
            <Panel
              osiedle={active}
              fit={activeFit}
              profile={profile}
              horizon={horizon}
              priorities={[...priorities]}
              layout="overlay"
              onBack={goBack}
              onFocusPlace={focusPlace}
              onHoverPlace={setHoverPin}
              onShowRoute={showRoute}
              activePlaceId={activePin}
              timelineYear={timelineYear}
              onTimelineYear={onTimelineYear}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CinematicLayer
