import * as maplibregl from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadHackathonData,
  loadLineLayers,
  loadPoiLayers,
  loadTravelTimes,
  type CellMetricsFile,
  type GridFeatureCollection,
  type LineFeatureCollection,
  type PersonaId,
  type PoiFeatureCollection,
} from '../lib/hackathonData'
import { poiPopupHtml } from '../lib/poiPopup'
import { POI_SUBTYPES, poiColorExpression, subtypeStyle } from '../lib/poiStyles'
import {
  MODE_LABELS,
  TRAVEL_SCALE,
  UNREACHABLE_COLOR,
  formatTravel,
  travelColorExpression,
  travelLayerData,
  type TravelTimesFile,
} from '../lib/travelTimes'
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
const GRID_LINE_LAYER = 'siatka-grid-line'
const POI_SOURCE = 'siatka-poi'
const POI_LAYER = 'siatka-poi-circles'
const LINE_SOURCE = 'siatka-lines'
const LINE_LAYER = 'siatka-lines-line'
const LINE_POINT_LAYER = 'siatka-lines-points'
// Transparent wide copy of the lines: a 2–5 px line is too thin to click.
const LINE_HIT_LAYER = 'siatka-lines-hit'
const CLICKABLE_LAYERS = [POI_LAYER, LINE_POINT_LAYER, LINE_HIT_LAYER]
const TRAVEL_SOURCE = 'siatka-travel'
const TRAVEL_FILL_LAYER = 'siatka-travel-fill'
const CELL_LAYERS = [GRID_FILL_LAYER, TRAVEL_FILL_LAYER]
const WARSAW_BOUNDS: [[number, number], [number, number]] = [[20.85, 52.09], [21.28, 52.37]]

type View = 'ocena' | 'dojazd'
const LINE_GEOMETRY: maplibregl.ExpressionSpecification = ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]]
const POINT_GEOMETRY: maplibregl.ExpressionSpecification = ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]]

type Props = {
  initialPersona?: PersonaId
}

