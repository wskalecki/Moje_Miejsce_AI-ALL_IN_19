/**
 * Progi zoomu dla warstw szczegółu (parki, woda, drogi, POI).
 * Wyższe wartości = dłużej widać tylko siatkę i basemap przy oddalaniu.
 */
export const MAP_LANDSCAPE_MIN_ZOOM = {
  water: 13.5,
  greenParkFloor: 13.5,
  greenPark: 14,
  greenPitch: 14.5,
  greenPitchLine: 15,
  greenTrees: 14.5,
  roads: 14.5,
} as const

/** Extrusion budynków z wektora basemap (Carto). */
export const MAP_BASEMAP_3D_BUILDINGS_MIN_ZOOM = 15.5

/** Demo footprinty POI + klikanie budynków z basemap. */
export const MAP_POI_DETAIL_MIN_ZOOM = 15.5

/** Lokalne bryły OSM (gdy włączone z manifestu). */
export const MAP_LOCAL_BUILDINGS_MIN_ZOOM = 15
