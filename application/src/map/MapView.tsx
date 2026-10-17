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
import { HoverController } from './hover'
import { addMapLayers, applyProfile, LAYER, SOURCE } from './layers'
import { Legend } from './Legend'
import { MapControls } from './MapControls'
import { ACCENTS } from './tokens'
import type { CategoryKey, FeaturedInfo, Horizon, OsiedleInfo, Profile } from './types'
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
  onMapReady,
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
  useLayoutEffect(() => {
    onReadyRef.current = onMapReady
    profileRef.current = profile
  })

  const [data, setData] = useState<MapData | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zoomedIn, setZoomedIn] = useState(false)

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

    map.once('load', async () => {
      warmBasemap(map)
      const d = await dataP
      if (cancelled) return
      addMapLayers(map, d, profileRef.current)
      appliedProfile.current = profileRef.current
      hoverRef.current = new HoverController(map, {
        getProfile: () => profileRef.current,
        info: d.info,
        onChange: setHoveredId,
        getCard: () => cardRef.current,
      })
      setData(d)
      map.easeTo({ ...homeCamera(map, homePadding()), duration: reducedMotion() ? 0 : 1600 })
      const api: MapApi = {
        map,
        resetView: (opts) => map.flyTo({ ...homeCamera(map, homePadding()), duration: opts?.duration ?? 1400, essential: true }),
        setInteractive: (on) => hoverRef.current?.setEnabled(on),
        layers: LAYER,
        sources: SOURCE,
        featured: d.featured,
        info: d.info,
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
    appliedProfile.current = profile
  }, [profile, data])

  // ---- hover off while an osiedle is selected ----
  const chromeVisible = chrome && !selectedSlug
  useEffect(() => {
    hoverRef.current?.setEnabled(!selectedSlug)
  }, [selectedSlug, data])

  const hovered = hoveredId && data ? (data.info.get(hoveredId) ?? null) : null
  const hoveredFeatured = useMemo(
    () => (hovered?.featuredSlug && data ? (data.featured.find((f) => f.slug === hovered.featuredSlug) ?? null) : null),
    [hovered, data],
  )

  const zoomBy = useCallback((dz: number) => mapRef.current?.easeTo({ zoom: (mapRef.current?.getZoom() ?? 11) + dz, duration: 300 }), [])
  const reset = useCallback(() => {
    const map = mapRef.current
    if (map) map.flyTo({ ...homeCamera(map, homePadding()), duration: 1400, essential: true })
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
      <HoverCard ref={cardRef} info={chromeVisible ? hovered : null} featured={hoveredFeatured} profile={profile} priorities={priorities} />
      <div className="smap__chrome">
        <div className="smap__bl">
          <Legend profile={profile} zoomedIn={zoomedIn} />
        </div>
        <div className="smap__tr">
          <MapControls onZoomIn={() => zoomBy(1)} onZoomOut={() => zoomBy(-1)} onReset={reset} />
        </div>
        <p className="smap__note">{DEMO_NOTE}</p>
      </div>
    </div>
  )
}

export default MapView
