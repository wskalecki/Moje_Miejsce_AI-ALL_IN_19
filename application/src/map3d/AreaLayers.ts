/**
 * Map layers of one area's OSM 3D data: green slabs, asphalt roads with a light curb, and buildings
 * coloured by kind that rise with the camera like the basemap extrusion they replace.
 *
 * Added once (when the area is first opened) and then only driven by paint values:
 *   - visibility: `fill-extrusion-opacity` with a transition (cheap, no tile reload);
 *   - traffic: per-way `cg` feature-state (no re-tiling while the hour slider plays);
 *   - focus: the building colour expression (kinds highlighted, the rest muted);
 *   - selection: `selected` feature-state on the clicked building.
 */
import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl'
import { roadCurbLayer, roadSurfaceLayer, ROADS_MIN_ZOOM } from '../lib/osm3d/roadStyle'
import type { BuildingKind } from '../lib/osm3d/buildingStyle'
import type { AreaData } from './areaData'
import { kindColorExpr, type BuildingColorMode } from './kinds'
import { TRAFFIC_SURFACE_COLOR, trafficAtHour } from './trafficStyle'

export const M3D_PREFIX = 'm3d-'

const OPACITY = { bld: 0.96, road: 1, curb: 1, green: 0.9 } as const

export interface AreaLayersOptions {
  /** Insert below this layer (labels and the route stay on top). */
  beforeId?: string
  /** Heights are flat at `zFlat` and full at `zFull` (the camera's landing zoom). */
  zFlat: number
  zFull: number
}

export class AreaLayers {
  readonly map: MlMap
  readonly data: AreaData
  readonly ids: { bld: string; road: string; curb: string; green: string }
  private readonly src: { bld: string; roads: string; green: string }
  private visible = false
  private focusKey = ''
  private colorMode: BuildingColorMode = 'base'
  private trafficOn = false
  private lastCg = new Map<number, number | null>()
  private selected: number | null = null

  constructor(map: MlMap, key: string, data: AreaData, opts: AreaLayersOptions) {
    this.map = map
    this.data = data
    const p = `${M3D_PREFIX}${key}`
    this.src = { bld: `${p}-bld`, roads: `${p}-roads`, green: `${p}-green` }
    this.ids = { bld: `${p}-bld`, road: `${p}-road`, curb: `${p}-curb`, green: `${p}-green` }
    this.install(opts)
  }

