/**
 * Map side of the cinematic transition (spec 4.4, 5.2, 5.4): night/day basemap palettes,
 * the dim mask with an osiedle-shaped hole, the glowing outline with a running glint,
 * 3D buildings that rise with the camera, sky/fog/light and the route line of the panel.
 *
 * Everything is added once and then only driven with constant paint values + `*-transition`,
 * so the GPU interpolates and no tile is re-laid-out during the shot.
 */
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  LightSpecification,
  Map as MlMap,
  SkySpecification,
} from 'maplibre-gl'
import type { Feature, FeatureCollection, LineString, MultiPolygon, Polygon, Position } from 'geojson'
import { ACCENTS } from '../design/tokens'
import type { ProfileId } from '../app/types'
import { LAYER } from '../map/layers'
import { PROFILES } from '../map/types'
import { AreaLayers } from '../map3d/AreaLayers'
import { areaHas3d, coverage, loadArea, type Coverage } from '../map3d/areaData'
import { Director } from './director'
import { buildingRamp, DIM, GOLDEN, LIGHT, mix, NIGHT, rgba, SKY, type BasemapKey, type BasemapPalette, type SkyPreset } from './palette'

export type Look = 'overview' | 'night' | 'day' | 'golden'

export interface SceneTarget {
  slug: string
  owner: ProfileId
  center: [number, number]
  bearing: number
  zoom: number
  shape: Feature<Polygon | MultiPolygon>
  /** Zoom from which the buildings stand at full height (the panel framing zoom); defaults to `zoom − 0.3`. */
  riseZoom?: number
  /** MSI area id — key of the OSM 3D files (public/data/3d/<msiId>/), when the area has them. */
  msiId?: string
}

export interface LookOptions {
  /** Overview only: delay (ms) before the heat / fills / labels come back. */
  overlayDelay?: number
  /** Overview only: duration (ms) of the buildings and outline fade-out. */
  fadeOut?: number
}

const SRC = { dim: 'cin-dim', outline: 'cin-outline', route: 'cin-route' } as const
export const CIN_LAYER = {
  dim: 'cin-dim',
  glowWide: 'cin-glow-wide',
  glow: 'cin-glow',
  line: 'cin-line',
  bld: (slug: string, look: 'night' | 'day') => `cin-bld-${slug}-${look === 'night' ? 'n' : 'd'}`,
  routeCasing: 'cin-route-casing',
  route: 'cin-route',
} as const

/** Buildings extrude only within this radius of the osiedle centre. */
const BUILDING_RADIUS_M = 2600
/** Heights grow with the camera: flat `Z_RISE_SPAN` zoom levels below the full-height zoom. */
const Z_RISE_SPAN = 1.2
const Z_RISE_TO = 0.3
const BLD_OPACITY = 0.94
/** Buildings fade from the "lit" to the ambient ramp over this distance past the lit radius. */
const LIT_FALLOFF_M = 650

/** Radius of the lit core: ~60 % of the half-diagonal of the osiedle bbox, clamped. */
function litRadius(t: SceneTarget): number {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of outerRings(t.shape))
    for (const [x, y] of ring) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  const kx = 111320 * Math.cos((t.center[1] * Math.PI) / 180)
  const half = Math.hypot((maxX - minX) * kx, (maxY - minY) * 111320) / 2
  return Math.max(420, Math.min(800, half * 0.6))
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function outerRings(shape: Feature<Polygon | MultiPolygon>): Position[][] {
  const g = shape.geometry
  return g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0])
}

function dimMask(shape: Feature<Polygon | MultiPolygon>): Feature<Polygon> {
  const world: Position[] = [
    [19.0, 50.8],
    [23.0, 50.8],
    [23.0, 53.6],
    [19.0, 53.6],
    [19.0, 50.8],
  ]
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [world, ...outerRings(shape)] } }
}

/**
 * Clean an outline ring for the wide glow: MSI rings carry runs of metre-long zigzag segments,
 * which a 34 px blurred line with round joins turns into spikes at close zoom. Drop near-duplicate
 * vertices, then Douglas–Peucker with a few metres of tolerance.
 */
