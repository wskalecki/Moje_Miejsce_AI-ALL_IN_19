import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { Horizon } from '../app/types'
import type { Osiedle } from '../mock/osiedla'
import { formatNumber, formatPLN } from '../lib/format'
import { SectionHead, TweenNumber, signed } from './shared'

type PriceMode = 'najem' | 'kupno'

/** "Ceny" (spec §4.5 pkt 8). The toggle defaults from the horizon but never changes it. */
export function Prices({ osiedle, horizon }: { osiedle: Osiedle; horizon: Horizon }) {
  // A manual pick holds until the horizon changes; then the horizon's default wins again.
  const [pick, setPick] = useState<{ horizon: Horizon; mode: PriceMode } | null>(null)
  const mode: PriceMode = pick?.horizon === horizon ? pick.mode : horizon === 'stale' ? 'kupno' : 'najem'
  const setMode = (m: PriceMode) => setPick({ horizon, mode: m })

  const p = osiedle.prices
  const rent = mode === 'najem'
  const value = rent ? p.rentPerM2 : p.buyPerM2
  const city = rent ? p.cityRentPerM2 : p.cityBuyPerM2
  const diff = Math.round(((value - city) / city) * 100)
  const max = Math.max(value, city)

  return (
    <section className="op-sec" aria-labelledby="op-prices-title" data-section="Ceny">
      <SectionHead
        id="op-prices-title"
        title="Ceny"
        aside={
          <div className="op-seg" role="radiogroup" aria-label="Rodzaj ceny">
            {(['najem', 'kupno'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? 'is-on' : undefined} onClick={() => setMode(m)}>
                {m === 'najem' ? 'Najem' : 'Kupno'}
              </button>
            ))}
            <span className="op-seg__thumb" style={{ transform: `translateX(${rent ? 0 : 100}%)` }} aria-hidden />
          </div>
        }
      />

      <div className="op-price">
        <p className="op-price__value">
          <TweenNumber key={mode} value={value} from={value * 0.92} duration={500} firstDuration={500} format={formatNumber} />
          <span className="op-price__unit">{rent ? 'zł/m² mies.' : 'zł/m²'}</span>
        </p>
        <p className="op-price__sub">
          {rent
            ? `ok. ${formatPLN(p.rentPerM2 * 45)} miesięcznie za 45 m²`
            : `ok. ${formatNumber((p.buyPerM2 * 55) / 1000)} tys. zł za 55 m²`}
          <span className="op-chip op-chip--neutral">{`${signed(diff)}% vs Warszawa`}</span>
        </p>

        <dl className="op-compare" aria-label="Porównanie ze średnią Warszawy">
          <div>
            <dt>{osiedle.name}</dt>
            <dd>
              <span className="op-compare__bar is-here" style={{ transform: `scaleX(${value / max})` }} />
              <span className="op-compare__num">{formatNumber(value)}</span>
            </dd>
          </div>
          <div>
            <dt>Warszawa</dt>
            <dd>
              <span className="op-compare__bar" style={{ transform: `scaleX(${city / max})` }} />
              <span className="op-compare__num">{formatNumber(city)}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="op-portals">
        {osiedle.portals.map((portal) => (
          <a key={portal.name} className="op-portal" href={rent ? portal.rentUrl : portal.buyUrl} target="_blank" rel="noopener noreferrer">
            Zobacz oferty na {portal.name}
            <ExternalLink size={15} strokeWidth={2.2} aria-hidden />
            <span className="sr-only"> (otwiera się w nowej karcie)</span>
          </a>
        ))}
      </div>
      <p className="op-note">Szacunek demonstracyjny na podstawie ofert z portali i RCN (dzielnica).</p>
      {p.sourceNote && (
        <details className="op-details">
          <summary>Skąd te liczby</summary>
          <p>{p.sourceNote}</p>
        </details>
      )}
    </section>
  )
}
