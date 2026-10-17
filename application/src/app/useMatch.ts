/**
 * Single source of truth for "how well does this osiedle match me, and where does it rank".
 *
 * Match = weighted mean of the osiedle's real category scores (public/data/osiedla-scores.json)
 * by the user's current category weights (store `state.weights`, 0–100), exactly as the map colours
 * it (src/map/weighting.ts). Rank = place among all osiedla for the same weights. No hand-set numbers:
 * use this instead of `match` / `rank` from src/mock/osiedla.ts (those are a snapshot for the
 * profile defaults and go stale as soon as the user moves a slider).
 *
 * API
 *
 *   const { match, rank, total, isTop, ready } = useMatch('muranow')
 *   //  match  number | null   0–100, rounded (null while the scores file loads or for an unknown id)
 *   //  rank   number | null   1 = best for the current weights
 *   //  total  number | null   number of ranked osiedla (143)
 *   //  isTop  boolean         rank === 1
 *   //  ready  boolean         scores loaded and the id is known
 *
 *   const ranking = useRanking()            // current store weights
 *   const other = useRanking(someWeights)   // what-if (e.g. another profile's defaults)
 *   //  ranking: Ranking | null — { match: Map<id, 0–100>, rank: Map<id, 1…>, order: id[], total }
 *   //  ranking.order[0] = the honest #1 osiedle id
 *
 *   useOsiedlaScores()  // the raw scores file (shared, cached fetch) or null while loading
 *   useOsiedlaNames()   // Map<id, display name> from public/data/osiedla.geojson, or null while loading
 *
 * Osiedle ids are the `id`s of public/data/osiedla.geojson (= `msiId` in src/mock/osiedla.ts).
 * The scores file is fetched once per page and shared with the map (src/app/mapLoader.ts fetchJson).
 */
import { useEffect, useMemo, useState } from 'react'
import { DATA_URLS } from './config'
import { fetchJson } from './mapLoader'
import { rankOsiedla, type Ranking, type ScoresFile } from './ranking'
import { useAppStore } from './useAppStore'
import type { Weights } from './weights'

export type { Ranking } from './ranking'

export interface MatchInfo {
  match: number | null
  rank: number | null
  total: number | null
  isTop: boolean
  ready: boolean
}

let scoresCache: ScoresFile | null = null
let scoresRequest: Promise<ScoresFile | null> | null = null

function loadScores(): Promise<ScoresFile | null> {
  if (!scoresRequest)
    scoresRequest = fetchJson<ScoresFile>(DATA_URLS.osiedlaScores)
      .then((s) => (scoresCache = s))
      .catch(() => {
        scoresRequest = null // retry on the next mount
        return null
      })
  return scoresRequest
}

/** public/data/osiedla-scores.json (shared, cached fetch); null while loading or on error. */
export function useOsiedlaScores(): ScoresFile | null {
  const [scores, setScores] = useState<ScoresFile | null>(scoresCache)
  useEffect(() => {
    if (scores) return
    let alive = true
    void loadScores().then((s) => {
      if (alive && s) setScores(s)
    })
    return () => {
      alive = false
    }
  }, [scores])
  return scores
}

type NamesFile = { features: { properties?: { id?: string; name?: string } | null }[] }
let namesCache: Map<string, string> | null = null

/** Display names of all osiedla (public/data/osiedla.geojson, shared with the map); null while loading. */
export function useOsiedlaNames(): ReadonlyMap<string, string> | null {
  const [names, setNames] = useState<Map<string, string> | null>(namesCache)
  useEffect(() => {
    if (names) return
    let alive = true
    fetchJson<NamesFile>(DATA_URLS.osiedlaGeojson)
      .then((g) => {
        const m = new Map<string, string>()
        for (const f of g.features) if (f.properties?.id && f.properties.name) m.set(f.properties.id, f.properties.name)
        namesCache = m
        if (alive) setNames(m)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [names])
  return names
}

// Many components rank with the same weights at once (map pills, sentence bar, panel, cinematic):
// keep the last few results so each weights change is computed once.
const memo = new Map<string, Ranking>()
const MEMO_MAX = 8

function rankingFor(scores: ScoresFile, weights: Weights): Ranking {
  const key = JSON.stringify(weights)
  const hit = memo.get(key)
  if (hit) return hit
  const r = rankOsiedla(scores, weights)
  memo.set(key, r)
  if (memo.size > MEMO_MAX) memo.delete(memo.keys().next().value as string)
  return r
}

/** Ranking of all osiedla for `weights` (default: the current store weights); null while loading. */
export function useRanking(weights?: Weights): Ranking | null {
  const { state } = useAppStore()
  const scores = useOsiedlaScores()
  const w = weights ?? state.weights
  return useMemo(() => (scores ? rankingFor(scores, w) : null), [scores, w])
}

/** Match (0–100) and rank of one osiedle for the current store weights. */
export function useMatch(msiId: string | null | undefined, weights?: Weights): MatchInfo {
  const ranking = useRanking(weights)
  const match = msiId ? (ranking?.match.get(msiId) ?? null) : null
  const rank = msiId ? (ranking?.rank.get(msiId) ?? null) : null
  return {
    match,
    rank,
    total: ranking ? ranking.total : null,
    isTop: rank === 1,
    ready: match !== null,
  }
}
