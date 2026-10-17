import { describe, expect, it } from 'vitest'
import { setBasemapWaterLayersVisible } from './mapBasemapWaterHide'

describe('setBasemapWaterLayersVisible', () => {
  it('ukrywa warstwy fill z source-layer water', () => {
    const calls: Array<[string, string, string]> = []
    const map = {
      getStyle: () => ({
        layers: [{ id: 'water', type: 'fill', 'source-layer': 'water' }],
      }),
      getLayer: () => ({}),
      setLayoutProperty: (id: string, prop: string, value: string) => {
        calls.push([id, prop, value])
      },
    }

    setBasemapWaterLayersVisible(map as never, false)
    expect(calls).toEqual([['water', 'visibility', 'none']])
  })
})
