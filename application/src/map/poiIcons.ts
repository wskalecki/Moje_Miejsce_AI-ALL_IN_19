import type { Map as MlMap } from 'maplibre-gl'
import { CATEGORY_COLORS } from './tokens'

type PoiRaster = { width: number; height: number; data: Uint8Array }

export const TRANSIT_POI_SUBTYPES = ['metro_station', 'tram_stop', 'stop'] as const
export const TRANSIT_POI_SUBTYPE_SET = new Set<string>(TRANSIT_POI_SUBTYPES)

export const EDUCATION_POI_SUBTYPES = ['kindergarten', 'school', 'high_school', 'university'] as const
export const EDUCATION_POI_SUBTYPE_SET = new Set<string>(EDUCATION_POI_SUBTYPES)

/** Drawn as Lucide symbols instead of circles in the interests layer. */
export const POI_SYMBOL_SUBTYPE_SET = new Set<string>([...TRANSIT_POI_SUBTYPES, ...EDUCATION_POI_SUBTYPES])

const TRANSIT_BLUE = '#2a6fd6'
const EDU_BADGE = CATEGORY_COLORS.edukacja
/** Base raster; final size on map = SIZE × `icon-size` in poiLayer. */
const SIZE = 54

/** Lucide static SVGs (ISC) — same family as lucide-react in the app. */
const LUCIDE_CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@0.503.0/icons'

const POI_ICON_DEFS = [
  { id: 'poi-bus', slug: 'bus', badge: TRANSIT_BLUE },
  { id: 'poi-tram', slug: 'tram-front', badge: TRANSIT_BLUE },
  { id: 'poi-metro', slug: 'train-front', badge: TRANSIT_BLUE },
  { id: 'poi-kindergarten', slug: 'blocks', badge: EDU_BADGE },
  { id: 'poi-school', slug: 'school', badge: EDU_BADGE },
  { id: 'poi-high-school', slug: 'graduation-cap', badge: EDU_BADGE },
  { id: 'poi-university', slug: 'university', badge: EDU_BADGE },
] as const

function drawCircleBadge(ctx: CanvasRenderingContext2D, size: number, fill: string) {
  const r = size / 2 - 1.5
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()
}

function whiteLucideSvg(svgText: string): string {
  return svgText.replace(/currentColor/gi, '#ffffff')
}

function loadSvgAsImage(svg: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('svg image load failed'))
    }
    img.src = url
  })
}

function rasterizeBadgeIcon(img: HTMLImageElement, badge: string): PoiRaster {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('canvas 2d')
  drawCircleBadge(ctx, SIZE, badge)
  const pad = SIZE * 0.21
  const s = SIZE - pad * 2
  ctx.drawImage(img, pad, pad, s, s)
  const data = ctx.getImageData(0, 0, SIZE, SIZE)
  return { width: SIZE, height: SIZE, data: new Uint8Array(data.data.buffer) }
}

let rasterCache: Map<string, PoiRaster> | null = null
let rasterLoad: Promise<Map<string, PoiRaster>> | null = null

async function loadPoiIconRasters(): Promise<Map<string, PoiRaster>> {
  if (rasterCache) return rasterCache
  if (rasterLoad) return rasterLoad

  rasterLoad = (async () => {
    const cache = new Map<string, PoiRaster>()
    for (const { id, slug, badge } of POI_ICON_DEFS) {
      const res = await fetch(`${LUCIDE_CDN}/${slug}.svg`)
      if (!res.ok) throw new Error(`lucide icon ${slug}: ${res.status}`)
      const svg = whiteLucideSvg(await res.text())
      const img = await loadSvgAsImage(svg)
      cache.set(id, rasterizeBadgeIcon(img, badge))
    }
    rasterCache = cache
    return cache
  })()

  try {
    return await rasterLoad
  } catch (e) {
    rasterLoad = null
    throw e
  }
}

function applyRastersToMap(map: MlMap, cache: Map<string, PoiRaster>) {
  for (const [id, image] of cache) {
    if (map.hasImage(id)) map.removeImage(id)
    map.addImage(id, image)
  }
  map.triggerRepaint()
}

/** Lucide POI markers for symbol layers (loads once from CDN). */
export function ensurePoiIcons(map: MlMap): void {
  void loadPoiIconRasters()
    .then((cache) => applyRastersToMap(map, cache))
    .catch((err) => console.warn('[poiIcons] icons failed to load', err))
}

/** @deprecated use ensurePoiIcons */
export const ensurePoiTransitIcons = ensurePoiIcons

export const transitIconImage = [
  'match',
  ['get', 'k'],
  'tram_stop',
  'poi-tram',
  'stop',
  'poi-bus',
  'metro_station',
  'poi-metro',
  'poi-bus',
] as const

export const educationIconImage = [
  'match',
  ['get', 'k'],
  'kindergarten',
  'poi-kindergarten',
  'school',
  'poi-school',
  'high_school',
  'poi-high-school',
  'university',
  'poi-university',
  'poi-school',
] as const

/** Shared symbol scale (−10% vs previous transit sizes). */
export const POI_SYMBOL_ICON_SIZE = [
  'interpolate',
  ['linear'],
  ['zoom'],
  14,
  0.47,
  15.5,
  0.56,
  17,
  0.67,
  19,
  0.74,
] as const
