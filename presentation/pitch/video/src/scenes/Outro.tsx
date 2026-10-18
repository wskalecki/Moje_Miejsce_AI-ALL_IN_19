import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Logo, Paper, sec } from '../components/ui'
import { C, FONT_DISPLAY, FONT_UI } from '../theme'

/** Counts from data/catalog.json (sources, datasets, metrics) and the MSI boundary layer (osiedla). */
const STATS = [
  { at: 0.9, n: 41, label: 'zbiorów danych', color: C.student },
  { at: 2.5, n: 10, label: 'otwartych źródeł', color: C.rodzina },
  { at: 3.6, n: 127, label: 'zdefiniowanych metryk', color: C.senior },
  { at: 4.4, n: 143, label: 'ocenianych osiedli', color: C.cat.edukacja },
]
const SOURCES = [
  { at: 5.5, name: 'Portal danych m.st. Warszawy', what: 'przystanki, AED, boiska, wydarzenia, powietrze' },
  { at: 6.2, name: 'Usługi mapowe WFS', what: 'granice osiedli, metro, biblioteki, budynki' },
  { at: 7.0, name: 'Rejestr Cen Nieruchomości', what: 'transakcje lokali mieszkalnych' },
  { at: 8.5, name: 'GIOŚ — mapy hałasu', what: 'zasięgi Lden i Lnight' },
  { at: 9.6, name: 'ZTM — rozkłady GTFS', what: 'dojazdy w szczycie, spowolnienia' },
  { at: 11.3, name: 'OpenStreetMap', what: 'szkoły, przedszkola, zieleń, sklepy' },
  { at: 11.8, name: 'OSRM', what: 'trasy piesze i rowerowe' },
  { at: 12.3, name: 'Wikimedia Commons', what: 'zdjęcia na licencjach CC' },
]

/** `pace` < 1 compresses the reveal timings (they follow the voiceover at 1; the silent System cut runs faster). */
export function Data({ pace = 1, t0 = 0.6 }: { pace?: number; t0?: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const final = spring({ frame: f - sec(t0 + 13.1 * pace), fps, config: { damping: 200 } })
  return (
    <AbsoluteFill>
      <Paper dark />
      <div style={{ position: 'absolute', left: 150, top: 96, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: '#8E8CA3', textTransform: 'uppercase' }}>
        Pod spodem · otwarte dane
      </div>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 160, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 30 }}>
        {STATS.map((s) => {
          const p = spring({ frame: f - sec(t0 + s.at * pace), fps, config: { damping: 200 } })
          const n = Math.round(s.n * interpolate(f - sec(t0 + s.at * pace), [0, sec(1.1)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (x) => 1 - Math.pow(1 - x, 3) }))
          return (
            <div key={s.label} style={{ opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 150, letterSpacing: -6, color: '#fff', lineHeight: 1 }}>{n}</div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT_UI, fontSize: 28, color: '#C9C7D6' }}>
                <span style={{ width: 12, height: 12, borderRadius: 6, background: s.color }} />
                {s.label}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', left: 150, right: 150, top: 470, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {SOURCES.map((s) => {
          const p = spring({ frame: f - sec(t0 + s.at * pace), fps, config: { damping: 18, stiffness: 150 } })
          return (
            <div
              key={s.name}
              style={{
                padding: '22px 24px',
                borderRadius: 20,
                background: 'rgba(255,255,255,.06)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.1)',
                opacity: Math.min(1, p),
                transform: `translateY(${(1 - p) * 26}px) scale(${0.96 + 0.04 * Math.min(1, p)})`,
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 27, color: '#fff', letterSpacing: -0.4 }}>{s.name}</div>
              <div style={{ marginTop: 6, fontFamily: FONT_UI, fontSize: 20, color: '#A9A7B9' }}>{s.what}</div>
            </div>
          )
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 150,
          bottom: 120,
          display: 'flex',
          alignItems: 'center',
          gap: 30,
          opacity: final,
          transform: `translateY(${(1 - final) * 24}px)`,
        }}
      >
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 72, letterSpacing: -2.5, color: '#fff' }}>Każda liczba ma swoje źródło.</span>
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 24, color: C.student, padding: '10px 16px', borderRadius: 10, background: 'rgba(124,92,255,.16)' }}>
          data/catalog.json
        </span>
      </div>
    </AbsoluteFill>
  )
}

export function Close() {
  const f = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const word = spring({ frame: f - sec(0.7), fps, config: { damping: 200 } })
  const tag = spring({ frame: f - sec(1.7), fps, config: { damping: 200 } })
  const foot = spring({ frame: f - sec(2.8), fps, config: { damping: 200 } })
  const out = interpolate(f, [durationInFrames - sec(0.9), durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: out }}>
        <Paper />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <Logo size={136} delay={sec(0.3)} />
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: 184,
                letterSpacing: -7,
                color: C.ink,
                opacity: word,
                clipPath: `inset(0 ${(1 - word) * 100}% 0 0)`,
              }}
            >
              Moje Miejsce
            </span>
          </div>
          <div style={{ marginTop: 26, fontFamily: FONT_UI, fontWeight: 500, fontSize: 50, letterSpacing: -1, color: C.ink2, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)` }}>
            Świadomie wybierz, gdzie mieszkać.
          </div>
        </AbsoluteFill>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 84,
            textAlign: 'center',
            fontFamily: FONT_UI,
            fontSize: 24,
            color: C.ink3,
            opacity: foot,
          }}
        >
          Warsaw Open Data Hackathon 2026 · Wyzwanie W3 „Warszawa: Twój ruch!” · zespół AI All In
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
