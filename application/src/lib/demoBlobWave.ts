export type BlobGroupDef = {
  id: string
  label: string
  centerRow: number
  centerCol: number
  radius: number
  /** Stały wynik / kolor grupy (bez gradientu wewnątrz plamy) */
  scoreBase: number
}

export type BlobPhase = {
  id: string
  caption: string
  groups: BlobGroupDef[]
}

export const WAVE_STAGGER_MS = 58
export const TILE_COLOR_POP_MS = 650

/** Jedna wartość → jeden kolor z rampy na całą plamę */
const WARM_SCORE = 82
const COOL_SCORE = 38

export const DEMO_BLOB_PHASES: BlobPhase[] = [
  {
    id: 'start',
    caption: 'Dwie plamy startowe',
    groups: [
      { id: 'a', label: 'Mokotów', centerRow: 4, centerCol: 4, radius: 3, scoreBase: WARM_SCORE },
      { id: 'b', label: 'Centrum', centerRow: 13, centerCol: 13, radius: 3, scoreBase: COOL_SCORE },
    ],
  },
  {
    id: 'a-grows',
    caption: 'Plama A rośnie — fala od krawędzi',
    groups: [
      { id: 'a', label: 'Mokotów', centerRow: 5, centerCol: 5, radius: 5, scoreBase: WARM_SCORE },
      { id: 'b', label: 'Centrum', centerRow: 13, centerCol: 13, radius: 2, scoreBase: COOL_SCORE },
    ],
  },
  {
    id: 'b-grows',
    caption: 'Plama B rośnie — fala od krawędzi',
    groups: [
      { id: 'a', label: 'Mokotów', centerRow: 4, centerCol: 4, radius: 3, scoreBase: WARM_SCORE },
      { id: 'b', label: 'Centrum', centerRow: 12, centerCol: 12, radius: 5, scoreBase: COOL_SCORE },
    ],
  },
  {
    id: 'persona',
    caption: 'Ta sama geometria — zmiana persony (fala od obwodu do środka)',
    groups: [
      { id: 'a', label: 'Mokotów', centerRow: 4, centerCol: 4, radius: 3, scoreBase: COOL_SCORE },
      { id: 'b', label: 'Centrum', centerRow: 13, centerCol: 13, radius: 3, scoreBase: WARM_SCORE },
    ],
  },
]

export type CellScoreGrid = (number | null)[][]

export function buildScoreGrid(size: number, phase: BlobPhase): CellScoreGrid {
  const grid: CellScoreGrid = Array.from({ length: size }, () =>
    Array<number | null>(size).fill(null),
  )

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (isBorder(row, col, size)) continue

      const group = groupAtCell(phase, row, col)
      if (group) grid[row][col] = group.scoreBase
    }
  }

  return grid
}

export type WaveCellAnim = {
  row: number
  col: number
  fromScore: number | null
  toScore: number | null
  delayMs: number
  changes: boolean
}

type WaveKind = 'expand' | 'shrink' | 'recolor'

/** Fala od krawędzi plamy (rozszerzanie / kurczenie / zmiana koloru). */
export function planWaveStep(
  from: CellScoreGrid,
  to: CellScoreGrid,
  toPhase: BlobPhase,
  fromPhase: BlobPhase,
): WaveCellAnim[] {
  const size = from.length
  const cells: WaveCellAnim[] = []

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const fromScore = from[row][col]
      const toScore = to[row][col]
      const changes = fromScore !== toScore
      const kind = classifyChange(row, col, fromPhase, toPhase, fromScore, toScore)
      const layer = changes ? waveLayer(row, col, kind, fromPhase, toPhase, size) : 0
      const delayMs = changes ? layer * WAVE_STAGGER_MS : 0

      cells.push({ row, col, fromScore, toScore, delayMs, changes })
    }
  }

  return cells
}

function classifyChange(
  row: number,
  col: number,
  fromPhase: BlobPhase,
  toPhase: BlobPhase,
  fromScore: number | null,
  toScore: number | null,
): WaveKind {
  const gFrom = groupAtCell(fromPhase, row, col)
  const gTo = groupAtCell(toPhase, row, col)

  if (gTo && !gFrom) return 'expand'
  if (gFrom && !gTo) return 'shrink'
  if (gTo && gFrom && gTo.id === gFrom.id && fromScore !== toScore) return 'recolor'
  if (gTo && gFrom && gTo.id !== gFrom.id) return 'expand'
  return 'expand'
}

