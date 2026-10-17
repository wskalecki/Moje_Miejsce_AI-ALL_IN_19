import * as maplibregl from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadHackathonData,
  type CellMetricsFile,
  type GridFeatureCollection,
  type PersonaId,
} from '../lib/hackathonData'
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

type Props = {
  initialPersona?: PersonaId
}

export function GridMap({ initialPersona = 'ania_tomek' }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const gridClickBound = useRef(false)

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

  const poiCollection = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: poiLayers.flatMap((fc) => fc.features),
    }),
    [poiLayers],
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

    mapRef.current = map

    map.on('load', () => {
      setMapError(null)
      setMapLoaded(true)
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

      map.addSource(POI_SOURCE, {
        type: 'geojson',
        data: poiCollection,
      })

      map.addLayer({
        id: POI_LAYER,
        type: 'circle',
        source: POI_SOURCE,
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'match',
            ['get', 'category'],
            'transit',
            '#ffffff',
            'amenity',
            '#f0c674',
            'sport',
            '#9bcf7f',
            'environment',
            '#7eb8da',
            'culture',
            '#e8a87c',
            '#cccccc',
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#1a1a24',
        },
      })

      add3dBuildingsIfAvailable(map)

      map.fitBounds(
        [
          [manifest.bbox[0], manifest.bbox[1]],
          [manifest.bbox[2], manifest.bbox[3]],
        ],
        { padding: 48, pitch: 45, duration: 0 },
      )

      if (!gridClickBound.current) {
        gridClickBound.current = true
        map.on('click', GRID_FILL_LAYER, (e) => {
          const id = e.features?.[0]?.properties?.id as string | undefined
          setSelectedCellId(id ?? null)
        })
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

    const visibility = showPoi ? 'visible' : 'none'
    if (map.getLayer(POI_LAYER)) {
      map.setLayoutProperty(POI_LAYER, 'visibility', visibility)
    }
    const poiSource = map.getSource(POI_SOURCE) as maplibregl.GeoJSONSource | undefined
    poiSource?.setData(poiCollection)
  }, [poiCollection, showPoi, mapLoaded])

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
          <code>application/.env</code>.
        </p>
      )}

      <p className="grid-map__hint">
        Kolorowe kwadraty ~1 km (próbka Mokotów). Oddal mapę — zobaczysz całą Warszawę, ale siatka
        jest tylko w obszarze danych demo.
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
