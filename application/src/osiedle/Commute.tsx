import type { Commute as CommuteRow, TravelMode } from '../mock/osiedla'
import { MODE_META, MODE_ORDER, SectionHead } from './shared'

/** "Dojazd" (spec §4.5 pkt 6): destinations × modes, fastest mode per row in bold. */
export function Commute({ rows }: { rows: CommuteRow[] }) {
  const modes: TravelMode[] = MODE_ORDER.filter((m) => rows.some((r) => r.minutes[m] != null))
  return (
    <section className="op-sec" aria-labelledby="op-commute-title" data-section="Dojazd">
      <SectionHead id="op-commute-title" title="Dojazd" aside={<span className="op-sec__aside">w szczycie, w minutach</span>} />
      <table className="op-commute">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Cel</span>
            </th>
            {modes.map((m) => {
              const { icon: Icon, label } = MODE_META[m]
              return (
                <th key={m} scope="col" title={label}>
                  <Icon size={16} strokeWidth={2} aria-hidden />
                  <span className="sr-only">{label}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const fastest = Math.min(...modes.map((m) => r.minutes[m] ?? Infinity))
            return (
              <tr key={r.id}>
                <th scope="row">{r.label}</th>
                {modes.map((m) => {
                  const v = r.minutes[m]
                  const best = v != null && v === fastest
                  return (
                    <td key={m} className={best ? 'is-best' : undefined}>
                      {v == null ? (
                        <span className="op-commute__none" aria-label="brak danych">
                          –
                        </span>
                      ) : (
                        <>
                          {v}
                          {best && <span className="sr-only"> min, najszybciej</span>}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
