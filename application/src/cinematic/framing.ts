/**
 * Camera framing for the panel view: fit a set of points (places, the core of the osiedle outline,
 * investment pins) into the part of the map that the panel leaves free, at a given pitch, and keep
 * them in frame while the slow orbit turns the camera.
 */
import type { Map as MlMap } from 'maplibre-gl'
import type { MultiPolygon, Polygon, Feature, Position } from 'geojson'

export type Pad = { top: number; bottom: number; left: number; right: number }
export type Pt = [number, number]

/** MapLibre's default vertical field of view. */
const FOV = 0.6435011087932844

const mercX = (lng: number) => (lng + 180) / 360
const mercY = (lat: number) => {
  const r = (lat * Math.PI) / 180
  return (1 - Math.log(Math.tan(Math.PI / 4 + r / 2)) / Math.PI) / 2
}

interface Cam {
  center: Pt
  zoom: number
  pitch: number
  bearing: number
  padding: Pad
  width: number
  height: number
}

/**
 * Screen position of a ground point for a camera that is not applied to the map — the same
 * perspective model as MapLibre's mercator transform (camera at `0.5 / tan(fov / 2) · height`
 * from the centre, padding shifts the principal point).
 */
function projectWith(cam: Cam, p: Pt): { x: number; y: number } {
  const ws = 512 * 2 ** cam.zoom
  const dx = (mercX(p[0]) - mercX(cam.center[0])) * ws
  const dy = (mercY(p[1]) - mercY(cam.center[1])) * ws
  const b = (cam.bearing * Math.PI) / 180
  const xr = dx * Math.cos(b) + dy * Math.sin(b)
  const fwd = dx * Math.sin(b) - dy * Math.cos(b)
  const pr = (cam.pitch * Math.PI) / 180
  const D = (0.5 / Math.tan(FOV / 2)) * cam.height
  const z = fwd * Math.sin(pr) + D
  const px = cam.width / 2 + (cam.padding.left - cam.padding.right) / 2
  const py = cam.height / 2 + (cam.padding.top - cam.padding.bottom) / 2
  if (z <= 1) return { x: Number.NaN, y: Number.NaN }
  return { x: px + (xr * D) / z, y: py - (fwd * Math.cos(pr) * D) / z }
}

export const LAND_PITCH = 57
/** Outline vertices farther than this from the centre are left out of the framing (some MSI areas cover several km²). */
const CORE_RADIUS_M = 1200

/** Breakpoint of the bottom-sheet layout (same as the map's filter sheet, src/map/map.css). */
export const SHEET_MAX_W = 1023

/**
 * Chrome grid (src/design/tokens.css): the place card sits in the map's left column, under the
 * header pill — 24 px edge, 416 px column, 16 px gap; "Ważne miejsca" take a 296 px column at the
 * right edge; on phones and tablets the card is a bottom sheet and the places a strip under the pill.
 */
const EDGE = 24
const COL = 416
const SIDE = 296
const GAP = 16
/** Bottom sheet top (`.op--overlay`, 35vh) and the header pill + places strip above the map strip. */
const SHEET_TOP = 0.35
const PILL_BOTTOM = 64
/** The places strip (`.op--side` < 1024 px) starts at the pill's bottom and is 52 px tall. */
const STRIP_BOTTOM = PILL_BOTTOM + 52

/** Camera padding that keeps the subject in the map area right of (or above, on phones) the place card. */
export function panelPadding(): Pad {
  const w = window.innerWidth
  const h = window.innerHeight
  if (w <= SHEET_MAX_W) return { top: STRIP_BOTTOM, bottom: Math.round(h * (1 - SHEET_TOP)), left: 0, right: 0 }
  return { top: 40, bottom: 40, left: EDGE + COL + GAP, right: SIDE + EDGE + GAP }
}

/** Extra margin inside the padded area: pins stand ~60 px above their point and need room for labels. */
function pinInset(): Pad {
  return window.innerWidth <= SHEET_MAX_W ? { top: 56, bottom: 64, left: 30, right: 30 } : { top: 80, bottom: 40, left: 44, right: 44 }
}

export const metersBetween = (a: Pt, b: Pt) => {
  const kx = 111320 * Math.cos((a[1] * Math.PI) / 180)
  return Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * 111320)
}

/** Outline vertices near the centre (the part of the outline that belongs in the shot). */
export function corePoints(shape: Feature<Polygon | MultiPolygon>, center: Pt, radius = CORE_RADIUS_M): Pt[] {
  const g = shape.geometry
  const rings: Position[][] = g.type === 'Polygon' ? [g.coordinates[0]] : g.coordinates.map((p) => p[0])
  const out: Pt[] = []
  for (const r of rings) for (const p of r) if (metersBetween(p as Pt, center) <= radius) out.push([p[0], p[1]])
  return out
}

interface FrameOpts {
  pitch: number
  bearing: number
  /** Extra bearings (relative, degrees) the framing must also hold for — the orbit turns the camera. */
  sweep?: number[]
  padding?: Pad
  minZoom?: number
  maxZoom?: number
}

export interface Framing {
  center: Pt
  zoom: number
  pitch: number
  bearing: number
  padding: Pad
}

/**
 * Largest zoom at which every point projects inside the free map area for all bearings of the
 * sweep. Pure maths on a cloned transform — the live camera does not move.
 */
export function frame(map: MlMap, points: Pt[], opts: FrameOpts): Framing {
  const padding = opts.padding ?? panelPadding()
  const inset = pinInset()
  const sweep = opts.sweep ?? [0]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of points) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const center: Pt = [(minX + maxX) / 2, (minY + maxY) / 2]
  const canvas = map.getCanvas()
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  const x0 = padding.left + inset.left
  const x1 = W - padding.right - inset.right
  const y0 = padding.top + inset.top
  const y1 = H - padding.bottom - inset.bottom
  const fits = (z: number) => {
    for (const db of sweep) {
      const cam: Cam = { center, zoom: z, pitch: opts.pitch, bearing: opts.bearing + db, padding, width: W, height: H }
      for (const p of points) {
        const s = projectWith(cam, p)
        if (!(s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1)) return false
      }
    }
    return true
  }
  let lo = opts.minZoom ?? 13.2
  let hi = opts.maxZoom ?? 16.2
  if (fits(hi)) lo = hi
  else
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (fits(mid)) lo = mid
      else hi = mid
    }
  return { center, zoom: Math.round(lo * 100) / 100, pitch: opts.pitch, bearing: opts.bearing, padding }
}

/** True when every point is inside the free map area of the live camera. */
export function allVisible(map: MlMap, points: Pt[], padding = panelPadding()): boolean {
  const inset = pinInset()
  const c = map.getCanvas()
  const W = c.clientWidth
  const H = c.clientHeight
  return points.every((p) => {
    const s = map.project(p)
    return s.x >= padding.left + inset.left * 0.6 && s.x <= W - padding.right - inset.right * 0.6 && s.y >= padding.top + inset.top * 0.6 && s.y <= H - padding.bottom - inset.bottom * 0.6
  })
}

/**
 * True when `b` is within the inner half of a top-down `w × h` view centred on `a` at `zoom`: the camera
 * can then zoom straight between them (no pull-back arc) without the subject leaving the frame.
 */
export function nearInView(a: Pt, b: Pt, zoom: number, w: number, h: number): boolean {
  const ws = 512 * 2 ** zoom
  const dx = Math.abs(mercX(a[0]) - mercX(b[0])) * ws
  const dy = Math.abs(mercY(a[1]) - mercY(b[1])) * ws
  return dx <= w * 0.5 && dy <= h * 0.5
}
