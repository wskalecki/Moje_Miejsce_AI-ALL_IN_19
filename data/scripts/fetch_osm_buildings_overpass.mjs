#!/usr/bin/env node
/**
 * Overpass → stdout (JSON). Args: south west north east
 * Użycie: node fetch_osm_buildings_overpass.mjs 52.181 20.976 52.244 21.06
 */
const [south, west, north, east] = process.argv.slice(2).map(Number)
if ([south, west, north, east].some((n) => Number.isNaN(n))) {
  console.error('usage: node fetch_osm_buildings_overpass.mjs <south> <west> <north> <east>')
  process.exit(1)
}

const query = `[out:json][timeout:180];
way["building"](${south},${west},${north},${east});
out geom;`

const body = 'data=' + encodeURIComponent(query)

async function run(attempt) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'wwa42hackathon-siatka/1.0 (data/scripts/fetch_osm_buildings)',
    },
    body,
  })
  const text = await res.text()
  if (!res.ok) {
    if (attempt < 4 && (res.status === 502 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, attempt * 8000))
      return run(attempt + 1)
    }
    console.error(text.slice(0, 400))
    process.exit(1)
  }
  process.stdout.write(text)
}

run(1)