function simplifyRing(ring: Position[], tolM = 3): Position[] {
  if (ring.length < 4) return ring
  const lat0 = ring[0][1]
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180)
  const xy = (p: Position) => [p[0] * kx, p[1] * 111320] as const
  const pts: Position[] = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = xy(pts[pts.length - 1])
    const [bx, by] = xy(ring[i])
    if (Math.hypot(bx - ax, by - ay) >= 2 || i === ring.length - 1) pts.push(ring[i])
  }
  const keep = new Uint8Array(pts.length)
  keep[0] = 1
  keep[pts.length - 1] = 1
  const stack: [number, number][] = [[0, pts.length - 1]]
  while (stack.length) {
    const [i0, i1] = stack.pop()!
    const [ax, ay] = xy(pts[i0])
    const [bx, by] = xy(pts[i1])
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy)
    let best = -1
    let bestD = tolM
    for (let i = i0 + 1; i < i1; i++) {
      const [px, py] = xy(pts[i])
      // closed ring: the first span starts and ends on the same vertex — measure from that point
      const d = len < 1e-6 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len
      if (d > bestD) {
        bestD = d
        best = i
      }
    }
    if (best > 0) {
      keep[best] = 1
      stack.push([i0, best], [best, i1])
    }
  }
  return pts.filter((_, i) => keep[i])
}

function outlineLines(shape: Feature<Polygon | MultiPolygon>): FeatureCollection<LineString> {
  return {
    type: 'FeatureCollection',
    features: outerRings(shape).map((ring) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: simplifyRing(ring) } })),
  }
}

/** line-gradient that "draws" a line up to `p` with a bright head. */
function drawGradient(p: number, color: string, head: string): ExpressionSpecification {
  if (p >= 0.999) return ['interpolate', ['linear'], ['line-progress'], 0, color, 1, color]
  const a = Math.max(0.0005, p)
  return ['interpolate', ['linear'], ['line-progress'], 0, color, a, head, Math.min(0.9999, a + 0.0004), 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0)']
}

/** Solid line with a soft glint travelling along it. */
function glintGradient(c: number, color: string, glint: string): ExpressionSpecification {
  const w = 0.06
  const stops: (number | string)[] = []
  const push = (x: number, col: string) => {
    if (stops.length && (stops[stops.length - 2] as number) >= x) return
    stops.push(x, col)
  }
  push(0, color)
  if (c - w > 0.001) push(c - w, color)
  push(Math.max(0.001, Math.min(0.998, c)), glint)
  if (c + w < 0.999) push(c + w, color)
  push(1, color)
  return ['interpolate', ['linear'], ['line-progress'], ...stops] as unknown as ExpressionSpecification
}

interface Entry {
  id: string
  prop: string
  key: BasemapKey
  day: unknown
}

export class CinemaScene {
  readonly director: Director
  private readonly targets = new Map<string, SceneTarget>()
  private basemap: Entry[] = []
  private savedOverlays: Map<string, unknown> | null = null
  private sky: SkyPreset = { ...SKY.day }
  private skyRaf = 0
  private lightRaf = 0
  private light: { color: string; intensity: number } = { color: LIGHT.day.color, intensity: LIGHT.day.intensity }
  private traceRaf = 0
  private routeRaf = 0
  private stopGlint: (() => void) | null = null
  private labelTimer = 0
  private handlers: Record<string, boolean> = {}
  private current: { slug: string | null; look: Look } = { slug: null, look: 'overview' }
  /** Look used for the "day" building layers (`golden` on the recording page). */
  private readonly dayLook: 'day' | 'golden'
  /** OSM 3D replaces the basemap buildings inside the coverage of areas that have the files. */
  private readonly osm3d: boolean
  private readonly rise = new Map<string, { zFlat: number; zFull: number; near: FilterSpecification }>()
  private readonly cover = new Map<string, Coverage>()
  private readonly areas = new Map<string, AreaLayers>()
  private readonly areaLoads = new Map<string, Promise<AreaLayers | null>>()
  private destroyed = false

