import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  BrowserFrame,
  Callouts,
  type CalloutDef,
  Camera,
  type CamKey,
  Chapter,
  Paper,
  Recording,
  sec,
} from '../components/ui'
import { C, FONT_DISPLAY } from '../theme'
import { beat, type Segment, SEGMENTS, segsLen } from '../timeline'

function AppShot({
  segments,
  cam,
  callouts,
  chapter,
  enter = false,
  children,
}: {
  segments: Segment[]
  cam: CamKey[]
  callouts: CalloutDef[]
  chapter: [string, string]
  enter?: boolean
  children?: React.ReactNode
}) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = enter ? spring({ frame: f, fps, config: { damping: 200, mass: 1.2 } }) : 1
  return (
    <AbsoluteFill>
      <Paper />
      <Chapter n={chapter[0]} title={chapter[1]} />
      <AbsoluteFill style={{ transform: `translateY(${(1 - p) * 70}px) scale(${0.94 + 0.06 * p})`, opacity: p }}>
        <BrowserFrame>
          <Camera keys={cam}>
            <Recording segments={segments} />
          </Camera>
        </BrowserFrame>
      </AbsoluteFill>
      <Callouts items={callouts} />
      {children}
    </AbsoluteFill>
  )
}

// ── 01 survey ────────────────────────────────────────────────────────────────
export function Survey() {
  const S = SEGMENTS.survey
  const end = segsLen(S)
  const steps = [
    { at: beat(S, 'profile'), label: 'Etap życia' },
    { at: beat(S, 'priorities'), label: 'Co jest ważne' },
    { at: beat(S, 'horizon'), label: 'Wynajem czy kupno' },
  ]
  return (
    <AppShot
      enter
      segments={S}
      chapter={['01', 'Profil w 30 sekund']}
      cam={[
        { t: 0, s: 1, x: 0.5, y: 0.5 },
        { t: 1.2, s: 1, x: 0.5, y: 0.5 },
        { t: 2.2, s: 1.42, x: 0.5, y: 0.47 },
        { t: end - 1.6, s: 1.42, x: 0.5, y: 0.47 },
        { t: end - 0.4, s: 1, x: 0.5, y: 0.5 },
      ]}
      callouts={[{ at: 0.6, dur: steps[0].at - 0.6, text: '3 pytania · 30 sekund', sub: 'bez logowania i rejestracji', color: C.rodzina }]}
    >
      <StepRail steps={steps} until={end - 0.6} />
    </AppShot>
  )
}

