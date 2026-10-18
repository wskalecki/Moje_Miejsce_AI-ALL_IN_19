import type { FC } from 'react'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion'
import { SceneFade, sec } from './components/ui'
import { Brand } from './scenes/Brand'
import { Data } from './scenes/Outro'
import { Fly, Layers, MapScene, Panel, Reweight, Survey, Timeline } from './system/scenes'
import { FPS } from './theme'
import { MUSIC_LEN } from './timeline'
import { PLACED, TOTAL, XFADE } from './system/timeline'

/** Line under the wordmark on the opening aerial. */
export const TAGLINE = 'Znajdź okolicę, która pasuje do Twojego życia.'

const SCENES: Record<string, FC> = {
  brand: () => <Brand tagline={TAGLINE} />,
  survey: Survey,
  map: MapScene,
  reweight: Reweight,
  fly: Fly,
  panel: Panel,
  timeline: Timeline,
  layers: Layers,
  data: () => <Data pace={0.6} t0={0.3} />,
}

/*
 * Music: the showcase bed (assets/music/bed.mp3, 2:17) is shorter than this cut, so it plays twice with a
 * crossfade on the cut into the osiedle panel; the second pass is offset so the track's own ending lands
 * on the last frame.
 */
const MUSIC_LEVEL = 0.8
const XF_MUSIC = 3
const SPLICE = PLACED.find((p) => p.id === 'panel')!.start
const TAIL_FROM = MUSIC_LEN - (TOTAL - SPLICE) // track second playing at SPLICE in the second pass
const fade = (t: number) =>
  Math.min(interpolate(t, [0, 1.5], [0, 1], { extrapolateRight: 'clamp' }), interpolate(t, [TOTAL - 1.4, TOTAL], [1, 0], { extrapolateLeft: 'clamp' }))
const firstPass = (f: number) => MUSIC_LEVEL * fade(f / FPS) * interpolate(f / FPS, [SPLICE - XF_MUSIC / 2, SPLICE + XF_MUSIC / 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
const secondPass = (f: number) => {
  const t = SPLICE - XF_MUSIC / 2 + f / FPS
  return MUSIC_LEVEL * fade(t) * interpolate(t, [SPLICE - XF_MUSIC / 2, SPLICE + XF_MUSIC / 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

/** System presentation (no voiceover): aerial opener → full app walkthrough (senior → Groszówka) → data panel. */
export const System: FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {PLACED.map((p, i) => {
      const C = SCENES[p.id]
      const last = i === PLACED.length - 1
      return (
        <Sequence key={p.id} from={p.from} durationInFrames={p.frames} name={p.id}>
          <SceneFade fadeIn={i === 0 ? 0.6 : XFADE} fadeOut={last ? 1.2 : 0}>
            <C />
          </SceneFade>
        </Sequence>
      )
    })}
    <Sequence durationInFrames={sec(SPLICE + XF_MUSIC / 2)} name="music 1">
      <Audio src={staticFile('music/bed.mp3')} volume={firstPass} />
    </Sequence>
    <Sequence from={sec(SPLICE - XF_MUSIC / 2)} name="music 2">
      <Audio src={staticFile('music/bed.mp3')} trimBefore={sec(TAIL_FROM - XF_MUSIC / 2)} volume={secondPass} />
    </Sequence>
  </AbsoluteFill>
)
