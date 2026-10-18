import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { sec } from '../components/ui'
import { C, FONT_DISPLAY } from '../theme'

/** Lines timed to the s1 voiceover (VO starts 0.7 s into the scene). */
const LINES = [
  { at: 0.7, text: 'Szukasz mieszkania w Warszawie?' },
  { at: 2.75, text: 'Setki ogłoszeń.' },
  { at: 4.7, text: 'Metraż. Cena. Piętro.' },
  { at: 6.8, text: 'Ale jak się tam żyje?', accent: true },
]

export function Hook() {
  const f = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const push = interpolate(f, [0, durationInFrames], [1.04, 1.14])
  const fadeIn = interpolate(f, [0, sec(0.8)], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: fadeIn, transform: `scale(${push})` }}>
        <OffthreadVideo src={staticFile('broll/listings.mp4')} playbackRate={0.69} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(8,8,14,.78) 0%, rgba(8,8,14,.35) 48%, rgba(8,8,14,0) 70%)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(0deg, rgba(8,8,14,.55) 0%, rgba(8,8,14,0) 40%)' }} />
      {LINES.map((l, i) => {
        const next = LINES[i + 1]
        const local = f - sec(l.at)
        if (local < 0) return null
        const inP = spring({ frame: local, fps, config: { damping: 200, mass: 0.6 } })
        const outP = next ? interpolate(f, [sec(next.at) - 6, sec(next.at)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
        if (outP <= 0) return null
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 150,
              top: 430,
              width: 1000,
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: l.accent ? 104 : 92,
              lineHeight: 1.04,
              letterSpacing: -3,
              color: '#fff',
              opacity: inP * outP,
              filter: `blur(${(1 - inP) * 14}px)`,
              transform: `translateY(${(1 - inP) * 34}px)`,
            }}
          >
            {l.text}
            {l.accent && (
              <div
                style={{
                  marginTop: 26,
                  height: 8,
                  borderRadius: 4,
                  width: interpolate(local, [8, 30], [0, 420], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
                  background: C.rodzina,
                }}
              />
            )}
          </div>
        )
      })}
    </AbsoluteFill>
  )
}
