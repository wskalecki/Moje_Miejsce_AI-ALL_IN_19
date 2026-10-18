import '../lib/maplibreSetup'
import { Map as MlMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  categoryHasDetailFilters,
  categoryHasSlider,
  CONFIGURABLE_FILTER_CATEGORIES,
  DEFAULT_FILTER_SECTIONS,
  poiSubtypesVisibleOnMap,
  sectionsEqual,
  type FilterSections,
} from './categoryFilterRows'
import { CategoryFilterPanel } from './CategoryFilterPanel'
import {
  MAP_BOUNDS,
  MAP_MAX_PITCH,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  MAP_STYLE_URL,
  START_CAMERA,
} from '../app/config'
import { warmBasemap } from './basemap'
import { homeCamera, homePadding } from './camera'
import { loadMapData, type MapData } from './data'
import { deriveWeights, sanitizeWeights } from '../app/weights'
import { addFeaturedLayers, applyFeaturedProfile, setTopShapes } from './featuredLayers'
import { FeaturedMarkers, type FeaturedRank, type TopItem } from './FeaturedMarkers'
import { FilterPanel } from './FilterPanel'
import { HOVER_MIN_ZOOM, HoverController } from './hover'
import { HoverCard, type HoverCardData } from './HoverCard'
import { addMapLayers, applyLabelFilter, applyMix, applyProfile, LAYER, SOURCE, type Mix } from './layers'
import { Legend } from './Legend'
import { MapControls } from './MapControls'
import { factsFor, loadMetrics, type MetricsIndex } from './metrics'
import {
  ALL_GASTRONOMY_CUISINES,
  personalGastronomyScore,
  resetGastronomyNorm,
  type GastronomyCuisine,
} from './gastronomyCuisine'
import { loadPoi, type PoiData } from './poi'
import { addPoiLayers, applyPoi, applyPoiEducation, applyPoiInterests, applyPoiTransit, POI_LAYER } from './poiLayer'
import { weightToUi } from '../app/weights'
import { Toast } from './Toast'
import { ACCENTS, CATEGORY_ORDER, topCategories } from './tokens'
import type { CategoryKey, FeaturedInfo, Horizon, OsiedleInfo, Profile } from './types'
import { shares, weightedMatch, type Weights } from './weighting'
import './map.css'

/** Imperative handle for the app shell and the cinematic transition (T7). */
export interface MapApi {
  map: MlMap
  /** Fly back to the start camera ("Cała Warszawa"). */
  resetView: (opts?: { duration?: number }) => void
  /** Enable/disable hover + click handling (e.g. during the cinematic shot). */
  setInteractive: (on: boolean) => void
  /** Layer and source ids used by the map. */
  layers: typeof LAYER
  sources: typeof SOURCE
  featured: FeaturedInfo[]
  info: Map<string, OsiedleInfo>
  /** Polygons of the featured osiedla, the ones with full content (`properties.featured_slug`). */
  shapes: MapData['featuredShapes']
}

export interface MapViewProps {
  profile: Profile
  /** Survey priorities in selection order (defaults for the weights when `weights` is not given). */
  priorities?: readonly CategoryKey[]
  /** Category weights 0–100 (store `state.weights`). Without it the map keeps its own copy. */
  weights?: Readonly<Record<CategoryKey, number>>
  /** Store `setWeight`. */
  onWeightChange?: (c: CategoryKey, v: number) => void
  /** Store `resetWeights`. */
  onResetWeights?: () => void
  horizon?: Horizon
  onHorizonChange?: (h: Horizon) => void
  /** Slug from `/mapa/:slug`; when set the map chrome fades out and hover is off. */
  selectedSlug?: string | null
  onSelectFeatured: (slug: string) => void
  /** Called once, after the style, data and all map layers are ready. */
  onMapReady?: (map: MlMap, api: MapApi) => void
  /** Rank and match of the featured osiedla (the live ranking the pills use) whenever they change. */
  onFeaturedRanks?: (ranks: Readonly<Record<string, FeaturedRank>>, total: number) => void
  /** Presenter switch: when given, the filter panel shows a 3-profile toggle that calls this. */
  onProfileChange?: (p: Profile) => void
  /** Hide all overlays (legend, panel, controls) — e.g. while the cinematic transition runs. */
  chrome?: boolean
  /** Checked POI subtypes (optional filter-panel section). */
  poiInterests?: readonly string[]
  onTogglePoiInterest?: (subtype: string) => void
  gastronomyCuisines?: readonly string[]
  onToggleGastronomyCuisine?: (cuisine: string) => void
  filterSections?: FilterSections
  onFilterSectionsChange?: (sections: FilterSections) => void
  className?: string
}

