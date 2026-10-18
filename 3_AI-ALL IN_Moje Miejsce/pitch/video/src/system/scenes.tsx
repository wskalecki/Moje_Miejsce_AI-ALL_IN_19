import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { BrowserFrame, Callouts, type CalloutDef, Camera, type CamKey, Chapter, Paper, Recording, sec } from '../components/ui'
import { StepRail } from '../scenes/AppScenes'
import { C, FONT_DISPLAY, FONT_UI } from '../theme'
import type { Segment } from '../timeline'
import { segsLen } from '../timeline'
import { at, atOr, SEG, SRC } from './timeline'

function Shot({
  segments,
  cam,
  callouts = [],
  chapter,
  enter = false,
  children,
}: {
  segments: Segment[]
  cam: CamKey[]
  callouts?: CalloutDef[]
  chapter: [string, string]
  enter?: boolean
  children?: ReactNode
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
            <Recording segments={segments} src={SRC} />
          </Camera>
        </BrowserFrame>
      </AbsoluteFill>
      <Callouts items={callouts} />
      {children}
    </AbsoluteFill>
  )
}

/** Callouts that follow each other: item i runs from its `at` until the next one starts. */
function chain(items: Omit<CalloutDef, 'dur'>[], end: number): CalloutDef[] {
  return items.map((c, i) => ({ ...c, dur: (i + 1 < items.length ? items[i + 1].at : end) - c.at - 0.15 }))
}

const full = { s: 1, x: 0.5, y: 0.5 }

// ── 01 survey ────────────────────────────────────────────────────────────────
export function Survey() {
  const S = SEG.survey
  const end = segsLen(S)
  const steps = [
    { at: at(S, 'profile'), label: 'Etap życia' },
    { at: at(S, 'priorities'), label: 'Co jest ważne' },
    { at: at(S, 'horizon'), label: 'Kupujesz czy wynajmujesz' },
  ]
  const modal = at(S, 'modal')
  const match = at(S, 'matching')
  return (
    <Shot
      enter
      segments={S}
      chapter={['01', 'Profil w 30 sekund']}
      cam={[
        { t: 0, ...full },
        { t: modal - 0.4, ...full },
        { t: modal + 0.6, s: 1.45, x: 0.5, y: 0.45 },
        { t: match - 0.2, s: 1.45, x: 0.5, y: 0.45 },
        { t: match + 0.6, s: 1.3, x: 0.5, y: 0.45 },
        { t: end - 0.2, s: 1.3, x: 0.5, y: 0.45 },
      ]}
      callouts={[
        { at: 0.6, dur: steps[0].at - 0.8, text: 'Bez logowania, bez rejestracji', color: C.senior },
        { at: match + 0.2, dur: end - match - 0.4, text: 'Profil: Senior', sub: 'cisza, zieleń i kultura · kupno', color: C.senior },
      ]}
    >
      <StepRail steps={steps} until={match - 0.3} color={C.senior} />
    </Shot>
  )
}

// ── 02 map ───────────────────────────────────────────────────────────────────
export function MapScene() {
  const S = SEG.map
  const end = segsLen(S)
  const so = at(S, 'solo')
  return (
    <Shot
      segments={S}
      chapter={['02', 'Mapa dopasowania']}
      cam={[
        { t: 0, s: 1.3, x: 0.5, y: 0.45 },
        { t: 1.2, ...full },
        { t: so - 0.3, ...full },
        { t: so + 0.5, s: 1.2, x: 1, y: 0.25 },
        { t: end - 0.6, s: 1.2, x: 1, y: 0.25 },
        { t: end, s: 1.1, x: 0.5, y: 0.5 },
      ]}
      callouts={chain(
        [
          { at: 1.4, text: '143 osiedla dopasowane do Twoich potrzeb', color: C.senior },
          { at: so + 0.4, text: 'Przychodnie, apteki, biblioteki', color: C.cat.zdrowie },
        ],
        end - 0.2,
      )}
    />
  )
}

// ── 03 weights reshuffle the top 3 ──────────────────────────────────────────
type Row = { name: string; pct: number; featured?: boolean }
const G = { name: 'Groszówka', featured: true }
const W = { name: 'Wilanów Królewski', featured: true }
const B = { name: 'Stare Bielany', featured: true }

