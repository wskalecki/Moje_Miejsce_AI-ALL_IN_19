import type { FilterSpecification } from 'maplibre-gl'
import { describe, expect, it } from 'vitest'
import {
  normalizeBuildingRender3dFilter,
  render3dFilterForExtrusionLayer,
  resolveBasemapBuildingStackFromLayers,
} from './mapBasemapBuildingHighlight'

describe('resolveBasemapBuildingStackFromLayers', () => {
  it('rozpoznaje warstwy MapTiler (Building / Building 3D)', () => {
    const layers = [
      {
        id: 'Building',
        type: 'fill',
        source: 'maptiler_planet',
        'source-layer': 'building',
      },
      {
        id: 'Building 3D',
        type: 'fill-extrusion',
        source: 'maptiler_planet',
        'source-layer': 'building',
        filter: ['!', ['has', 'hide_3d']] as FilterSpecification,
      },
    ]

    const stack = resolveBasemapBuildingStackFromLayers(layers, (id) =>
      ['Building', 'Building 3D'].includes(id),
    )

    expect(stack).not.toBeNull()
    expect(stack?.source).toBe('maptiler_planet')
    expect(stack?.extrusionLayerId).toBe('Building 3D')
    expect(stack?.fillLayerId).toBe('Building')
    expect(stack?.queryLayerIds).toContain('Building 3D')
    expect(stack?.queryLayerIds).toContain('Building')
    expect(stack?.render3dFilter).toEqual(['!', ['has', 'hide_3d']])
  })

  it('rozpoznaje warstwy Carto (building + 3d-buildings)', () => {
    const layers = [
      {
        id: 'building',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
      },
      {
        id: '3d-buildings',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        filter: ['==', ['get', 'extrude'], 'true'] as FilterSpecification,
      },
    ]

    const stack = resolveBasemapBuildingStackFromLayers(layers, (id) =>
      ['building', '3d-buildings'].includes(id),
    )

    expect(stack).not.toBeNull()
    expect(stack?.extrusionLayerId).toBe('3d-buildings')
    expect(stack?.render3dFilter).toEqual(['==', ['get', 'extrude'], 'true'])
  })
})

describe('normalizeBuildingRender3dFilter', () => {
  it('konwertuje legacy !has na składnię MapLibre', () => {
    expect(normalizeBuildingRender3dFilter(['!has', 'hide_3d'])).toEqual([
      '!',
      ['has', 'hide_3d'],
    ])
  })
})

describe('render3dFilterForExtrusionLayer', () => {
  it('normalizuje legacy !has w definicji warstwy', () => {
    expect(
      render3dFilterForExtrusionLayer({
        id: 'Building 3D',
        type: 'fill-extrusion',
        source: 'maptiler_planet',
        'source-layer': 'building',
        filter: ['!has', 'hide_3d'] as FilterSpecification,
      }),
    ).toEqual(['!', ['has', 'hide_3d']])
  })

  it('domyślnie MapTiler gdy source maptiler_planet bez filtra w stylu', () => {
    expect(
      render3dFilterForExtrusionLayer({
        id: 'Building 3D',
        type: 'fill-extrusion',
        source: 'maptiler_planet',
        'source-layer': 'building',
      }),
    ).toEqual(['!', ['has', 'hide_3d']])
  })
})
