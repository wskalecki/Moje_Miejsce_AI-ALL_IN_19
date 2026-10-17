import { describe, expect, it } from 'vitest'
import { inferBuildingStyleTier } from './localBuildingMaterials'
import type { LocalBuildingProps } from './localServiceBuildings'

describe('inferBuildingStyleTier', () => {
  const poly = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [21.0, 52.22],
        [21.0003, 52.22],
        [21.0003, 52.2203],
        [21.0, 52.2203],
        [21.0, 52.22],
      ],
    ],
  }

  it('klasyfikuje wieżowiec po wysokości', () => {
    const props = { osm_id: '1', height: 80, building: 'yes' } as LocalBuildingProps
    expect(inferBuildingStyleTier(props, poly)).toBe('tower')
  })

  it('klasyfikuje kamienicę', () => {
    const props = { osm_id: '2', height: 18, building: 'yes' } as LocalBuildingProps
    expect(inferBuildingStyleTier(props, poly)).toBe('block')
  })

  it('klasyfikuje dom wolnostojący', () => {
    const props = { osm_id: '3', height: 7, building: 'detached' } as LocalBuildingProps
    expect(inferBuildingStyleTier(props, poly)).toBe('detached')
  })
})
