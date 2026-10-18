import { ArrowLeft, Crown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_PRIORITIES } from '../app/dictionary'
import type { CategoryId, Horizon, ProfileId } from '../app/types'
import type { PlaceFit } from '../cinematic/panelLoader'
import type { Highlight, LngLat, Osiedle, Route, TimelineEvent, TravelMode } from '../mock/osiedla'
import { CategoryBars } from './CategoryBars'
import { Commute } from './Commute'
import { Credits } from './Credits'
import { Hero, type HeroVideo } from './Hero'
import { Places } from './Places'
import { Prices } from './Prices'
import { Ring } from './Ring'
import { Routes } from './Routes'
import { EASE_EMPHASIZED, defaultMode, useSeenOnce } from './shared'
import { Timeline, TimelineTeaser } from './Timeline'
import { FIRST_YEAR, eventsUpTo, matchAtYear, statDeltasAtYear, statsAtYear, toTimelineYear, type TimelineYear } from './timelineMath'
import { TrafficChart } from './TrafficChart'
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
  /** Controlled timeline year (store `timelineYear`); uncontrolled (starts at 2026) when omitted. */
  timelineYear?: number
  /** Timeline year changed (and once when the timeline opens) with the events of year ≤ Y, for map markers. */
  onTimelineYear?: (year: TimelineYear, events: TimelineEvent[]) => void
  /** "Pokaż prognozę" on the `chwila` teaser asks to switch the horizon to `stale`. */
  onHorizonChange?: (horizon: Horizon) => void
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

const DEMO_NOTE = 'Wersja demonstracyjna — liczby policzone z otwartych danych bez ręcznych korekt; szacunki są oznaczone.'

/**
 * Osiedle detail panel (spec §4.5) in the map's card language: a fixed head (back, name, rank,
 * match ring) over a scrolling body — photos, key numbers, category bars, places, routes, commute,
 * traffic, prices, timeline 2026 → 2030, credits.
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
  activePlaceId,
  heroVideo,
  timelineYear,
  onTimelineYear,
  onHorizonChange,
  className,
}: OsiedlePanelProps) {
  const reduce = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const prios = priorities?.length ? priorities : [...DEFAULT_PRIORITIES[profile]]
  // The map's live ranking (same weights as the pills); the mock snapshot only without a map (dev harness).
  const rank = fit?.rank ?? osiedle.rank?.[profile]
  const total = fit?.total ?? 143
  const todayMatch = fit?.match ?? osiedle.match[profile]
  const isBest = rank === 1
  const msiName = MSI_NAMES[osiedle.msiId]

  // Timeline (spec §4.6): full for `stale`; for `chwila` a teaser whose "Pokaż prognozę" switches the
  // horizon to `stale` (store) and opens the timeline in place right away, even before the prop flips.
  const [expanded, setExpanded] = useState(false)
  const timelineOn = horizon === 'stale' || expanded
  const focusTimeline = useRef(false)
  const expandTimeline = () => {
    onHorizonChange?.('stale')
    setExpanded(true)
    focusTimeline.current = true
  }
  // The button disappears with the teaser: move focus to the timeline heading and bring it into view.
  useEffect(() => {
    if (!timelineOn || !focusTimeline.current) return
    focusTimeline.current = false
    const head = document.getElementById('op-tl-title')
    head?.focus({ preventScroll: true })
    head?.closest('section')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [timelineOn, reduce])
  const [ownYear, setOwnYear] = useState<TimelineYear>(toTimelineYear(timelineYear ?? FIRST_YEAR))
  const year = timelineYear != null ? toTimelineYear(timelineYear) : ownYear
  const onYearRef = useRef(onTimelineYear)
  const setYear = useCallback((y: TimelineYear) => {
    setOwnYear(y)
    onYearRef.current?.(y, eventsUpTo(osiedle, y))
  }, [osiedle])
  // Tell the map once when the timeline opens (markers for year ≤ current).
  useEffect(() => {
    if (timelineOn) onYearRef.current?.(year, eventsUpTo(osiedle, year))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineOn])
  const values = timelineOn ? statsAtYear(osiedle, year) : osiedle.stats
  const deltas = timelineOn ? statDeltasAtYear(osiedle, year) : undefined
  const match = timelineOn ? matchAtYear(osiedle, profile, year, todayMatch) : todayMatch

  // Places
  const [placeId, setPlaceId] = useState<string | null>(null)
  const shownPlaceId = activePlaceId ?? placeId
  const selectPlace = (p: Highlight) => {
    setPlaceId(p.id)
    onFocusPlace?.(p.coord, p)
  }

  // Routes — first destination selected by default, drawn once the section scrolls into view.
  const [routeId, setRouteId] = useState(osiedle.routes[0]?.id ?? '')
  const [mode, setMode] = useState<TravelMode>(() => (osiedle.routes[0] ? defaultMode(osiedle.routes[0]) : 'pieszo'))
  const [routesRef, routesSeen] = useSeenOnce<HTMLDivElement>(0.4)
  const showRoute = useRef(onShowRoute)
  const back = useRef(onBack)
  useEffect(() => {
    showRoute.current = onShowRoute
    back.current = onBack
    onYearRef.current = onTimelineYear
  })
  const route = osiedle.routes.find((r) => r.id === routeId) ?? osiedle.routes[0]
  useEffect(() => {
    if (routesSeen && route) showRoute.current?.(route, mode)
  }, [routesSeen, route, mode])
  useEffect(() => () => showRoute.current?.(null), [])
  const selectRoute = (r: Route) => {
    setRouteId(r.id)
    setMode((m) => (r.minutes[m] != null ? m : defaultMode(r)))
  }

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
        <Hero osiedle={osiedle} video={heroVideo} />
        {osiedle.tagline && <p className="op-lead">{osiedle.tagline}</p>}

        <CategoryBars profile={profile} priorities={prios} values={values} deltas={deltas} />
        <Places places={osiedle.highlights} activeId={shownPlaceId} onSelect={selectPlace} onHover={onHoverPlace} hasMap={!!onFocusPlace} />
        {osiedle.routes.length > 0 && (
          <div ref={routesRef}>
            <Routes routes={osiedle.routes} selectedId={route?.id ?? ''} mode={mode} onSelect={selectRoute} onMode={setMode} />
          </div>
        )}
        <Commute rows={osiedle.commute} />
        <TrafficChart traffic={osiedle.traffic} road={osiedle.trafficRoad} />
        <Prices osiedle={osiedle} horizon={horizon} />
        {timelineOn ? (
          <Timeline osiedle={osiedle} profile={profile} year={year} onYear={setYear} baseMatch={todayMatch} />
        ) : (
          <TimelineTeaser name={osiedle.name} onExpand={expandTimeline} />
        )}

        <footer className="op-foot">
          <Credits slug={osiedle.slug} images={osiedle.heroImages} />
          <p className="op-note">{DEMO_NOTE}</p>
        </footer>
      </div>
    </motion.aside>
  )
}
