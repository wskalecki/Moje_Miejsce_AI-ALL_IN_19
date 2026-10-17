/**
 * Osiedle 3D view — OSM buildings coloured by kind, asphalt roads with a curb, schedule-based
 * congestion by hour (docs/data/zrodla-danych.md §6–7).
 *
 * Shared state (no provider needed):
 *   useTrafficHour(): [hour, setHour]       hour 0–23 of the map's traffic slider (default: now)
 *   getTrafficHour() / setTrafficHour(h) / subscribeTrafficHour(fn)
 *   focusCategory(category | null)          highlight the buildings of a place category on the map
 *   setBuildingFocus(kinds | null), useBuildingFocus()
 *
 * Map side: CinemaScene (src/cinematic/scene.ts) owns one AreaLayers per osiedle with data;
 * the UI over the map is <Osm3dOverlay area={…} />.
 */
export { focusCategory, getBuildingFocus, getTrafficHour, setBuildingFocus, setTrafficHour, subscribeBuildingFocus, subscribeTrafficHour, useBuildingFocus, useTrafficHour } from './store'
export { categoryKinds, KIND_CATEGORY, KIND_COLOR, KIND_LEGEND, kindColorExpr } from './kinds'
export { TRAFFIC_CAPTION, TRAFFIC_LEGEND, TRAFFIC_STOPS, trafficAtHour } from './trafficStyle'
export type { AreaData } from './areaData'
export type { AreaLayers } from './AreaLayers'
