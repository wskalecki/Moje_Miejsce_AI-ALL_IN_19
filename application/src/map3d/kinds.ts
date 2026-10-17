/**
 * Building kinds (OSM 3D, src/lib/osm3d/buildingStyle.ts) in the app's category colours
 * (`CATEGORY_COLORS`): education kinds are shades of `edukacja`, health of `zdrowie`, culture and
 * churches of `kultura`, retail of `zakupy`. Housing keeps the warm neutral height tiers; civic and
 * office buildings stay in cool neutrals (no category).
 */
import type { ExpressionSpecification } from 'maplibre-gl'
import { CATEGORY_COLORS } from '../app/dictionary'
import type { CategoryKey } from '../app/types'
import { mix } from '../cinematic/palette'
import { BUILDING_LEGEND, RESIDENTIAL_TIERS, type BuildingKind, type BuildingLegendItem } from '../lib/osm3d/buildingStyle'

const C = CATEGORY_COLORS
const lighter = (c: string, k: number) => mix(c, '#ffffff', k)
const darker = (c: string, k: number) => mix(c, '#16161d', k)

/** Map colour per kind (residential / other: the swatch of a mid-height building). */
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

/** Building kinds that stand for a place category (`[]` for categories without buildings, e.g. zieleń). */
export function categoryKinds(category: CategoryKey): readonly BuildingKind[] {
  return CATEGORY_KINDS[category] ?? []
}

export type KindLegendItem = BuildingLegendItem & { color: string }

/** Legend in display order with the category-aligned colours. */
export const KIND_LEGEND: readonly KindLegendItem[] = BUILDING_LEGEND.map((i) => ({ ...i, color: KIND_COLOR[i.kind] }))

const HEIGHT: ExpressionSpecification = ['coalesce', ['get', 'h'], 9]
const MUTED = '#dcd8d1'
/** Clicked building: dark ink, distinct from every kind colour. */
const SELECTED = '#2b2f45'

const residentialExpr = ['interpolate', ['linear'], HEIGHT, ...RESIDENTIAL_TIERS.flat()] as ExpressionSpecification
const otherExpr = ['interpolate', ['linear'], HEIGHT, 0, '#d6d2cb', 20, '#c6c1b9', 60, '#b5b0a8'] as ExpressionSpecification

/**
 * `fill-extrusion-color` by kind (same structure as buildingStyle.buildingColorExpr, app colours).
 * With `focusKinds` everything else is muted; `selected` feature-state wins (clicked building).
 */
export function kindColorExpr(focusKinds?: readonly BuildingKind[] | null): ExpressionSpecification {
  const on = (k: BuildingKind) => !focusKinds || focusKinds.includes(k)
  const pairs: (string | ExpressionSpecification)[] = []
  for (const item of BUILDING_LEGEND) {
    if (item.kind === 'residential' || item.kind === 'other') continue
    pairs.push(item.kind, on(item.kind) ? KIND_COLOR[item.kind] : MUTED)
  }
  const match = [
    'match',
    ['get', 'kind'],
    ...pairs,
    'residential',
    on('residential') ? residentialExpr : MUTED,
    on('other') ? otherExpr : MUTED,
  ] as unknown as ExpressionSpecification
  return ['case', ['boolean', ['feature-state', 'selected'], false], SELECTED, match] as ExpressionSpecification
}
