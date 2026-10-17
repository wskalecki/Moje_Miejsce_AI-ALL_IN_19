import type { ExpressionSpecification } from 'maplibre-gl'

export type PoiSubtypeStyle = { label: string; color: string }

/** One entry per POI `subtype` (docs/data/poi-schema.md); order is the legend order. */
export const POI_SUBTYPES: Record<string, PoiSubtypeStyle> = {
  stop: { label: 'Przystanki', color: '#ffffff' },
  tram_stop: { label: 'Przystanki tramwajowe', color: '#ffffff' },
  toilet: { label: 'Toalety', color: '#f0c674' },
  aed: { label: 'Defibrylatory AED', color: '#ff6b6b' },
  parking: { label: 'Parkingi miejskie', color: '#8c9eff' },
  medicine_disposal: { label: 'Odbiór leków', color: '#d48fd8' },
  e_waste: { label: 'Elektroodpady', color: '#b39ddb' },
  waste_collection: { label: 'PSZOK', color: '#a1887f' },
  food_sharing: { label: 'Jadłodzielnie', color: '#ffb74d' },
  pitch: { label: 'Boiska szkolne', color: '#9bcf7f' },
  sports_class: { label: 'Zajęcia sportowe', color: '#3fbf9f' },
  event: { label: 'Wydarzenia', color: '#e8a87c' },
  air_sensor: { label: 'Czujniki powietrza', color: '#7eb8da' },
  weather_station: { label: 'Stacje pogodowe', color: '#4dd0e1' },
  bo_project: { label: 'Budżet obywatelski — w realizacji', color: '#ffe066' },
  bo_done: { label: 'Budżet obywatelski — zrealizowane', color: '#c5b358' },
}

const FALLBACK_COLOR = '#cccccc'

export function subtypeStyle(subtype: string): PoiSubtypeStyle {
  return POI_SUBTYPES[subtype] ?? { label: subtype, color: FALLBACK_COLOR }
}

export const poiColorExpression: ExpressionSpecification = [
  'match',
  ['get', 'subtype'],
  ...Object.entries(POI_SUBTYPES).flatMap(([subtype, style]) => [subtype, style.color]),
  FALLBACK_COLOR,
] as unknown as ExpressionSpecification
