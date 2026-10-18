import { ArrowLeft, Crown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_PRIORITIES } from '../app/dictionary'
import type { CategoryId, Horizon, ProfileId } from '../app/types'
import type { PlaceFit } from '../cinematic/panelLoader'
import type { Highlight, LngLat, Osiedle, Route, TimelineEvent, TravelMode } from '../mock/osiedla'
import { CategoryBars } from './CategoryBars'
import { Commute } from './Commute'
import { Credits } from './Credits'
import { Hero, type HeroVideo } from './Hero'
import { Places } from './Places'
import { routeFrom } from './osrm'
import { Prices } from './Prices'
import { Ring } from './Ring'
import { Routes, type StartStatus } from './Routes'
import { EASE_EMPHASIZED, defaultMode, useInView } from './shared'
import { Timeline } from './Timeline'
import { FIRST_YEAR, eventsUpTo, matchAtYear, statDeltasAtYear, statsAtYear, toStop, type TimelineYear } from './timelineMath'
import { TrafficChart } from './TrafficChart'
import { CollapsibleSection } from './ui'
import './osiedle.css'

export interface OsiedlePanelProps {
  osiedle: Osiedle
  /** Rank and match for the current weights — the numbers of the osiedle's map pill. */
  fit?: PlaceFit | null
  profile: ProfileId
  horizon: Horizon
  /** Categories that count in the score ("Liczy się dla mnie" of the map filters); defaults to the profile's. */
  priorities?: CategoryId[]
  /** `overlay` = place card in the map's left column over the 3D map; `page` = standalone full page. */
  layout?: 'overlay' | 'page'
  onBack: () => void
  /** Highlight clicked → fly the map there. */
  onFocusPlace?: (lngLat: LngLat, place: Highlight) => void
  /** Highlight hovered / focused (null = left) → scale its map marker. */
  onHoverPlace?: (id: string | null) => void
  /** Destination or mode picked → draw the route; null when the panel closes. */
  onShowRoute?: (route: Route | null, mode?: TravelMode) => void
  /** Controlled timeline year (store `timelineYear`, snapped to its 5-year stop); uncontrolled (starts at today) when omitted. */
  timelineYear?: number
  /** Timeline stop changed (and once when the panel opens) with the dated events of year ≤ Y, for map markers. */
  onTimelineYear?: (year: TimelineYear, events: TimelineEvent[]) => void
  /**
   * Wait for one click on the map and resolve its point (null = cancelled, e.g. Esc); calling it
   * again while it waits cancels. Enables the own start point of "Droga do…".
   */
  onPickPoint?: () => Promise<LngLat | null>
  /** Highlight id currently emphasised from the map side (marker hover). */
  activePlaceId?: string | null
  /** Explicit hero video; default probes `/osiedla/<slug>/flyover.{webm,mp4}`; `false` = photos only. */
  heroVideo?: HeroVideo | false
  className?: string
}

/** Display name of the MSI area when it differs from the osiedle name (spec §6.2). */
const MSI_NAMES: Record<string, string> = {
  'blonia-wilanowskie': 'Błonia Wilanowskie',
}

// Sections re-render only when their own props change — not on every pin hover / route / store
// update that re-renders the panel (each is pure in its props and its own state).
const HeroSection = memo(Hero)
const CategoryBarsSection = memo(CategoryBars)
const PlacesSection = memo(Places)
const RoutesSection = memo(Routes)
const CommuteSection = memo(Commute)
const TrafficSection = memo(TrafficChart)
const PricesSection = memo(Prices)
const TimelineSection = memo(Timeline)
const CreditsSection = memo(Credits)

/**
 * Osiedle detail panel (spec §4.5) in the map's card language: a fixed head (back, name, rank,
 * match ring) over a scrolling body — photos, key numbers, category bars, places, routes, commute,
 * traffic, prices, timeline dziś → 2045 (5-year stops), credits.
 */
