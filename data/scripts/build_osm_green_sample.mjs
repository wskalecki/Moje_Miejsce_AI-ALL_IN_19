#!/usr/bin/env node
/**
 * Overpass → GeoJSON: parki, boiska, drzewa (tylko w parkach) + linie boisk.
 * Uruchom z katalogu application:
 *   node ../data/scripts/build_osm_green_sample.mjs
 */
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appPkg = join(dirname(fileURLToPath(import.meta.url)), '../../application/package.json')
const require = createRequire(appPkg)
const buffer = require('@turf/buffer').default
const { point, lineString, polygon, featureCollection, feature } = require('@turf/helpers')

const south = 52.181
const west = 20.976
const north = 52.244
const east = 21.06

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../samples/osm_green_sample.geojson')

const MAX_TREES_TOTAL = 3200
const MAX_TREES_PER_PARK = 140
const TREE_GRID_STEP_M = 24

const query = `[out:json][timeout:240];
(
  way["leisure"="park"](${south},${west},${north},${east});
  way["landuse"="grass"](${south},${west},${north},${east});
  way["landuse"="recreation_ground"](${south},${west},${north},${east});
  way["leisure"="garden"]["access"!="private"](${south},${west},${north},${east});
  way["leisure"="pitch"](${south},${west},${north},${east});
  relation["leisure"="park"](${south},${west},${north},${east});
  relation["landuse"="grass"](${south},${west},${north},${east});
  relation["landuse"="recreation_ground"](${south},${west},${north},${east});
  relation["leisure"="garden"]["access"!="private"](${south},${west},${north},${east});
  node["natural"="tree"](${south},${west},${north},${east});
);
out geom;`

async function fetchOverpass(attempt = 1) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'wwa42hackathon-siatka/1.0 (build_osm_green_sample)',
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

function wayToPolygonCoords(way) {
  const geom = way.geometry
  if (!geom || geom.length < 3) return null
  const coords = geom.map((p) => [p.lon, p.lat])
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first])
  return coords
}

function relationToPolygonCoords(relation) {
  const geom = relation.geometry
  if (!geom || geom.length < 3) return null
  const coords = geom.map((p) => [p.lon, p.lat])
  const first = coords[0]
  const last = coords[coords.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first])
  return coords
}

function parkFeature(coords, props) {
  return polygon([coords], props)
}

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 0.0) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pointInPolygonRing(lon, lat, ring) {
  return pointInRing(lon, lat, ring)
}

function metersToDelta(lat, meters) {
  const mPerDegLat = 111_320
  const mPerDegLon = 111_320 * Math.cos((lat * Math.PI) / 180)
  return { dLon: meters / mPerDegLon, dLat: meters / mPerDegLat }
}

function parkClassFromTags(tags) {
  if (tags.landuse === 'grass') return 'grass'
  if (tags.leisure === 'garden') return 'garden'
  if (tags.landuse === 'recreation_ground') return 'recreation'
  if (tags.leisure === 'park') return 'park'
  return 'grass'
}

function isTreeParkTags(tags) {
  return (
    tags.leisure === 'park' ||
    tags.leisure === 'garden' ||
    tags.landuse === 'recreation_ground'
  )
}

function pitchKindFromTags(tags) {
  const sport = (tags.sport || '').toLowerCase()
  if (sport.includes('soccer') || sport.includes('football') || sport === 'futsal') {
    return 'pitch_football'
  }
  if (sport.includes('basketball')) return 'pitch_basketball'
  return 'pitch_other'
}

function pitchLineFeatures(coords, kind, osmId, name) {
  const ring = coords.slice(0, -1)
  if (ring.length < 3) return []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const [x, y] of ring) {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const lines = []
  const outline = [...ring, ring[0]]
  lines.push(
    lineString(outline, {
      osm_id: osmId,
      kind: 'pitch_line',
      pitch_kind: kind,
      name: name || undefined,
      line_role: 'outline',
    }),
  )
  if (kind === 'pitch_football') {
    lines.push(
      lineString([[cx, minY], [cx, maxY]], {
        osm_id: `${osmId}-mid`,
        kind: 'pitch_line',
        pitch_kind: kind,
        line_role: 'center',
      }),
    )
  }
  if (kind === 'pitch_basketball') {
    const inset = 0.15
    const w = maxX - minX
    const h = maxY - minY
    lines.push(
      lineString(
        [
          [minX + w * inset, cy],
          [maxX - w * inset, cy],
        ],
        {
          osm_id: `${osmId}-mid`,
          kind: 'pitch_line',
          pitch_kind: kind,
          line_role: 'center',
        },
      ),
    )
    lines.push(
      lineString(
        [
          [cx, minY + h * inset],
          [cx, maxY - h * inset],
        ],
        {
          osm_id: `${osmId}-vert`,
          kind: 'pitch_line',
          pitch_kind: kind,
          line_role: 'center',
        },
      ),
    )
  }
  return lines
}

