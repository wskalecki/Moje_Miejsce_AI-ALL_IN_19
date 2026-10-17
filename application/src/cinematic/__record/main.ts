/**
 * DEV-only recording stage for the flyover clips (T8): `npx vite` → /record.html?slug=powisle.
 * Renders the 3D map in the "golden hour" look with no UI and exposes a deterministic camera:
 *
 *   await window.__ready                 // style, tiles and scene are in place
 *   await window.__seek(i)               // camera for frame i, resolves on the map's 'idle'
 *   window.__frames                      // { total, loop, fps } — frames to capture
 *
 * The capture script is `application/scripts/record-flyovers.mjs`. Not part of the app bundle.
 */
import { Map as MlMap } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import '../../lib/maplibreSetup'
import { DATA_URLS, MAP_STYLE_URL } from '../../app/config'
import { warmBasemap } from '../../map/basemap'
import { OSIEDLA, OSIEDLA_BY_SLUG, type OsiedleSlug } from '../../mock/osiedla'
import { CinemaScene, type SceneTarget } from '../scene'

const params = new URLSearchParams(location.search)
const slug = (params.get('slug') ?? 'powisle') as OsiedleSlug
const o = OSIEDLA_BY_SLUG[slug] ?? OSIEDLA[0]
const FPS = Number(params.get('fps') ?? 30)
const SECONDS = Number(params.get('seconds') ?? 9)
/** Extra frames rendered after the clip: crossfaded into its head so the clip loops seamlessly. */
const LOOP_FRAMES = FPS
const CLIP = Math.round(FPS * SECONDS)

const zoom0 = o.cameraZoom ?? 16
const PITCH0 = 60
/** Drone move: the clip starts on the camera where the live fly-in ends, then orbits and pushes in. */
const MOVE = { bearing: 30, zoom: 0.35, pitch: 8 }

function cameraAt(i: number) {
  const t = i / CLIP
  return {
    center: o.center,
    zoom: zoom0 + MOVE.zoom * t,
    pitch: PITCH0 + MOVE.pitch * t,
    bearing: o.cameraBearing + MOVE.bearing * t,
  }
}

declare global {
  interface Window {
    __ready: Promise<void>
    __seek: (i: number) => Promise<void>
    __frames: { total: number; loop: number; fps: number }
  }
}

const map = new MlMap({
  container: 'map',
  style: MAP_STYLE_URL,
  ...cameraAt(0),
  interactive: false,
  attributionControl: false,
  fadeDuration: 0,
  maxPitch: 70,
  canvasContextAttributes: { antialias: true, preserveDrawingBuffer: true },
})

const idle = () =>
  new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, 15000)
    map.once('idle', () => {
      window.clearTimeout(timer)
      resolve()
    })
    map.triggerRepaint()
  })

window.__frames = { total: CLIP + LOOP_FRAMES, loop: LOOP_FRAMES, fps: FPS }

window.__ready = new Promise<void>((resolve) => {
  map.once('load', async () => {
    warmBasemap(map)
    // a drone shot has no labels
    for (const l of map.getStyle().layers) if (l.type === 'symbol') map.setLayoutProperty(l.id, 'visibility', 'none')
    const shapes = (await (await fetch(DATA_URLS.osiedlaGeojson)).json()) as FeatureCollection<Polygon | MultiPolygon>
    const shape = shapes.features.find((f) => f.properties?.id === o.msiId) as Feature<Polygon | MultiPolygon>
    const target: SceneTarget = { slug: o.slug, owner: o.profile, center: o.center, bearing: o.cameraBearing, zoom: zoom0, shape }
    const scene = new CinemaScene(map, [target], { dayLook: 'golden', overlays: false })
    scene.setLook('golden', o.slug, 0)
    scene.traceOutline(0, { glint: false })
    await idle()
    // second pass: tiles requested by the first frame (sky, far tiles) have arrived
    await idle()
    resolve()
  })
})

window.__seek = async (i: number) => {
  await window.__ready
  map.jumpTo(cameraAt(i))
  await idle()
}
