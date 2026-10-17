import type { GridFeatureCollection } from './hackathonData'

/** 1 km → 5×5 ≈ 200 m (przybliżenie jak w generatorze danych). */
export const SUBCELLS_PER_KM = 5

export type GridFeature200 = GridFeatureCollection['features'][number] & {
  properties: GridFeatureCollection['features'][number]['properties'] & {
    parentId: string
    fineRow: number
    fineCol: number
    displayScore?: number
    lift?: number
  }
}

export type GridFeatureCollection200 = GridFeatureCollection & {
  features: GridFeature200[]
}

export function subdivideGridTo200m(grid: GridFeatureCollection): GridFeatureCollection200 {
  const features: GridFeature200[] = []

  for (const f of grid.features) {
    const ring = f.geometry.coordinates[0]
    const west = ring[0][0]
    const south = ring[0][1]
    const east = ring[2][0]
    const north = ring[2][1]
    const dLon = (east - west) / SUBCELLS_PER_KM
    const dLat = (north - south) / SUBCELLS_PER_KM
    const parentId = f.properties.id
    const baseRow = f.properties.row * SUBCELLS_PER_KM
    const baseCol = f.properties.col * SUBCELLS_PER_KM

    for (let sr = 0; sr < SUBCELLS_PER_KM; sr++) {
      for (let sc = 0; sc < SUBCELLS_PER_KM; sc++) {
        const w = west + sc * dLon
        const s = south + sr * dLat
        const e = w + dLon
        const n = s + dLat
        const id = `${parentId}__${sr}_${sc}`
        const fineRow = baseRow + sr
        const fineCol = baseCol + sc

        features.push({
          type: 'Feature',
          id,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [w, s],
                [e, s],
                [e, n],
                [w, n],
                [w, s],
              ],
            ],
          },
          properties: {
            id,
            parentId,
            row: f.properties.row,
            col: f.properties.col,
            fineRow,
            fineCol,
            center: [w + dLon / 2, s + dLat / 2],
          },
        })
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