export function Reweight() {
  const S = SEG.reweight
  const end = segsLen(S)
  const top = at(S, 'top3')
  const pick = at(S, 'pick')
  // top 3 as the map pills announced it during the take (tools/record-system.mjs logs them)
  const states: { t: number; chip: string; rows: Row[] }[] = [
    { t: 0, chip: 'Profil: Senior', rows: [{ ...G, pct: 84 }, { ...W, pct: 84 }, { ...B, pct: 75 }] },
    { t: at(S, 'reweight', 1.15), chip: '− Cisza', rows: [{ name: 'Powiśle', pct: 89 }, { name: 'Śródmieście Północne', pct: 87 }, { name: 'Słodowiec', pct: 87 }] },
    { t: at(S, 'noGreen', 1.05), chip: '− Zieleń', rows: [{ name: 'Śródmieście Północne', pct: 99 }, { name: 'Śródmieście Południowe', pct: 99 }, { name: 'Stare Miasto', pct: 97 }] },
    { t: at(S, 'gastro', 1.7), chip: '+ Gastronomia 5/5', rows: [{ name: 'Śródmieście Północne', pct: 100 }, { name: 'Śródmieście Południowe', pct: 99 }, { name: 'Stare Miasto', pct: 97 }] },
    { t: at(S, 'restore', 1.25), chip: 'Przywróć profil', rows: [{ ...W, pct: 83 }, { ...G, pct: 83 }, { ...B, pct: 76 }] },
    { t: at(S, 'restore', 4.2), chip: 'Zieleń 4/5', rows: [{ ...G, pct: 84 }, { ...W, pct: 83 }, { ...B, pct: 76 }] },
  ]
  return (
    <Shot
      segments={S}
      chapter={['03', 'Twoje wagi, Twój ranking']}
      cam={[
        { t: 0, s: 1.1, x: 0.5, y: 0.5 },
        { t: 0.8, s: 1.12, x: 0, y: 0.45 },
        { t: top - 0.4, s: 1.12, x: 0, y: 0.45 },
        { t: pick - 0.6, s: 1.5, x: 0.78, y: 0.47 },
        { t: end, s: 1.6, x: 0.79, y: 0.47 },
      ]}
    >
      <Top3 states={states} until={pick - 0.2} />
    </Shot>
  )
}

