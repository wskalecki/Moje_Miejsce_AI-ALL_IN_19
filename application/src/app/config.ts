/** App-wide constants (spec §4.0, §4.3, §15). */

export const APP_NAME = 'Okolica'

export const APP_TAGLINE =
  'Znajdź okolicę w Warszawie, która pasuje do Twojego życia — zanim zaczniesz szukać mieszkania.'

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
export const MAP_STYLE_FALLBACK_URL =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export const START_CAMERA = {
  center: [21.0122, 52.2297] as [number, number],
  zoom: 10.4,
  pitch: 0,
  bearing: 0,
}
export const START_CAMERA_SETTLE_ZOOM = 10.8

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [20.75, 52.03],
  [21.4, 52.43],
]
export const MAP_MIN_ZOOM = 9.5
export const MAP_MAX_ZOOM = 18
export const MAP_MAX_PITCH = 70

/** Static data files in `public/data/`. */
export const DATA_URLS = {
  heat: '/data/heat.json',
  osiedlaScores: '/data/osiedla-scores.json',
  osiedlaGeojson: '/data/osiedla.geojson',
} as const

/** v2: adds `weights`, drops the 4-priority limit. */
export const STORAGE_KEY = 'okolica.mock.v2'

/** Duration of the "Dopasowujemy" screen (spec §4.2). */
export const MATCHING_DURATION_MS = 1800

export const DEMO_NOTE =
  'Wersja demonstracyjna — liczby policzone z otwartych danych bez ręcznych korekt; szacunki są oznaczone'
