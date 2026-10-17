import type { CellMetricsFile, PersonaId } from './hackathonData'
import type { GridFeature200, GridFeatureCollection200 } from './grid200m'
import { marekScoreAt } from './personaIslandScore'
import { NO_SCORE } from './scoreColor'

export function scoresForPersona(
  grid: GridFeatureCollection200,
  metrics: CellMetricsFile,
  persona: PersonaId,
): Record<string, number | null> {
  const marekIsland = persona === 'marek' ? metrics.islands?.marek : undefined

  const out: Record<string, number | null> = {}
  for (const f of grid.features) {
    const id = f.properties.id
    if (marekIsland) {
      out[id] = marekScoreAt(f.properties.center, id, marekIsland)
      continue
    }
    const parentId = f.properties.parentId
    const cell = metrics.cells[parentId]
    const raw = cell?.scores[persona]
    out[id] = raw === undefined || raw === null ? null : raw
  }
  return out
}

export function applyDisplayToGrid(
  grid: GridFeatureCollection200,
  displayScores: Record<string, number | null>,
  lifts: Record<string, number>,
): GridFeatureCollection200 {
  return {
    ...grid,
    features: grid.features.map((f): GridFeatureCollection200['features'][number] => {
      const id = f.properties.id
      const raw = displayScores[id]
      const displayScore = raw == null ? NO_SCORE : raw
      return {
        ...f,
        properties: {
          ...f.properties,
          displayScore,
          lift: lifts[id] ?? 0,
        },
      } as GridFeature200
    }),
  }
}
