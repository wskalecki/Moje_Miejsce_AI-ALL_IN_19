import type { ExpressionSpecification, Map as MlMap } from 'maplibre-gl'
import type { MapData } from './data'
import { ACCENTS } from './tokens'
import type { Profile } from './types'
import { PROFILES } from './types'
import outline from './warsaw-outline.json'

/** Public ids — the cinematic transition (T7) drives these. */
export const LAYER = {
  heat: (p: Profile) => `heat-${p}`,
  fill: (p: Profile) => `osiedla-fill-${p}`,
  hoverFill: 'osiedla-hover-fill',
  line: 'osiedla-line',
  hoverLine: 'osiedla-hover-line',
  outline: 'warsaw-outline',
  mask: 'warsaw-mask',
  featuredFill: 'featured-fill',
  featuredGlow: 'featured-glow',
  featuredLine: 'featured-line',
  label: 'osiedla-label',
} as const

export const SOURCE = {
  heat: 'heat',
  osiedla: 'osiedla',
  featured: 'featured',
  labels: 'osiedla-labels',
  outline: 'warsaw-outline',
  mask: 'warsaw-mask',
} as const

const HEAT_KEY: Record<Profile, string> = { student: 's', rodzina: 'r', senior: 'n' }
const TRANSITION = { duration: 600, delay: 0 }

/** Kernel radius as a multiple of the grid spacing — ≥ 2.5 keeps individual points invisible. */
export const HEAT_RADIUS_SCALE = 2.6
/** Empirical: density ≈ K · (radius / spacing)² · weight, tuned so the top cells reach the deep accent. */
const HEAT_INTENSITY_K = 3.7
/** Heat values are skewed (median ≈ 0.12); a gamma < 1 spreads them over the ramp. */
const HEAT_GAMMA = 0.55
/** Fade window for heat → osiedla (spec 4.3). */
const Z0 = 11.5
const Z1 = 12.5

export const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false]

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function heatRamp(p: Profile): ExpressionSpecification {
  const a = ACCENTS[p]
  return [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    `rgba(${a.rgb},0)`,
    0.12,
    rgba(a.soft, 0.0),
    0.28,
    rgba(a.soft, 0.6),
    0.5,
    rgba(a.mid, 0.68),
    0.74,
    rgba(a.base, 0.78),
    0.94,
    rgba(a.deep, 0.86),
  ]
}

function heatOpacity(active: boolean): ExpressionSpecification | number {
  return active ? ['interpolate', ['linear'], ['zoom'], Z0, 0.9, Z1, 0] : 0
}

function fillOpacity(active: boolean): ExpressionSpecification | number {
  return active ? ['interpolate', ['linear'], ['zoom'], Z0, 0, Z1, 0.5] : 0
}

function fillColor(p: Profile): ExpressionSpecification {
  const a = ACCENTS[p]
  // alpha rises with the match, so weak osiedla stay close to paper and strong ones read as colour
  return [
    'interpolate',
    ['linear'],
    ['get', `m_${p}`],
    38,
    rgba(a.soft, 0.25),
    62,
    rgba(a.mid, 0.45),
    82,
    rgba(a.base, 0.6),
    96,
    rgba(a.deep, 0.8),
  ]
}

