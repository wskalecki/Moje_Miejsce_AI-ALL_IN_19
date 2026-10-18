import type { CSSProperties, ReactNode } from 'react'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { C, FONT_DISPLAY, FONT_UI, FPS, H, W } from '../theme'
import { type Segment, segLen } from '../timeline'

export const sec = (s: number) => Math.round(s * FPS)
const ease = Easing.bezier(0.65, 0, 0.35, 1)

/** Plays pieces of a screen recording (default: the showcase walkthrough) back to back. */
export function Recording({ segments, style, src = 'clips/walkthrough.mp4' }: { segments: Segment[]; style?: CSSProperties; src?: string }) {
  let at = 0
  return (
    <AbsoluteFill style={style}>
      {segments.map((s, i) => {
        const from = sec(at)
        const len = sec(segLen(s))
        at += segLen(s)
        return (
          <Sequence key={i} from={from} durationInFrames={len} layout="none">
            <OffthreadVideo
              src={staticFile(src)}
              trimBefore={sec(s.from)}
              playbackRate={s.rate}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}

/** Camera key: at scene second `t`, zoom `s` around focus point (x, y) in 0–1 of the frame. */
export type CamKey = { t: number; s: number; x: number; y: number }

/** Screen-Studio-style eased zooms between keys. */
export function Camera({ keys, children }: { keys: CamKey[]; children: ReactNode }) {
  const frame = useCurrentFrame()
  const t = frame / FPS
  const next = keys.findIndex((key) => key.t > t)
  let k = next === -1 ? keys[keys.length - 1] : keys[Math.max(0, next - 1)]
  if (next > 0) {
    const a = keys[next - 1]
    const b = keys[next]
    const p = ease(Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))))
    k = { t, s: a.s + (b.s - a.s) * p, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p }
  }
  // keep the zoomed frame covering the viewport: translate so the focus point moves toward centre
  const tx = (0.5 - k.x) * (k.s - 1)
  const ty = (0.5 - k.y) * (k.s - 1)
  const maxShift = (k.s - 1) / 2
  const cx = Math.max(-maxShift, Math.min(maxShift, tx))
  const cy = Math.max(-maxShift, Math.min(maxShift, ty))
  return (
    <AbsoluteFill style={{ transform: `translate(${cx * 100}%, ${cy * 100}%) scale(${k.s})`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  )
}

/** Warm paper background with slowly drifting colour fields (as on the app's intro). */
export function Paper({ dark = false }: { dark?: boolean }) {
  const f = useCurrentFrame()
  const d = (n: number, amp: number) => Math.sin(f / (FPS * n)) * amp
  return (
    <AbsoluteFill style={{ background: dark ? C.night : C.bg, overflow: 'hidden' }}>
      <Blob color={C.student} x={1500 + d(7, 60)} y={120 + d(9, 40)} r={720} o={dark ? 0.32 : 0.22} />
      <Blob color={C.senior} x={140 + d(8, 50)} y={900 + d(6, 40)} r={640} o={dark ? 0.22 : 0.2} />
      <Blob color={C.rodzina} x={900 + d(10, 70)} y={1140 + d(7, 30)} r={680} o={dark ? 0.22 : 0.18} />
    </AbsoluteFill>
  )
}
function Blob({ color, x, y, r, o }: { color: string; x: number; y: number; r: number; o: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        opacity: o,
        filter: 'blur(40px)',
      }}
    />
  )
}

/** Floating browser window that hosts the screen recording. */
export const FRAME = { w: 1536, top: 110 }
export function BrowserFrame({ children, title = 'Moje Miejsce — mapa okolic Warszawy' }: { children: ReactNode; title?: string }) {
  const bar = 44
  const h = (FRAME.w * H) / W
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - FRAME.w) / 2,
        top: FRAME.top,
        width: FRAME.w,
        height: h + bar,
        borderRadius: 22,
        overflow: 'hidden',
        background: C.surface,
        boxShadow: '0 50px 120px -30px rgba(22,22,29,.38), 0 0 0 1px rgba(22,22,29,.08)',
      }}
    >
      <div style={{ height: bar, display: 'flex', alignItems: 'center', padding: '0 18px', gap: 9, background: '#FBFAF8', borderBottom: `1px solid ${C.line}` }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />
        ))}
        <div
          style={{
            margin: '0 auto',
            transform: 'translateX(-30px)',
            height: 28,
            minWidth: 380,
            borderRadius: 9,
            background: '#F0EDE8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: FONT_UI,
            fontSize: 15,
            color: C.ink2,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ position: 'relative', width: FRAME.w, height: h, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

/** Small chapter label above the window. */
export function Chapter({ n, title }: { n: string; title: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = spring({ frame: f - 6, fps, config: { damping: 200 } })
  return (
    <div
      style={{
        position: 'absolute',
        left: (W - FRAME.w) / 2 + 4,
        top: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: p,
        transform: `translateY(${(1 - p) * 14}px)`,
        fontFamily: FONT_DISPLAY,
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 700, color: C.rodzina, letterSpacing: 2 }}>{n}</span>
      <span style={{ width: 28, height: 2, background: C.ink, opacity: 0.25 }} />
      <span style={{ fontSize: 24, fontWeight: 700, color: C.ink, letterSpacing: -0.3 }}>{title}</span>
    </div>
  )
}

export type CalloutDef = { at: number; dur: number; text: string; color?: string; sub?: string }

/** Annotation pill that slides in at the lower right of the window. */
export function Callouts({ items, dark = false }: { items: CalloutDef[]; dark?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  return (
    <>
      {items.map((c, i) => {
        const local = f - sec(c.at)
        if (local < 0 || local > sec(c.dur)) return null
        const inP = spring({ frame: local, fps, config: { damping: 18, stiffness: 140, mass: 0.7 } })
        const outP = interpolate(local, [sec(c.dur) - 9, sec(c.dur)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: 112,
              bottom: 76,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: c.sub ? '18px 30px 18px 22px' : '20px 32px 20px 22px',
              borderRadius: 22,
              background: dark ? 'rgba(14,18,30,.78)' : 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 30px 70px -18px rgba(22,22,29,.42), inset 0 0 0 1px rgba(22,22,29,.06)',
              opacity: inP * outP,
              transform: `translateY(${(1 - inP) * 40}px) scale(${0.94 + 0.06 * inP})`,
              transformOrigin: 'right bottom',
            }}
          >
            <span style={{ width: 14, height: 14, borderRadius: 7, background: c.color ?? C.rodzina, boxShadow: `0 0 0 6px ${(c.color ?? C.rodzina) + '2a'}` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34, letterSpacing: -0.6, color: dark ? C.nightInk : C.ink }}>{c.text}</span>
              {c.sub && <span style={{ fontFamily: FONT_UI, fontSize: 19, color: dark ? '#B9B8C6' : C.ink2 }}>{c.sub}</span>}
            </div>
          </div>
        )
      })}
    </>
  )
}

/** The Moje Miejsce mark (favicon grid), built tile by tile. */
export function Logo({ size = 120, delay = 0, onDark = false }: { size?: number; delay?: number; onDark?: boolean }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const tiles = [
    [0, 0, 0.5], [7, 0, 0.72], [14, 0, 0.5],
    [0, 7, 0.72], [14, 7, 0.72],
    [0, 14, 0.5], [7, 14, 0.72], [14, 14, 0.5],
  ] as const
  const order = [0, 1, 2, 4, 7, 6, 5, 3]
  const box = spring({ frame: f - delay, fps, config: { damping: 16, stiffness: 120 } })
  const dot = spring({ frame: f - delay - 16, fps, config: { damping: 9, stiffness: 160 } })
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ overflow: 'visible' }}>
      <rect width="20" height="20" rx="5" fill={onDark ? '#F6F3EE' : C.ink} transform={`translate(10 10) scale(${box}) translate(-10 -10)`} />
      <g transform="translate(3 3) scale(0.7)">
        {tiles.map(([x, y, o], i) => {
          const p = spring({ frame: f - delay - 4 - order.indexOf(i) * 2, fps, config: { damping: 14, stiffness: 170 } })
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="6"
              height="6"
              rx="1.6"
              fill={onDark ? C.ink : '#F6F3EE'}
              opacity={o * p}
              transform={`translate(${x + 3} ${y + 3}) scale(${p}) translate(${-x - 3} ${-y - 3})`}
            />
          )
        })}
      </g>
      <rect x="7.9" y="7.9" width="4.2" height="4.2" rx="2.1" fill={C.student} transform={`translate(10 10) scale(${dot}) translate(-10 -10)`} />
    </svg>
  )
}

/** Fade the whole scene in/out at its edges (for cross-dissolves). */
export function SceneFade({ children, fadeIn = 0.5, fadeOut = 0.5 }: { children: ReactNode; fadeIn?: number; fadeOut?: number }) {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const o = Math.min(
    fadeIn ? interpolate(f, [0, sec(fadeIn)], [0, 1], { extrapolateRight: 'clamp' }) : 1,
    fadeOut ? interpolate(f, [durationInFrames - sec(fadeOut), durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }) : 1,
  )
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}
