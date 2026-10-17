import * as maplibregl from 'maplibre-gl'
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

/** Required for Vite — default worker path breaks in dev/build. */
maplibregl.setWorkerUrl(maplibreWorker)