export function addMapLayers(map: MlMap, data: MapData, profile: Profile) {
  const style = map.getStyle().layers
  const beforeRoads = style.find((l) => 'source-layer' in l && l['source-layer'] === 'transportation')?.id
  const beforeLabels = style.find((l) => l.type === 'symbol')?.id

  // metres per pixel at Warsaw latitude for 512 px tiles: 78271.5 · cos(lat) / 2^z
  const spacingPxZ10 = data.heatSpacingM / ((78271.5 * Math.cos((52.23 * Math.PI) / 180)) / 1024)
  const r = (z: number) => HEAT_RADIUS_SCALE * spacingPxZ10 * 2 ** (z - 10)
  const intensity = HEAT_INTENSITY_K / (HEAT_RADIUS_SCALE * HEAT_RADIUS_SCALE)

  map.addSource(SOURCE.heat, { type: 'geojson', data: data.heat, maxzoom: 13 })
  map.addSource(SOURCE.osiedla, { type: 'geojson', data: data.osiedla, promoteId: 'id' })
  map.addSource(SOURCE.featured, { type: 'geojson', data: data.featuredShapes, promoteId: 'id' })
  map.addSource(SOURCE.labels, { type: 'geojson', data: data.labels })
  map.addSource(SOURCE.outline, { type: 'geojson', data: outline as GeoJSON.Feature })
  const ring = (outline as GeoJSON.Feature<GeoJSON.LineString>).geometry.coordinates
  map.addSource(SOURCE.mask, {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [19.5, 51.2],
            [22.5, 51.2],
            [22.5, 53.2],
            [19.5, 53.2],
            [19.5, 51.2],
          ],
          ring,
        ],
      },
    },
  })

  // Quiet everything outside the city so Warsaw reads as the subject.
  map.addLayer(
    {
      id: LAYER.mask,
      type: 'fill',
      source: SOURCE.mask,
      paint: { 'fill-color': '#F4F0EA', 'fill-opacity': 0.5, 'fill-antialias': false },
    },
    beforeLabels,
  )

  for (const p of PROFILES) {
    map.addLayer(
      {
        id: LAYER.heat(p),
        type: 'heatmap',
        source: SOURCE.heat,
        maxzoom: 13,
        layout: { visibility: p === profile ? 'visible' : 'none' },
        paint: {
          'heatmap-weight': ['^', ['get', HEAT_KEY[p]], HEAT_GAMMA],
          'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 8, r(8), 13, r(13)],
          'heatmap-intensity': intensity,
          'heatmap-color': heatRamp(p),
          'heatmap-opacity': heatOpacity(p === profile),
          'heatmap-opacity-transition': TRANSITION,
        },
      },
      beforeLabels,
    )
  }

  for (const p of PROFILES) {
    map.addLayer(
      {
        id: LAYER.fill(p),
        type: 'fill',
        source: SOURCE.osiedla,
        paint: {
          'fill-color': fillColor(p),
          'fill-opacity': fillOpacity(p === profile),
          'fill-opacity-transition': TRANSITION,
          'fill-antialias': false,
        },
      },
      beforeRoads,
    )
  }

  map.addLayer(
    {
      id: LAYER.hoverFill,
      type: 'fill',
      source: SOURCE.osiedla,
      paint: {
        'fill-color': ACCENTS[profile].base,
        'fill-color-transition': TRANSITION,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], Z0, ['case', hover, 0.14, 0], Z1, ['case', hover, 0.26, 0]],
      },
    },
    beforeRoads,
  )

  map.addLayer(
    {
      id: LAYER.outline,
      type: 'line',
      source: SOURCE.outline,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': 'rgba(22,22,29,0.4)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 13, 1.4],
        'line-dasharray': [4, 2.5],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.9, 13, 0.55],
      },
    },
    beforeLabels,
  )

  map.addLayer(
    {
      id: LAYER.line,
      type: 'line',
      source: SOURCE.osiedla,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(40,30,80,0.42)',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.7, 15, 1.4],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], Z0, 0, Z1, 1],
      },
    },
    beforeLabels,
  )

  map.addLayer(
    {
      id: LAYER.hoverLine,
      type: 'line',
      source: SOURCE.osiedla,
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': ACCENTS[profile].base,
        'line-color-transition': TRANSITION,
        'line-width': 2,
        'line-opacity': ['case', hover, 1, 0],
      },
    },
    beforeLabels,
  )

  map.addLayer({
    id: LAYER.label,
    type: 'symbol',
    source: SOURCE.labels,
    minzoom: 13,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11.5, 16, 14],
      'text-max-width': 8,
      'text-letter-spacing': 0.02,
      'text-padding': 4,
    },
    paint: {
      'text-color': 'rgba(22,22,29,0.58)',
      'text-halo-color': 'rgba(255,255,255,0.92)',
      'text-halo-width': 1.5,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 13.4, 1],
    },
  })
}

/** Cross-fade every profile-dependent layer (600 ms paint transitions). */
export function applyProfile(map: MlMap, profile: Profile, prev: Profile | null) {
  for (const p of PROFILES) {
    const active = p === profile
    if (active) map.setLayoutProperty(LAYER.heat(p), 'visibility', 'visible')
    map.setPaintProperty(LAYER.heat(p), 'heatmap-opacity', heatOpacity(active))
    map.setPaintProperty(LAYER.fill(p), 'fill-opacity', fillOpacity(active))
  }
  if (prev && prev !== profile) {
    const old = prev
    window.setTimeout(() => {
      // hide the faded-out heatmap so it stops costing GPU time
      if (map.getLayer(LAYER.heat(old)) && map.getLayoutProperty(LAYER.heat(old), 'visibility') === 'visible') {
        const stillInactive = map.getPaintProperty(LAYER.heat(old), 'heatmap-opacity') === 0
        if (stillInactive) map.setLayoutProperty(LAYER.heat(old), 'visibility', 'none')
      }
    }, 700)
  }
  map.setPaintProperty(LAYER.hoverFill, 'fill-color', ACCENTS[profile].base)
  map.setPaintProperty(LAYER.hoverLine, 'line-color', ACCENTS[profile].base)
}
