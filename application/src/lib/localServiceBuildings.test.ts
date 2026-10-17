import type { FeatureCollection } from 'geojson'
import { describe, expect, it } from 'vitest'
import {
  autoMatchPoisToLocalBuildings,
  localBuildingsForMap,
  matchPoiToLocalBuilding,
  mergeLocalBuildingPicks,
} from './localServiceBuildings'

const buildings: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: '100',
      properties: { osm_id: '100', height: 20 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [21.0, 52.0],
            [21.001, 52.0],
            [21.001, 52.001],
            [21.0, 52.001],
            [21.0, 52.0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: '200',
      properties: { osm_id: '200', height: 30 },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [21.0, 52.0],
            [21.002, 52.0],
            [21.002, 52.002],
            [21.0, 52.002],
            [21.0, 52.0],
          ],
        ],
      },
    },
  ],
}

describe('localServiceBuildings', () => {
  it('wybiera najmniejszy budynek zawierający punkt', () => {
    const hit = matchPoiToLocalBuilding(21.0005, 52.0005, buildings)
    expect(hit?.properties?.osm_id).toBe('100')
  })

  it('matchuje POI do osm_id', () => {
    const poi: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { category: 'education' },
          geometry: { type: 'Point', coordinates: [21.0005, 52.0005] },
        },
      ],
    }
    const picks = autoMatchPoisToLocalBuildings(poi, buildings)
    expect(picks).toEqual([{ highlightId: '100', category: 'education' }])
  })

  it('ustawia category w kopii GeoJSON', () => {
    const map = mergeLocalBuildingPicks(
      [{ highlightId: '100', category: 'transit' }],
      [],
    )
    const out = localBuildingsForMap(buildings, map, true)
    expect(out.features[0]?.properties?.category).toBe('transit')
    expect(out.features[1]?.properties?.category).toBeNull()
  })

  it('zostawia budynki na mapie gdy POI wyłączone', () => {
    const out = localBuildingsForMap(buildings, new Map(), false)
    expect(out.features).toHaveLength(2)
    expect(out.features[0]?.properties?.category).toBeNull()
    expect(out.features[0]?.properties?.style_tier).toBeTruthy()
  })
})
