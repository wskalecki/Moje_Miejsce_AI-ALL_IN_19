import { describe, expect, it } from 'vitest'
import { setBasemapGreenLayersVisible } from './mapBasemapGreenHide'

describe('setBasemapGreenLayersVisible', () => {
  it('ukrywa warstwy fill z source-layer landcover', () => {
    const calls: Array<[string, string, string]> = []
    const map = {
      getStyle: () => ({
        layers: [{ id: 'landcover_grass', type: 'fill', 'source-layer': 'landcover' }],
      }),
      getLayer: () => ({}),
      setLayoutProperty: (id: string, prop: string, value: string) => {
        calls.push([id, prop, value])
      },
    }

    setBasemapGreenLayersVisible(map as never, false)
    expect(calls).toEqual([['landcover_grass', 'visibility', 'none']])
  })
})
