/**
 * Edit decision list for the silent system presentation (composition "System").
 * Every app scene is cut from one continuous recording (assets/clips/system.mp4) using the beat
 * markers written by tools/record-system.mjs, so re-recording the app re-times the edit.
 */
import rec from '../../../assets/clips/system-markers.json'
import { FPS } from '../theme'
import { type Segment, segsLen, srcToScene } from '../timeline'

const m = rec.markers as Record<string, number>
export const SRC = 'clips/system.mp4'

export const SEG = {
  survey: [
    { from: m.start - 1.6, to: m.modal, rate: 1.4 },
    { from: m.modal, to: m.profile, rate: 1.5 },
    { from: m.profile, to: m.horizon, rate: 1.6 },
    { from: m.horizon, to: m.map + 0.4, rate: 1.5 },
  ],
  map: [
    { from: m.map + 0.4, to: m.solo, rate: 1.4 },
    { from: m.solo, to: m.preview, rate: 1.6 },
    { from: m.preview, to: m.reweight, rate: 2.0 },
  ],
  reweight: [
    { from: m.reweight, to: m.restore, rate: 1.15 },
    { from: m.restore, to: m.top3 + 1, rate: 1.6 },
    { from: m.top3 + 1, to: m.pick + 0.6, rate: 1.3 },
  ],
  fly: [{ from: m.pick + 0.6, to: m.panel + 0.6, rate: 1.0 }],
  panel: [
    { from: m.panel + 0.6, to: m.scores, rate: 1.3 },
    { from: m.scores, to: m.places, rate: 1.2 },
    { from: m.places, to: m.routes, rate: 1.8 },
    { from: m.routes, to: m.commute, rate: 1.8 },
    { from: m.commute, to: m.traffic, rate: 1.3 },
    { from: m.traffic, to: m.prices, rate: 1.5 },
    { from: m.prices, to: m.timeline, rate: 1.4 },
  ],
  timeline: [
    { from: m.timeline, to: m.investments, rate: 1.5 },
    { from: m.investments, to: m.layers, rate: 1.6 },
  ],
  // opening the layers menu is dead time: run it fast up to just before the first toggle
  layers: [
    { from: m.layers, to: (m.layerBuildings ?? m.layers + 11.6) - 0.6, rate: 3.0 },
    { from: (m.layerBuildings ?? m.layers + 11.6) - 0.6, to: m.end, rate: 1.8 },
  ],
} satisfies Record<string, Segment[]>

/** Scene second of a recorder beat (+ `plus` source seconds) inside a scene cut from `segs`. */
export const at = (segs: Segment[], name: string, plus = 0) => srcToScene(segs, m[name] + plus)
/** Newer takes carry extra beats (e.g. layerTraffic); older ones fall back to a measured offset. */
export const atOr = (segs: Segment[], name: string, plus: number, base: string, offset: number) =>
  name in m ? at(segs, name, plus) : at(segs, base, offset)

export const SCENES = [
  { id: 'brand', dur: 6.6 },
  { id: 'survey', dur: segsLen(SEG.survey) },
  { id: 'map', dur: segsLen(SEG.map) },
  { id: 'reweight', dur: segsLen(SEG.reweight) },
  { id: 'fly', dur: segsLen(SEG.fly) },
  { id: 'panel', dur: segsLen(SEG.panel) },
  { id: 'timeline', dur: segsLen(SEG.timeline) },
  { id: 'layers', dur: segsLen(SEG.layers) },
  { id: 'data', dur: 12.5 },
]

export const XFADE = 0.5

export const PLACED = (() => {
  let t = 0
  return SCENES.map((s, i) => {
    const start = i === 0 ? 0 : t - XFADE
    t = start + s.dur
    return { ...s, start, from: Math.round(start * FPS), frames: Math.round(s.dur * FPS) }
  })
})()
export const TOTAL = PLACED.at(-1)!.start + PLACED.at(-1)!.dur
export const TOTAL_FRAMES = Math.round(TOTAL * FPS)
