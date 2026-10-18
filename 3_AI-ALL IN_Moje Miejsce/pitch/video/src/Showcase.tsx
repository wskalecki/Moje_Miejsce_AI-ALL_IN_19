import type { FC } from 'react'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from 'remotion'
import { SceneFade, sec } from './components/ui'
import { Fly, Layers, MapScene, Panel, Survey } from './scenes/AppScenes'
import { Brand } from './scenes/Brand'
import { Hook } from './scenes/Hook'
import { Close, Data } from './scenes/Outro'
import { FPS } from './theme'
import { MUSIC_OFFSET, PLACED, TOTAL, VO_WINDOWS, XFADE } from './timeline'

const SCENE_COMPONENTS: Record<string, FC> = {
  hook: Hook,
  brand: Brand,
  survey: Survey,
  map: MapScene,
  fly: Fly,
  panel: Panel,
  layers: Layers,
  data: Data,
  close: Close,
}

/** Music level: full between lines, ducked under the voiceover, faded at both ends. */
function musicVolume(frame: number) {
  const t = frame / FPS
  const ramp = 0.45
  let duck = 0
  for (const [a, b] of VO_WINDOWS) {
    duck = Math.max(duck, interpolate(t, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  }
  const level = 0.62 - duck * (0.62 - 0.2)
  const fade = Math.min(interpolate(t, [0, 1.6], [0, 1], { extrapolateRight: 'clamp' }), interpolate(t, [TOTAL - 1.4, TOTAL], [1, 0], { extrapolateLeft: 'clamp' }))
  return level * fade
}

export const Showcase: FC = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    {PLACED.map((p, i) => {
      const C = SCENE_COMPONENTS[p.id]
      return (
        <Sequence key={p.id} from={p.from} durationInFrames={p.frames} name={p.id}>
          <SceneFade fadeIn={i === 0 ? 0 : XFADE} fadeOut={i === PLACED.length - 1 ? 0 : 0}>
            <C />
          </SceneFade>
        </Sequence>
      )
    })}
    <Audio src={staticFile('music/bed.mp3')} trimBefore={sec(MUSIC_OFFSET)} volume={musicVolume} />
    {PLACED.filter((p) => p.vo).map((p) => (
      <Sequence key={`vo-${p.id}`} from={p.from + sec(p.voAt ?? 0)} name={`vo ${p.vo}`}>
        <Audio src={staticFile(`vo/${p.vo}.mp3`)} volume={1} />
      </Sequence>
    ))}
  </AbsoluteFill>
)
