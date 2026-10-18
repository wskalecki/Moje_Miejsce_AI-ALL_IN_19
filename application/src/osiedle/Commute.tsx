import type { Commute as CommuteRow, TravelMode } from '../mock/osiedla'
import { MODE_META, MODE_ORDER } from './shared'
import { CollapsibleSection } from './ui'

/** "Dojazd" (spec §4.5 pkt 6): destinations × modes, fastest mode per row in bold. Folded by default. */
export function Commute({ rows }: { rows: CommuteRow[] }) {
  const modes: TravelMode[] = MODE_ORDER.filter((m) => rows.some((r) => r.minutes[m] != null))
  return (
    <CollapsibleSection id="op-commute-title" title="Dojazd" section="Dojazd" defaultOpen={false}>
      <p className="op-sec__lede">W szczycie, w minutach</p>
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
    </CollapsibleSection>
  )
}