/** Warstwa 0 = pierwsza przy krawędzi, wyżej = głębiej w plamie / dalej na zewnątrz. */
function waveLayer(
  row: number,
  col: number,
  kind: WaveKind,
  fromPhase: BlobPhase,
  toPhase: BlobPhase,
  size: number,
): number {
  const gTo = groupAtCell(toPhase, row, col)
  const gFrom = groupAtCell(fromPhase, row, col)
  const groupId = gTo?.id ?? gFrom?.id
  if (!groupId) return 0

  if (kind === 'expand') {
    const prevFootprint = cellsInGroup(fromPhase, groupId, size)
    if (prevFootprint.size === 0) return 0
    const d = minChebyshevToSet(row, col, prevFootprint)
    return Math.max(0, d - 1)
  }

  if (kind === 'shrink') {
    const nextFootprint = cellsInGroup(toPhase, groupId, size)
    if (nextFootprint.size === 0) return 0
    return minChebyshevToSet(row, col, nextFootprint)
  }

  // recolor: od obwodu plamy do środka (czytelna zmiana persony)
  if (gTo) {
    return inwardLayersFromPerimeter(toPhase, gTo.id, size).get(key(row, col)) ?? 0
  }

  return 0
}

/** BFS od krawędzi plamy do wnętrza (warstwa 0 = obwód). */
function inwardLayersFromPerimeter(
  phase: BlobPhase,
  groupId: string,
  size: number,
): Map<string, number> {
  const inGroup = cellsInGroup(phase, groupId, size)
  const layers = new Map<string, number>()
  const queue: { row: number; col: number; layer: number }[] = []

  for (const k of inGroup) {
    const [row, col] = parseKey(k)
    if (isGroupBoundary(row, col, size, inGroup)) {
      layers.set(k, 0)
      queue.push({ row, col, layer: 0 })
    }
  }

  let head = 0
  while (head < queue.length) {
    const { row, col, layer } = queue[head++]
    for (const [dr, dc] of NEIGHBORS8) {
      const nr = row + dr
      const nc = col + dc
      const nk = key(nr, nc)
      if (!inGroup.has(nk) || layers.has(nk)) continue
      layers.set(nk, layer + 1)
      queue.push({ row: nr, col: nc, layer: layer + 1 })
    }
  }

  return layers
}

function isGroupBoundary(
  row: number,
  col: number,
  size: number,
  inGroup: Set<string>,
): boolean {
  if (!inGroup.has(key(row, col))) return false
  for (const [dr, dc] of NEIGHBORS8) {
    const nr = row + dr
    const nc = col + dc
    if (nr < 0 || nc < 0 || nr >= size || nc >= size) return true
    if (!inGroup.has(key(nr, nc))) return true
  }
  return false
}

function cellsInGroup(phase: BlobPhase, groupId: string, size: number): Set<string> {
  const set = new Set<string>()
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (groupAtCell(phase, row, col)?.id === groupId) set.add(key(row, col))
    }
  }
  return set
}

function minChebyshevToSet(row: number, col: number, cells: Set<string>): number {
  let min = Infinity
  for (const k of cells) {
    const [r, c] = parseKey(k)
    min = Math.min(min, chebyshev(row, col, r, c))
  }
  return min === Infinity ? 0 : min
}

function key(row: number, col: number) {
  return `${row},${col}`
}

function parseKey(k: string): [number, number] {
  const [r, c] = k.split(',').map(Number)
  return [r, c]
}

const NEIGHBORS8: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

function groupAtCell(phase: BlobPhase, row: number, col: number): BlobGroupDef | null {
  for (const g of phase.groups) {
    if (chebyshev(row, col, g.centerRow, g.centerCol) <= g.radius) return g
  }
  return null
}

function isBorder(row: number, col: number, size: number) {
  const last = size - 1
  return row === 0 || col === 0 || row === last || col === last
}

function chebyshev(row: number, col: number, centerRow: number, centerCol: number) {
  return Math.max(Math.abs(row - centerRow), Math.abs(col - centerCol))
}

export function maxWaveDelay(cells: WaveCellAnim[]) {
  return cells.reduce((max, c) => (c.changes ? Math.max(max, c.delayMs) : max), 0)
}
