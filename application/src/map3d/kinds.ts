/**
 * Building colours on the osiedle 3D map.
 * Default: one calm base tone (no height / kind rainbow). Optional `byKind` mode in advanced settings.
 */
import type { ExpressionSpecification } from 'maplibre-gl'
import { CATEGORY_COLORS } from '../app/dictionary'
import type { CategoryKey } from '../app/types'
import { mix } from '../cinematic/palette'
import { BUILDING_LEGEND, RESIDENTIAL_TIERS, type BuildingKind, type BuildingLegendItem } from '../lib/osm3d/buildingStyle'

const C = CATEGORY_COLORS
const lighter = (c: string, k: number) => mix(c, '#ffffff', k)
const darker = (c: string, k: number) => mix(c, '#16161d', k)

/** Default extrusion fill — warm neutral (all buildings). */
export const BUILDING_BASE_COLOR = '#d8d2c8'

/** Map colour per kind (used only in advanced “by kind” mode). */
export const KIND_COLOR: Readonly<Record<BuildingKind, string>> = {
  kindergarten: lighter(C.edukacja, 0.4),
  school: C.edukacja,
  college: darker(C.edukacja, 0.14),
  university: darker(C.edukacja, 0.28),
  clinic: lighter(C.zdrowie, 0.3),
  hospital: C.zdrowie,
  church: lighter(C.kultura, 0.32),
  culture: C.kultura,
  public: '#8fa1b5',
  office: '#b4bcc8',
  retail: C.zakupy,
  residential: RESIDENTIAL_TIERS[2][1],
  other: '#cdc8c0',
}

/** Category a kind belongs to (for the legend dot and the panel ↔ map focus). */
export const KIND_CATEGORY: Readonly<Partial<Record<BuildingKind, CategoryKey>>> = {
  kindergarten: 'edukacja',
  school: 'edukacja',
  college: 'edukacja',
  university: 'edukacja',
  clinic: 'zdrowie',
  hospital: 'zdrowie',
  church: 'kultura',
  culture: 'kultura',
  retail: 'zakupy',
}

const CATEGORY_KINDS: Readonly<Partial<Record<CategoryKey, readonly BuildingKind[]>>> = {
  edukacja: ['kindergarten', 'school', 'college', 'university'],
  zdrowie: ['clinic', 'hospital'],
  kultura: ['culture', 'church'],
  zakupy: ['retail'],
  gastronomia: ['retail'],
  zycieNocne: ['culture', 'retail'],
}

export function categoryKinds(category: CategoryKey): readonly BuildingKind[] {
  return CATEGORY_KINDS[category] ?? []
}

export type KindLegendItem = BuildingLegendItem & { color: string }

export const KIND_LEGEND: readonly KindLegendItem[] = BUILDING_LEGEND.map((i) => ({ ...i, color: KIND_COLOR[i.kind] }))

export type BuildingColorMode = 'base' | 'byKind'

const HEIGHT: ExpressionSpecification = ['coalesce', ['get', 'h'], 9]
const MUTED = '#e4e0da'
/** Clicked building: dark ink, distinct from the base fill. */
const SELECTED = '#2b2f45'

const residentialExpr = ['interpolate', ['linear'], HEIGHT, ...RESIDENTIAL_TIERS.flat()] as ExpressionSpecification
const otherExpr = ['interpolate', ['linear'], HEIGHT, 0, '#d6d2cb', 20, '#c6c1b9', 60, '#b5b0a8'] as ExpressionSpecification

function byKindExpr(focusKinds?: readonly BuildingKind[] | null): ExpressionSpecification {
  const on = (k: BuildingKind) => !focusKinds || focusKinds.includes(k)
  const pairs: (string | ExpressionSpecification)[] = []
  for (const item of BUILDING_LEGEND) {
    if (item.kind === 'residential' || item.kind === 'other') continue
    pairs.push(item.kind, on(item.kind) ? KIND_COLOR[item.kind] : MUTED)
  }
  return [
    'match',
    ['get', 'kind'],
    ...pairs,
    'residential',
    on('residential') ? residentialExpr : MUTED,
    on('other') ? otherExpr : MUTED,
  ] as unknown as ExpressionSpecification
}

function baseExpr(focusKinds?: readonly BuildingKind[] | null): string | ExpressionSpecification {
  if (!focusKinds?.length) return BUILDING_BASE_COLOR
  return [
    'case',
    ['boolean', ['in', ['get', 'kind'], ['literal', [...focusKinds]]], false],
    BUILDING_BASE_COLOR,
    MUTED,
  ] as ExpressionSpecification
}

/**
 * `fill-extrusion-color`. Default `base` = single neutral; `byKind` = category colours + height tiers on housing.
 */
export function kindColorExpr(
  focusKinds?: readonly BuildingKind[] | null,
  mode: BuildingColorMode = 'base',
): ExpressionSpecification {
  const fill = mode === 'byKind' ? byKindExpr(focusKinds) : baseExpr(focusKinds)
  return ['case', ['boolean', ['feature-state', 'selected'], false], SELECTED, fill] as ExpressionSpecification
}
