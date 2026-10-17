import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMO_GRID_SIZE, DEMO_ZONE_LABELS } from '../../lib/demoLocationGrid'
import {
  buildScoreGrid,
  DEMO_BLOB_PHASES,
  maxWaveDelay,
  planWaveStep,
  TILE_COLOR_POP_MS,
  type CellScoreGrid,
  type WaveCellAnim,
  WAVE_STAGGER_MS,
} from '../../lib/demoBlobWave'
import { GridTile } from './GridTile'

const PHASE_HOLD_MS = 2600

type CellWaveState = 'idle' | 'animating' | 'done'

type Props = {
  className?: string
  cellClassName?: string
}

function cellKey(row: number, col: number) {
  return `${row}-${col}`
}

function staticPlan(grid: CellScoreGrid, phaseIndex: number) {
  const phase = DEMO_BLOB_PHASES[phaseIndex]
  return planWaveStep(grid, grid, phase, phase)
}

export function LocationWaveGrid({ className = '', cellClassName = '' }: Props) {
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [committed, setCommitted] = useState<CellScoreGrid>(() =>
    buildScoreGrid(DEMO_GRID_SIZE, DEMO_BLOB_PHASES[0]),
  )
  const [wavePlan, setWavePlan] = useState<WaveCellAnim[]>(() => staticPlan(committed, 0))
  const [waveRunId, setWaveRunId] = useState(0)
  const [cellWave, setCellWave] = useState<Record<string, CellWaveState>>({})
  const [running, setRunning] = useState(true)

  const committedRef = useRef(committed)
  const phaseRef = useRef(phaseIndex)
  const transitioningRef = useRef(false)
  const loopTimerRef = useRef<number | null>(null)
  const waveTimersRef = useRef<number[]>([])

  committedRef.current = committed
  phaseRef.current = phaseIndex

  const phase = DEMO_BLOB_PHASES[phaseIndex]

  const clearWaveTimers = () => {
    for (const id of waveTimersRef.current) window.clearTimeout(id)
    waveTimersRef.current = []
  }

  const playWavePlan = useCallback((plan: WaveCellAnim[]) => {
    clearWaveTimers()
    const nextWave: Record<string, CellWaveState> = {}
    for (const cell of plan) {
      if (cell.changes) nextWave[cellKey(cell.row, cell.col)] = 'idle'
    }
    setCellWave(nextWave)

    for (const cell of plan) {
      if (!cell.changes) continue
      const key = cellKey(cell.row, cell.col)

      const startId = window.setTimeout(() => {
        setCellWave((prev) => ({ ...prev, [key]: 'animating' }))
      }, cell.delayMs)
      waveTimersRef.current.push(startId)

      const endId = window.setTimeout(() => {
        setCellWave((prev) => ({ ...prev, [key]: 'done' }))
      }, cell.delayMs + TILE_COLOR_POP_MS)
      waveTimersRef.current.push(endId)
    }
  }, [])

  const runTransition = useCallback(() => {
    if (transitioningRef.current) return PHASE_HOLD_MS + TILE_COLOR_POP_MS
    transitioningRef.current = true

    const fromIndex = phaseRef.current
    const toIndex = (fromIndex + 1) % DEMO_BLOB_PHASES.length
    const fromPhase = DEMO_BLOB_PHASES[fromIndex]
    const toPhase = DEMO_BLOB_PHASES[toIndex]
    const fromGrid = committedRef.current
    const nextGrid = buildScoreGrid(DEMO_GRID_SIZE, toPhase)
    const plan = planWaveStep(fromGrid, nextGrid, toPhase, fromPhase)
    const settleMs = maxWaveDelay(plan) + TILE_COLOR_POP_MS + 160
    const runId = waveRunId + 1

    setWaveRunId(runId)
    setWavePlan(plan)
    setPhaseIndex(toIndex)
    playWavePlan(plan)

    const finishId = window.setTimeout(() => {
      committedRef.current = nextGrid
      setCommitted(nextGrid)
      setWavePlan(staticPlan(nextGrid, toIndex))
      setCellWave({})
      transitioningRef.current = false
    }, settleMs)
    waveTimersRef.current.push(finishId)

    return PHASE_HOLD_MS + settleMs
  }, [playWavePlan, waveRunId])

  const scheduleLoop = useCallback(() => {
    if (loopTimerRef.current != null) window.clearTimeout(loopTimerRef.current)
    loopTimerRef.current = window.setTimeout(() => {
      const wait = runTransition()
      loopTimerRef.current = window.setTimeout(scheduleLoop, wait)
    }, PHASE_HOLD_MS)
  }, [runTransition])

  useEffect(() => {
    if (!running) {
      if (loopTimerRef.current != null) window.clearTimeout(loopTimerRef.current)
      return
    }
    scheduleLoop()
    return () => {
      if (loopTimerRef.current != null) window.clearTimeout(loopTimerRef.current)
      clearWaveTimers()
    }
  }, [running, scheduleLoop])

  const advanceOnce = () => {
    if (loopTimerRef.current != null) window.clearTimeout(loopTimerRef.current)
    const wait = runTransition()
    if (running) {
      loopTimerRef.current = window.setTimeout(scheduleLoop, wait)
    }
  }

  return (
    <div className="location-wave-grid">
      <div className="location-wave-grid__meta">
        <p className="location-wave-grid__caption">{phase.caption}</p>
        <p className="location-wave-grid__hint">
          Rozszerzanie: fala od <strong>krawędzi</strong> plamy na zewnątrz (
          {WAVE_STAGGER_MS}ms / warstwa). Jednolity kolor w grupie.
        </p>
        <button
          type="button"
          className="location-wave-grid__toggle"
          onClick={() => setRunning((r) => !r)}
        >
          {running ? 'Pauza' : 'Wznów'}
        </button>
        <button type="button" className="location-wave-grid__toggle" onClick={advanceOnce}>
          Następna faza
        </button>
      </div>
      <ul className="location-wave-grid__legend">
        <li>{DEMO_ZONE_LABELS.mokotow}</li>
        <li>{DEMO_ZONE_LABELS.centrum}</li>
      </ul>
      <div
        className={`location-wave-grid__board ${className}`.trim()}
        style={{ gridTemplateColumns: `repeat(${DEMO_GRID_SIZE}, var(--wave-cell-size))` }}
      >
        {wavePlan.map((cell) => {
          const key = cellKey(cell.row, cell.col)
          const waveState = cellWave[key]
          const isChanging = cell.changes

          if (!isChanging || waveState === 'done' || waveState === undefined) {
            return (
              <GridTile
                key={key}
                score={cell.toScore}
                variant="static"
                className={cellClassName}
              />
            )
          }

          if (waveState === 'animating') {
            return (
              <GridTile
                key={key}
                score={cell.fromScore}
                targetScore={cell.toScore}
                variant="color-pop"
                animateKey={waveRunId}
                animationDelayMs={0}
                className={cellClassName}
              />
            )
          }

          return (
            <GridTile
              key={key}
              score={cell.fromScore}
              variant="static"
              className={cellClassName}
            />
          )
        })}
      </div>
    </div>
  )
}