export function OsiedlePanel(props: OsiedlePanelProps) {
  // Keyed by slug: switching osiedle starts from a clean state (gallery, route, scroll, reveal).
  return <PanelBody key={props.osiedle.slug} {...props} />
}

function PanelBody({
  osiedle,
  fit,
  profile,
  horizon,
  priorities,
  layout = 'overlay',
  onBack,
  onFocusPlace,
  onHoverPlace,
  onShowRoute,
  onPickPoint,
  activePlaceId,
  heroVideo,
  timelineYear,
  onTimelineYear,
  className,
}: OsiedlePanelProps) {
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // by content: the caller passes a fresh copy of the same list on every render
  const prioKey = priorities?.length ? priorities.join(',') : ''
  const prios = useMemo(
    () => (prioKey ? (prioKey.split(',') as CategoryId[]) : [...DEFAULT_PRIORITIES[profile]]),
    [prioKey, profile],
  )
  // The map's live ranking (same weights as the pills); the mock snapshot only without a map (dev harness).
  const rank = fit?.rank ?? osiedle.rank?.[profile]
  const total = fit?.total ?? 143
  const todayMatch = fit?.match ?? osiedle.match[profile]
  const isBest = rank === 1
  const msiName = MSI_NAMES[osiedle.msiId]

  // Timeline (spec §4.6): the same full timeline for both horizons; the year snaps to its 5-year stop.
  const [ownYear, setOwnYear] = useState<TimelineYear>(toStop(timelineYear ?? FIRST_YEAR))
  const year = timelineYear != null ? toStop(timelineYear) : ownYear
  const onYearRef = useRef(onTimelineYear)
  const setYear = useCallback((y: TimelineYear) => {
    setOwnYear(y)
    onYearRef.current?.(y, eventsUpTo(osiedle, y))
  }, [osiedle])
  // Tell the map once when the panel opens (markers for year ≤ current).
  useEffect(() => {
    onYearRef.current?.(year, eventsUpTo(osiedle, year))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const values = useMemo(() => statsAtYear(osiedle, year), [osiedle, year])
  const deltas = useMemo(() => statDeltasAtYear(osiedle, year), [osiedle, year])
  const match = matchAtYear(osiedle, profile, year, todayMatch)

  // Sections: photos, stats and prices start open, the rest folded. Opening "Droga do…" folds the
  // stats (the panel gets short enough for the route to stay in view) and scrolls to it.
  const [photosOpen, setPhotosOpen] = useState(true)
  const [statsOpen, setStatsOpen] = useState(true)
  const [routesOpen, setRoutesOpen] = useState(false)

  // Routes — first destination selected by default. The route is on the map only while the section is
  // open and in view: scrolling away (or picking a place) clears it and the camera returns to the osiedle.
  const [routeId, setRouteId] = useState(osiedle.routes[0]?.id ?? '')
  const [mode, setMode] = useState<TravelMode>(() => (osiedle.routes[0] ? defaultMode(osiedle.routes[0]) : 'pieszo'))
  const [routesRef, routesInView] = useInView<HTMLDivElement>(scrollRef)
  // a place picked while the routes are in view takes the map over until the user comes back to them
  const [routeDismissed, setRouteDismissed] = useState(false)
  const [wasInView, setWasInView] = useState(routesInView)
  if (wasInView !== routesInView) {
    setWasInView(routesInView)
    if (!routesInView) setRouteDismissed(false)
  }
  const showRoute = useRef(onShowRoute)
  const back = useRef(onBack)
  const pickRef = useRef(onPickPoint)
  useEffect(() => {
    showRoute.current = onShowRoute
    back.current = onBack
    pickRef.current = onPickPoint
    onYearRef.current = onTimelineYear
  })
  const picked = osiedle.routes.find((r) => r.id === routeId) ?? osiedle.routes[0]

  // Own start point (pin + map click): the picked destination re-routed live; results kept per point+destination.
  const [start, setStart] = useState<LngLat | null>(null)
  const [picking, setPicking] = useState(false)
  const [fromStart, setFromStart] = useState<Record<string, Route | 'error'>>({})
  const startKey = start && picked ? `${start.join(',')}|${picked.id}` : null
  const startResult = startKey ? fromStart[startKey] : undefined
  const startStatus: StartStatus = picking ? 'picking' : !startKey ? 'none' : startResult === undefined ? 'loading' : startResult === 'error' ? 'error' : 'ok'
  const startRoute = startResult && startResult !== 'error' ? startResult : null
  useEffect(() => {
    if (!start || !picked || !startKey || fromStart[startKey] !== undefined) return
    const ctrl = new AbortController()
    routeFrom(start, picked, ctrl.signal).then(
      (r) => setFromStart((m) => ({ ...m, [startKey]: r })),
      () => {
        if (!ctrl.signal.aborted) setFromStart((m) => ({ ...m, [startKey]: 'error' }))
      },
    )
    return () => ctrl.abort()
  }, [start, picked, startKey, fromStart])
  const pickingRef = useRef(false)
  const pickStart = useCallback(async () => {
    const pick = pickRef.current
    if (!pick) return
    // a second press while waiting cancels the pending pick (it resolves null)
    if (pickingRef.current) return void pick()
    pickingRef.current = true
    setPicking(true)
    const p = await pick()
    pickingRef.current = false
    setPicking(false)
    if (p) {
      setStart(p)
      setRouteDismissed(false)
    }
  }, [])
  const clearStart = useCallback(() => setStart(null), [])
  // folding the routes (or closing the panel) mid-pick gives the map click back
  useEffect(() => {
    if (!routesOpen && pickingRef.current) void pickRef.current?.()
  }, [routesOpen])
  useEffect(
    () => () => {
      if (pickingRef.current) void pickRef.current?.()
    },
    [],
  )

  const route = startRoute ?? picked
  const routeOn = routesOpen && routesInView && !routeDismissed && !!route
  const routeShown = useRef(false)
  useEffect(() => {
    if (!routeOn) {
      if (routeShown.current) {
        routeShown.current = false
        showRoute.current?.(null)
      }
      return
    }
    // a short wait on the way in, so scrolling past the section doesn't send the camera off and back
    const t = window.setTimeout(
      () => {
        routeShown.current = true
        showRoute.current?.(route, mode)
      },
      routeShown.current ? 0 : 250,
    )
    return () => window.clearTimeout(t)
  }, [routeOn, route, mode])
  useEffect(() => () => showRoute.current?.(null), [])
  const openRoutes = useCallback(
    (open: boolean) => {
      setRoutesOpen(open)
      if (!open) return
      setStatsOpen(false)
      // bring the routes to the top of the scroll area while the stats fold (--d-slow): the target is
      // re-read every frame, since it moves up as the content above shrinks
      const scroller = scrollRef.current
      const el = routesRef.current
      if (!scroller || !el) return
      const from = scroller.scrollTop
      const t0 = performance.now()
      const dur = reduce ? 0 : 420
      const step = (now: number) => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1
        const target = Math.max(0, el.offsetTop - 8)
        scroller.scrollTop = from + (target - from) * (1 - (1 - k) ** 3)
        if (k < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    },
    [routesRef, reduce],
  )
  const selectRoute = useCallback((r: Route) => {
    setRouteDismissed(false)
    setRouteId(r.id)
    setMode((m) => (r.minutes[m] != null ? m : defaultMode(r)))
  }, [])
  const selectMode = useCallback((m: TravelMode) => {
    setRouteDismissed(false)
    setMode(m)
  }, [])

  // Places — a place picked while a route is shown clears the route first, then the camera flies there.
  const [placeId, setPlaceId] = useState<string | null>(null)
  const shownPlaceId = activePlaceId ?? placeId
  const selectPlace = useCallback(
    (p: Highlight) => {
      setPlaceId(p.id)
      setRouteDismissed(true)
      if (routeShown.current) {
        routeShown.current = false
        showRoute.current?.(null)
      }
      onFocusPlace?.(p.coord, p)
    },
    [onFocusPlace],
  )

  // Focus the heading on open (spec §10), Esc goes back.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [osiedle.slug])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) back.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const enterFrom = layout === 'overlay' ? { x: -32, opacity: 0 } : { y: 24, opacity: 0 }

  return (
    <motion.aside
      className={['op', `op--${layout}`, layout === 'overlay' ? 'chrome-card' : '', `accent-${profile}`, className].filter(Boolean).join(' ')}
      aria-labelledby="op-title"
      initial={reduce ? { opacity: 0 } : enterFrom}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { ...enterFrom, transition: { duration: 0.25, ease: EASE_EMPHASIZED } }}
      transition={{ duration: reduce ? 0.2 : 0.32, ease: EASE_EMPHASIZED }}
    >
      <header className="op-head">
        <button type="button" className="op-head__back" onClick={onBack} aria-label="Wróć do mapy" title="Wróć do mapy">
          <ArrowLeft size={17} strokeWidth={2.3} aria-hidden />
        </button>
        <div className="op-head__text">
          <h1 id="op-title" ref={titleRef} tabIndex={-1} className="op-head__name chrome-title">
            {osiedle.name}
          </h1>
          <p className="op-head__district">
            {osiedle.district}
            {msiName && msiName !== osiedle.name && <> · obszar {msiName}</>}
          </p>
          {isBest ? (
            <p className="op-head__rank is-best">
              <Crown size={12} strokeWidth={2.4} aria-hidden />
              Najlepsze dopasowanie
            </p>
          ) : rank != null ? (
            <p className="op-head__rank tabular">
              {rank}. miejsce spośród {total} osiedli
            </p>
          ) : null}
        </div>
        <span className="op-head__match">
          <Ring value={match} size={44} duration={700} />
        </span>
      </header>

      <div ref={scrollRef} className="op__scroll">
        <CollapsibleSection id="op-photos-title" title="Zdjęcia" section="Zdjęcia" className="op-sec--photos" open={photosOpen} onOpenChange={setPhotosOpen}>
          <HeroSection osiedle={osiedle} video={heroVideo} active={photosOpen} />
        </CollapsibleSection>
        {osiedle.tagline && <p className="op-lead">{osiedle.tagline}</p>}

        <CategoryBarsSection profile={profile} priorities={prios} values={values} deltas={deltas} open={statsOpen} onOpenChange={setStatsOpen} />
        <PlacesSection places={osiedle.highlights} activeId={shownPlaceId} onSelect={selectPlace} onHover={onHoverPlace} hasMap={!!onFocusPlace} />
        {osiedle.routes.length > 0 && (
          <div ref={routesRef}>
            <RoutesSection
              routes={osiedle.routes}
              selectedId={picked?.id ?? ''}
              mode={mode}
              onSelect={selectRoute}
              onMode={selectMode}
              open={routesOpen}
              onOpenChange={openRoutes}
              fromStart={startRoute}
              startStatus={startStatus}
              onPickStart={onPickPoint ? pickStart : undefined}
              onClearStart={clearStart}
            />
          </div>
        )}
        <CommuteSection rows={osiedle.commute} />
        <TrafficSection traffic={osiedle.traffic} road={osiedle.trafficRoad} />
        <PricesSection osiedle={osiedle} horizon={horizon} />
        <TimelineSection osiedle={osiedle} profile={profile} year={year} onYear={setYear} baseMatch={todayMatch} />

        <footer className="op-foot">
          <CreditsSection slug={osiedle.slug} images={osiedle.heroImages} />
        </footer>
      </div>
    </motion.aside>
  )
}
