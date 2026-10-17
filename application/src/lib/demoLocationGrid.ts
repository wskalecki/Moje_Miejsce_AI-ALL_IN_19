/** Demo 10×10: szary pierścień + dwie grupy lokalizacji w środku. */

export type LocationZoneId = 'outside' | 'buffer' | 'mokotow' | 'centrum'

export type DemoGridCell = {
  row: number
  col: number
  score: number | null
  zone: LocationZoneId
}

/** Siatka symulacji fali (lab) */
export const DEMO_GRID_SIZE = 18

export const DEMO_WAVE_CELL_PX = 14

const ZONE_A: LocationZoneId = 'mokotow'
const ZONE_B: LocationZoneId = 'centrum'

/** Strefa A — cieplejsze wyniki (koral / żółty). Strefa B — chłodniejsze (mięta / błękit). */
export function buildDemoLocationGrid(size = DEMO_GRID_SIZE): DemoGridCell[] {
  const cells: DemoGridCell[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const zone = classifyZone(row, col, size)
      cells.push({
        row,
        col,
        zone,
        score: scoreForZone(zone, row, col),
      })
    }
  }

  return cells
}

function classifyZone(row: number, col: number, size: number): LocationZoneId {
  const last = size - 1
  if (row === 0 || col === 0 || row === last || col === last) {
    return 'outside'
  }

  const inA = row >= 1 && row <= 4 && col >= 1 && col <= 4
  const inB = row >= 5 && row <= 8 && col >= 5 && col <= 8

  if (inA) return ZONE_A
  if (inB) return ZONE_B
  return 'buffer'
}

function scoreForZone(zone: LocationZoneId, row: number, col: number): number | null {
  if (zone === 'outside' || zone === 'buffer') return null
  const jitter = (row + col) % 4
  if (zone === ZONE_A) return 72 + jitter * 5
  return 32 + jitter * 4
}

export const DEMO_ZONE_LABELS: Record<Exclude<LocationZoneId, 'outside' | 'buffer'>, string> = {
  mokotow: 'Grupa A · Mokotów',
  centrum: 'Grupa B · Centrum',
}