function treeMetricsFromSeed(seed) {
  const hash = Math.abs(Number(seed)) % 97
  const canopyRadius = 4.2 + (hash % 5) * 0.65
  const trunkRadius = 0.55 + (hash % 4) * 0.14
  const trunkTop = 4.2 + (hash % 6) * 0.45
  const canopyTop = trunkTop + 8.5 + (hash % 5) * 1.1
  return { canopyRadius, trunkRadius, trunkTop, canopyTop }
}

function treeFeaturesAt(lon, lat, osmId, parkOsmId, name) {
  const { canopyRadius, trunkRadius, trunkTop, canopyTop } = treeMetricsFromSeed(osmId)
  const pt = point([lon, lat])
  const trunkPoly = buffer(pt, trunkRadius, { units: 'meters', steps: 6 })
  const canopyPoly = buffer(pt, canopyRadius, { units: 'meters', steps: 10 })
  if (!trunkPoly?.geometry || !canopyPoly?.geometry) return []
  return [
    feature(trunkPoly.geometry, {
      osm_id: String(osmId),
      park_osm_id: parkOsmId,
      kind: 'tree_trunk',
      trunk_base_m: 0.1,
      trunk_top_m: trunkTop,
      name,
    }),
    feature(canopyPoly.geometry, {
      osm_id: String(osmId),
      park_osm_id: parkOsmId,
      kind: 'tree_canopy',
      canopy_base_m: trunkTop - 0.2,
      canopy_top_m: canopyTop,
    }),
  ]
}

function findTreeParkId(lon, lat, treeParks, pitchRings) {
  for (const ring of pitchRings) {
    if (pointInPolygonRing(lon, lat, ring)) return null
  }
  for (const park of treeParks) {
    if (pointInPolygonRing(lon, lat, park.ring)) return park.osmId
  }
  return null
}

function scatterTreesInPark(park, pitchRings, existingKeys, treeCountByPark) {
  const ring = park.ring.slice(0, -1)
  if (ring.length < 3) return []
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon)
    minLat = Math.min(minLat, lat)
    maxLon = Math.max(maxLon, lon)
    maxLat = Math.max(maxLat, lat)
  }
  const midLat = (minLat + maxLat) / 2
  const step = metersToDelta(midLat, TREE_GRID_STEP_M)
  const out = []
  let placed = treeCountByPark.get(park.osmId) ?? 0
  const target = Math.min(MAX_TREES_PER_PARK, Math.max(12, Math.floor(park.areaHa * 35)))

  for (let lat = minLat; lat <= maxLat; lat += step.dLat) {
    for (let lon = minLon; lon <= maxLon; lon += step.dLon) {
      if (placed >= target) break
      if (!pointInPolygonRing(lon, lat, park.ring)) continue
      let onPitch = false
      for (const pr of pitchRings) {
        if (pointInPolygonRing(lon, lat, pr)) {
          onPitch = true
          break
        }
      }
      if (onPitch) continue
      const cellKey = `${Math.round(lon * 1e5)}:${Math.round(lat * 1e5)}`
      if (existingKeys.has(cellKey)) continue
      const jitterLon = lon + step.dLon * 0.22 * ((placed % 3) - 1)
      const jitterLat = lat + step.dLat * 0.18 * ((placed % 5) - 2)
      if (!pointInPolygonRing(jitterLon, jitterLat, park.ring)) continue
      const osmId = `gen-${park.osmId}-${placed}`
      existingKeys.add(cellKey)
      placed++
      treeCountByPark.set(park.osmId, placed)
      out.push(...treeFeaturesAt(jitterLon, jitterLat, osmId, park.osmId, undefined))
    }
    if (placed >= target) break
  }
  return out
}

