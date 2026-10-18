import { Composition } from 'remotion'
import { Showcase } from './Showcase'
import { System } from './System'
import { TOTAL_FRAMES as SYSTEM_FRAMES } from './system/timeline'
import { FPS, H, W } from './theme'
import { TOTAL_FRAMES } from './timeline'

export const RemotionRoot = () => (
  <>
    <Composition id="Showcase" component={Showcase} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="System" component={System} durationInFrames={SYSTEM_FRAMES} fps={FPS} width={W} height={H} />
  </>
)
