import type { Map as MlMap } from 'maplibre-gl'
import { START_CAMERA, START_CAMERA_SETTLE_ZOOM } from '../app/config'

/** Warsaw bbox (from heat.json). */
const WARSAW_BBOX: [[number, number], [number, number]] = [
  [20.852, 52.098],
  [21.271, 52.368],
]

/** Whole-Warsaw camera: spec zoom 10.8, but never tighter than what fits the city in the viewport. */
export function homeCamera(map: MlMap, padding: { top: number; bottom: number; left: number; right: number }) {
  const cam = map.cameraForBounds(WARSAW_BBOX, { padding })
  const zoom = Math.min(START_CAMERA_SETTLE_ZOOM, cam?.zoom ?? START_CAMERA_SETTLE_ZOOM)
  const c = cam?.center ? (cam.center as { lng: number; lat: number }) : { lng: START_CAMERA.center[0], lat: START_CAMERA.center[1] }
  return { center: [c.lng, c.lat] as [number, number], zoom, pitch: 0, bearing: 0 }
}

/** Padding for the home camera; T6 reserves the left column for the "Polecane" panel. */
export function homePadding() {
  return { top: 48, bottom: 48, left: 48, right: 48 }
}
