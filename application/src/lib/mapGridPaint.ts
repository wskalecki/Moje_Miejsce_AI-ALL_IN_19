import { NO_SCORE, SCORE_RAMP_HEX } from './scoreColor'

const GRAY_FILL = '#bac2cc'

const scoreColorExpr = [
  'case',
  ['<', ['coalesce', ['get', 'displayScore'], NO_SCORE], 0],
  GRAY_FILL,
  [
    'interpolate',
    ['linear'],
    ['coalesce', ['get', 'displayScore'], 0],
    ...SCORE_RAMP_HEX.flatMap(({ score, color }) => [score, color]),
  ],
]

/** Główna siatka — fill (przezroczystość działa stabilnie na fill-opacity). */
export const MAP_GRID_FILL_PAINT = {
  'fill-color': scoreColorExpr,
  'fill-opacity': [
    'case',
    ['<', ['coalesce', ['get', 'displayScore'], NO_SCORE], 0],
    0.42,
    0.78,
  ],
}

/** Podbicie przy animacji fali (tylko komórki z lift > 0). */
export const MAP_GRID_LIFT_PAINT = {
  'fill-extrusion-color': scoreColorExpr,
  'fill-extrusion-height': ['*', ['coalesce', ['get', 'lift'], 0], 22],
  'fill-extrusion-base': 0,
  'fill-extrusion-opacity': 0.88,
}

export const MAP_GRID_LINE_PAINT = {
  'line-color': 'rgba(255, 255, 255, 0.65)',
  'line-width': 1,
  'line-opacity': 0.72,
}
