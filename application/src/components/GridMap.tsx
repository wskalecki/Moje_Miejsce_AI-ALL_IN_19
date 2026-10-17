import { MapboxOverlay } from '@deck.gl/mapbox'
import { GeoJsonLayer, ScatterplotLayer } from '@deck.gl/layers'
import * as maplibregl from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadHackathonData,
  type CellMetricsFile,
  type GridFeatureCollection,
  type PersonaId,
} from '../lib/hackathonData'
import { scoreToRgba } from '../lib/scoreColor'
import 'maplibre-gl/dist/maplibre-gl.css'

const PERSONAS: { id: PersonaId; label: string }[] = [
  { id: 'kasia', label: 'Kasia — spokój' },
  { id: 'marek', label: 'Marek — centrum' },
  { id: 'ania_tomek', label: 'Ania & Tomek — rodzina' },
]

/** Global basemap (no API key). Demotiles do not cover Warsaw. */
const DEFAULT_STYLE =
  'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'

type Props = {
  initialPersona?: PersonaId
}

export function GridMap({ initialPersona = 'ania_tomek' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const overlayRef = useRef<MapboxOverlay | null>(null)

  const { manifest, grid, cellMetrics, poiLayers } = useMemo(() => loadHackathonData(), [])
  const [persona, setPersona] = useState<PersonaId>(initialPersona)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)
  const [showPoi, setShowPoi] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const enrichedGrid = useMemo(
    () => enrichGridWithScores(grid, cellMetrics, persona),
    [grid, cellMetrics, persona],
  )

  const selectedDetail = selectedCellId ? cellMetrics.cells[selectedCellId] : null

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

    const overlay = new MapboxOverlay({ interleaved: false, layers: [] })
    overlayRef.current = overlay
    mapRef.current = map

    map.on('load', () => {
      setMapError(null)
      setMapLoaded(true)
      map.resize()
      map.addControl(overlay as unknown as maplibregl.IControl)
      const layers = map.getStyle().layers ?? []
      const labelLayerId = layers.find(
        (l: maplibregl.LayerSpecification) =>
          l.type === 'symbol' && 'layout' in l && l.layout?.['text-field'],
      )?.id
      const buildingLayer = layers.find(
        (l: maplibregl.LayerSpecification) => l.id.includes('building') && l.type === 'fill',
      ) as maplibregl.FillLayerSpecification | undefined
      if (buildingLayer?.source) {
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
    })

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(mapContainerRef.current)

    return () => {
      ro.disconnect()
      overlay.setProps({ layers: [] })
      setMapLoaded(false)
      map.remove()
      mapRef.current = null
      overlayRef.current = null
    }
  }, [manifest.bbox])

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !mapLoaded) return

    const gridLayer = new GeoJsonLayer({
      id: 'grid-cells',
      data: enrichedGrid,
      pickable: true,
      stroked: true,
      filled: true,
      extruded: false,
      getFillColor: (f) => scoreToRgba(f.properties?.score, 0.58),
      getLineColor: [255, 255, 255, 80],
      lineWidthUnits: 'pixels',
      getLineWidth: 1,
      onClick: (info) => {
        const id = info.object?.properties?.id as string | undefined
        setSelectedCellId(id ?? null)
      },
      updateTriggers: {
        getFillColor: [persona],
      },
    })

    const poiPoints = showPoi
      ? poiLayers.flatMap((fc) => fc.features)
      : []

    const poiLayer = new ScatterplotLayer({
      id: 'poi-points',
      data: poiPoints,
      pickable: true,
      radiusUnits: 'pixels',
      getRadius: 6,
      getPosition: (d) => (d.geometry as GeoJSON.Point).coordinates as [number, number],
      getFillColor: (d) => poiColor(d.properties?.category as string),
    })

    overlay.setProps({ layers: [gridLayer, poiLayer] })
    mapRef.current?.triggerRepaint()
  }, [enrichedGrid, persona, poiLayers, showPoi, mapLoaded])

  return (
    <div className="grid-map">
      <div ref={mapContainerRef} className="grid-map__canvas" />

      <header className="grid-map__bar">
        <h1>Siatka</h1>
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
          POI (sample)
        </label>
      </header>

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

      {mapError && (
        <p className="grid-map__hint grid-map__hint--error">
          Błąd mapy: {mapError}. Sprawdź <code>VITE_MAP_STYLE_URL</code> w{' '}
          <code>application/.env</code> lub usuń tę linię (użyjemy Carto).
        </p>
      )}

      {!import.meta.env.VITE_MAP_STYLE_URL?.trim() && !mapError && (
        <p className="grid-map__hint">
          Domyślnie: Carto Voyager (cała Warszawa). Dla budynków 3D ustaw MapTiler w{' '}
          <code>VITE_MAP_STYLE_URL</code>.
        </p>
      )}
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
    features: grid.features.map((f) => {
      const id = f.properties.id
      const score = metrics.cells[id]?.scores[persona] ?? null
      return {
        ...f,
        properties: { ...f.properties, score },
      }
    }),
  }
}

function poiColor(category: string): [number, number, number, number] {
  switch (category) {
    case 'transit':
      return [255, 255, 255, 220]
    case 'amenity':
      return [240, 198, 116, 220]
    case 'sport':
      return [155, 207, 127, 220]
    case 'environment':
      return [126, 184, 218, 220]
    case 'culture':
      return [232, 168, 124, 220]
    default:
      return [200, 200, 200, 200]
  }
}
