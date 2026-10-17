import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import type { GridFeatureCollection200 } from '../lib/grid200m'
import { applyDisplayToGrid, scoresForPersona } from '../lib/gridMapScores'
import { poiRippleAnchorsFromCollections } from '../lib/mapPoiRipple'
import { maxWaveDelay, planPersonaScoreWave, type WavePlanItem } from '../lib/mapScoreWave'
import type { CellMetricsFile, PersonaId } from '../lib/hackathonData'
import { NO_SCORE } from '../lib/scoreColor'

const WAVE_SETTLE_BUFFER_MS = 120

export function useMapPersonaWave(
  grid: GridFeatureCollection200,
  cellMetrics: CellMetricsFile,
  persona: PersonaId,
  poiCollections: FeatureCollection[],
) {
  const anchors = useMemo(
    () => poiRippleAnchorsFromCollections(poiCollections),
    [poiCollections],
  )

  const [displayScores, setDisplayScores] = useState<Record<string, number | null>>(() =>
    scoresForPersona(grid, cellMetrics, persona),
  )
  const displayRef = useRef(displayScores)
  const timersRef = useRef<number[]>([])
  const personaInit = useRef(persona)

  displayRef.current = displayScores

  const clearTimers = () => {
    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []
  }

  const playWave = useCallback((plan: WavePlanItem[]) => {
    clearTimers()

    for (const item of plan) {
      if (item.fromScore === item.toScore) continue

      const id = window.setTimeout(() => {
        setDisplayScores((prev) => ({ ...prev, [item.id]: item.toScore }))
      }, item.delayMs)
      timersRef.current.push(id)
    }
  }, [])

  useEffect(() => {
    if (personaInit.current === persona) return
    personaInit.current = persona

    const fromScores = { ...displayRef.current }
    const toScores = scoresForPersona(grid, cellMetrics, persona)
    const plan = planPersonaScoreWave(grid.features, fromScores, toScores, anchors)
    playWave(plan)

    const settle = maxWaveDelay(plan) + WAVE_SETTLE_BUFFER_MS
    const syncId = window.setTimeout(() => {
      setDisplayScores(toScores)
    }, settle)
    timersRef.current.push(syncId)
  }, [persona, grid, cellMetrics, playWave, anchors])

  useEffect(() => () => clearTimers(), [])

  const geoJson = applyDisplayToGrid(grid, displayScores, {})

  const parentIdForCell = (cellId: string | null) => {
    if (!cellId) return null
    const f = grid.features.find((x) => x.properties.id === cellId)
    return f?.properties.parentId ?? cellId.split('__')[0] ?? null
  }

  return { geoJson, displayScores, parentIdForCell, noScore: NO_SCORE }
}
