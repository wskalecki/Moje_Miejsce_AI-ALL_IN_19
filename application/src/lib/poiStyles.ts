import type { ExpressionSpecification } from 'maplibre-gl'

export type PoiSubtypeStyle = { label: string; color: string }

/** One entry per POI `subtype` (docs/data/poi-schema.md); order is the legend order. */
export const POI_SUBTYPES: Record<string, PoiSubtypeStyle> = {
  stop: { label: 'Przystanki', color: '#ffffff' },
  tram_stop: { label: 'Przystanki tramwajowe', color: '#ffffff' },
  toilet: { label: 'Toalety', color: '#f0c674' },
  aed: { label: 'Defibrylatory AED', color: '#ff6b6b' },
  pitch: { label: 'Boiska szkolne', color: '#9bcf7f' },
  sports_class: { label: 'Zajęcia sportowe', color: '#3fbf9f' },
  event: { label: 'Wydarzenia', color: '#e8a87c' },
  air_sensor: { label: 'Czujniki powietrza', color: '#7eb8da' },
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