export function StepRail({ steps, until, color = C.rodzina }: { steps: { at: number; label: string }[]; until: number; color?: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = f / fps
  if (t < steps[0].at - 0.2 || t > until + 0.4) return null
  const vis = Math.min(
    interpolate(t, [steps[0].at - 0.2, steps[0].at + 0.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    interpolate(t, [until, until + 0.4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  )
  const active = steps.reduce((a, s, i) => (t >= s.at ? i : a), 0)
  return (
    <div
      style={{
        position: 'absolute',
        right: 112,
        bottom: 76,
        display: 'flex',
        gap: 10,
        padding: 10,
        borderRadius: 24,
        background: 'rgba(255,255,255,.92)',
        boxShadow: '0 30px 70px -18px rgba(22,22,29,.42), inset 0 0 0 1px rgba(22,22,29,.06)',
        opacity: vis,
        transform: `translateY(${(1 - vis) * 30}px)`,
      }}
    >
      {steps.map((s, i) => {
        const on = i === active
        const done = i < active
        const p = spring({ frame: f - sec(s.at), fps, config: { damping: 200 } })
        return (
          <div
            key={s.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 22px 14px 14px',
              borderRadius: 16,
              background: on ? `color-mix(in srgb, ${color} ${Math.round(14 * p)}%, white)` : 'transparent',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                display: 'grid',
                placeItems: 'center',
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: 17,
                color: on || done ? '#fff' : C.ink3,
                background: on || done ? color : '#EFEBE5',
              }}
            >
              {done ? '✓' : i + 1}
            </span>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 26, color: on ? C.ink : C.ink3, letterSpacing: -0.4 }}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 02 map ───────────────────────────────────────────────────────────────────
export function MapScene() {
  const S = SEGMENTS.map
  const end = segsLen(S)
  const sl = beat(S, 'sliders')
  const so = beat(S, 'solo')
  const pk = beat(S, 'pick')
  return (
    <AppShot
      segments={S}
      chapter={['02', 'Mapa dopasowania']}
      cam={[
        { t: 0, s: 1, x: 0.5, y: 0.5 },
        { t: sl - 0.6, s: 1, x: 0.5, y: 0.5 },
        { t: sl + 0.4, s: 1.6, x: 0.04, y: 0.3 },
        { t: so - 0.4, s: 1.6, x: 0.04, y: 0.3 },
        { t: so + 0.6, s: 1.22, x: 0.2, y: 0.45 },
        { t: pk - 1.4, s: 1.22, x: 0.2, y: 0.45 },
        { t: pk - 0.2, s: 1.3, x: 0.5, y: 0.78 },
        { t: end, s: 1.3, x: 0.5, y: 0.78 },
      ]}
      callouts={[
        { at: 2.6, dur: sl - 2.8, text: '143 osiedla pod Twój profil', sub: 'im cieplejszy kolor, tym lepsze dopasowanie', color: C.rodzina },
        { at: sl + 0.5, dur: so - sl - 0.6, text: 'Wagi 0–5, mapa przelicza się na żywo', sub: 'dopasowanie na podstawie prawdziwych danych, bez ręcznych korekt', color: C.cat.zielen },
        { at: so + 0.4, dur: pk - so - 1.4, text: 'Podgląd jednej kategorii', sub: 'sport · edukacja · komunikacja · zdrowie…', color: C.cat.sport },
      ]}
    />
  )
}

// ── 03 flyover (full bleed, the app's own cinematic) ────────────────────────
export function Fly() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const z = interpolate(f, [0, durationInFrames], [1, 1.04])
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <Recording segments={SEGMENTS.fly} />
      </AbsoluteFill>
      <Callouts dark items={[{ at: 1.4, dur: 4.2, text: 'Przelot nad osiedlem w 3D', sub: 'budynki i ulice z OpenStreetMap', color: C.student }]} />
    </AbsoluteFill>
  )
}

// ── 04 osiedle panel ─────────────────────────────────────────────────────────
export function Panel() {
  const S = SEGMENTS.panel
  const end = segsLen(S)
  const cp = beat(S, 'compare')
  const rt = beat(S, 'routes')
  const cm = beat(S, 'commute')
  const pr = beat(S, 'prices')
  const tl = beat(S, 'timeline')
  return (
    <AppShot
      segments={S}
      chapter={['03', 'Osiedle z bliska']}
      cam={[
        { t: 0, s: 1, x: 0.5, y: 0.5 },
        { t: 0.8, s: 1, x: 0.5, y: 0.5 },
        { t: 2.0, s: 1.62, x: 0.02, y: 0.2 },
        { t: cp - 0.3, s: 1.62, x: 0.02, y: 0.2 },
        { t: cp + 0.5, s: 1.62, x: 0.02, y: 0.62 },
        { t: rt - 0.3, s: 1.62, x: 0.02, y: 0.62 },
        { t: rt + 0.5, s: 1.18, x: 0.55, y: 0.5 },
        { t: cm - 0.4, s: 1.18, x: 0.55, y: 0.5 },
        { t: cm + 0.3, s: 1.6, x: 0.02, y: 0.55 },
        { t: tl + 2.4, s: 1.6, x: 0.02, y: 0.55 },
        { t: end - 0.3, s: 1.05, x: 0.5, y: 0.5 },
      ]}
      callouts={[
        { at: 1.4, dur: cp - 1.5, text: 'Konkrety zamiast ogólników', sub: 'metro 150 m · 26 przedszkoli w promieniu 1 km', color: C.rodzina },
        { at: cp + 0.3, dur: rt - cp - 0.4, text: 'Każda kategoria na tle średniej dla Warszawy', color: C.cat.kultura },
        { at: rt + 0.4, dur: cm - rt - 0.5, text: 'Trasa do szkoły i przedszkola', sub: 'pieszo i rowerem · OSRM na danych OpenStreetMap', color: C.cat.edukacja },
        { at: cm + 0.2, dur: pr - cm - 0.3, text: 'Dojazd w godzinach szczytu', sub: 'routing po rozkładach ZTM (GTFS)', color: C.cat.komunikacja },
        { at: pr + 0.2, dur: tl - pr - 0.3, text: 'Ceny transakcyjne', sub: 'Rejestr Cen Nieruchomości m.st. Warszawy', color: C.cat.zakupy },
        { at: tl + 0.4, dur: end - tl - 0.6, text: 'Inwestycje miasta na osi czasu', sub: 'MPZP · inwestycje · budżet obywatelski', color: C.cat.zielen },
      ]}
    />
  )
}

// ── 05 3D layers ─────────────────────────────────────────────────────────────
export function Layers() {
  const S = SEGMENTS.layers
  const end = segsLen(S)
  return (
    <AppShot
      segments={S}
      chapter={['03', 'Osiedle z bliska']}
      cam={[
        { t: 0, s: 1.05, x: 0.5, y: 0.5 },
        { t: 1.2, s: 1.3, x: 0.82, y: 0.32 },
        { t: end, s: 1.36, x: 0.8, y: 0.34 },
      ]}
      callouts={[{ at: 0.6, dur: end - 0.8, text: 'Budynki według funkcji, korki w ciągu doby', sub: 'warstwy 3D z OSM i rozkładów ZTM', color: C.cat.sport }]}
    />
  )
}