function ringAreaHa(ring) {
  let area = 0
  const r = ring.slice(0, -1)
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length
    area += r[i][0] * r[j][1] - r[j][0] * r[i][1]
  }
  const m2 = Math.abs(area) * 0.5 * 111_320 * 111_320 * Math.cos(((south + north) / 2) * (Math.PI / 180))
  return m2 / 10_000
}

async function main() {
  console.log('Pobieranie parków / boisk / drzew z Overpass…')
  const data = await fetchOverpass()
  const features = []
  const treeNodes = []
  const treeParks = []
  const pitchRings = []

  for (const el of data.elements ?? []) {
    if (el.type === 'node' && el.tags?.natural === 'tree') {
      treeNodes.push(el)
      continue
    }
    if (el.type === 'relation') {
      const coords = relationToPolygonCoords(el)
      if (!coords) continue
      const osmId = `relation/${el.id}`
      const name = el.tags?.name
      const isPark =
        el.tags?.leisure === 'park' ||
        el.tags?.leisure === 'garden' ||
        el.tags?.landuse === 'grass' ||
        el.tags?.landuse === 'recreation_ground'
      if (!isPark) continue
      features.push(
        parkFeature(coords, {
          osm_id: osmId,
          kind: 'park',
          park_class: parkClassFromTags(el.tags ?? {}),
          name,
        }),
      )
      if (isTreeParkTags(el.tags ?? {})) {
        treeParks.push({ osmId, ring: coords, areaHa: ringAreaHa(coords) })
      }
      continue
    }

    if (el.type !== 'way') continue
    const coords = wayToPolygonCoords(el)
    if (!coords) continue
    const osmId = String(el.id)
    const name = el.tags?.name

    if (el.tags?.leisure === 'pitch') {
      pitchRings.push(coords)
      const kind = pitchKindFromTags(el.tags)
      features.push(
        parkFeature(coords, {
          osm_id: osmId,
          kind,
          sport: el.tags.sport || 'unknown',
          name,
        }),
      )
      features.push(...pitchLineFeatures(coords, kind, osmId, name))
      continue
    }

    const isPark =
      el.tags?.leisure === 'park' ||
      el.tags?.leisure === 'garden' ||
      el.tags?.landuse === 'grass' ||
      el.tags?.landuse === 'recreation_ground'
    if (!isPark) continue

    features.push(
      parkFeature(coords, {
        osm_id: osmId,
        kind: 'park',
        park_class: parkClassFromTags(el.tags),
        name,
      }),
    )

    if (isTreeParkTags(el.tags)) {
      treeParks.push({
        osmId,
        ring: coords,
        areaHa: ringAreaHa(coords),
      })
    }
  }

  const existingTreeCells = new Set()
  const treeCountByPark = new Map()
  let treeNodeCount = 0

  for (const node of treeNodes) {
    if (treeNodeCount >= MAX_TREES_TOTAL) break
    const lon = node.lon
    const lat = node.lat
    if (lon == null || lat == null) continue
    const parkId = findTreeParkId(lon, lat, treeParks, pitchRings)
    if (!parkId) continue
    const cellKey = `${Math.round(lon * 1e5)}:${Math.round(lat * 1e5)}`
    if (existingTreeCells.has(cellKey)) continue
    const count = treeCountByPark.get(parkId) ?? 0
    if (count >= MAX_TREES_PER_PARK) continue
    existingTreeCells.add(cellKey)
    treeCountByPark.set(parkId, count + 1)
    treeNodeCount++
    const name = node.tags?.species || node.tags?.genus || undefined
    features.push(...treeFeaturesAt(lon, lat, node.id, parkId, name))
  }

  for (const park of treeParks) {
    const scattered = scatterTreesInPark(park, pitchRings, existingTreeCells, treeCountByPark)
    features.push(...scattered)
    const trunks = features.filter((f) => f.properties?.kind === 'tree_trunk').length
    if (trunks >= MAX_TREES_TOTAL) break
  }

  const trunkCount = features.filter((f) => f.properties?.kind === 'tree_trunk').length
  const fc = featureCollection(features)
  writeFileSync(OUT, JSON.stringify(fc))
  console.log(`Zapisano ${features.length} obiektów (${trunkCount} drzew w parkach) → ${OUT}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
