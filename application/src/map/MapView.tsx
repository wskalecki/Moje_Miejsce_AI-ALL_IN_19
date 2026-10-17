import '../lib/maplibreSetup'
import { Map as MlMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  DEMO_NOTE,
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
import { HoverCard } from './HoverCard'
import { FeaturedMarkers } from './FeaturedMarkers'
import { addFeaturedLayers, applyFeaturedProfile } from './featuredLayers'
import { HOVER_MIN_ZOOM, HoverController } from './hover'
import { addMapLayers, applyProfile, LAYER, SOURCE } from './layers'
import { Legend } from './Legend'
import { MapControls } from './MapControls'
import { RecommendedPanel } from './RecommendedPanel'
import { Toast } from './Toast'
import { ACCENTS } from './tokens'
import type { CategoryKey, FeaturedInfo, FeaturedSlug, Horizon, OsiedleInfo, Profile } from './types'
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
  /** Polygons of the 3 featured osiedla (`properties.featured_slug`). */
  shapes: MapData['featuredShapes']
}

export interface MapViewProps {
  profile: Profile
  /** Survey priorities in selection order — drives the hover bars. */
  priorities?: readonly CategoryKey[]
  horizon?: Horizon
  /** Slug from `/mapa/:slug`; when set the map chrome fades out and hover is off. */
  selectedSlug?: string | null
  onSelectFeatured: (slug: string) => void
  /** Called once, after the style, data and all map layers are ready. */
  onMapReady?: (map: MlMap, api: MapApi) => void
  /** Presenter switch: when given, the "Polecane" panel shows a 3-profile toggle that calls this. */
  onProfileChange?: (p: Profile) => void
  /** Hide all overlays (legend, panel, controls) — e.g. while the cinematic transition runs. */
  chrome?: boolean
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

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function MapView({
  profile,
  priorities,
  selectedSlug = null,
  onSelectFeatured,
  onMapReady,
  onProfileChange,
  chrome = true,
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
  useLayoutEffect(() => {
    onReadyRef.current = onMapReady
    onSelectRef.current = onSelectFeatured
    profileRef.current = profile
    chromeRef.current = chromeVisible
  })

  const [data, setData] = useState<MapData | null>(null)
  const [mapInst, setMapInst] = useState<MlMap | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [panelHover, setPanelHover] = useState<FeaturedSlug | null>(null)
  const [zoomedIn, setZoomedIn] = useState(false)
  const [toastSeq, setToastSeq] = useState(0)

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
      dragRotate: false,
      pitchWithRotate: false,
    })
    map.touchZoomRotate.disableRotation()
    map.getCanvas().setAttribute('aria-label', 'Mapa dopasowania osiedli Warszawy')
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
      addMapLayers(map, d, profileRef.current)
      addFeaturedLayers(map, profileRef.current)
      appliedProfile.current = profileRef.current
      hoverRef.current = new HoverController(map, {
        getProfile: () => profileRef.current,
        info: d.info,
        extraLayers: () => [LAYER.featuredFill],
        onChange: (id) => {
          setHoveredId(id)
          map.getCanvas().style.cursor = id && d.info.get(id)?.featuredSlug ? 'pointer' : ''
        },
        getCard: () => cardRef.current,
      })

      // Only the 3 featured osiedla open; any other osiedle shows the "wkrótce" toast.
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
        if (hits.length && map.getZoom() >= HOVER_MIN_ZOOM) setToastSeq((n) => n + 1)
      })

      setData(d)
      setMapInst(map)
      map.easeTo({ ...homeCamera(map, padding()), duration: reducedMotion() ? 0 : 1600 })
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

  // ---- hover + clicks off while an osiedle is selected ----
  useEffect(() => {
    interactiveRef.current = !selectedSlug
    hoverRef.current?.setEnabled(!selectedSlug)
  }, [selectedSlug, data])

  // ---- panel / marker hover → same feature-state highlight on the map ----
  useEffect(() => {
    if (!data) return
    const msi = panelHover ? data.featured.find((f) => f.slug === panelHover)?.msiId : null
    hoverRef.current?.highlight(msi ?? null)
  }, [panelHover, data])

  useLayoutEffect(() => {
    hoverRef.current?.reposition()
  }, [hoveredId])

  const hovered = hoveredId && data ? (data.info.get(hoveredId) ?? null) : null
  const hoveredFeatured = useMemo(
    () => (hovered?.featuredSlug && data ? (data.featured.find((f) => f.slug === hovered.featuredSlug) ?? null) : null),
    [hovered, data],
  )
  const highlighted: FeaturedSlug | null = panelHover ?? hoveredFeatured?.slug ?? null

  const zoomBy = useCallback((dz: number) => mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 11) + dz, duration: 300 }), [])
  const reset = useCallback(() => {
    const map = mapRef.current
    const el = containerRef.current
    if (map && el) map.flyTo({ ...homeCamera(map, homePadding(true, el.clientWidth)), duration: 1400, essential: true })
  }, [])
  const select = useCallback((slug: FeaturedSlug) => {
    if (interactiveRef.current) onSelectRef.current(slug)
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
      className={['smap', chromeVisible ? '' : 'is-chrome-hidden', data ? 'is-ready' : '', className].filter(Boolean).join(' ')}
      data-map-profile={profile}
      style={style}
    >
      <div ref={containerRef} className="smap__canvas" />
      {data && mapInst && (
        <FeaturedMarkers
          map={mapInst}
          featured={data.featured}
          profile={profile}
          highlighted={highlighted}
          selectedSlug={selectedSlug}
          onSelect={select}
          onHover={setPanelHover}
        />
      )}
      <HoverCard
        ref={cardRef}
        info={chromeVisible && !panelHover ? hovered : null}
        featured={hoveredFeatured}
        profile={profile}
        priorities={priorities}
      />
      <div className="smap__chrome">
        {data && (
          <div className="smap__left">
            <RecommendedPanel
              featured={data.featured}
              profile={profile}
              highlighted={highlighted}
              onHover={setPanelHover}
              onSelect={select}
              onProfileChange={onProfileChange}
            />
          </div>
        )}
        <div className="smap__bl">
          <Legend profile={profile} zoomedIn={zoomedIn} />
        </div>
        <div className="smap__tr">
          <MapControls onZoomIn={() => zoomBy(1)} onZoomOut={() => zoomBy(-1)} onReset={reset} />
        </div>
        <p className="smap__note">{DEMO_NOTE}</p>
      </div>
      <Toast seq={toastSeq} message="Pełny profil tego osiedla wkrótce" />
    </div>
  )
}

export default MapView
