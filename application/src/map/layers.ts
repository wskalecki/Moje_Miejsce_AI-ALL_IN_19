import type { ExpressionSpecification, FilterSpecification, Map as MlMap } from 'maplibre-gl'
import type { MapData } from './data'
import { ACCENTS, categoryTones, type Tones } from './tokens'
import type { CategoryKey, Profile } from './types'
import { PROFILES } from './types'
import { heatRange, heatWeightExpr, linearExpr, rampStops } from './weighting'
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
  /** The live top 3 under the current weights (outline only, see featuredLayers.ts). */
  top: 'top3',
  labels: 'osiedla-labels',
  outline: 'warsaw-outline',
  mask: 'warsaw-mask',
} as const

const TRANSITION = { duration: 600, delay: 0 }

/** Kernel radius as a multiple of the grid spacing — ≥ 2.5 keeps individual points invisible. */
export const HEAT_RADIUS_SCALE = 2.6
/** Empirical: density ≈ K · (radius / spacing)² · weight, tuned so the top cells reach the deep accent. */
const HEAT_INTENSITY_K = 3.2
/** Applied after the contrast window (see `heatRange`); < 1 lifts the mid tones a little. */
const HEAT_GAMMA = 0.8
/** Fade window for heat → osiedla (spec 4.3). */
const Z0 = 11.5
const Z1 = 12.5

export const hover: ExpressionSpecification = ['boolean', ['feature-state', 'hover'], false]

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Weighted view: the profile accent; solo view: the category colour (transparent → colour). */
function tonesFor(p: Profile, solo: CategoryKey | null): Tones {
  return solo ? categoryTones(solo) : ACCENTS[p]
}

function heatRamp(a: Tones): ExpressionSpecification {
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
  // full tint around the 12.5 hand-off, then let outlines carry the map so zoom ≥ 13 is not a wash of colour
  return active ? ['interpolate', ['linear'], ['zoom'], Z0, 0, Z1, 0.56, 13.5, 0.44, 15, 0.24] : 0
}

/**
 * Weighted mix of the categories (`shares` sums to 1; solo = one category at 1).
 * Drives both the heat (per-category grid values 0–1) and the osiedla fill (category scores 0–100).
 */
export interface Mix {
  shares: number[]
  solo: CategoryKey | null
}

/** Weighted match expression over the osiedla features (`c0…c9` = scores 0–100). */
export function matchExpr(mix: Mix): ExpressionSpecification | number {
  return linearExpr(mix.shares)
}

function fillColor(p: Profile, mix: Mix, stops: number[]): ExpressionSpecification {
  const a = tonesFor(p, mix.solo)
  // alpha rises with the match, so weak osiedla stay close to paper and strong ones read as colour
  return [
    'interpolate',
    ['linear'],
    matchExpr(mix),
    stops[0],
    rgba(a.soft, 0.1),
    stops[1],
    rgba(a.mid, 0.3),
    stops[2],
    rgba(a.base, 0.55),
    stops[3],
    rgba(a.base, 0.78),
    stops[4],
    rgba(a.deep, 0.92),
  ] as ExpressionSpecification
}

/** Ramp stops = quantiles of the mixed match over all osiedla (QA #18). */
function mixStops(data: MapData, mix: Mix): number[] {
  const vals: number[] = []
  for (const f of data.osiedla.features) {
    let v = 0
    mix.shares.forEach((k, i) => (v += k * (Number(f.properties?.[`c${i}`]) || 0)))
    vals.push(v)
  }
  return rampStops(vals)
}

/** Re-weight heat + fills for a new mix (weights changed / solo on or off). No source data changes. */
export function applyMix(map: MlMap, data: MapData, mix: Mix) {
  const weight = heatWeightExpr(mix.shares, heatRange(data.heatRows, mix.shares), HEAT_GAMMA)
  const stops = mixStops(data, mix)
  for (const p of PROFILES) {
    if (map.getLayer(LAYER.heat(p))) {
      map.setPaintProperty(LAYER.heat(p), 'heatmap-weight', weight)
      map.setPaintProperty(LAYER.heat(p), 'heatmap-color', heatRamp(tonesFor(p, mix.solo)))
    }
    if (map.getLayer(LAYER.fill(p))) map.setPaintProperty(LAYER.fill(p), 'fill-color', fillColor(p, mix, stops))
  }
}

export function addMapLayers(map: MlMap, data: MapData, profile: Profile, mix: Mix) {
  const style = map.getStyle().layers
  const beforeRoads = style.find((l) => 'source-layer' in l && l['source-layer'] === 'transportation')?.id
  const beforeLabels = style.find((l) => l.type === 'symbol')?.id

  // metres per pixel at Warsaw latitude for 512 px tiles: 78271.5 · cos(lat) / 2^z
  const spacingPxZ10 = data.heatSpacingM / ((78271.5 * Math.cos((52.23 * Math.PI) / 180)) / 1024)
  const r = (z: number) => HEAT_RADIUS_SCALE * spacingPxZ10 * 2 ** (z - 10)
  const intensity = HEAT_INTENSITY_K / (HEAT_RADIUS_SCALE * HEAT_RADIUS_SCALE)

  const stops = mixStops(data, mix)
  const heatWeight = heatWeightExpr(mix.shares, heatRange(data.heatRows, mix.shares), HEAT_GAMMA)

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
          'heatmap-weight': heatWeight,
          'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'], 8, r(8), 13, r(13)],
          'heatmap-intensity': intensity,
          'heatmap-color': heatRamp(tonesFor(p, mix.solo)),
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
          'fill-color': fillColor(p, mix, stops),
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
    minzoom: 12.6,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Bold'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11.5, 16, 14.5],
      'text-max-width': 8,
      'text-letter-spacing': 0.03,
      'text-padding': 4,
    },
    paint: {
      // dark ink on a wide paper halo: readable over tinted fills and busy streets (QA #18)
      'text-color': 'rgba(22,22,29,0.84)',
      'text-halo-color': 'rgba(250,247,242,0.96)',
      'text-halo-width': 2.2,
      'text-halo-blur': 0.4,
      'text-opacity': ['interpolate', ['linear'], ['zoom'], 12.6, 0, 13, 1],
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

/** Hide the name labels of the osiedla that carry a top-3 pill (the pill already names them). */
export function applyLabelFilter(map: MlMap, hiddenIds: readonly string[]) {
  if (!map.getLayer(LAYER.label)) return
  const filter: FilterSpecification | null = hiddenIds.length ? ['!', ['in', ['get', 'id'], ['literal', [...hiddenIds]]]] : null
  map.setFilter(LAYER.label, filter)
}
