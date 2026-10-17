import * as maplibregl from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMapPersonaWave } from '../hooks/useMapPersonaWave'
import { subdivideGridTo200m } from '../lib/grid200m'
import { loadHackathonData, type PersonaId } from '../lib/hackathonData'
import {
  MAP_GRID_FILL_PAINT,
  MAP_GRID_LIFT_PAINT,
  MAP_GRID_LINE_PAINT,
} from '../lib/mapGridPaint'
import {
  addBasemapServiceBuildingLayer,
  applyBasemapBuildingHighlights,
  BASEMAP_3D_BUILDINGS_LAYER,
  BUILDING_EXTRUSION_BASE_EXPR,
  BUILDING_EXTRUSION_HEIGHT_EXPR,
  buildingQueryLayerIds,
  MANUAL_PAINT_CATEGORIES,
  mergeBuildingPicks,
  pickBuildingAtClick,
  pickBuildingsForPois,
  POI_BASEMAP_HIGHLIGHT_LAYER,
  POI_PICK_MIN_ZOOM,
  raiseBuildingLayersAboveGrid,
  resolveBasemapBuildingStack,
  styleHasBuildingExtrusionLayer,
  type BasemapBuildingStack,
  type PickedServiceBuilding,
} from '../lib/mapBasemapBuildingHighlight'
import {
  fetchLocalBuildings,
  resolveLocalBuildingsUrl,
} from '../lib/loadLocalBuildings'
import { fetchLocalRoads, resolveLocalRoadsUrl } from '../lib/loadLocalRoads'
import {
  LOCAL_ROADS_CURB_LAYER,
  LOCAL_ROADS_CURB_PAINT,
  LOCAL_ROADS_SOURCE,
  LOCAL_ROADS_SURFACE_LAYER,
  LOCAL_ROADS_SURFACE_PAINT,
  ROAD_CURB_FILTER,
  ROAD_SURFACE_FILTER,
} from '../lib/localExtrudedRoads'
import { fetchLocalGreen, resolveLocalGreenUrl } from '../lib/loadLocalGreen'
import {
  GREEN_PARK_FILTER,
  GREEN_PITCH_FILTER,
  GREEN_PITCH_LINE_FILTER,
  GREEN_TREE_CANOPY_FILTER,
  GREEN_TREE_TRUNK_FILTER,
  LOCAL_GREEN_PARK_FLOOR_LAYER,
  LOCAL_GREEN_PARK_FLOOR_PAINT,
  LOCAL_GREEN_PARK_LAYER,
  LOCAL_GREEN_PARK_PAINT,
  LOCAL_GREEN_PITCH_LAYER,
  LOCAL_GREEN_PITCH_LINE_LAYER,
  LOCAL_GREEN_PITCH_PAINT,
  LOCAL_GREEN_SOURCE,
  LOCAL_GREEN_TREE_CANOPY_LAYER,
  LOCAL_GREEN_TREE_CANOPY_PAINT,
  LOCAL_GREEN_TREE_TRUNK_LAYER,
  LOCAL_GREEN_TREE_TRUNK_PAINT,
} from '../lib/localExtrudedGreen'
import { fetchLocalWater, resolveLocalWaterUrl } from '../lib/loadLocalWater'
import {
  LOCAL_WATER_SHORE_LAYER,
  LOCAL_WATER_SHORE_PAINT,
  LOCAL_WATER_SOURCE,
  LOCAL_WATER_SURFACE_LAYER,
  LOCAL_WATER_SURFACE_PAINT,
  WATER_SHORE_FILTER,
  WATER_SURFACE_FILTER,
} from '../lib/localExtrudedWater'
import { setBasemapGreenLayersVisible } from '../lib/mapBasemapGreenHide'
import { setBasemapTransportLayersVisible } from '../lib/mapBasemapTransportHide'
import { setBasemapWaterLayersVisible } from '../lib/mapBasemapWaterHide'
import { LOCAL_BUILDING_EXTRUSION_PAINT } from '../lib/localBuildingMaterials'
import {
  autoMatchPoisToLocalBuildings,
  LOCAL_BUILDINGS_LAYER,
  LOCAL_BUILDINGS_SOURCE,
  localBuildingsForMap,
  mergeLocalBuildingPicks,
  pickLocalBuildingAtLngLat,
} from '../lib/localServiceBuildings'
import {
  MAP_BASEMAP_3D_BUILDINGS_MIN_ZOOM,
  MAP_LANDSCAPE_MIN_ZOOM,
  MAP_LOCAL_BUILDINGS_MIN_ZOOM,
} from '../lib/mapDetailZoom'
import {
  POI_BUILDING_COLOR_EXPR,
  POI_BUILDING_EXTRUSION_OPACITY_EXPR,
  POI_BUILDING_HEIGHT_EXPR,
  POI_BUILDING_MIN_ZOOM,
  POI_CIRCLE_OPACITY_EXPR,
  poiBuildingsForMap,
} from '../lib/mapPoiBuildingHighlights'
import 'maplibre-gl/dist/maplibre-gl.css'

