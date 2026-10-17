#!/usr/bin/env node
/**
 * Overpass → GeoJSON z buforowanymi bryłami drogi (curb + surface).
 * Uruchom z katalogu application (ma @turf/* w devDependencies):
 *   node ../data/scripts/build_osm_roads_sample.mjs
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appPkg = join(dirname(fileURLToPath(import.meta.url)), '../../application/package.json')
const require = createRequire(appPkg)
const buffer = require('@turf/buffer').default
const { lineString, featureCollection, feature } = require('@turf/helpers')

const south = 52.181
const west = 20.976
const north = 52.244
const east = 21.06

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../samples/osm_roads_sample.geojson')

const HIGHWAY_WIDTH_M = {
  motorway: 14,
  trunk: 12,
  primary: 10,
  secondary: 8,
  tertiary: 7,
  residential: 5.5,
  living_street: 5,
  unclassified: 5,
}

const CURB_EXTRA_M = 0.45
/** Lekkie rozszerzenie nawierzchni — mniejsze szczeliny na węzłach OSM (osobne way). */
const SURFACE_JOIN_OVERLAP_M = 0.28

const query = `[out:json][timeout:180];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|living_street|unclassified)$"](${south},${west},${north},${east});
out geom;`

async function fetchOverpass(attempt = 1) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'wwa42hackathon-siatka/1.0 (build_osm_roads_sample)',
    },
    body: 'data=' + encodeURIComponent(query),
  })
  const text = await res.text()
  if (!res.ok) {
    if (attempt < 4 && (res.status === 502 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, attempt * 8000))
      return fetchOverpass(attempt + 1)
    }
    throw new Error(`Overpass ${res.status}: ${text.slice(0, 300)}`)
  }
  return JSON.parse(text)
}

function wayToLineCoords(way) {
  const geom = way.geometry
  if (!geom || geom.length < 2) return null
  return geom.map((p) => [p.lon, p.lat])
}

function bufferedPolygon(coords, radiusM) {
  const ls = lineString(coords)
  const poly = buffer(ls, radiusM, { units: 'meters', steps: 4 })
  if (!poly?.geometry) return null
  return poly.geometry
}

async function main() {
  console.log('Pobieranie dróg z Overpass…')
  const data = await fetchOverpass()
  const features = []

  for (const el of data.elements ?? []) {
    if (el.type !== 'way') continue
    const highway = el.tags?.highway
    const widthM = HIGHWAY_WIDTH_M[highway]
    if (!widthM) continue
    const coords = wayToLineCoords(el)
    if (!coords) continue

    const osmId = String(el.id)
    const curbGeom = bufferedPolygon(coords, widthM / 2 + CURB_EXTRA_M)
    const surfaceGeom = bufferedPolygon(coords, widthM / 2 + SURFACE_JOIN_OVERLAP_M)
    if (!curbGeom || !surfaceGeom) continue

    features.push(
      feature(curbGeom, {
        osm_id: osmId,
        highway,
        part: 'curb',
        width_m: widthM,
      }),
      feature(surfaceGeom, {
        osm_id: osmId,
        highway,
        part: 'surface',
        width_m: widthM,
      }),
    )
  }

  const fc = featureCollection(features)
  writeFileSync(OUT, JSON.stringify(fc))
  console.log(`Zapisano ${features.length} polygonów → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
