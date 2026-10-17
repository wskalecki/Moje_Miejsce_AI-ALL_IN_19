#!/usr/bin/env node
/**
 * Overpass → GeoJSON: jeziora, stawy, zbiorniki (bryła + delikatny brzeg).
 * Uruchom z katalogu application:
 *   node ../data/scripts/build_osm_water_sample.mjs
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appPkg = join(dirname(fileURLToPath(import.meta.url)), '../../application/package.json')
const require = createRequire(appPkg)
const buffer = require('@turf/buffer').default
const { polygon, featureCollection, feature } = require('@turf/helpers')

const south = 52.181
const west = 20.976
const north = 52.244
const east = 21.06

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../samples/osm_water_sample.geojson')

const query = `[out:json][timeout:180];
(
  way["natural"="water"](${south},${west},${north},${east});
  way["water"](${south},${west},${north},${east});
  way["landuse"="reservoir"](${south},${west},${north},${east});
  relation["natural"="water"](${south},${west},${north},${east});
  relation["water"](${south},${west},${north},${east});
  relation["landuse"="reservoir"](${south},${west},${north},${east});
);
out geom;`

async function fetchOverpass(attempt = 1) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'wwa42hackathon-siatka/1.0 (build_osm_water_sample)',
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

function closeRing(coords) {
  if (!coords.length) return coords
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) return [...coords, [...first]]
  return coords
}

function wayToPolygonCoords(way) {
  const geom = way.geometry
  if (!geom || geom.length < 3) return null
  return closeRing(geom.map((p) => [p.lon, p.lat]))
}

function relationOuterRings(relation) {
  const geom = relation.geometry
  if (!geom || !Array.isArray(geom) || geom.length < 3) return []
  const ring = []
  for (const pt of geom) {
    if (pt.lat == null || pt.lon == null) continue
    ring.push([pt.lon, pt.lat])
  }
  if (ring.length < 3) return []
  return [closeRing(ring)]
}

function waterKindFromTags(tags) {
  const water = (tags.water || '').toLowerCase()
  if (water === 'pond' || water === 'basin' || water === 'fishpond') return 'pond'
  if (water === 'reservoir' || tags.landuse === 'reservoir') return 'reservoir'
  if (water === 'lake' || water === 'lagoon') return 'lake'
  if (tags.natural === 'water') return 'lake'
  return 'water'
}

function shoreAndSurfacePolygons(coords, props) {
  const poly = polygon([coords])
  const shore = buffer(poly, 0.45, { units: 'meters', steps: 4 })
  if (!shore?.geometry) return []
  return [
    feature(shore.geometry, { ...props, kind: 'shore', osm_id: `${props.osm_id}-shore` }),
    feature(poly.geometry, props),
  ]
}

async function main() {
  console.log('Pobieranie wód z Overpass…')
  const data = await fetchOverpass()
  const features = []
  const seen = new Set()

  for (const el of data.elements ?? []) {
    if (el.type === 'way') {
      const coords = wayToPolygonCoords(el)
      if (!coords) continue
      const osmId = `way/${el.id}`
      if (seen.has(osmId)) continue
      seen.add(osmId)
      const kind = waterKindFromTags(el.tags ?? {})
      const props = {
        osm_id: osmId,
        kind,
        water: el.tags?.water,
        name: el.tags?.name,
      }
      features.push(...shoreAndSurfacePolygons(coords, props))
      continue
    }

    if (el.type === 'relation') {
      const rings = relationOuterRings(el)
      for (let i = 0; i < rings.length; i++) {
        const osmId = `relation/${el.id}${rings.length > 1 ? `#${i}` : ''}`
        if (seen.has(osmId)) continue
        seen.add(osmId)
        const kind = waterKindFromTags(el.tags ?? {})
        const props = {
          osm_id: osmId,
          kind,
          water: el.tags?.water,
          name: el.tags?.name,
        }
        features.push(...shoreAndSurfacePolygons(rings[i], props))
      }
    }
  }

  writeFileSync(OUT, JSON.stringify(featureCollection(features)))
  console.log(`Zapisano ${features.length} polygonów wody → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
