import { useCallback, useState } from 'react'
import { GridTile } from '../components/grid-tile/GridTile'
import { LocationWaveGrid } from '../components/grid-tile/LocationWaveGrid'
import { DEMO_ZONE_LABELS } from '../lib/demoLocationGrid'
import { SCORE_RAMP_HEX } from '../lib/scoreColor'
import './GridTileLab.css'

const PERSONA_SCORE_PAIRS: { from: number; to: number; label: string }[] = [
  { from: 38, to: 72, label: 'Marek → lepszy fit' },
  { from: 72, to: 41, label: 'Kasia → spokojniejsza okolica' },
  { from: 55, to: 88, label: 'Rodzina → mocny wynik' },
]

export function GridTileLab() {
  const [colorPopStep, setColorPopStep] = useState(0)
  const [pickedInteractive, setPickedInteractive] = useState<number | null>(null)
  const [pulseId, setPulseId] = useState<number | null>(null)

  const colorDemo = PERSONA_SCORE_PAIRS[colorPopStep % PERSONA_SCORE_PAIRS.length]

  const triggerColorPop = useCallback(() => {
    setColorPopStep((s) => s + 1)
  }, [])

  const onInteractiveClick = (index: number) => {
    setPickedInteractive(index)
    setPulseId(index)
    window.setTimeout(() => setPulseId(null), 450)
  }

  return (
    <div className="grid-tile-lab">
      <header className="grid-tile-lab__header">
        <div>
          <p className="grid-tile-lab__eyebrow">Urban Arcade · lab kratki</p>
          <h1>Stany kafelka</h1>
          <p className="grid-tile-lab__lead">
            Pastelowa heatmapa (niebieski → mięta → żółty → koral → róż), pikselowa
            siatka i delikatny glow przy uniesieniu — vibe z moodboardu zespołu.
          </p>
        </div>
        <nav className="grid-tile-lab__nav">
          <a href="/">← Mapa (spike)</a>
        </nav>
      </header>

      <p className="grid-tile-lab__ramp-label">Rampa wyniku 0 → 100</p>
      <div className="grid-tile-lab__ramp" aria-hidden="true">
        {SCORE_RAMP_HEX.map(({ color }) => (
          <span key={color} style={{ backgroundColor: color }} />
        ))}
      </div>

      <section className="grid-tile-lab__section" aria-labelledby="lab-zones">
        <div className="grid-tile-lab__section-head">
          <h2 id="lab-zones">Symulacja 18×18 · fala od środka plamy</h2>
          <p>
            W pętli: zmiana rozmiaru plam i kolorów (persona). Kafelki reagują falą od
            środka aktywnej grupy — pierścień po pierścieniu na zewnątrz.
          </p>
        </div>
        <ul className="grid-tile-lab__legend">
          <li>
            <span className="grid-tile-lab__legend-swatch grid-tile-lab__legend-swatch--gray" />
            Szary — obramowanie i bufor między strefami
          </li>
          <li>
            <span
              className="grid-tile-lab__legend-swatch"
              style={{ backgroundColor: SCORE_RAMP_HEX[3].color }}
            />
            {DEMO_ZONE_LABELS.mokotow} — jeden kolor (ciepły)
          </li>
          <li>
            <span
              className="grid-tile-lab__legend-swatch"
              style={{ backgroundColor: SCORE_RAMP_HEX[1].color }}
            />
            {DEMO_ZONE_LABELS.centrum} — jeden kolor (chłodny)
          </li>
        </ul>
        <LocationWaveGrid
          className="grid-tile-lab__grid-10"
          cellClassName="grid-tile-lab__grid-cell"
        />
      </section>

      <section className="grid-tile-lab__section" aria-labelledby="lab-static">
        <div className="grid-tile-lab__section-head">
          <h2 id="lab-static">1. Bazowy, statyczny</h2>
          <p>
            Kolor z rampy wyniku (0–100), obrys jak na mapie. Bez animacji — stan
            domyślny siatki.
          </p>
        </div>
        <div className="grid-tile-lab__row">
          {[22, 50, 76, 88].map((score) => (
            <GridTile key={score} score={score} variant="static" label={`${score}`} />
          ))}
        </div>
      </section>

      <section className="grid-tile-lab__section" aria-labelledby="lab-color-pop">
        <div className="grid-tile-lab__section-head">
          <h2 id="lab-color-pop">2. Animacja zmiany koloru (persona / wynik)</h2>
          <p>
            Kafelek unosi się, w górnej fazie (<strong>~50% keyframe</strong>) następuje
            zamiana koloru, potem opada na nowy wynik. Symulacja przełączenia persony.
          </p>
        </div>
        <div className="grid-tile-lab__row grid-tile-lab__row--center">
          <GridTile
            score={colorDemo.from}
            targetScore={colorDemo.to}
            variant="color-pop"
            animateKey={colorPopStep}
            label={`${colorDemo.from} → ${colorDemo.to}`}
          />
          <div className="grid-tile-lab__controls">
            <button type="button" className="grid-tile-lab__btn" onClick={triggerColorPop}>
              Zmień personę (odtwórz)
            </button>
            <p className="grid-tile-lab__meta">{colorDemo.label}</p>
            <p className="grid-tile-lab__meta grid-tile-lab__meta--dim">
              Kliknij kilka razy — kolejne pary wyników z demo.
            </p>
          </div>
        </div>
        <div className="grid-tile-lab__row">
          {PERSONA_SCORE_PAIRS.map((pair, i) => (
            <GridTile
              key={pair.label}
              score={pair.from}
              targetScore={pair.to}
              variant="color-pop"
              animateKey={colorPopStep > i ? colorPopStep : 0}
              label={pair.label}
            />
          ))}
        </div>
      </section>

      <section className="grid-tile-lab__section" aria-labelledby="lab-interactive">
        <div className="grid-tile-lab__section-head">
          <h2 id="lab-interactive">3. Interakcja bez zmiany koloru</h2>
          <p>
            Hover / focus — delikatny lift. Klik — krótszy bounce, kolor bez zmiany
            (np. wybór komórki na mapie).
          </p>
        </div>
        <div className="grid-tile-lab__row">
          {[55, 67, 72].map((score, i) => (
            <GridTile
              key={score}
              score={score}
              variant="interactive"
              selected={pickedInteractive === i}
              className={pulseId === i ? 'grid-tile--pulse' : ''}
              label={pickedInteractive === i ? 'wybrana' : 'hover / klik'}
              onClick={() => onInteractiveClick(i)}
            />
          ))}
        </div>
        {pickedInteractive !== null && (
          <p className="grid-tile-lab__meta">
            Wybrany indeks demo: <strong>{pickedInteractive}</strong>
          </p>
        )}
      </section>

      <footer className="grid-tile-lab__footer">
        <p>
          Następne kroki: doprecyzować wysokość liftu, czas trwania, easing oraz czy na mapie
          używamy CSS overlay vs. MapLibre fill-extrusion / custom layer.
        </p>
      </footer>
    </div>
  )
}
