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
  const title = solo ? (solo === 'cisza' ? 'Cisza (mniej hałasu)' : `Dostępność: ${categoryLabel(solo).toLowerCase()}`) : 'Dopasowanie do Twoich wag'
  const low = solo ? (solo === 'cisza' ? 'głośniej' : 'mniej') : 'niższe'
  const high = solo ? (solo === 'cisza' ? 'ciszej' : 'więcej') : 'wyższe'
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
                Kolor pokazuje tylko kategorię „{categoryLabel(solo)}”: ocenę 0–100 każdego osiedla na tle całej Warszawy.
                {solo !== 'cisza' && ' Punkty to konkretne obiekty z danych (OpenStreetMap, dane m.st. Warszawy).'}
              </>
            ) : (
              <>
                Każde osiedle ma ocenę 0–100 w 10 kategoriach (na tle wszystkich osiedli Warszawy, z danych OSM i m.st.
                Warszawy). Kolor to średnia tych ocen ważona Twoimi suwakami — im ciemniej, tym lepiej pasuje. Jasne
                miejsca nie są „złe”, tylko słabsze od typowych dla Twoich wag.
              </>
            )}
            {heatSource === 'poi' && ' Siatka między osiedlami: tymczasowo z gęstości punktów POI.'}
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
        {zoomedIn ? 'Najedź na osiedle, żeby zobaczyć szczegóły' : 'Przybliż, żeby zobaczyć osiedla'}
      </p>
    </div>
  )
}