const PERSONAS: { id: PersonaId; label: string }[] = [
  { id: 'kasia', label: 'Kasia — spokój' },
  { id: 'marek', label: 'Marek — centrum' },
  { id: 'ania_tomek', label: 'Ania & Tomek — rodzina' },
]

const DEFAULT_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

const GRID_SOURCE = 'siatka-grid'
const GRID_FILL_LAYER = 'siatka-grid-fill'
const GRID_LIFT_LAYER = 'siatka-grid-lift'
const GRID_LINE_LAYER = 'siatka-grid-line'
const POI_SOURCE = 'siatka-poi'
const POI_LAYER = 'siatka-poi-circles'
const POI_DEMO_BUILDINGS_SOURCE = 'siatka-poi-demo-buildings'
const POI_DEMO_BUILDINGS_LAYER = 'siatka-poi-demo-buildings-extrusion'
type Props = {
  initialPersona?: PersonaId
}

export function GridMap({ initialPersona = 'ania_tomek' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const gridClickBound = useRef(false)

  const { manifest, grid, cellMetrics, poiLayers, poiBuildings } = useMemo(
    () => loadHackathonData(),
    [],
  )
  const localBuildingsUrl = useMemo(
    () => resolveLocalBuildingsUrl(manifest.files.localBuildings),
    [manifest.files.localBuildings],
  )
  const localRoadsUrl = useMemo(
    () => resolveLocalRoadsUrl(manifest.files.localRoads),
    [manifest.files.localRoads],
  )
  const localGreenUrl = useMemo(
    () => resolveLocalGreenUrl(manifest.files.localGreen),
    [manifest.files.localGreen],
  )
  const localWaterUrl = useMemo(
    () => resolveLocalWaterUrl(manifest.files.localWater),
    [manifest.files.localWater],
  )
  const useLocalBuildingVolumes = Boolean(localBuildingsUrl)
  const useLocalRoadVolumes = Boolean(localRoadsUrl)
  const useLocalGreenVolumes = Boolean(localGreenUrl)
  const useLocalWaterVolumes = Boolean(localWaterUrl)
  const grid200 = useMemo(() => subdivideGridTo200m(grid), [grid])

  const [persona, setPersona] = useState<PersonaId>(initialPersona)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showPoi, setShowPoi] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [paintBuildingMode, setPaintBuildingMode] = useState(false)
  const [manualPaintCategory, setManualPaintCategory] = useState('manual')
  const [manualBuildingPicks, setManualBuildingPicks] = useState<PickedServiceBuilding[]>([])
  const [buildingPickMessage, setBuildingPickMessage] = useState<string | null>(null)
  const [localBuildings, setLocalBuildings] = useState<import('geojson').FeatureCollection | null>(
    null,
  )
  const [localBuildingsError, setLocalBuildingsError] = useState<string | null>(null)
  const [localRoads, setLocalRoads] = useState<import('geojson').FeatureCollection | null>(
    null,
  )
  const [localRoadsError, setLocalRoadsError] = useState<string | null>(null)
  const [localGreen, setLocalGreen] = useState<import('geojson').FeatureCollection | null>(null)
  const [localGreenError, setLocalGreenError] = useState<string | null>(null)
  const [localWater, setLocalWater] = useState<import('geojson').FeatureCollection | null>(
    null,
  )
  const [localWaterError, setLocalWaterError] = useState<string | null>(null)

  const { geoJson: gridForMap, parentIdForCell } = useMapPersonaWave(
    grid200,
    cellMetrics,
    persona,
    poiLayers,
  )
  const poiCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: poiLayers.flatMap((fc) => fc.features),
    }),
    [poiLayers],
  )

  const autoLocalPoiPicks = useMemo(() => {
    if (!localBuildings || !showPoi) return []
    return autoMatchPoisToLocalBuildings(poiCollection, localBuildings)
  }, [localBuildings, poiCollection, showPoi])

  const localCategoryByOsmId = useMemo(
    () => mergeLocalBuildingPicks(autoLocalPoiPicks, manualBuildingPicks),
    [autoLocalPoiPicks, manualBuildingPicks],
  )

  const localBuildingsOnMap = useMemo(() => {
    if (!localBuildings) return null
    return localBuildingsForMap(localBuildings, localCategoryByOsmId, showPoi)
  }, [localBuildings, localCategoryByOsmId, showPoi])

  const gridForMapRef = useRef(gridForMap)
  gridForMapRef.current = gridForMap
  const poiCollectionRef = useRef(poiCollection)
  poiCollectionRef.current = poiCollection
  const showPoiRef = useRef(showPoi)
  showPoiRef.current = showPoi
  const buildingStackRef = useRef<BasemapBuildingStack | null>(null)
  const localBuildingsRef = useRef(localBuildings)
  localBuildingsRef.current = localBuildings
  const poiBuildingsRef = useRef(poiBuildings)
  poiBuildingsRef.current = poiBuildings
  const manualBuildingPicksRef = useRef(manualBuildingPicks)
  const manualPaintCategoryRef = useRef(manualPaintCategory)
  manualPaintCategoryRef.current = manualPaintCategory
  manualBuildingPicksRef.current = manualBuildingPicks
  const paintBuildingModeRef = useRef(paintBuildingMode)
  paintBuildingModeRef.current = paintBuildingMode

  const metricsParentId = parentIdForCell(selectedCellId)
  const selectedDetail = metricsParentId ? cellMetrics.cells[metricsParentId] : null

  useEffect(() => {
    if (!localBuildingsUrl) return
    let cancelled = false
    setLocalBuildingsError(null)
    fetchLocalBuildings(localBuildingsUrl)
      .then((fc) => {
        if (!cancelled) setLocalBuildings(fc)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLocalBuildingsError(
            err instanceof Error ? err.message : 'Błąd ładowania lokalnych budynków',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [localBuildingsUrl])

  useEffect(() => {
    if (!localRoadsUrl) return
    let cancelled = false
    setLocalRoadsError(null)
    fetchLocalRoads(localRoadsUrl)
      .then((fc) => {
        if (!cancelled) setLocalRoads(fc)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLocalRoadsError(
            err instanceof Error ? err.message : 'Błąd ładowania lokalnych dróg',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [localRoadsUrl])

  useEffect(() => {
    if (!localGreenUrl) return
    let cancelled = false
    setLocalGreenError(null)
    fetchLocalGreen(localGreenUrl)
      .then((fc) => {
        if (!cancelled) setLocalGreen(fc)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLocalGreenError(
            err instanceof Error ? err.message : 'Błąd ładowania lokalnych parków',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [localGreenUrl])

  useEffect(() => {
    if (!localWaterUrl) return
    let cancelled = false
    setLocalWaterError(null)
    fetchLocalWater(localWaterUrl)
      .then((fc) => {
        if (!cancelled) setLocalWater(fc)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLocalWaterError(
            err instanceof Error ? err.message : 'Błąd ładowania lokalnej wody',
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [localWaterUrl])

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const envStyle = import.meta.env.VITE_MAP_STYLE_URL?.trim()
    const styleUrl = envStyle || DEFAULT_STYLE

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [(manifest.bbox[0] + manifest.bbox[2]) / 2, (manifest.bbox[1] + manifest.bbox[3]) / 2],
      zoom: 14.2,
      pitch: 52,
      bearing: -18,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-left')

    map.on('error', (e) => {
      const msg = e.error?.message ?? 'Nie udało się załadować stylu mapy'
      setMapError(msg)
    })

    mapRef.current = map

    map.on('load', () => {
      setMapError(null)
      map.resize()

      map.addSource(GRID_SOURCE, {
        type: 'geojson',
        data: gridForMapRef.current,
        generateId: true,
      })

      map.addLayer({
        id: GRID_FILL_LAYER,
        type: 'fill',
        source: GRID_SOURCE,
        paint: MAP_GRID_FILL_PAINT as maplibregl.FillLayerSpecification['paint'],
      })

      map.addLayer({
        id: GRID_LIFT_LAYER,
        type: 'fill-extrusion',
        source: GRID_SOURCE,
        filter: ['>', ['coalesce', ['get', 'lift'], 0], 0],
        paint: MAP_GRID_LIFT_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      })

      map.addLayer({
        id: GRID_LINE_LAYER,
        type: 'line',
        source: GRID_SOURCE,
        paint: MAP_GRID_LINE_PAINT,
      })

      if (useLocalGreenVolumes) {
        addLocalGreenLayers(map)
      }

      if (useLocalWaterVolumes) {
        addLocalWaterLayers(map)
      }

      if (useLocalRoadVolumes) {
        addLocalRoadLayers(map)
      }

      map.addSource(POI_SOURCE, {
        type: 'geojson',
        data: poiCollectionRef.current,
      })

      map.addLayer({
        id: POI_LAYER,
        type: 'circle',
        source: POI_SOURCE,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 4, 13.5, 8, 14.5, 5],
          'circle-color': POI_BUILDING_COLOR_EXPR,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0d1a30',
          'circle-opacity': POI_CIRCLE_OPACITY_EXPR,
        } as maplibregl.CircleLayerSpecification['paint'],
      })

      if (useLocalBuildingVolumes) {
        map.addSource(LOCAL_BUILDINGS_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          promoteId: 'osm_id',
        })
        map.addLayer({
          id: LOCAL_BUILDINGS_LAYER,
          type: 'fill-extrusion',
          source: LOCAL_BUILDINGS_SOURCE,
          minzoom: MAP_LOCAL_BUILDINGS_MIN_ZOOM,
          paint: LOCAL_BUILDING_EXTRUSION_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
        })
        setBasemapBuildingExtrusionVisible(map, false)
      } else {
        add3dBuildingsIfAvailable(map)
        const buildingStack = resolveBasemapBuildingStack(map)
        buildingStackRef.current = buildingStack
        if (buildingStack) {
          addBasemapServiceBuildingLayer(map, buildingStack)
        }

        map.addSource(POI_DEMO_BUILDINGS_SOURCE, {
          type: 'geojson',
          data: poiBuildingsForMap(poiBuildingsRef.current, showPoiRef.current),
        })
        map.addLayer({
          id: POI_DEMO_BUILDINGS_LAYER,
          type: 'fill-extrusion',
          source: POI_DEMO_BUILDINGS_SOURCE,
          minzoom: POI_BUILDING_MIN_ZOOM,
          paint: {
            'fill-extrusion-color': POI_BUILDING_COLOR_EXPR,
            'fill-extrusion-height': POI_BUILDING_HEIGHT_EXPR,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': POI_BUILDING_EXTRUSION_OPACITY_EXPR,
          } as maplibregl.FillExtrusionLayerSpecification['paint'],
        })
      }

      orderLandscapeLayersOnMap(
        map,
        useLocalBuildingVolumes,
        useLocalRoadVolumes,
        useLocalGreenVolumes,
        useLocalWaterVolumes,
      )

      map.fitBounds(
        [
          [manifest.bbox[0], manifest.bbox[1]],
          [manifest.bbox[2], manifest.bbox[3]],
        ],
        { padding: 56, pitch: 52, duration: 0 },
      )

      setMapLoaded(true)

      if (!gridClickBound.current) {
        gridClickBound.current = true
        const onGridPick = (e: maplibregl.MapLayerMouseEvent) => {
          if (paintBuildingModeRef.current) return
          const id = e.features?.[0]?.properties?.id as string | undefined
          setSelectedCellId(id ?? null)
        }
        map.on('click', GRID_FILL_LAYER, onGridPick)
        map.on('click', GRID_LIFT_LAYER, onGridPick)
        map.on('mouseenter', GRID_FILL_LAYER, () => {
          map.getCanvas().style.cursor = 'pointer'
        })
        map.on('mouseleave', GRID_FILL_LAYER, () => {
          map.getCanvas().style.cursor = ''
        })
      }
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(mapContainerRef.current)

    return () => {
      ro.disconnect()
      gridClickBound.current = false
      setMapLoaded(false)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, [manifest.bbox])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const gridSource = map.getSource(GRID_SOURCE) as maplibregl.GeoJSONSource | undefined
    gridSource?.setData(gridForMap)
  }, [gridForMap, mapLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const poiVisibility = showPoi ? 'visible' : 'none'
    if (map.getLayer(POI_LAYER)) {
      map.setLayoutProperty(POI_LAYER, 'visibility', poiVisibility)
    }
    if (map.getLayer(POI_DEMO_BUILDINGS_LAYER)) {
      map.setLayoutProperty(POI_DEMO_BUILDINGS_LAYER, 'visibility', poiVisibility)
    }
    if (map.getLayer(LOCAL_BUILDINGS_LAYER)) {
      map.setLayoutProperty(LOCAL_BUILDINGS_LAYER, 'visibility', 'visible')
    }
    if (map.getLayer(POI_BASEMAP_HIGHLIGHT_LAYER)) {
      map.setLayoutProperty(POI_BASEMAP_HIGHLIGHT_LAYER, 'visibility', 'visible')
    }
    const poiSource = map.getSource(POI_SOURCE) as maplibregl.GeoJSONSource | undefined
    poiSource?.setData(poiCollection)
    const poiDemoBuildingsSource = map.getSource(POI_DEMO_BUILDINGS_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    poiDemoBuildingsSource?.setData(
      poiBuildingsForMap(poiBuildings, showPoi),
    )

    const localSource = map.getSource(LOCAL_BUILDINGS_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    if (useLocalGreenVolumes) {
      addLocalGreenLayers(map)
    }
    if (useLocalWaterVolumes) {
      addLocalWaterLayers(map)
    }
    if (useLocalRoadVolumes) {
      addLocalRoadLayers(map)
    }

    const localWaterSource = map.getSource(LOCAL_WATER_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    const localGreenSource = map.getSource(LOCAL_GREEN_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined

    if (localWaterSource && localWater) {
      localWaterSource.setData(localWater)
      setBasemapWaterLayersVisible(map, false)
      orderLandscapeLayersOnMap(
        map,
        useLocalBuildingVolumes,
        useLocalRoadVolumes,
        useLocalGreenVolumes,
        true,
      )
    }

    if (localGreenSource && localGreen) {
      localGreenSource.setData(localGreen)
      setBasemapGreenLayersVisible(map, false)
      orderLandscapeLayersOnMap(
        map,
        useLocalBuildingVolumes,
        useLocalRoadVolumes,
        true,
        useLocalWaterVolumes,
      )
    }

    const localRoadsSourceAfter = map.getSource(LOCAL_ROADS_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    if (localRoadsSourceAfter && localRoads) {
      localRoadsSourceAfter.setData(localRoads)
      setBasemapTransportLayersVisible(map, false)
      orderLandscapeLayersOnMap(
        map,
        useLocalBuildingVolumes,
        true,
        useLocalGreenVolumes,
        useLocalWaterVolumes,
      )
    }

    if (localWater || localGreen || localRoads) {
      orderLandscapeLayersOnMap(
        map,
        useLocalBuildingVolumes,
        useLocalRoadVolumes,
        useLocalGreenVolumes,
        useLocalWaterVolumes,
      )
    }

    if (localSource && localBuildingsOnMap) {
      localSource.setData(localBuildingsOnMap)
      orderLandscapeLayersOnMap(
        map,
        true,
        useLocalRoadVolumes,
        useLocalGreenVolumes,
        useLocalWaterVolumes,
      )
      setBasemapBuildingExtrusionVisible(map, false)
    }

    if (useLocalBuildingVolumes) {
      return
    }

    const syncBasemapServiceBuildings = () => {
      orderLandscapeLayersOnMap(
        map,
        false,
        useLocalRoadVolumes,
        useLocalGreenVolumes,
        useLocalWaterVolumes,
      )
      const stack = buildingStackRef.current ?? resolveBasemapBuildingStack(map)
      if (!stack) return
      buildingStackRef.current = stack

      const poiPicks = showPoi
        ? pickBuildingsForPois(map, poiCollection, buildingQueryLayerIds(map))
        : []
      const picks = mergeBuildingPicks(poiPicks, manualBuildingPicksRef.current)

      applyBasemapBuildingHighlights(map, stack, picks)
    }

    syncBasemapServiceBuildings()
    map.on('idle', syncBasemapServiceBuildings)
    map.on('zoomend', syncBasemapServiceBuildings)
    map.on('moveend', syncBasemapServiceBuildings)

    return () => {
      map.off('idle', syncBasemapServiceBuildings)
      map.off('zoomend', syncBasemapServiceBuildings)
      map.off('moveend', syncBasemapServiceBuildings)
    }
  }, [
    poiCollection,
    poiBuildings,
    localBuildingsOnMap,
    localRoads,
    localGreen,
    localWater,
    showPoi,
    manualBuildingPicks,
    mapLoaded,
    useLocalBuildingVolumes,
    useLocalRoadVolumes,
    useLocalGreenVolumes,
    useLocalWaterVolumes,
  ])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const commitManualPick = (pick: PickedServiceBuilding) => {
      setManualBuildingPicks((prev) => {
        const rest = prev.filter((p) => p.highlightId !== pick.highlightId)
        return [...rest, pick]
      })
      setBuildingPickMessage(
        `OK: osm/id ${pick.highlightId} → „${pick.category}”.`,
      )
    }

    const onPaintBuildingClick = (e: maplibregl.MapMouseEvent | maplibregl.MapLayerMouseEvent) => {
      if (!paintBuildingModeRef.current) return

      const buildings = localBuildingsRef.current
      if (buildings?.features.length) {
        const pick = pickLocalBuildingAtLngLat(
          e.lngLat.lng,
          e.lngLat.lat,
          buildings,
          manualPaintCategoryRef.current,
        )
        if (!pick) {
          setBuildingPickMessage('Brak lokalnego budynku w tym miejscu — kliknij w bryłę 3D.')
          return
        }
        commitManualPick(pick)
        return
      }

      if (map.getZoom() < POI_PICK_MIN_ZOOM) {
        setBuildingPickMessage(
          `Przybliż mapę (zoom ≥ ${POI_PICK_MIN_ZOOM}, teraz ${map.getZoom().toFixed(1)}).`,
        )
        return
      }

      const pick = pickBuildingAtClick(map, e, manualPaintCategoryRef.current)
      if (!pick) {
        setBuildingPickMessage(
          'Brak budynku w tym miejscu — kliknij bezpośrednio w szary blok 3D (nie w pustą siatkę).',
        )
        return
      }

      commitManualPick(pick)
    }

    const buildingLayerIds = localBuildingsRef.current?.features.length
      ? [LOCAL_BUILDINGS_LAYER]
      : buildingQueryLayerIds(map)

    if (paintBuildingMode) {
      map.on('click', onPaintBuildingClick)
      for (const layerId of buildingLayerIds) {
        if (map.getLayer(layerId)) {
          map.on('click', layerId, onPaintBuildingClick)
        }
      }
      map.getCanvas().style.cursor = 'crosshair'
    } else {
      map.getCanvas().style.cursor = ''
    }

    return () => {
      map.off('click', onPaintBuildingClick)
      for (const layerId of buildingLayerIds) {
        map.off('click', layerId, onPaintBuildingClick)
      }
    }
  }, [paintBuildingMode, manualPaintCategory, mapLoaded])

  return (
    <div className="grid-map">
      <div ref={mapContainerRef} className="grid-map__canvas" />

      <header className="grid-map__bar">
        <h1>Siatka</h1>
        <a className="grid-map__lab-link" href="/lab/grid">Lab kratki</a>
        <label>
          Persona
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value as PersonaId)}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="grid-map__checkbox">
          <input
            type="checkbox"
            checked={showPoi}
            onChange={(e) => setShowPoi(e.target.checked)}
          />
          Usługi (punkty / budynki)
        </label>
        <label className="grid-map__checkbox grid-map__checkbox--paint">
          <input
            type="checkbox"
            checked={paintBuildingMode}
            onChange={(e) => setPaintBuildingMode(e.target.checked)}
          />
          Koloruj budynek (klik)
        </label>
        {paintBuildingMode && (
          <label>
            Kolor
            <select
              value={manualPaintCategory}
              onChange={(e) => setManualPaintCategory(e.target.value)}
            >
              {MANUAL_PAINT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
        )}
        {manualBuildingPicks.length > 0 && (
          <button
            type="button"
            className="grid-map__clear-buildings"
            onClick={() => {
              setManualBuildingPicks([])
              setBuildingPickMessage('Wyczyszczono ręczne podświetlenia.')
            }}
          >
            Wyczyść ręczne ({manualBuildingPicks.length})
          </button>
        )}
      </header>

      {(paintBuildingMode || buildingPickMessage || manualBuildingPicks.length > 0) && (
        <aside className="grid-map__paint-panel" aria-live="polite">
          <h2>Podświetlenie budynków (dowód)</h2>
          {paintBuildingMode ? (
            <p>
              Kliknij <strong>budynek 3D</strong>
              {useLocalBuildingVolumes ? ' (lokalny GeoJSON OSM)' : ` (zoom ≥ ${POI_PICK_MIN_ZOOM})`}.
            </p>
          ) : (
            <p>Włącz „Koloruj budynek (klik)” w pasku u góry.</p>
          )}
          {buildingPickMessage && <p className="grid-map__paint-msg">{buildingPickMessage}</p>}
          {manualBuildingPicks.length > 0 && (
            <ul className="grid-map__paint-list">
              {manualBuildingPicks.map((p) => (
                <li key={p.highlightId}>
                  <code>{p.highlightId}</code>
                  <span>{p.category}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      )}

      {selectedCellId && selectedDetail && (
        <aside className="grid-map__panel">
          <button type="button" className="grid-map__close" onClick={() => setSelectedCellId(null)}>
            ×
          </button>
          <h2>{metricsParentId}</h2>
          <p className="grid-map__score">
            Wynik ({persona}):{' '}
            <strong>
              {selectedDetail.scores[persona] ?? '—'}
            </strong>
            {selectedDetail.scores[persona] != null ? '/100' : ' (poza wyspą danych)'}
          </p>
          <p className="grid-map__meta-line">
            Komórka mapy: <code>{selectedCellId}</code> (~200 m)
          </p>
          <ul className="grid-map__metrics">
            {Object.entries(selectedDetail.metrics).map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{v ?? '—'}</span>
              </li>
            ))}
          </ul>
          {selectedDetail.narrative?.pl && (
            <div className="grid-map__narrative">
              {selectedDetail.narrative.pl.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </aside>
      )}

      {mapError && (
        <p className="grid-map__hint grid-map__hint--error">
          Błąd mapy: {mapError}. Sprawdź <code>VITE_MAP_STYLE_URL</code> w{' '}
          <code>application/.env</code>.
        </p>
      )}

      {localWaterError && (
        <p className="grid-map__error" role="alert">
          {localWaterError}. Uruchom{' '}
          <code>node ../data/scripts/build_osm_water_sample.mjs</code> z katalogu{' '}
          <code>application</code>.
        </p>
      )}
      {localGreenError && (
        <p className="grid-map__error" role="alert">
          {localGreenError}. Uruchom{' '}
          <code>node ../data/scripts/build_osm_green_sample.mjs</code> z katalogu{' '}
          <code>application</code>.
        </p>
      )}
      {localRoadsError && (
        <p className="grid-map__error" role="alert">
          {localRoadsError}. Uruchom{' '}
          <code>node ../data/scripts/build_osm_roads_sample.mjs</code> z katalogu{' '}
          <code>application</code>.
        </p>
      )}
      {localBuildingsError && (
        <p className="grid-map__hint grid-map__hint--error">
          {localBuildingsError}. Uruchom{' '}
          <code>python3 data/scripts/fetch_osm_buildings.py</code>.
        </p>
      )}

     
    </div>
  )
}

function addLocalWaterLayers(map: maplibregl.Map) {
  if (!map.getSource(LOCAL_WATER_SOURCE)) {
    map.addSource(LOCAL_WATER_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  const beforeLift = GRID_LIFT_LAYER
  if (!map.getLayer(LOCAL_WATER_SHORE_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_WATER_SHORE_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_WATER_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.water,
        filter: WATER_SHORE_FILTER,
        paint: LOCAL_WATER_SHORE_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_WATER_SURFACE_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_WATER_SURFACE_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_WATER_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.water,
        filter: WATER_SURFACE_FILTER,
        paint: LOCAL_WATER_SURFACE_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  setBasemapWaterLayersVisible(map, false)
}

function addLocalGreenLayers(map: maplibregl.Map) {
  if (!map.getSource(LOCAL_GREEN_SOURCE)) {
    map.addSource(LOCAL_GREEN_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  const beforeLift = GRID_LIFT_LAYER
  if (!map.getLayer(LOCAL_GREEN_PARK_FLOOR_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_PARK_FLOOR_LAYER,
        type: 'fill',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenParkFloor,
        filter: GREEN_PARK_FILTER,
        paint: LOCAL_GREEN_PARK_FLOOR_PAINT as maplibregl.FillLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_GREEN_PARK_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_PARK_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenPark,
        filter: GREEN_PARK_FILTER,
        paint: LOCAL_GREEN_PARK_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_GREEN_PITCH_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_PITCH_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenPitch,
        filter: GREEN_PITCH_FILTER,
        paint: LOCAL_GREEN_PITCH_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_GREEN_PITCH_LINE_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_PITCH_LINE_LAYER,
        type: 'line',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenPitchLine,
        filter: GREEN_PITCH_LINE_FILTER,
        paint: {
          'line-color': '#eef3ee',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            MAP_LANDSCAPE_MIN_ZOOM.greenPitchLine,
            0.6,
            16,
            2.2,
          ],
          'line-opacity': 0.92,
        },
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_GREEN_TREE_TRUNK_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_TREE_TRUNK_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenTrees,
        filter: GREEN_TREE_TRUNK_FILTER,
        paint: LOCAL_GREEN_TREE_TRUNK_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  if (!map.getLayer(LOCAL_GREEN_TREE_CANOPY_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_GREEN_TREE_CANOPY_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_GREEN_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.greenTrees,
        filter: GREEN_TREE_CANOPY_FILTER,
        paint: LOCAL_GREEN_TREE_CANOPY_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      beforeLift,
    )
  }
  setBasemapGreenLayersVisible(map, false)
}

function addLocalRoadLayers(map: maplibregl.Map) {
  if (!map.getSource(LOCAL_ROADS_SOURCE)) {
    map.addSource(LOCAL_ROADS_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
  }
  if (!map.getLayer(LOCAL_ROADS_CURB_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_ROADS_CURB_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_ROADS_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.roads,
        filter: ROAD_CURB_FILTER,
        paint: LOCAL_ROADS_CURB_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      GRID_LIFT_LAYER,
    )
  }
  if (!map.getLayer(LOCAL_ROADS_SURFACE_LAYER)) {
    map.addLayer(
      {
        id: LOCAL_ROADS_SURFACE_LAYER,
        type: 'fill-extrusion',
        source: LOCAL_ROADS_SOURCE,
        minzoom: MAP_LANDSCAPE_MIN_ZOOM.roads,
        filter: ROAD_SURFACE_FILTER,
        paint: LOCAL_ROADS_SURFACE_PAINT as maplibregl.FillExtrusionLayerSpecification['paint'],
      },
      GRID_LIFT_LAYER,
    )
  }
  setBasemapTransportLayersVisible(map, false)
}

function setBasemapBuildingExtrusionVisible(map: maplibregl.Map, visible: boolean) {
  const stack = resolveBasemapBuildingStack(map)
  const visibility = visible ? 'visible' : 'none'
  if (stack?.extrusionLayerId && map.getLayer(stack.extrusionLayerId)) {
    map.setLayoutProperty(stack.extrusionLayerId, 'visibility', visibility)
  }
  if (map.getLayer(BASEMAP_3D_BUILDINGS_LAYER)) {
    map.setLayoutProperty(BASEMAP_3D_BUILDINGS_LAYER, 'visibility', visibility)
  }
}

function landscapeInsertBeforeId(map: maplibregl.Map): string | undefined {
  if (map.getLayer(POI_LAYER)) return POI_LAYER
  if (map.getLayer(LOCAL_BUILDINGS_LAYER)) return LOCAL_BUILDINGS_LAYER
  if (map.getLayer(GRID_LINE_LAYER)) return GRID_LINE_LAYER
  return undefined
}

function orderLandscapeLayersOnMap(
  map: maplibregl.Map,
  localBuildingVolumes: boolean,
  localRoadVolumes: boolean,
  localGreenVolumes: boolean,
  localWaterVolumes: boolean,
) {
  const beforeId = landscapeInsertBeforeId(map)
  if (!beforeId) return

  const landscapeStack: string[] = []
  if (localGreenVolumes) {
    landscapeStack.push(
      LOCAL_GREEN_PARK_FLOOR_LAYER,
      LOCAL_GREEN_PARK_LAYER,
      LOCAL_GREEN_PITCH_LAYER,
    )
  }
  if (localWaterVolumes) {
    landscapeStack.push(LOCAL_WATER_SHORE_LAYER, LOCAL_WATER_SURFACE_LAYER)
  }
  if (localGreenVolumes) {
    landscapeStack.push(
      LOCAL_GREEN_PITCH_LINE_LAYER,
      LOCAL_GREEN_TREE_TRUNK_LAYER,
      LOCAL_GREEN_TREE_CANOPY_LAYER,
    )
  }
  if (localRoadVolumes) {
    landscapeStack.push(LOCAL_ROADS_CURB_LAYER, LOCAL_ROADS_SURFACE_LAYER)
  }

  for (const id of landscapeStack) {
    if (map.getLayer(id)) {
      map.moveLayer(id, beforeId)
    }
  }

  if (localBuildingVolumes) {
    if (map.getLayer(LOCAL_BUILDINGS_LAYER)) {
      map.moveLayer(LOCAL_BUILDINGS_LAYER)
    }
    return
  }
  raiseBuildingLayersAboveGrid(map)
  if (map.getLayer(POI_DEMO_BUILDINGS_LAYER) && map.getLayer(POI_BASEMAP_HIGHLIGHT_LAYER)) {
    map.moveLayer(POI_DEMO_BUILDINGS_LAYER, POI_BASEMAP_HIGHLIGHT_LAYER)
  } else if (map.getLayer(POI_DEMO_BUILDINGS_LAYER)) {
    map.moveLayer(POI_DEMO_BUILDINGS_LAYER)
  }
}

function add3dBuildingsIfAvailable(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? []
  if (styleHasBuildingExtrusionLayer(layers) || map.getLayer(BASEMAP_3D_BUILDINGS_LAYER)) {
    return
  }

  const labelLayerId = layers.find(
    (l) => l.type === 'symbol' && 'layout' in l && l.layout?.['text-field'],
  )?.id
  const buildingLayer = layers.find(
    (l) =>
      l.type === 'fill' &&
      (l as maplibregl.FillLayerSpecification)['source-layer'] === 'building',
  ) as maplibregl.FillLayerSpecification | undefined

  if (!buildingLayer?.source) return

  map.addLayer(
    {
      id: BASEMAP_3D_BUILDINGS_LAYER,
      type: 'fill-extrusion',
      source: buildingLayer.source,
      'source-layer': buildingLayer['source-layer'],
      filter: ['==', ['get', 'extrude'], 'true'],
      minzoom: MAP_BASEMAP_3D_BUILDINGS_MIN_ZOOM,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'height'], ['get', 'render_height'], 0],
          0,
          '#c4c4c4',
          80,
          '#e8e4dc',
        ],
        'fill-extrusion-height': BUILDING_EXTRUSION_HEIGHT_EXPR,
        'fill-extrusion-base': BUILDING_EXTRUSION_BASE_EXPR,
        'fill-extrusion-opacity': 0.85,
      },
    },
    labelLayerId,
  )
}