/**
 * Spec bounds (≈ [[20.75, 52.03], [21.40, 52.43]]) are narrower than a 1440 px viewport at zoom 10.8,
 * which pushes the start camera east. Pad them so the start camera stays centred on wide screens.
 */
const PADDED_BOUNDS: [[number, number], [number, number]] = [
  [MAP_BOUNDS[0][0] - 0.25, MAP_BOUNDS[0][1] - 0.06],
  [MAP_BOUNDS[1][0] + 0.25, MAP_BOUNDS[1][1] + 0.06],
]

const NO_PRIORITIES: readonly CategoryKey[] = []

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function MapView({
  profile,
  priorities = NO_PRIORITIES,
  weights: weightsProp,
  onWeightChange,
  onResetWeights,
  selectedSlug = null,
  onSelectFeatured,
  onMapReady,
  onFeaturedRanks,
  horizon = 'stale',
  onHorizonChange,
  chrome = true,
  poiInterests = [],
  onTogglePoiInterest,
  gastronomyCuisines = [],
  onToggleGastronomyCuisine,
  filterSections: filterSectionsProp,
  onFilterSectionsChange,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MlMap | null>(null)
  const hoverRef = useRef<HoverController | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef(profile)
  const appliedProfile = useRef<Profile>(profile)
  const onReadyRef = useRef(onMapReady)
  const onSelectRef = useRef(onSelectFeatured)
  const interactiveRef = useRef(true)
  const chromeVisible = chrome && !selectedSlug
  const chromeRef = useRef(chromeVisible)
  /** The start camera was framed without the filter panel (it was hidden) and the user has not moved the map yet. */
  const fitWithoutPanelRef = useRef(false)
  /** MSI ids of the live top 3 (pills + outline), best first — read by the map click / hover handlers. */
  const topIdsRef = useRef<readonly string[]>([])

  // ---- weights: the store's when given, else a local copy (dev harness) ----
  const defaults = useMemo(() => deriveWeights(profile, priorities), [profile, priorities])
  const [localWeights, setLocalWeights] = useState<{ base: Weights; w: Weights }>({ base: defaults, w: defaults })
  if (!weightsProp && localWeights.base !== defaults) setLocalWeights({ base: defaults, w: defaults })
  const weights: Weights = useMemo(
    () => (weightsProp ? sanitizeWeights(weightsProp, defaults) : localWeights.w),
    [weightsProp, defaults, localWeights],
  )
  const setWeight = useCallback(
    (c: CategoryKey, v: number) => {
      if (onWeightChange) onWeightChange(c, v)
      else setLocalWeights((s) => ({ ...s, w: { ...s.w, [c]: v } }))
    },
    [onWeightChange],
  )
  const resetWeights = useCallback(() => {
    if (onResetWeights) onResetWeights()
    else setLocalWeights((s) => ({ ...s, w: s.base }))
  }, [onResetWeights])
  const filterSections = filterSectionsProp ?? DEFAULT_FILTER_SECTIONS
  const isDefault =
    sectionsEqual(filterSections, DEFAULT_FILTER_SECTIONS) &&
    CONFIGURABLE_FILTER_CATEGORIES.every((c) => weights[c] === defaults[c])

  const [solo, setSolo] = useState<CategoryKey | null>(null)
  const scoreCats = filterSections.score
  const mix: Mix = useMemo(() => ({ shares: shares(weights, solo, scoreCats), solo }), [weights, solo, scoreCats])
  const mixRef = useRef(mix)
  useLayoutEffect(() => {
    onReadyRef.current = onMapReady
    onSelectRef.current = onSelectFeatured
    profileRef.current = profile
    chromeRef.current = chromeVisible
    mixRef.current = mix
  })
  const [poi, setPoi] = useState<PoiData | null>(null)
  const [metrics, setMetrics] = useState<MetricsIndex | null>(null)
  const [poiHover, setPoiHover] = useState<{ key: string; c: number; n: string; t: string; s: string } | null>(null)
  const poiTipRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<MapData | null>(null)
  const [mapInst, setMapInst] = useState<MlMap | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [panelHover, setPanelHover] = useState<string | null>(null)
  const [zoomedIn, setZoomedIn] = useState(false)
  const [toastSeq, setToastSeq] = useState(0)
  const [detailCat, setDetailCat] = useState<CategoryKey | null>(null)

  useEffect(() => {
    if (detailCat && !categoryHasDetailFilters(detailCat)) setDetailCat(null)
  }, [detailCat])

  const openDetailCat = detailCat && categoryHasDetailFilters(detailCat) ? detailCat : null

  useEffect(() => {
    if (!chromeVisible) setDetailCat(null)
  }, [chromeVisible])

  // The start camera was framed while the preferences modal hid the panel: once the panel shows,
  // re-frame Warsaw beside it so no osiedle (or its top-3 pill) sits under the panel.
  useEffect(() => {
    const map = mapRef.current
    const el = containerRef.current
    if (!chromeVisible || !map || !el || !fitWithoutPanelRef.current) return
    fitWithoutPanelRef.current = false
    map.easeTo({ ...homeCamera(map, homePadding(true, el.clientWidth)), duration: reducedMotion() ? 0 : 900 })
  }, [chromeVisible, data])

  // ---- map lifecycle (one instance per mount) ----
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const map = new MlMap({
      container: el,
      style: MAP_STYLE_URL,
      center: START_CAMERA.center,
      zoom: START_CAMERA.zoom,
      pitch: START_CAMERA.pitch,
      bearing: START_CAMERA.bearing,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      maxPitch: MAP_MAX_PITCH,
      maxBounds: PADDED_BOUNDS,
      attributionControl: { compact: true },
      fadeDuration: 200,
      // keep the tiles of the overview and of the visited osiedla (the default ≈ 5 viewports evicts
      // them, and a second fly-in lands on a grey map); the size is a cap, the zoom levels the budget
      maxTileCacheSize: 480,
      maxTileCacheZoomLevels: 40,
      // let the tiles of the levels a fast zoom passes through finish loading: details fill in
      // progressively during the fly-in, and the zoom back out finds them cached (a cached parent
      // is not used for a tile that was never requested, so the climb would show blank ground)
      cancelPendingTileRequestsWhileZooming: false,
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    map.getCanvas().setAttribute('aria-label', 'Mapa okolic Warszawy — kolory pokazują, jak dobrze pasują do Twoich priorytetów')
    mapRef.current = map
    let cancelled = false
    const dataP = loadMapData()
    const padding = () => homePadding(chromeRef.current, el.clientWidth)

    map.once('load', async () => {
      warmBasemap(map)
      // phones/tablets: start the attribution collapsed to its (i) button (it sits between controls and sheet)
      if (el.clientWidth < 1024) el.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show')
      const d = await dataP
      if (cancelled) return
      addMapLayers(map, d, profileRef.current, mixRef.current)
      addFeaturedLayers(map, profileRef.current)
      appliedProfile.current = profileRef.current
      hoverRef.current = new HoverController(map, {
        getProfile: () => profileRef.current,
        info: d.info,
        extraLayers: () => [LAYER.featuredFill],
        isPinned: (id) => !!d.info.get(id)?.featuredSlug || topIdsRef.current.includes(id),
        onChange: (id) => {
          setHoveredId(id)
          map.getCanvas().style.cursor = id ? 'pointer' : ''
        },
        getCard: () => cardRef.current,
        getKeepOut: () => el.parentElement?.querySelector('.smap-toast.is-visible .smap-toast__inner')?.getBoundingClientRect() ?? null,
      })

      // Only the osiedla with full content open; any other one (also a top-3 one) shows the "wkrótce" toast.
      map.on('click', (e) => {
        if (!interactiveRef.current) return
        const layers = [LAYER.featuredFill, LAYER.fill(profileRef.current)]
        const hits = map.queryRenderedFeatures(e.point, { layers })
        const featuredHit = hits.find((f) => d.info.get(f.properties?.id as string)?.featuredSlug)
        if (featuredHit) {
          const slug = d.info.get(featuredHit.properties?.id as string)?.featuredSlug
          if (slug) onSelectRef.current(slug)
          return
        }
        const topHit = hits.some((f) => topIdsRef.current.includes(f.properties?.id as string))
        if (hits.length && (topHit || map.getZoom() >= HOVER_MIN_ZOOM)) setToastSeq((n) => n + 1)
      })

      setData(d)
      setMapInst(map)

      // POI points + real numbers for the hover card: after the first frame, off the critical path
      void loadPoi()
        .then((p) => {
          if (cancelled || !map.getStyle()) return
          addPoiLayers(map, p)
          setPoi(p)
        })
        .catch(() => undefined)
      void loadMetrics().then((m) => !cancelled && setMetrics(m))
      let poiKey: string | undefined
      map.on('mousemove', (e) => {
        const layers = [POI_LAYER.interestsEdu, POI_LAYER.interestsTransit, POI_LAYER.interests, POI_LAYER.solo, POI_LAYER.pri].filter(
          (l) => map.getLayer(l) && map.getLayoutProperty(l, 'visibility') !== 'none',
        )
        const f = layers.length && interactiveRef.current ? map.queryRenderedFeatures(e.point, { layers })[0] : undefined
        if (!f) {
          if (poiKey !== undefined) setPoiHover(null)
          poiKey = undefined
          return
        }
        const tip = poiTipRef.current
        if (tip) tip.style.transform = `translate3d(${Math.round(e.point.x)}px, ${Math.round(e.point.y)}px, 0)`
        const pr = f.properties ?? {}
        const key = `${(f.geometry as GeoJSON.Point).coordinates.join(',')}|${pr.n}`
        if (key === poiKey) return
        poiKey = key
        setPoiHover({ key, c: Number(pr.c), n: String(pr.n ?? ''), t: String(pr.t ?? ''), s: String(pr.s ?? '') })
      })
      map.getCanvasContainer().addEventListener('mouseleave', () => setPoiHover(null))
      map.easeTo({ ...homeCamera(map, padding()), duration: reducedMotion() ? 0 : 1600 })
      fitWithoutPanelRef.current = !chromeRef.current
      map.on('movestart', (e) => {
        if (e.originalEvent) fitWithoutPanelRef.current = false
      })
      const api: MapApi = {
        map,
        resetView: (opts) => map.flyTo({ ...homeCamera(map, padding()), duration: opts?.duration ?? 1400, essential: true }),
        setInteractive: (on) => {
          interactiveRef.current = on
          hoverRef.current?.setEnabled(on)
        },
        layers: LAYER,
        sources: SOURCE,
        featured: d.featured,
        info: d.info,
        shapes: d.featuredShapes,
      }
      onReadyRef.current?.(map, api)
    })

    const onZoom = () => setZoomedIn(map.getZoom() >= 12)
    map.on('zoom', onZoom)

    return () => {
      cancelled = true
      hoverRef.current?.destroy()
      hoverRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ---- profile switch: paint transitions ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data) return
    if (appliedProfile.current === profile) return
    applyProfile(map, profile, appliedProfile.current)
    applyFeaturedProfile(map, profile)
    appliedProfile.current = profile
  }, [profile, data])

  // ---- weights / solo → heat + fills (coalesced to one paint update per frame) ----
  const appliedMix = useRef<Mix | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data) return
    if (!appliedMix.current) {
      appliedMix.current = mix // layers were created with this mix
      return
    }
    const raf = requestAnimationFrame(() => {
      applyMix(map, data, mix)
      appliedMix.current = mix
    })
    return () => cancelAnimationFrame(raf)
  }, [mix, data])

  const gastroAllowed = useMemo(() => new Set<GastronomyCuisine>(gastronomyCuisines as GastronomyCuisine[]), [gastronomyCuisines])
  const gastroPersonalized =
    gastroAllowed.size > 0 && gastroAllowed.size < ALL_GASTRONOMY_CUISINES.length && weightToUi(weights.gastronomia) > 0

  useEffect(() => {
    if (!poi || !data) return
    resetGastronomyNorm(poi, [...data.info.values()].map((o) => o.labelPoint))
  }, [poi, data])

  const catsForRanking = useCallback(
    (o: OsiedleInfo): Record<CategoryKey, number> => {
      if (!gastroPersonalized || !poi) return o.cats
      return {
        ...o.cats,
        gastronomia: personalGastronomyScore(poi, o.labelPoint, gastroAllowed, o.cats.gastronomia),
      }
    },
    [gastroPersonalized, poi, gastroAllowed],
  )

  // ---- honest ranking: weighted match of every osiedle (solo does not change the ranking) ----
  const ranking = useMemo(() => {
    if (!data) return null
    const match = new Map<string, number>()
    for (const o of data.info.values()) match.set(o.id, weightedMatch(catsForRanking(o), weights, null, scoreCats))
    const sh = shares(weights, null, scoreCats)
    const exact = (o: OsiedleInfo) => CATEGORY_ORDER.reduce((v, c, i) => v + sh[i] * catsForRanking(o)[c], 0)
    const order = [...data.info.values()].map((o) => ({ id: o.id, v: exact(o) })).sort((a, b) => b.v - a.v || a.id.localeCompare(b.id))
    const rank = new Map(order.map((x, i) => [x.id, i + 1]))
    return { match, rank, order: order.map((x) => x.id), total: order.length }
  }, [data, weights, catsForRanking, scoreCats])

  const featuredRanks = useMemo(() => {
    const out: Record<string, FeaturedRank> = {}
    if (!data || !ranking) return out
    for (const f of data.featured) out[f.slug] = { rank: ranking.rank.get(f.msiId) ?? 0, match: ranking.match.get(f.msiId) ?? 0 }
    return out
  }, [data, ranking])
  // ---- the live top 3: pills #1–#3 + a thin outline; they move when the weights change ----
  const topKey = ranking ? ranking.order.slice(0, 3).join('|') : ''
  const topItems: TopItem[] = useMemo(() => {
    if (!data || !ranking || !topKey) return []
    return topKey.split('|').map((id) => {
      const o = data.info.get(id)!
      return { id, slug: o.featuredSlug, name: o.name, center: o.labelPoint, rank: ranking.rank.get(id) ?? 0, match: ranking.match.get(id) ?? 0 }
    })
  }, [data, ranking, topKey])
  useLayoutEffect(() => {
    topIdsRef.current = topKey ? topKey.split('|') : []
  }, [topKey])
  // the osiedle view shows the same rank and match as the pills (one ranking, one source)
  const onRanksRef = useRef(onFeaturedRanks)
  useLayoutEffect(() => {
    onRanksRef.current = onFeaturedRanks
  })
  useEffect(() => {
    if (ranking) onRanksRef.current?.(featuredRanks, ranking.total)
  }, [featuredRanks, ranking])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !data) return
    const ids = topKey ? topKey.split('|') : []
    setTopShapes(map, data, ids)
    applyLabelFilter(map, ids)
  }, [topKey, data])

  const visibleMapSubs = useMemo(
    () => poiSubtypesVisibleOnMap(poiInterests, filterSections, weights),
    [poiInterests, filterSections, weights],
  )

  // ---- POI: tylko zaznaczone typy w szczegółach (+ kuchnie gastronomii) ----
  useEffect(() => {
    const map = mapRef.current
    if (!map || !poi) return
    const gastroCuisines =
      weightToUi(weights.gastronomia) > 0 && gastronomyCuisines.length > 0 ? gastronomyCuisines : []
    applyPoi(map, {
      solo,
      visibleSubtypes: visibleMapSubs,
      visible: chromeVisible,
    })
    applyPoiInterests(map, { subtypes: visibleMapSubs, gastroCuisines, visible: chromeVisible })
    applyPoiTransit(map, { visible: chromeVisible, interestSubtypes: visibleMapSubs })
    applyPoiEducation(map, { visible: chromeVisible, interestSubtypes: visibleMapSubs })
  }, [poi, solo, chromeVisible, visibleMapSubs, gastronomyCuisines, weights.gastronomia])

  // ---- hover + clicks off while an osiedle is selected ----
  useEffect(() => {
    interactiveRef.current = !selectedSlug
    hoverRef.current?.setEnabled(!selectedSlug)
  }, [selectedSlug, data])

  // ---- marker hover → same feature-state highlight on the map ----
  useEffect(() => {
    if (data) hoverRef.current?.highlight(panelHover)
  }, [panelHover, data])

  useLayoutEffect(() => {
    hoverRef.current?.reposition()
  }, [hoveredId])

  // the toast mounts on the next tick — re-clamp the card around it (QA #16)
  useEffect(() => {
    if (!toastSeq) return
    const t = window.setTimeout(() => hoverRef.current?.reposition(), 30)
    return () => window.clearTimeout(t)
  }, [toastSeq])

  const hovered = hoveredId && data ? (data.info.get(hoveredId) ?? null) : null
  const cardData: HoverCardData | null = useMemo(() => {
    if (!hovered || !ranking) return null
    const cats = topCategories(weights, solo, 3)
    const m = metrics?.get(hovered.id)
    const { facts, from } = factsFor(cats, m, poi, m?.anchor ?? hovered.labelPoint, 3)
    return {
      info: hovered,
      match: ranking.match.get(hovered.id) ?? 0,
      rank: ranking.rank.get(hovered.id) ?? 0,
      total: ranking.total,
      cats,
      solo,
      facts,
      factsFrom: from,
    }
  }, [hovered, ranking, weights, solo, metrics, poi])
  const hoveredFeatured = useMemo(
    () => (hovered?.featuredSlug && data ? (data.featured.find((f) => f.slug === hovered.featuredSlug) ?? null) : null),
    [hovered, data],
  )
  const highlighted: string | null = panelHover ?? (hoveredId && topKey.split('|').includes(hoveredId) ? hoveredId : null)

  const zoomBy = useCallback((dz: number) => mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 11) + dz, duration: 300 }), [])
  const reset = useCallback(() => {
    const map = mapRef.current
    const el = containerRef.current
    if (map && el) map.flyTo({ ...homeCamera(map, homePadding(true, el.clientWidth)), duration: 1400, essential: true })
  }, [])
  const select = useCallback((item: TopItem) => {
    if (!interactiveRef.current) return
    if (item.slug) onSelectRef.current(item.slug)
    else setToastSeq((n) => n + 1)
  }, [])

  const a = ACCENTS[profile]
  const style = {
    '--smap-accent': a.base,
    '--smap-accent-soft': a.soft,
    '--smap-accent-mid': a.mid,
    '--smap-accent-deep': a.deep,
    '--accent': a.base,
    '--accent-soft': a.soft,
    '--accent-mid': a.mid,
    '--accent-deep': a.deep,
  } as CSSProperties

  return (
    <div
      className={['smap', chromeVisible ? '' : 'is-chrome-hidden', openDetailCat ? 'is-detail-open' : '', data ? 'is-ready' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-map-profile={profile}
      style={style}
    >
      <div ref={containerRef} className="smap__canvas" />
      {data && mapInst && (
        <FeaturedMarkers
          map={mapInst}
          items={topItems}
          highlighted={highlighted}
          selectedSlug={selectedSlug}
          onSelect={select}
          onHover={setPanelHover}
        />
      )}
      <HoverCard ref={cardRef} data={chromeVisible && !panelHover && !poiHover ? cardData : null} featured={hoveredFeatured} profile={profile} />
      <div ref={poiTipRef} className={`smap-poi-tip${poiHover && chromeVisible ? ' is-visible' : ''}`} role="tooltip" aria-hidden={!poiHover}>
        {poiHover && (
          <span className="smap-poi-tip__inner" key={poiHover.key}>
            {poiHover.n || poiHover.t}
          </span>
        )}
      </div>
      <div className="smap__chrome">
        {data && (
          <div className="smap__left">
            <FilterPanel
              weights={weights}
              horizon={horizon}
              onHorizonChange={onHorizonChange}
              isDefault={isDefault}
              onWeight={setWeight}
              onReset={resetWeights}
              onSoloChange={setSolo}
              poiInterests={poiInterests}
              gastronomyCuisines={gastronomyCuisines}
              detailCat={openDetailCat}
              onDetailCatChange={setDetailCat}
              filterSections={filterSections}
              onFilterSectionsChange={onFilterSectionsChange}
            />
          </div>
        )}
        {data && (
          <div className="smap__right" data-open={openDetailCat ? '' : undefined}>
            <AnimatePresence>
              {openDetailCat && (
                <CategoryFilterPanel
                  key={openDetailCat}
                  category={openDetailCat}
                  onClose={() => setDetailCat(null)}
                  filterSections={filterSections}
                  weight={categoryHasSlider(openDetailCat, filterSections) ? weights[openDetailCat] : 0}
                  gastronomyCuisines={gastronomyCuisines}
                  onToggleGastronomyCuisine={onToggleGastronomyCuisine}
                  poiInterests={poiInterests}
                  onTogglePoiInterest={onTogglePoiInterest}
                />
              )}
            </AnimatePresence>
          </div>
        )}
        <div className="smap__bl">
          <Legend profile={profile} zoomedIn={zoomedIn} solo={solo} heatSource={data?.heatSource ?? null} />
        </div>
        <div className="smap__tr">
          <MapControls onZoomIn={() => zoomBy(1)} onZoomOut={() => zoomBy(-1)} onReset={reset} />
        </div>
      </div>
      <Toast seq={toastSeq} message="Pełny profil tego osiedla wkrótce" />
    </div>
  )
}

export default MapView
