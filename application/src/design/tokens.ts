/**
 * Token values for places that cannot read CSS variables (MapLibre paint
 * expressions, canvas). Keep in sync with tokens.css (spec §8.1, §5.4).
 */
import type { ProfileId } from '../app/types'

export interface AccentScale {
  accent: string
  soft: string
  mid: string
  deep: string
}

export const ACCENTS: Record<ProfileId, AccentScale> = {
  student: { accent: '#7C5CFF', soft: '#EEEAFF', mid: '#B3A2FF', deep: '#3D22B8' },
  rodzina: { accent: '#FF6B4A', soft: '#FFEDE6', mid: '#FFAA7A', deep: '#C2361A' },
  senior: { accent: '#13A396', soft: '#DFF5F2', mid: '#6FD0C4', deep: '#0B6B62' },
}

export const COLORS = {
  bg: '#F6F3EE',
  surface: '#FFFFFF',
  ink: '#16161D',
  ink2: '#4A4A57',
  ink3: '#8A8A99',
  line: '#E7E2DA',
  ok: '#2E9E6A',
  warn: '#E3A33B',
  bad: '#D9534F',
  nightBg: '#0B0E17',
  nightInk: '#F3F1EC',
} as const

/** Basemap palettes for day / night (spec §5.4). */
export const MAP_PALETTE = {
  day: {
    background: '#F4F0EA',
    water: '#D6E2EA',
    green: '#E4EADB',
    roads: '#FFFFFF',
    roadsMinor: '#FBF8F3',
    buildingLow: '#EEE8E0',
    buildingHigh: '#D8D0C4',
    dim: { color: '#16161D', opacity: 0.18 },
  },
  night: {
    background: '#0B0E17',
    water: '#101A2A',
    green: '#0F1A17',
    roads: '#1C2233',
    roadsMinor: '#1C2233',
    buildingLow: '#262C3D',
    buildingHigh: '#3A4258',
    dim: { color: '#0B0E17', opacity: 0.62 },
  },
} as const

export const DURATION = {
  fast: 120,
  base: 200,
  slow: 320,
  slower: 600,
  cinema: 1200,
} as const

/** Cubic-bezier tuples usable by `motion` (`ease: EASE.emphasized`). */
export const EASE = {
  standard: [0.2, 0.8, 0.2, 1],
  emphasized: [0.16, 1, 0.3, 1],
  cinema: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

/** `#RRGGBB` → `rgba(r, g, b, a)` helper for heatmap ramps. */
export function withAlpha(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
