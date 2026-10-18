/**
 * Edit decision list. Every app scene is cut from one continuous screen recording
 * (assets/clips/walkthrough.mp4) using the beat markers written by tools/record-demo.mjs,
 * so re-recording the app re-times the edit automatically.
 */
import rec from '../../assets/clips/markers.json'
import { FPS } from './theme'

const m = rec.markers as Record<string, number>

/** A piece of the recording: source seconds [from, to) played at `rate`. */
export type Segment = { from: number; to: number; rate: number }
export const segLen = (s: Segment) => (s.to - s.from) / s.rate
export const segsLen = (segs: Segment[]) => segs.reduce((a, s) => a + segLen(s), 0)

/** Voiceover clip lengths in seconds (ffprobe of assets/vo/*.mp3). */
export const VO = {
  's1-hook': 10.08,
  's2-brand': 7.2,
  's3-survey': 9.36,
  's4-map': 14.96,
  's5-fly': 4.32,
  's6-panel': 22.0,
  's7-data': 15.2,
  's8-close': 3.68,
} as const
export type VoId = keyof typeof VO

export const SEGMENTS = {
  survey: [
    { from: m.start - 0.3, to: m.profile + 0.2, rate: 1.8 },
    { from: m.profile + 0.2, to: m.horizon, rate: 2.0 },
    { from: m.horizon, to: m.map + 0.6, rate: 1.8 },
  ],
  map: [
    { from: m.map + 0.6, to: m.sliders, rate: 1.35 },
    { from: m.sliders, to: m.solo, rate: 1.6 },
    { from: m.solo, to: m.pick + 0.9, rate: 1.6 },
  ],
  fly: [{ from: m.pick + 0.9, to: m.panel + 0.2, rate: 1.1 }],
  panel: [
    { from: m.panel + 0.2, to: m.compare + 2.3, rate: 1.0 },
    { from: m.compare + 2.3, to: m.layers, rate: 2.0 },
  ],
  layers: [{ from: m.layers, to: Math.min(m.end, m.layers + 13), rate: 2.0 }],
} satisfies Record<string, Segment[]>

/** Source second → seconds into a scene built from `segs` (for syncing callouts to beats). */
export function srcToScene(segs: Segment[], src: number): number {
  let acc = 0
  for (const s of segs) {
    if (src < s.to) return acc + Math.max(0, src - s.from) / s.rate
    acc += segLen(s)
  }
  return acc
}
export const beat = (segs: Segment[], name: string, plus = 0) => srcToScene(segs, m[name] + plus)

export type SceneDef = { id: string; dur: number; vo?: VoId; voAt?: number }

export const SCENES: SceneDef[] = [
  { id: 'hook', dur: 11.6, vo: 's1-hook', voAt: 0.7 },
  { id: 'brand', dur: 8.8, vo: 's2-brand', voAt: 0.5 },
  { id: 'survey', dur: segsLen(SEGMENTS.survey), vo: 's3-survey', voAt: 0.5 },
  { id: 'map', dur: segsLen(SEGMENTS.map), vo: 's4-map', voAt: 0.4 },
  { id: 'fly', dur: segsLen(SEGMENTS.fly), vo: 's5-fly', voAt: 0.8 },
  { id: 'panel', dur: segsLen(SEGMENTS.panel), vo: 's6-panel', voAt: 0.2 },
  { id: 'layers', dur: segsLen(SEGMENTS.layers) },
  { id: 'data', dur: 17.0, vo: 's7-data', voAt: 0.6 },
  { id: 'close', dur: 8.0, vo: 's8-close', voAt: 0.8 },
]

/** Scenes overlap by this much for cross-dissolves. */
export const XFADE = 0.5

export type Placed = SceneDef & { start: number; from: number; frames: number }
export const PLACED: Placed[] = (() => {
  let t = 0
  return SCENES.map((s, i) => {
    const start = i === 0 ? 0 : t - XFADE
    t = start + s.dur
    return { ...s, start, from: Math.round(start * FPS), frames: Math.round(s.dur * FPS) }
  })
})()
export const TOTAL = PLACED.at(-1)!.start + PLACED.at(-1)!.dur
export const TOTAL_FRAMES = Math.round(TOTAL * FPS)
export const scene = (id: string) => PLACED.find((p) => p.id === id)!

/** Voiceover windows on the global timeline (seconds), used for music ducking. */
export const VO_WINDOWS = PLACED.filter((p) => p.vo).map((p) => {
  const a = p.start + (p.voAt ?? 0)
  return [a, a + VO[p.vo!]] as const
})

/** Music: start into the track so its natural ending lands on the last frame. */
export const MUSIC_LEN = 136.86
export const MUSIC_OFFSET = Math.max(0, MUSIC_LEN - TOTAL - 0.4)