  private install({ beforeId, zFlat, zFull }: AreaLayersOptions) {
    const map = this.map
    const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined
    // leftovers of a previous scene on the same map (dev remount / hot reload): start clean
    this.destroy()
    // below the buildings' first full-height zoom nothing is drawn (keeps the overview free)
    const minzoom = Math.max(12, Math.min(ROADS_MIN_ZOOM, zFlat) - 0.3)

    if (this.data.green) {
      map.addSource(this.src.green, { type: 'geojson', data: this.data.green })
      map.addLayer(
        {
          id: this.ids.green,
          type: 'fill-extrusion',
          source: this.src.green,
          minzoom,
          paint: {
            'fill-extrusion-color': ['match', ['get', 'kind'], 'park', '#b7d39d', '#c4dcab'],
            'fill-extrusion-height': 0.18,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0,
            'fill-extrusion-vertical-gradient': false,
          },
        },
        before,
      )
    }

    map.addSource(this.src.roads, { type: 'geojson', data: this.data.roads, promoteId: 'way_id' })
    const curb = roadCurbLayer(this.ids.curb, this.src.roads, minzoom)
    map.addLayer({ ...curb, paint: { ...curb.paint, 'fill-extrusion-opacity': 0 } }, before)
    const surface = roadSurfaceLayer(this.ids.road, this.src.roads, { minzoom })
    map.addLayer({ ...surface, paint: { ...surface.paint, 'fill-extrusion-color': TRAFFIC_SURFACE_COLOR, 'fill-extrusion-opacity': 0 } }, before)

    const rise = (prop: ExpressionSpecification): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], zFlat, 0, zFull, prop]
    map.addSource(this.src.bld, { type: 'geojson', data: this.data.buildings, promoteId: 'id' })
    map.addLayer(
      {
        id: this.ids.bld,
        type: 'fill-extrusion',
        source: this.src.bld,
        minzoom,
        paint: {
          'fill-extrusion-color': kindColorExpr(null),
          'fill-extrusion-height': rise(['max', ['coalesce', ['get', 'h'], 9], 3]),
          'fill-extrusion-base': rise(['coalesce', ['get', 'mh'], 0]),
          'fill-extrusion-opacity': 0,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      before,
    )
  }

  private paint(id: string, prop: string, value: unknown, duration = 0) {
    const map = this.map
    if (!map.getLayer(id)) return
    map.setPaintProperty(id, `${prop}-transition` as never, { duration, delay: 0 } as never)
    map.setPaintProperty(id, prop as never, value as never)
  }

  get isVisible() {
    return this.visible
  }

  setVisible(on: boolean, duration: number) {
    this.visible = on
    this.paint(this.ids.bld, 'fill-extrusion-opacity', on ? OPACITY.bld : 0, duration)
    this.paint(this.ids.road, 'fill-extrusion-opacity', on ? OPACITY.road : 0, duration)
    this.paint(this.ids.curb, 'fill-extrusion-opacity', on ? OPACITY.curb : 0, duration)
    this.paint(this.ids.green, 'fill-extrusion-opacity', on ? OPACITY.green : 0, duration)
    if (!on) this.select(null)
  }

  setColorMode(mode: BuildingColorMode) {
    if (mode === this.colorMode) return
    this.colorMode = mode
    this.focusKey = ''
    this.repaintBuildings(null)
  }

  /** Highlight these kinds (others muted); `null` = uniform base (or full palette in `byKind` mode). */
  setFocus(kinds: readonly BuildingKind[] | null) {
    const key = `${this.colorMode}|${kinds?.length ? [...kinds].sort().join(',') : ''}`
    if (key === this.focusKey) return
    this.focusKey = key
    this.repaintBuildings(kinds)
  }

  private repaintBuildings(kinds: readonly BuildingKind[] | null) {
    this.paint(this.ids.bld, 'fill-extrusion-color', kindColorExpr(kinds, this.colorMode))
  }

  /** Colour the road surfaces by congestion at `hour` (fractional allowed); `null` = plain asphalt. */
  setTraffic(hour: number | null) {
    const doc = this.data.traffic
    const map = this.map
    if (!map.getSource(this.src.roads)) return
    if (!doc || hour == null) {
      if (this.trafficOn) map.removeFeatureState({ source: this.src.roads })
      this.trafficOn = false
      this.lastCg.clear()
      return
    }
    this.trafficOn = true
    for (const [id, v] of trafficAtHour(doc, hour)) {
      const r = v == null ? null : Math.round(v * 200) / 200
      if (this.lastCg.has(id) && this.lastCg.get(id) === r) continue
      this.lastCg.set(id, r)
      map.setFeatureState({ source: this.src.roads, id }, { cg: r })
    }
  }

  get hasTraffic() {
    return !!this.data.traffic
  }

  /** Mark the clicked building (feature-state) — `null` clears. */
  select(id: number | null) {
    if (this.selected === id || !this.map.getSource(this.src.bld)) return
    if (this.selected != null) this.map.setFeatureState({ source: this.src.bld, id: this.selected }, { selected: false })
    this.selected = id
    if (id != null) this.map.setFeatureState({ source: this.src.bld, id }, { selected: true })
  }

  destroy() {
    const map = this.map
    try {
      for (const id of Object.values(this.ids)) if (map.getLayer(id)) map.removeLayer(id)
      for (const id of Object.values(this.src)) if (map.getSource(id)) map.removeSource(id)
    } catch {
      /* map already removed */
    }
  }
}
