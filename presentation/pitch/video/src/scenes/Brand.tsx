import { AbsoluteFill, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Logo, sec } from '../components/ui'
import { FONT_DISPLAY, FONT_UI } from '../theme'

/**
 * "Poznaj Moje Miejsce" over a golden-hour aerial of Warsaw (VO s2 starts at 0.5 s).
 * With `tagline` it shows that single line instead of the showcase's two (silent System cut).
 */
export function Brand({ tagline }: { tagline?: string }) {
  const f = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const drift = interpolate(f, [0, durationInFrames], [1.2, 1.28])
  const word = spring({ frame: f - sec(0.75), fps, config: { damping: 200 } })
  const tag1 = spring({ frame: f - sec(1.9), fps, config: { damping: 200 } })
  const tag2 = spring({ frame: f - sec(5.4), fps, config: { damping: 200 } })
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* scaled from the bottom edge: crops the top band where the generated drone shot shows rotor blur */}
      <AbsoluteFill style={{ transform: `scale(${drift})`, transformOrigin: '50% 100%' }}>
        <OffthreadVideo src={staticFile('broll/aerial2.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 46%, rgba(10,10,20,.62) 0%, rgba(10,10,20,.3) 55%, rgba(10,10,20,.1) 100%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Logo size={150} delay={sec(0.4)} onDark />
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 200,
              letterSpacing: -8,
              color: '#fff',
              opacity: word,
              transform: `translateX(${(1 - word) * -30}px)`,
              clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
              textShadow: '0 10px 60px rgba(0,0,0,.35)',
            }}
          >
            Moje Miejsce
          </div>
        </div>
        <div style={{ height: 150, position: 'relative', width: 1400 }}>
          {tagline ? (
            <Tag p={tag1}>{tagline}</Tag>
          ) : (
            <>
              <Tag p={tag1 * interpolate(f, [sec(5.1), sec(5.4)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
                Najpierw miejsce do życia.
              </Tag>
              <Tag p={tag2}>Mieszkanie znajdziesz potem.</Tag>
            </>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function Tag({ p, children }: { p: number; children: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        top: 30,
        textAlign: 'center',
        fontFamily: FONT_UI,
        fontWeight: 500,
        fontSize: 52,
        letterSpacing: -1,
        color: 'rgba(255,255,255,.94)',
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
        textShadow: '0 4px 30px rgba(0,0,0,.4)',
      }}
    >
      {children}
    </div>
  )
}
