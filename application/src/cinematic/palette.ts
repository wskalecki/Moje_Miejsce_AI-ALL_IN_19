/**
 * Colours of the 3D look under the osiedle panel (daylight) and the "golden hour" look used by the
 * flyover recordings (T8). MapLibre cannot read CSS variables, so the values live here.
 */
import type { SkySpecification } from 'maplibre-gl'
import { ACCENTS } from '../design/tokens'
import type { ProfileId } from '../app/types'

export type BasemapKey =
  | 'background'
  | 'water'
  | 'waterLine'
  | 'park'
  | 'wood'
  | 'residential'
  | 'building'
  | 'buildingOutline'
  | 'roadMajor'
  | 'roadMinor'
  | 'roadCasing'
  | 'rail'
  | 'label'
  | 'halo'

export type BasemapPalette = Record<BasemapKey, string>

/**
 * Golden hour (flyover renders): neutral, slightly cool ground in shade so the sunlit ivory roofs
 * carry the warmth; natural greens and a deep blue river. The ffmpeg grade in
 * scripts/record-flyovers.mjs adds the warm highlights / cool shadows split on top.
 */
export const GOLDEN: BasemapPalette = {
  background: '#9C9D98',
  water: '#34607F',
  waterLine: '#3E6987',
  park: '#6E8565',
  wood: '#627A5C',
  residential: '#A1A29C',
  building: '#E4DFD4',
  buildingOutline: '#D2CCC0',
  roadMajor: '#EEE7DA',
  roadMinor: '#B6B6AF',
  roadCasing: '#8E908C',
  rail: '#8F918D',
  label: 'rgba(40,36,30,0.5)',
  halo: 'rgba(246,242,234,0.85)',
}

export type SkyPreset = Required<
  Pick<
    SkySpecification,
    'sky-color' | 'horizon-color' | 'fog-color' | 'sky-horizon-blend' | 'horizon-fog-blend' | 'fog-ground-blend'
  >
>

export const SKY: Record<'day' | 'golden', SkyPreset> = {
  day: {
    'sky-color': '#C9DCEB',
    'horizon-color': '#F7EEE2',
    'fog-color': '#F1E9DE',
    'sky-horizon-blend': 0.7,
    'horizon-fog-blend': 0.6,
    'fog-ground-blend': 0.55,
  },
  golden: {
    'sky-color': '#6F97C4',
    'horizon-color': '#F6D7B4',
    'fog-color': '#DCD4C8',
    'sky-horizon-blend': 0.7,
    'horizon-fog-blend': 0.65,
    'fog-ground-blend': 0.8,
  },
}

export const LIGHT = {
  day: { anchor: 'map', position: [1.4, 200, 35], color: '#FFF4E6', intensity: 0.35 },
  golden: { anchor: 'map', position: [1.5, 215, 40], color: '#FFEEDC', intensity: 0.5 },
} as const

// ---------- colour helpers ----------

function parse(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(a: string, b: string, t: number): string {
  const ca = parse(a)
  const cb = parse(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Building ramps (low → high), inside / outside the lit core of the selected osiedle.
 * Keep the light colour light: MapLibre lifts dark light colours to a grey floor.
 */
export function buildingRamp(look: 'day' | 'golden', owner: ProfileId) {
  const a = ACCENTS[owner]
  if (look === 'golden') {
    return {
      inside: [mix('#FFF8EC', a.soft, 0.3), '#FFFDF7'] as const,
      outside: ['#F8F1E4', '#FFFAF0'] as const,
    }
  }
  return {
    inside: [mix('#F1ECE6', a.accent, 0.08), mix('#FFFFFF', a.soft, 0.4)] as const,
    outside: ['#D3CCC2', '#E6E0D7'] as const,
  }
}
