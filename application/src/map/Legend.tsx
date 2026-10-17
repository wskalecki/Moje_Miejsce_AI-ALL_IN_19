import { Info } from 'lucide-react'
import { ACCENTS, CATEGORY_COLORS, categoryLabel, categoryTones } from './tokens'
import type { CategoryKey, Profile } from './types'

interface LegendProps {
  profile: Profile
  zoomedIn: boolean
  /** Solo category from the filter panel; null = weighted view. */
  solo: CategoryKey | null
  /** Where the per-category heat comes from. */
  heatSource: 'data' | 'poi' | null
}

const ramp = (t: { soft: string; mid: string; base: string; deep: string }) =>
  `linear-gradient(90deg, ${t.soft}00 0%, ${t.soft} 14%, ${t.mid} 48%, ${t.base} 76%, ${t.deep} 100%)`

/** Bottom-left legend: what the colour means (weighted match or one category), zoom hint, method tooltip. */
export function Legend({ profile, zoomedIn, solo, heatSource }: LegendProps) {
  const a = ACCENTS[profile]
  const title = solo
    ? solo === 'cisza'
      ? 'Cisza w okolicy'
      : `Na mapie: ${categoryLabel(solo).toLowerCase()}`
    : 'Jak dobrze pasuje do Ciebie'
  const low = solo ? (solo === 'cisza' ? 'głośniej' : 'mniej') : 'mniej pasuje'
  const high = solo ? (solo === 'cisza' ? 'ciszej' : 'więcej') : 'lepiej pasuje'
  return (
    <div className={['smap-legend', solo ? 'is-solo' : ''].filter(Boolean).join(' ')} role="note" aria-label="Legenda mapy">
      <div className="smap-legend__title">
        <span key={title}>
          {solo && <i className="smap-legend__dot" style={{ background: CATEGORY_COLORS[solo] }} aria-hidden />}
          {title}
        </span>
        <span className="smap-legend__info">
          <button type="button" aria-label="Jak to liczymy?" aria-describedby="smap-legend-tip">
            <Info size={14} strokeWidth={2.2} aria-hidden />
          </button>
          <span id="smap-legend-tip" role="tooltip" className="smap-legend__tip">
            {solo ? (
              <>
                Kolor pokazuje wyłącznie „{categoryLabel(solo)}” — jak dana okolica wypada na tle całej Warszawy.
                {solo === 'zielen' &&
                  ' Zielone kropki to parki i lasy — włącz je w filtrach kategorii „Zieleń” (Podgląd na mapie).'}
                {solo && solo !== 'cisza' && solo !== 'zielen' &&
                  ' Kropki to konkretne miejsca w okolicy (np. szkoły, sklepy, przystanki).'}
              </>
            ) : (
              <>
                Porównujemy okolice w dziesięciu sprawach, które ustawiasz suwakami po lewej. Im ciemniejszy kolor, tym
                lepiej pasuje do Twoich priorytetów. Jasne obszary nie są złe — po prostu mniej trafiają w to, co dla
                Ciebie ważne.
              </>
            )}
            {heatSource === 'poi' && ' Obszary między osiedlami: orientacyjnie, z liczby pobliskich miejsc.'}
          </span>
        </span>
      </div>
      <div className="smap-legend__ramp" aria-hidden>
        {(['student', 'rodzina', 'senior'] as Profile[]).map((p) => (
          <span
            key={p}
            className={p === profile && !solo ? 'is-active' : undefined}
            style={{ background: ramp(ACCENTS[p]) }}
          />
        ))}
        {solo && <span className="is-active" style={{ background: ramp(categoryTones(solo)) }} />}
      </div>
      <div className="smap-legend__scale">
        <span>{low}</span>
        <span style={{ color: solo ? categoryTones(solo).deep : a.deep }}>{high}</span>
      </div>
      <p className="smap-legend__hint" key={zoomedIn ? 'in' : 'out'}>
        {zoomedIn
          ? 'Najedź na okolicę — zobaczysz liczby i krótki opis'
          : 'Przybliż mapę — pojawią się nazwy okolic i więcej szczegółów'}
      </p>
    </div>
  )
}