export function GridMap({ initialPersona = 'ania_tomek' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const gridClickBound = useRef(false)

  const { manifest, grid, cellMetrics } = useMemo(() => loadHackathonData(), [])
  const [persona, setPersona] = useState<PersonaId>(initialPersona)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showPoi, setShowPoi] = useState(true)
  const [poiLayers, setPoiLayers] = useState<PoiFeatureCollection[]>([])
  const [poiIsSample, setPoiIsSample] = useState(false)
  const [lineLayers, setLineLayers] = useState<LineFeatureCollection[]>([])
  const [hiddenSubtypes, setHiddenSubtypes] = useState<Set<string>>(() => new Set())
  const [legendOpen, setLegendOpen] = useState(true)
  const [view, setView] = useState<View>('ocena')
  const [travel, setTravel] = useState<TravelTimesFile | null>(null)
  const [travelTarget, setTravelTarget] = useState('')
  const [travelMode, setTravelMode] = useState('wszystkie')
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const enrichedGrid = useMemo(
    () => enrichGridWithScores(grid, cellMetrics, persona),
    [grid, cellMetrics, persona],
  )

  useEffect(() => {
    let cancelled = false
    loadPoiLayers(manifest).then(({ layers, isSample }) => {
      if (cancelled) return
      setPoiLayers(layers)
      setPoiIsSample(isSample)
    })
    loadLineLayers(manifest).then((layers) => {
      if (!cancelled) setLineLayers(layers)
    })
    loadTravelTimes(manifest).then((file) => {
      if (cancelled || !file) return
      setTravel(file)
      setTravelTarget(Object.keys(file.metadata.cele)[0] ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [manifest])

  const poiCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: poiLayers.flatMap((fc) => fc.features),
    }),
    [poiLayers],
  )

  const lineCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: lineLayers.flatMap((fc) => fc.features),
    }),
    [lineLayers],
  )

  const subtypeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const f of [...poiCollection.features, ...lineCollection.features]) {
      counts.set(f.properties.subtype, (counts.get(f.properties.subtype) ?? 0) + 1)
    }
    const order = Object.keys(POI_SUBTYPES)
    return [...counts.entries()].sort(([a], [b]) => {
      const ia = order.indexOf(a)
      const ib = order.indexOf(b)
      return (ia < 0 ? order.length : ia) - (ib < 0 ? order.length : ib)
    })
  }, [poiCollection, lineCollection])

  const toggleSubtype = (subtype: string) =>
    setHiddenSubtypes((prev) => {
      const next = new Set(prev)
      if (!next.delete(subtype)) next.add(subtype)
      return next
    })

  const travelData = useMemo(
    () => (travel && travelTarget ? travelLayerData(travel, travelTarget, travelMode) : null),
    [travel, travelTarget, travelMode],
  )
  const travelByCell = useMemo(
    () => new Map((travel?.features ?? []).map((f) => [f.properties.id, f.properties])),
    [travel],
  )

  const selectedDetail = selectedCellId && view === 'ocena' ? cellMetrics.cells[selectedCellId] : null
  const selectedTravel = selectedCellId && view === 'dojazd' ? travelByCell.get(selectedCellId) : undefined

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const envStyle = import.meta.env.VITE_MAP_STYLE_URL?.trim()
    const styleUrl = envStyle || DEFAULT_STYLE

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: styleUrl,
      center: [(manifest.bbox[0] + manifest.bbox[2]) / 2, (manifest.bbox[1] + manifest.bbox[3]) / 2],
      zoom: 12,
      pitch: 45,
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
        data: enrichedGrid,
        generateId: true,
      })

      map.addLayer({
        id: GRID_FILL_LAYER,
        type: 'fill',
        source: GRID_SOURCE,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'score'], 0],
            0,
            '#3d4f6f',
            25,
            '#5a7a8c',
            50,
            '#4a9b7f',
            75,
            '#9bb86a',
            100,
            '#c9e265',
          ],
          'fill-opacity': 0.72,
        },
      })

      map.addLayer({
        id: GRID_LINE_LAYER,
        type: 'line',
        source: GRID_SOURCE,
        paint: {
          'line-color': '#ffffff',
          'line-width': 1.5,
          'line-opacity': 0.85,
        },
      })

      map.addSource(TRAVEL_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: TRAVEL_FILL_LAYER,
        type: 'fill',
        source: TRAVEL_SOURCE,
        layout: { visibility: 'none' },
        paint: {
          'fill-color': travelColorExpression,
          'fill-opacity': ['case', ['<', ['get', 'minutes'], 0], 0.35, 0.7],
          'fill-outline-color': 'rgba(255, 255, 255, 0.25)',
        },
      })

      map.addSource(LINE_SOURCE, {
        type: 'geojson',
        data: lineCollection,
      })

      map.addLayer({
        id: LINE_LAYER,
        type: 'line',
        source: LINE_SOURCE,
        filter: LINE_GEOMETRY,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': poiColorExpression,
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 15, 5],
          'line-opacity': 0.9,
        },
      })

      map.addLayer({
        id: LINE_HIT_LAYER,
        type: 'line',
        source: LINE_SOURCE,
        filter: LINE_GEOMETRY,
        // Opacity 0 would drop the layer from queryRenderedFeatures; 0.01 is invisible but hit-testable.
        paint: { 'line-color': '#000000', 'line-width': 14, 'line-opacity': 0.01 },
      })

      map.addLayer({
        id: LINE_POINT_LAYER,
        type: 'circle',
        source: LINE_SOURCE,
        filter: POINT_GEOMETRY,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3.5, 16, 9],
          'circle-color': poiColorExpression,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.addSource(POI_SOURCE, {
        type: 'geojson',
        data: poiCollection,
      })

      map.addLayer({
        id: POI_LAYER,
        type: 'circle',
        source: POI_SOURCE,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2.5, 13, 4.5, 16, 8],
          'circle-color': poiColorExpression,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#1a1a24',
        },
      })

      add3dBuildingsIfAvailable(map)
      // Only now do the layers exist that the data and filter effects write to.
      setMapLoaded(true)

      map.fitBounds(
        [
          [manifest.bbox[0], manifest.bbox[1]],
          [manifest.bbox[2], manifest.bbox[3]],
        ],
        { padding: 48, pitch: 45, duration: 0 },
      )

      if (!gridClickBound.current) {
        gridClickBound.current = true
        for (const layer of CELL_LAYERS) {
          map.on('click', layer, (e) => {
            // A point or line on top of the cell gets the click instead.
            if (map.queryRenderedFeatures(e.point, { layers: CLICKABLE_LAYERS }).length) return
            const id = e.features?.[0]?.properties?.id as string | undefined
            setSelectedCellId(id ?? null)
          })
          map.on('mouseenter', layer, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layer, () => {
            map.getCanvas().style.cursor = ''
          })
        }
        map.on('click', (e) => {
          // One popup per click, for the topmost point or line.
          const [feature] = map.queryRenderedFeatures(e.point, { layers: CLICKABLE_LAYERS })
          if (!feature) return
          const at = feature.geometry.type === 'Point'
            ? (feature.geometry.coordinates as [number, number])
            : e.lngLat
          const popup = new maplibregl.Popup({ maxWidth: '320px', className: 'poi-popup-container' })
            .setLngLat(at)
            .setHTML(poiPopupHtml(feature.properties))
            .addTo(map)
          // MapLibre focuses the first link, which scrolls a long popup to its bottom.
          popup.getElement().querySelector('.maplibregl-popup-content')?.scrollTo({ top: 0 })
        })
        for (const layer of CLICKABLE_LAYERS) {
          map.on('mouseenter', layer, () => {
            map.getCanvas().style.cursor = 'pointer'
          })
          map.on('mouseleave', layer, () => {
            map.getCanvas().style.cursor = ''
          })
        }
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
    // enrichedGrid applied in separate effect after load
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once
  }, [manifest.bbox])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const gridSource = map.getSource(GRID_SOURCE) as maplibregl.GeoJSONSource | undefined
    gridSource?.setData(enrichedGrid)
  }, [enrichedGrid, mapLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return
    const travelShown = view === 'dojazd' && travelData !== null
    for (const layer of [GRID_FILL_LAYER, GRID_LINE_LAYER]) {
      map.setLayoutProperty(layer, 'visibility', travelShown ? 'none' : 'visible')
    }
    map.setLayoutProperty(TRAVEL_FILL_LAYER, 'visibility', travelShown ? 'visible' : 'none')
    if (travelData) {
      ;(map.getSource(TRAVEL_SOURCE) as maplibregl.GeoJSONSource | undefined)?.setData(travelData)
    }
  }, [view, travelData, mapLoaded])

  useEffect(() => {
    // The travel times cover the whole city, the persona sample only one district.
    if (!mapLoaded) return
    const bounds: [[number, number], [number, number]] = view === 'dojazd'
      ? WARSAW_BOUNDS
      : [[manifest.bbox[0], manifest.bbox[1]], [manifest.bbox[2], manifest.bbox[3]]]
    mapRef.current?.fitBounds(bounds, { padding: 48, duration: 0 })
  }, [view, mapLoaded, manifest.bbox])

  const switchView = (next: View) => {
    setView(next)
    setSelectedCellId(null)
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoaded) return

    const visibility = showPoi ? 'visible' : 'none'
    const shown: maplibregl.ExpressionSpecification = ['!', ['in', ['get', 'subtype'], ['literal', [...hiddenSubtypes]]]]
    const layerFilters: [string, maplibregl.ExpressionSpecification | null][] = [
      [POI_LAYER, null],
      [LINE_LAYER, LINE_GEOMETRY],
      [LINE_HIT_LAYER, LINE_GEOMETRY],
      [LINE_POINT_LAYER, POINT_GEOMETRY],
    ]
    for (const [layer, geometryFilter] of layerFilters) {
      if (!map.getLayer(layer)) continue
      map.setLayoutProperty(layer, 'visibility', visibility)
      const parts = [geometryFilter, hiddenSubtypes.size ? shown : null].filter(
        (f): f is maplibregl.ExpressionSpecification => f !== null,
      )
      map.setFilter(layer, parts.length === 0 ? null : parts.length === 1 ? parts[0] : ['all', ...parts])
    }
    ;(map.getSource(POI_SOURCE) as maplibregl.GeoJSONSource | undefined)?.setData(poiCollection)
    ;(map.getSource(LINE_SOURCE) as maplibregl.GeoJSONSource | undefined)?.setData(lineCollection)
  }, [poiCollection, lineCollection, showPoi, hiddenSubtypes, mapLoaded])

  return (
    <div className="grid-map">
      <div ref={mapContainerRef} className="grid-map__canvas" />

      <header className="grid-map__bar">
        <h1>Siatka</h1>
        <label>
          Widok
          <select value={view} onChange={(e) => switchView(e.target.value as View)}>
            <option value="ocena">Ocena persony</option>
            <option value="dojazd" disabled={!travel}>
              Czas dojazdu{travel ? '' : ' (brak danych)'}
            </option>
          </select>
        </label>
        {view === 'ocena' && (
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
        )}
        {view === 'dojazd' && travel && (
          <>
            <label>
              Cel
              <select value={travelTarget} onChange={(e) => setTravelTarget(e.target.value)}>
                {Object.entries(travel.metadata.cele).map(([id, cel]) => (
                  <option key={id} value={id}>{cel.nazwa}</option>
                ))}
              </select>
            </label>
            <label>
              Środek
              <select value={travelMode} onChange={(e) => setTravelMode(e.target.value)}>
                {travel.metadata.tryby.map((mode) => (
                  <option key={mode} value={mode}>{MODE_LABELS[mode] ?? mode}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <label className="grid-map__checkbox">
          <input
            type="checkbox"
            checked={showPoi}
            onChange={(e) => setShowPoi(e.target.checked)}
          />
          POI{poiIsSample ? ' (próbka)' : ''}
        </label>
      </header>

      {showPoi && subtypeCounts.length > 0 && (
        <aside className="grid-map__legend" aria-label="Warstwy POI">
          <h2>
            <button
              type="button"
              className="grid-map__legend-toggle"
              aria-expanded={legendOpen}
              onClick={() => setLegendOpen((open) => !open)}
            >
              Warstwy{poiIsSample ? ' (próbka)' : ''}
              <span className="grid-map__count">
                {subtypeCounts.length - hiddenSubtypes.size}/{subtypeCounts.length} {legendOpen ? '▾' : '▸'}
              </span>
            </button>
          </h2>
          <ul hidden={!legendOpen}>
            {subtypeCounts.map(([subtype, count]) => {
              const style = subtypeStyle(subtype)
              return (
                <li key={subtype}>
                  <label>
                    <input
                      type="checkbox"
                      checked={!hiddenSubtypes.has(subtype)}
                      onChange={() => toggleSubtype(subtype)}
                    />
                    <span className="grid-map__swatch" style={{ background: style.color }} />
                    <span>{style.label}</span>
                    <span className="grid-map__count">{count}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </aside>
      )}

      {selectedCellId && selectedDetail && (
        <aside className="grid-map__panel">
          <button type="button" className="grid-map__close" onClick={() => setSelectedCellId(null)}>
            ×
          </button>
          <h2>{selectedCellId}</h2>
          <p className="grid-map__score">
            Wynik ({persona}): <strong>{selectedDetail.scores[persona]}</strong>/100
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

      {selectedCellId && selectedTravel && travel && (
        <aside className="grid-map__panel">
          <button type="button" className="grid-map__close" onClick={() => setSelectedCellId(null)}>
            ×
          </button>
          <h2>
            {selectedCellId}
            {selectedTravel.district ? ` · ${selectedTravel.district}` : ''}
          </h2>
          <p className="grid-map__score">
            Średni czas dojazdu, przyjazd {travel.metadata.przyjazd.od}–{travel.metadata.przyjazd.do} w dzień roboczy
          </p>
          {Object.entries(travel.metadata.cele).map(([id, cel]) => (
            <div key={id} className="grid-map__travel-target">
              <h3>{cel.nazwa}</h3>
              <ul className="grid-map__metrics">
                {travel.metadata.tryby.map((mode) => (
                  <li key={mode} className={id === travelTarget && mode === travelMode ? 'is-active' : ''}>
                    <span>{MODE_LABELS[mode] ?? mode}</span>
                    <span>{formatTravel(selectedTravel.t[id]?.[mode] ?? null, travel.metadata.przyjazd.terminow)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="grid-map__note">
            Z dojściem pieszym i przesiadkami, bez czekania na pierwszy pojazd. Bez Kolei Mazowieckich i WKD.
          </p>
        </aside>
      )}

      {view === 'dojazd' && travel && (
        <div className="grid-map__scale" aria-label="Skala czasu dojazdu">
          {TRAVEL_SCALE.map(([minutes, color]) => (
            <span key={minutes}>
              <i style={{ background: color }} />
              {minutes === TRAVEL_SCALE[TRAVEL_SCALE.length - 1][0] ? `${minutes}+` : `≤${minutes}`} min
            </span>
          ))}
          <span>
            <i style={{ background: UNREACHABLE_COLOR }} />
            brak
          </span>
        </div>
      )}

      {mapError && (
        <p className="grid-map__hint grid-map__hint--error">
          Błąd mapy: {mapError}. Sprawdź <code>VITE_MAP_STYLE_URL</code> w{' '}
          <code>application/.env</code>.
        </p>
      )}

      <p className="grid-map__hint">
        Spike UI — siatka demo (Mokotów). Pełne dane: <code>data/manifest.json</code>.
      </p>
    </div>
  )
}

function enrichGridWithScores(
  grid: GridFeatureCollection,
  metrics: CellMetricsFile,
  persona: PersonaId,
): GridFeatureCollection {
  return {
    ...grid,
    features: grid.features.map((f: GridFeatureCollection['features'][number]) => {
      const id = f.properties.id
      const score = metrics.cells[id]?.scores[persona] ?? 0
      return {
        ...f,
        properties: { ...f.properties, score },
      }
    }),
  }
}

function add3dBuildingsIfAvailable(map: maplibregl.Map) {
  const layers = map.getStyle().layers ?? []
  const labelLayerId = layers.find(
    (l) => l.type === 'symbol' && 'layout' in l && l.layout?.['text-field'],
  )?.id
  const buildingLayer = layers.find(
    (l) => l.id.includes('building') && l.type === 'fill',
  ) as maplibregl.FillLayerSpecification | undefined

  if (!buildingLayer?.source || map.getLayer('3d-buildings')) return

  map.addLayer(
    {
      id: '3d-buildings',
      type: 'fill-extrusion',
      source: buildingLayer.source,
      'source-layer': buildingLayer['source-layer'],
      filter: ['==', ['get', 'extrude'], 'true'],
      minzoom: 14,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'height'],
          0,
          '#c4c4c4',
          80,
          '#e8e4dc',
        ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.85,
      },
    },
    labelLayerId,
  )
}
