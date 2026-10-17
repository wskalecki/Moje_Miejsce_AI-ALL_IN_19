import { describe, expect, it } from 'vitest'
import { cellNoise01, marekScoreAt } from './personaIslandScore'

const MAREK_ISLAND = {
  anchor: [21.022, 52.215] as [number, number],
  radiusM: 2000,
}

describe('marekScoreAt', () => {
  it('varies per subcell id (noise) and position', () => {
    const center: [number, number] = [21.0221, 52.2151]
    const a = marekScoreAt(center, 'cell_r011_c012__0_0', MAREK_ISLAND)
    const b = marekScoreAt(center, 'cell_r011_c012__4_4', MAREK_ISLAND)
    expect(a).not.toBeNull()
    expect(b).not.toBeNull()
    expect(a).not.toBe(b)
  })

  it('feathers edge cells instead of a hard disk', () => {
    const inner = marekScoreAt([21.022, 52.215], 'cell_anchor__0_0', MAREK_ISLAND)
    const edge = marekScoreAt([21.04, 52.215], 'cell_edge_a__2_2', MAREK_ISLAND)
    const beyond = marekScoreAt([21.06, 52.215], 'cell_far__3_3', MAREK_ISLAND)
    expect(inner).toBeGreaterThan(80)
    if (edge != null) expect(edge).toBeLessThan(inner!)
    expect(beyond).toBeNull()
  })

  it('cellNoise01 is stable', () => {
    expect(cellNoise01('cell_r011_c012__1_2')).toBe(cellNoise01('cell_r011_c012__1_2'))
  })
})