  readonly map: MlMap

  constructor(
    map: MlMap,
    targets: SceneTarget[],
    opts: { dayLook?: 'day' | 'golden'; overlays?: boolean; osm3d?: boolean } = {},
  ) {
    this.map = map
    this.dayLook = opts.dayLook ?? 'day'
    this.osm3d = opts.osm3d ?? false
    for (const t of targets) this.targets.set(t.slug, t)
    this.director = new Director(map)
    this.install(opts.overlays ?? true)
  }

  target(slug: string) {
    return this.targets.get(slug)
  }

  get state() {
    return this.current
  }

  // ---------------------------------------------------------------- install

  private install(withOverlays: boolean) {
    const map = this.map
    // a previous scene on the same map (dev remounts) — start clean
    for (const l of map.getStyle().layers) if (l.id.startsWith('cin-')) map.removeLayer(l.id)
    for (const id of Object.values(SRC)) if (map.getSource(id)) map.removeSource(id)
    const layers = map.getStyle().layers
    const firstSymbol = layers.find((l) => l.type === 'symbol')?.id

    this.snapshotBasemap()

    map.addSource(SRC.dim, { type: 'geojson', data: EMPTY })
    map.addSource(SRC.outline, { type: 'geojson', data: EMPTY, lineMetrics: true })
    map.addSource(SRC.route, { type: 'geojson', data: EMPTY, lineMetrics: true })

    map.addLayer(
      {
        id: CIN_LAYER.dim,
        type: 'fill',
        source: SRC.dim,
        paint: { 'fill-color': DIM.night.color, 'fill-opacity': 0, 'fill-antialias': false },
      },
      firstSymbol,
    )
    map.addLayer(
      {
        id: CIN_LAYER.glowWide,
        type: 'line',
        source: SRC.outline,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#7C5CFF', 'line-width': 34, 'line-blur': 26, 'line-opacity': 0 },
      },
      firstSymbol,
    )
    map.addLayer(
      {
        id: CIN_LAYER.glow,
        type: 'line',
        source: SRC.outline,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#B3A2FF', 'line-width': 9, 'line-blur': 5, 'line-opacity': 0 },
      },
      firstSymbol,
    )
    map.addLayer(
      {
        id: CIN_LAYER.line,
        type: 'line',
        source: SRC.outline,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-width': 2.4, 'line-opacity': 0, 'line-gradient': drawGradient(1, '#ffffff', '#ffffff') },
      },
      firstSymbol,
    )

    // 3D buildings: a night and a day layer per featured osiedle, shown only through their opacity.
    // They stay `visible` for good: toggling `visibility` reloads the whole basemap source and empties
    // MapLibre's out-of-view tile cache (→ a grey map on the next visit). `minzoom` 13 keeps them out of
    // the overview, the radial filter keeps the buckets small. Day ↔ night is an opacity crossfade.
    for (const t of this.targets.values()) {
      const near: FilterSpecification = [
        'all',
        ['!=', ['get', 'hide_3d'], true],
        ['<', ['distance', { type: 'Point', coordinates: t.center }], BUILDING_RADIUS_M],
      ] as FilterSpecification
      // "Inside" is radial around the centre: a polygon `distance` per building is ~4× slower to lay out.
      const dist: ExpressionSpecification = ['distance', { type: 'Point', coordinates: t.center }] as ExpressionSpecification
      const rIn = litRadius(t)
      // heights rise during the last stretch of the fly-in (and settle back when zooming out)
      const zFull = Math.min(t.zoom - Z_RISE_TO, t.riseZoom ?? Infinity)
      const zFlat = zFull - Z_RISE_SPAN
      this.rise.set(t.slug, { zFlat, zFull, near })
      // our own OSM buildings take over inside the coverage in daylight: the basemap's day layer skips it
      const cov = this.osm3d && areaHas3d(t.msiId) ? coverage(t.shape, t.center, BUILDING_RADIUS_M) : null
      if (cov) this.cover.set(t.slug, cov)
      const height = (prop: 'render_height' | 'render_min_height', fallback: number): ExpressionSpecification => [
        'interpolate',
        ['linear'],
        ['zoom'],
        zFlat,
        0,
        zFull,
        ['coalesce', ['get', prop], fallback],
      ]
      for (const look of ['night', 'day'] as const) {
        const ramp = buildingRamp(look === 'day' ? this.dayLook : 'night', t.owner)
        const color = (pair: readonly [string, string]): ExpressionSpecification => [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'render_height'], 8],
          0,
          pair[0],
          45,
          pair[1],
        ]
        map.addLayer(
          {
            id: CIN_LAYER.bld(t.slug, look),
            type: 'fill-extrusion',
            source: 'openmaptiles',
            'source-layer': 'building',
            minzoom: 13,
            filter: look === 'day' && cov ? (['all', near, ['>', ['distance', cov.polygon], 0]] as FilterSpecification) : near,
            paint: {
              'fill-extrusion-color': ['interpolate', ['linear'], dist, rIn, color(ramp.inside), rIn + LIT_FALLOFF_M, color(ramp.outside)],
              'fill-extrusion-height': height('render_height', 8),
              'fill-extrusion-base': height('render_min_height', 0),
              'fill-extrusion-opacity': 0,
              'fill-extrusion-vertical-gradient': true,
            },
          },
          firstSymbol,
        )
      }
    }

    map.addLayer(
      {
        id: CIN_LAYER.routeCasing,
        type: 'line',
        source: SRC.route,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 9, 'line-opacity': 0, 'line-blur': 0.5 },
      },
      firstSymbol,
    )
    map.addLayer(
      {
        id: CIN_LAYER.route,
        type: 'line',
        source: SRC.route,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-width': 5, 'line-opacity': 0, 'line-gradient': drawGradient(0, '#7C5CFF', '#7C5CFF') },
      },
      firstSymbol,
    )

    if (!withOverlays) return
    this.setSkyNow(SKY.day)
    for (const h of ['dragPan', 'scrollZoom', 'boxZoom', 'dragRotate', 'keyboard', 'doubleClickZoom', 'touchZoomRotate'] as const) {
      this.handlers[h] = map[h].isEnabled()
    }
  }

  // ---------------------------------------------------------------- OSM 3D areas

  /** OSM 3D layers of an osiedle, once loaded (`undefined` while loading or without data). */
  area(slug: string): AreaLayers | undefined {
    return this.areas.get(slug)
  }

  /**
   * Load and add the OSM 3D layers of an osiedle (once). Resolves `null` when it has no 3D data —
   * then the basemap extrusion stays as the fallback.
   */
  ensureArea(slug: string): Promise<AreaLayers | null> {
    const t = this.targets.get(slug)
    const cov = this.cover.get(slug)
    const rise = this.rise.get(slug)
    if (!t?.msiId || !cov || !rise) return Promise.resolve(null)
    const pending = this.areaLoads.get(slug)
    if (pending) return pending
    const p = loadArea(t.msiId, cov).then((data) => {
      if (this.destroyed || !this.map.getStyle()) return null
      // no files (or no layers) after all: give the basemap its buildings back inside the coverage
      const fallback = () => {
        this.cover.delete(slug)
        if (this.map.getLayer(CIN_LAYER.bld(slug, 'day'))) this.map.setFilter(CIN_LAYER.bld(slug, 'day'), rise.near)
        this.areaLoads.delete(slug)
        return null
      }
      if (!data) return fallback()
      let a: AreaLayers
      try {
        a = new AreaLayers(this.map, slug, data, { beforeId: CIN_LAYER.routeCasing, zFlat: rise.zFlat, zFull: rise.zFull })
      } catch {
        return fallback()
      }
      this.areas.set(slug, a)
      const on = this.current.slug === slug && this.current.look !== 'overview' && this.current.look !== 'night'
      a.setVisible(on, on ? 700 : 0)
      return a
    })
    this.areaLoads.set(slug, p)
    return p
  }

  // ---------------------------------------------------------------- basemap palette

  private snapshotBasemap() {
    const map = this.map
    const out: Entry[] = []
    const add = (id: string, prop: string, key: BasemapKey) => out.push({ id, prop, key, day: map.getPaintProperty(id, prop as never) })
    for (const layer of map.getStyle().layers) {
      const id = layer.id
      const sl = 'source-layer' in layer ? layer['source-layer'] : undefined
      if (id.startsWith('cin-')) continue
      if (layer.type === 'background') add(id, 'background-color', 'background')
      if (layer.type === 'fill' && 'source' in layer && layer.source === 'openmaptiles') {
        if (id === 'water' || sl === 'water') add(id, 'fill-color', 'water')
        else if (id === 'park' || sl === 'park') add(id, 'fill-color', 'park')
        else if (id.includes('wood') || id.includes('grass') || sl === 'landcover') add(id, 'fill-color', 'wood')
        else if (id.includes('residential') || sl === 'landuse') add(id, 'fill-color', 'residential')
        else if (id === 'building' || sl === 'building') {
          add(id, 'fill-color', 'building')
          add(id, 'fill-outline-color', 'buildingOutline')
        } else add(id, 'fill-color', 'roadMinor')
      }
      if (layer.type === 'line' && 'source' in layer && layer.source === 'openmaptiles') {
        if (id === 'waterway' || sl === 'waterway') add(id, 'line-color', 'waterLine')
        else if (id.includes('casing')) add(id, 'line-color', 'roadCasing')
        else if (id.includes('_inner') || id.includes('major')) add(id, 'line-color', 'roadMajor')
        else if (id.startsWith('railway')) add(id, 'line-color', id.includes('dashline') ? 'roadMinor' : 'rail')
        else add(id, 'line-color', 'roadMinor')
      }
      if (layer.type === 'symbol' && 'source' in layer && layer.source === 'openmaptiles') {
        add(id, 'text-color', 'label')
        add(id, 'text-halo-color', 'halo')
      }
    }
    this.basemap = out
  }

  private paint(id: string, prop: string, value: unknown, duration: number, delay = 0) {
    const map = this.map
    if (!map.getLayer(id)) return
    try {
      map.setPaintProperty(id, `${prop}-transition` as never, { duration, delay } as never)
    } catch {
      /* property has no transition */
    }
    try {
      map.setPaintProperty(id, prop as never, value as never)
    } catch {
      /* not applicable */
    }
  }

  /**
   * `labels: 'hide'` sends the label colours to transparent (the rest of the basemap to the look),
   * `labels: 'only'` touches the labels alone.
   */
  private applyBasemap(look: Look, duration: number, opts: { labels?: 'hide' | 'only'; labelDuration?: number } = {}) {
    const pal: BasemapPalette | null = look === 'night' ? NIGHT : look === 'golden' ? GOLDEN : null
    for (const e of this.basemap) {
      const isLabel = e.key === 'label' || e.key === 'halo'
      if (opts.labels === 'only' && !isLabel) continue
      if (opts.labels === 'hide' && isLabel) {
        this.paint(e.id, e.prop, 'rgba(0,0,0,0)', opts.labelDuration ?? duration)
        continue
      }
      this.paint(e.id, e.prop, pal ? pal[e.key] : e.day, duration)
    }
  }

  // ---------------------------------------------------------------- app overlays (heat, fills, featured)

  private overlayProps(): [string, string][] {
    return [
      ...PROFILES.map((p) => [LAYER.heat(p), 'heatmap-opacity'] as [string, string]),
      ...PROFILES.map((p) => [LAYER.fill(p), 'fill-opacity'] as [string, string]),
      [LAYER.hoverFill, 'fill-opacity'],
      [LAYER.line, 'line-opacity'],
      [LAYER.hoverLine, 'line-opacity'],
      [LAYER.outline, 'line-opacity'],
      [LAYER.mask, 'fill-opacity'],
      [LAYER.label, 'text-opacity'],
      [LAYER.featuredFill, 'fill-opacity'],
      [LAYER.featuredGlow, 'line-opacity'],
      [LAYER.featuredLine, 'line-opacity'],
    ]
  }

  private hideOverlays(duration: number) {
    if (!this.savedOverlays) {
      const saved = new Map<string, unknown>()
      for (const [id, prop] of this.overlayProps()) {
        if (this.map.getLayer(id)) saved.set(`${id}|${prop}`, this.map.getPaintProperty(id, prop as never))
      }
      this.savedOverlays = saved
    }
    for (const [id, prop] of this.overlayProps()) this.paint(id, prop, 0, duration)
  }

  /** The heat / fills come back after `delay`, once the camera is high again. */
  private restoreOverlays(duration: number, delay: number) {
    const saved = this.savedOverlays
    if (!saved) return
    for (const [id, prop] of this.overlayProps()) {
      const key = `${id}|${prop}`
      if (!saved.has(key)) continue
      const v = saved.get(key)
      // data-driven values (feature-state cases) cannot transition — switch them back once the camera is up
      if (Array.isArray(v) && JSON.stringify(v).includes('feature-state')) window.setTimeout(() => this.paint(id, prop, v, 0), delay + duration / 2)
      else this.paint(id, prop, v, duration, delay)
    }
    this.savedOverlays = null
  }

  // ---------------------------------------------------------------- sky + light

  private setSkyNow(s: SkyPreset) {
    this.sky = { ...s }
    this.map.setSky({ ...s } as SkySpecification)
  }

  private tweenSky(to: SkyPreset, duration: number) {
    cancelAnimationFrame(this.skyRaf)
    if (duration <= 0) return this.setSkyNow(to)
    const from = { ...this.sky }
    const start = performance.now()
    const keys = Object.keys(to) as (keyof SkyPreset)[]
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const k = easeInOutCubic(t)
      const s = {} as Record<string, string | number>
      for (const key of keys) {
        const a = from[key]
        const b = to[key]
        s[key] = typeof a === 'number' && typeof b === 'number' ? a + (b - a) * k : mix(String(a), String(b), k)
      }
      this.setSkyNow(s as unknown as SkyPreset)
      if (t < 1) this.skyRaf = requestAnimationFrame(step)
    }
    this.skyRaf = requestAnimationFrame(step)
  }

  // ---------------------------------------------------------------- looks

  /**
   * Switch the whole map look. `overview` restores the app's day map; `night` is the dramatic
   * transition look; `day` is the daylight 3D look under the panel; `golden` is for the recordings.
   */
  setLook(look: Look, slug: string | null, duration: number, opts: LookOptions = {}) {
    const map = this.map
    const t = slug ? this.targets.get(slug) : undefined
    const prevSlug = this.current.slug
    this.current = { slug: look === 'overview' ? null : (slug ?? prevSlug), look }
    window.clearTimeout(this.labelTimer)

    const owner = (this.current.slug && this.targets.get(this.current.slug)?.owner) || t?.owner || 'student'
    const a = ACCENTS[owner]
    if (t && slug !== prevSlug) {
      ;(map.getSource(SRC.dim) as GeoJSONSource).setData(dimMask(t.shape))
      ;(map.getSource(SRC.outline) as GeoJSONSource).setData(outlineLines(t.shape))
      // the outline is invisible now: take the owner's colours at once, so the glow never starts in
      // another osiedle's (or the default violet) colour
      this.paint(CIN_LAYER.glowWide, 'line-color', a.accent, 0)
      this.paint(CIN_LAYER.glow, 'line-color', look === 'night' ? a.mid : a.accent, 0)
    }

    if (look === 'overview') {
      // way back: labels and overlays stay away while the camera climbs (no double-exposed glyphs
      // from the zoom crossfade), then return late
      const delay = opts.overlayDelay ?? Math.round(duration * 0.7)
      const fade = opts.fadeOut ?? duration
      this.applyBasemap('overview', duration, { labels: 'hide', labelDuration: Math.min(250, fade) })
      this.labelTimer = window.setTimeout(() => this.applyBasemap('overview', 600, { labels: 'only' }), delay)
      this.restoreOverlays(Math.max(500, duration - delay), delay)
    } else {
      this.applyBasemap(look, duration)
      this.hideOverlays(Math.min(duration, 700))
    }

    // dim mask
    const dim = look === 'overview' ? null : DIM[look]
    const fade = look === 'overview' ? (opts.fadeOut ?? duration) : duration
    if (dim) this.paint(CIN_LAYER.dim, 'fill-color', dim.color, duration)
    this.paint(CIN_LAYER.dim, 'fill-opacity', dim ? dim.opacity : 0, fade)

    // outline
    if (look === 'overview') {
      for (const id of [CIN_LAYER.glowWide, CIN_LAYER.glow, CIN_LAYER.line]) this.paint(id, 'line-opacity', 0, fade)
      this.stopGlint?.()
      this.stopGlint = null
    } else {
      const night = look === 'night'
      this.paint(CIN_LAYER.glowWide, 'line-color', a.accent, duration)
      this.paint(CIN_LAYER.glowWide, 'line-opacity', night ? 0.55 : 0.32, duration)
      this.paint(CIN_LAYER.glow, 'line-color', night ? a.mid : a.accent, duration)
      this.paint(CIN_LAYER.glow, 'line-opacity', night ? 0.85 : 0.55, duration)
      this.paint(CIN_LAYER.line, 'line-opacity', 1, Math.min(400, duration))
    }

    // buildings (opacity only — see install)
    const shown = look === 'overview' ? null : this.current.slug
    for (const tg of this.targets.values()) {
      const on = tg.slug === shown
      this.paint(CIN_LAYER.bld(tg.slug, 'night'), 'fill-extrusion-opacity', on && look === 'night' ? BLD_OPACITY : 0, fade)
      this.paint(CIN_LAYER.bld(tg.slug, 'day'), 'fill-extrusion-opacity', on && look !== 'night' ? BLD_OPACITY : 0, fade)
    }

    // OSM 3D (daylight only; the night shot keeps the basemap silhouettes)
    for (const [s, a] of this.areas) a.setVisible(s === shown && look !== 'night', look === 'night' ? Math.min(600, duration) : fade)

    // sky + light
    this.tweenSky(look === 'overview' ? SKY.day : SKY[look], duration)
    this.tweenLight(look === 'overview' ? 'day' : look, duration)
  }

  private tweenLight(look: 'day' | 'night' | 'golden', duration: number) {
    cancelAnimationFrame(this.lightRaf)
    const base = LIGHT[look]
    const to = { color: base.color, intensity: base.intensity }
    const from = { ...this.light }
    const apply = (c: string, i: number) => {
      this.light = { color: c, intensity: i }
      this.map.setLight({ anchor: base.anchor, position: [...base.position], color: c, intensity: i } as LightSpecification)
    }
    if (duration <= 0) return apply(to.color, to.intensity)
    const start = performance.now()
    const step = (now: number) => {
      const k = easeInOutCubic(Math.min(1, (now - start) / duration))
      apply(mix(from.color, to.color, k), from.intensity + (to.intensity - from.intensity) * k)
      if (k < 1) this.lightRaf = requestAnimationFrame(step)
    }
    this.lightRaf = requestAnimationFrame(step)
  }

  /** Line colour used by the outline core for the current look. */
  private lineColors(): { base: string; head: string } {
    const owner = (this.current.slug && this.targets.get(this.current.slug)?.owner) || 'student'
    const a = ACCENTS[owner]
    if (this.current.look === 'night') return { base: mix(a.mid, '#ffffff', 0.35), head: '#ffffff' }
    if (this.current.look === 'golden') return { base: mix(a.accent, '#ffffff', 0.25), head: '#ffffff' }
    return { base: a.deep, head: mix(a.accent, '#ffffff', 0.7) }
  }

  /** Draw the outline around the osiedle (line-gradient sweep), then keep a slow glint running on it. */
  traceOutline(duration: number, opts: { glint?: boolean } = {}) {
    cancelAnimationFrame(this.traceRaf)
    this.stopGlint?.()
    this.stopGlint = null
    const startGlint = () => {
      if (opts.glint === false) return
      let c = 0
      let acc = 0
      this.stopGlint = this.director.addTicker((_now, dt) => {
        c = (c + dt * 0.055) % 1
        acc += dt
        if (acc < 1 / 30) return
        acc = 0
        const { base, head } = this.lineColors()
        this.map.setPaintProperty(CIN_LAYER.line, 'line-gradient', glintGradient(c, base, head))
      })
    }
    if (duration <= 0) {
      const { base } = this.lineColors()
      this.map.setPaintProperty(CIN_LAYER.line, 'line-gradient', drawGradient(1, base, base))
      startGlint()
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const { base, head } = this.lineColors()
      this.map.setPaintProperty(CIN_LAYER.line, 'line-gradient', drawGradient(easeInOutCubic(t), base, head))
      if (t < 1) this.traceRaf = requestAnimationFrame(step)
      else startGlint()
    }
    this.traceRaf = requestAnimationFrame(step)
  }

  // ---------------------------------------------------------------- route

  showRoute(line: LineString | null, owner: ProfileId) {
    cancelAnimationFrame(this.routeRaf)
    const src = this.map.getSource(SRC.route) as GeoJSONSource | undefined
    if (!src) return
    if (!line) {
      this.paint(CIN_LAYER.route, 'line-opacity', 0, 250)
      this.paint(CIN_LAYER.routeCasing, 'line-opacity', 0, 250)
      return
    }
    const color = ACCENTS[owner].accent
    src.setData({ type: 'Feature', properties: {}, geometry: line })
    this.paint(CIN_LAYER.route, 'line-opacity', 1, 0)
    this.paint(CIN_LAYER.routeCasing, 'line-opacity', 0.95, 200)
    const start = performance.now()
    const dur = 900
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      this.map.setPaintProperty(CIN_LAYER.route, 'line-gradient', drawGradient(easeOutCubic(t), color, rgba(color, 1)))
      if (t < 1) this.routeRaf = requestAnimationFrame(step)
    }
    this.map.setPaintProperty(CIN_LAYER.route, 'line-gradient', drawGradient(0, color, color))
    this.routeRaf = requestAnimationFrame(step)
  }

  // ---------------------------------------------------------------- interaction

  lock() {
    for (const h of Object.keys(this.handlers)) (this.map as unknown as Record<string, { disable(): void }>)[h].disable()
  }

  /** Panel mode: pan, zoom and rotate (right-drag) are allowed. */
  unlockExplore() {
    const m = this.map
    m.dragPan.enable()
    m.scrollZoom.enable()
    m.doubleClickZoom.enable()
    m.keyboard.enable()
    m.touchZoomRotate.enable()
    m.dragRotate.enable()
  }

  /** Back to the overview's original handler set. */
  restoreInteraction() {
    for (const [h, on] of Object.entries(this.handlers)) {
      const handler = (this.map as unknown as Record<string, { enable(): void; disable(): void }>)[h]
      if (on) handler.enable()
      else handler.disable()
    }
  }

  destroy() {
    window.clearTimeout(this.labelTimer)
    cancelAnimationFrame(this.skyRaf)
    cancelAnimationFrame(this.lightRaf)
    cancelAnimationFrame(this.traceRaf)
    cancelAnimationFrame(this.routeRaf)
    this.director.destroy()
    this.destroyed = true
    for (const a of this.areas.values()) a.destroy()
    this.areas.clear()
    const map = this.map
    try {
      for (const l of map.getStyle().layers) if (l.id.startsWith('cin-')) map.removeLayer(l.id)
      for (const id of Object.values(SRC)) if (map.getSource(id)) map.removeSource(id)
    } catch {
      /* map already removed */
    }
  }
}