/** Live top-3 card: rows re-deal whenever the ranking changes. */
function Top3({ states, until }: { states: { t: number; chip: string; rows: Row[] }[]; until: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = f / fps
  const idx = states.reduce((a, s, i) => (t >= s.t ? i : a), 0)
  const cur = states[idx]
  const local = f - sec(cur.t)
  const vis = Math.min(spring({ frame: f - sec(0.5), fps, config: { damping: 200 } }), interpolate(t, [until, until + 0.4], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const chipP = spring({ frame: local, fps, config: { damping: 14, stiffness: 180 } })
  return (
    <div
      style={{
        position: 'absolute',
        right: 112,
        bottom: 76,
        width: 600,
        padding: '24px 26px 18px',
        borderRadius: 26,
        background: 'rgba(255,255,255,.94)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 30px 70px -18px rgba(22,22,29,.42), inset 0 0 0 1px rgba(22,22,29,.06)',
        opacity: vis,
        transform: `translateY(${(1 - vis) * 40}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, letterSpacing: -0.6, color: C.ink, whiteSpace: 'nowrap' }}>Top 3 miejsca dla Ciebie</span>
        <span
          style={{
            fontFamily: FONT_UI,
            fontWeight: 600,
            fontSize: 19,
            whiteSpace: 'nowrap',
            padding: '7px 14px',
            borderRadius: 999,
            color: idx === 0 || idx >= 4 ? '#0b6b62' : '#9a3412',
            background: idx === 0 || idx >= 4 ? 'rgba(19,163,150,.14)' : 'rgba(235,104,52,.14)',
            transform: `scale(${0.8 + 0.2 * chipP})`,
            opacity: chipP,
          }}
        >
          {cur.chip}
        </span>
      </div>
      {cur.rows.map((r, i) => {
        const p = spring({ frame: local - i * 3, fps, config: { damping: 16, stiffness: 160 } })
        const prev = idx > 0 ? states[idx - 1].rows[i] : null
        const changed = !prev || prev.name !== r.name
        const o = idx === 0 || !changed ? 1 : Math.min(1, p)
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 4px',
              borderTop: i ? `1px solid ${C.line}` : 'none',
              opacity: o,
              transform: changed && idx > 0 ? `translateX(${(1 - Math.min(1, p)) * 30}px)` : undefined,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: 20,
                color: '#fff',
                background: r.featured ? C.senior : '#5B5B6B',
              }}
            >
              #{i + 1}
            </span>
            <span style={{ flex: 1, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 27, letterSpacing: -0.4, color: C.ink }}>{r.name}</span>
            <span style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 25, color: r.featured ? '#0b6b62' : C.ink2, fontVariantNumeric: 'tabular-nums' }}>{r.pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── 04 fly-in (full bleed) ───────────────────────────────────────────────────
export function Fly() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const z = interpolate(f, [0, durationInFrames], [1, 1.05])
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ transform: `scale(${z})` }}>
        <Recording segments={SEG.fly} src={SRC} />
      </AbsoluteFill>
      <Callouts items={[{ at: 0.5, dur: segsLen(SEG.fly) - 0.4, text: 'Groszówka · Wesoła', sub: '1. miejsce dla profilu seniora · dopasowanie 84%', color: C.senior }]} />
    </AbsoluteFill>
  )
}

// ── 05 osiedle panel ─────────────────────────────────────────────────────────
export function Panel() {
  const S = SEG.panel
  const end = segsLen(S)
  const b = (n: string) => at(S, n)
  const [sc, pl, cm, pr] = ['scores', 'places', 'commute', 'prices'].map(b)
  const panelTop = { s: 1.6, x: 0.02, y: 0.3 }
  const panelMid = { s: 1.6, x: 0.02, y: 0.55 }
  const withMap = { s: 1.12, x: 0, y: 0.5 }
  return (
    <Shot
      segments={S}
      chapter={['04', 'Groszówka z bliska']}
      cam={[
        { t: 0, ...full },
        { t: 0.6, ...full },
        { t: 1.6, ...panelTop },
        { t: sc - 0.2, ...panelTop },
        { t: sc + 0.6, ...panelMid },
        { t: pl - 0.2, ...panelMid },
        { t: pl + 0.6, ...withMap },
        { t: cm - 0.3, ...withMap },
        { t: cm + 0.5, ...panelMid },
        { t: pr + 0.3, ...panelMid },
        { t: end - 0.4, s: 1.15, x: 0, y: 0.45 },
        { t: end, s: 1.15, x: 0, y: 0.45 },
      ]}
      callouts={chain(
        [
          { at: 1.2, text: 'Zdjęcia i krótko o okolicy', sub: 'hałas i zieleń w promieniu 1 km', color: C.senior },
          { at: sc + 0.3, text: 'Jak wypada dla Ciebie', sub: 'każda kategoria w skali 0–100', color: C.cat.cisza },
          { at: pl + 0.3, text: 'Ważne miejsca w okolicy', sub: 'Ile zajmie Ci transport?', color: C.cat.zielen },
          { at: cm + 0.3, text: 'Dojazd w godzinach szczytu i korki w ciągu doby', sub: 'do centrum i biurowców · rozkłady ZTM (GTFS)', color: C.cat.komunikacja },
          { at: pr + 0.3, text: 'Ceny transakcyjne', sub: 'Rejestr Cen Nieruchomości · na tle Warszawy', color: C.cat.zakupy },
        ],
        end - 0.1,
      )}
    />
  )
}

// ── 06 timeline & investments ────────────────────────────────────────────────
export function Timeline() {
  const S = SEG.timeline
  const end = segsLen(S)
  const inv = at(S, 'investments')
  return (
    <Shot
      segments={S}
      chapter={['05', 'Co się zmieni do 2045']}
      cam={[
        { t: 0, s: 1.15, x: 0, y: 0.45 },
        { t: 1.0, s: 1.22, x: 0, y: 0.4 },
        { t: inv - 0.3, s: 1.22, x: 0, y: 0.4 },
        { t: inv + 0.6, s: 1.18, x: 0, y: 0.42 },
        { t: end, s: 1.18, x: 0, y: 0.42 },
      ]}
      callouts={chain(
        [
          { at: 0.6, text: 'Działania planowane dla Twojej okolicy', sub: 'Bez stresu na przyszłość', color: C.student },
        ],
        end - 0.1,
      )}
    />
  )
}

// ── 07 3D layers ─────────────────────────────────────────────────────────────
export function Layers() {
  const S = SEG.layers
  const end = segsLen(S)
  // takes without per-toggle markers: moments read off the frames of the 2026-10-18 take
  const traffic = atOr(S, 'layerTraffic', 1, 'layers', 17)
  return (
    <Shot
      segments={S}
      chapter={['06', 'Warstwy mapy 3D']}
      cam={[
        { t: 0, s: 1.18, x: 0, y: 0.42 },
        { t: 1.4, s: 1.38, x: 1, y: 0.3 },
        { t: end - 2.2, s: 1.38, x: 1, y: 0.36 },
        { t: end, s: 1.1, x: 0.5, y: 0.5 },
      ]}
      callouts={chain(
        [
          { at: traffic + 0.3, text: 'Korki na drogach w ciągu doby', color: C.cat.gastronomia },
        ],
        end - 0.3,
      )}
    />
  )
}
