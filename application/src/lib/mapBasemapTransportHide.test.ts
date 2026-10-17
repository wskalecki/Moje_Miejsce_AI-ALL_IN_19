import { describe, expect, it, vi } from 'vitest'
import { setBasemapTransportLayersVisible } from './mapBasemapTransportHide'

describe('setBasemapTransportLayersVisible', () => {
  it('ukrywa warstwy line z source-layer transportation', () => {
    const calls: Array<[string, string, string]> = []
    const map = {
      getStyle: () => ({
        layers: [
          { id: 'road-primary', type: 'line', 'source-layer': 'transportation' },
          { id: 'labels', type: 'symbol' },
        ],
      }),
      getLayer: (id: string) => (id === 'road-primary' ? {} : undefined),
      setLayoutProperty: (id: string, prop: string, value: string) => {
        calls.push([id, prop, value])
      },
    }

    setBasemapTransportLayersVisible(map as never, false)
    expect(calls).toEqual([['road-primary', 'visibility', 'none']])
  })

  it('nie rzuca gdy brak stylu', () => {
    const map = { getStyle: () => undefined, getLayer: vi.fn(), setLayoutProperty: vi.fn() }
    expect(() => setBasemapTransportLayersVisible(map as never, true)).not.toThrow()
  })
})
