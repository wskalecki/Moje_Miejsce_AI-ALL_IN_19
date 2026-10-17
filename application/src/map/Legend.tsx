import { ACCENTS } from './tokens'
import type { Profile } from './types'

interface LegendProps {
  profile: Profile
  zoomedIn: boolean
}

/** Bottom-left legend: profile gradient + zoom-dependent hint (spec 4.3). */
export function Legend({ profile, zoomedIn }: LegendProps) {
  const a = ACCENTS[profile]
  return (
    <div className="smap-legend" role="note" aria-label="Legenda mapy">
      <div className="smap-legend__ramp" aria-hidden>
        {(['student', 'rodzina', 'senior'] as Profile[]).map((p) => (
          <span
            key={p}
            className={p === profile ? 'is-active' : undefined}
            style={{
              background: `linear-gradient(90deg, ${ACCENTS[p].soft}00 0%, ${ACCENTS[p].soft} 14%, ${ACCENTS[p].mid} 48%, ${ACCENTS[p].base} 76%, ${ACCENTS[p].deep} 100%)`,
            }}
          />
        ))}
      </div>
      <div className="smap-legend__scale">
        <span>niższe</span>
        <span style={{ color: a.deep }}>wyższe dopasowanie</span>
      </div>
      <p className="smap-legend__hint" key={zoomedIn ? 'in' : 'out'}>
        {zoomedIn ? 'Najedź na osiedle, żeby zobaczyć szczegóły' : 'Przybliż, żeby zobaczyć osiedla'}
      </p>
    </div>
  )
}
