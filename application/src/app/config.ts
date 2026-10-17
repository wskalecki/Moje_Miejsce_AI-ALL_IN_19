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
  /** Per-category heat grid (values 0–1) — the map's heatmap source. */
  heatCategories: '/data/heat-categories.json',
  osiedlaScores: '/data/osiedla-scores.json',
  osiedlaGeojson: '/data/osiedla.geojson',
  /** Legacy per-profile grid, read only when heat-categories.json is missing (not preloaded). */
  heat: '/data/heat.json',
} as const

/** Data files warmed up from the intro / survey and on a cold `/mapa` entry. */
export const PRELOAD_DATA_URLS: readonly string[] = [DATA_URLS.heatCategories, DATA_URLS.osiedlaScores, DATA_URLS.osiedlaGeojson]

/** Years covered by the osiedle timeline (all known investments). */
export const TIMELINE_FIRST_YEAR = 2026
export const TIMELINE_LAST_YEAR = 2040

/** v2: adds `weights`, drops the 4-priority limit. */
export const STORAGE_KEY = 'okolica.mock.v2'

/** Panel tutorial dismissed (left filter hints). */
export const PANEL_HINT_KEY = 'okolica.panelHint.v1'

/** Left filter column width (px) — keep in sync with `--smap-panel-width` in map.css. */
export const FILTER_PANEL_WIDTH = 416

/** Duration of the "Dopasowujemy" screen (spec §4.2). */
export const MATCHING_DURATION_MS = 1800

export const DEMO_NOTE =
  'Wersja demonstracyjna — liczby policzone z otwartych danych bez ręcznych korekt; szacunki są oznaczone'
