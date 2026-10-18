/** Dev-only harness UI for the osiedle panel (entry: `main.tsx`). */
import { useEffect, useState } from 'react'
import { OSIEDLA, OSIEDLA_BY_SLUG, type OsiedleSlug } from '../../mock/osiedla'
import type { Horizon, ProfileId } from '../../app/types'
import { OsiedlePanel } from '../OsiedlePanel'

const params = new URLSearchParams(location.search)
/** `?bg=busy` puts a high-contrast backdrop (fake 3D buildings + glow line) behind the glass panel. */
const busy = params.get('bg') === 'busy'

export function Harness() {
  const [slug, setSlug] = useState<OsiedleSlug>((params.get('slug') as OsiedleSlug) || OSIEDLA[0].slug)
  const [profile, setProfile] = useState<ProfileId>((params.get('profil') as ProfileId) || OSIEDLA_BY_SLUG[slug].profile)
  const [horizon, setHorizon] = useState<Horizon>((params.get('horyzont') as Horizon) || 'chwila')
  const [layout, setLayout] = useState<'overlay' | 'page'>((params.get('layout') as 'overlay' | 'page') || 'overlay')
  const [open, setOpen] = useState(true)
  const [log, setLog] = useState<string[]>([])
  const push = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString('pl-PL')}  ${s}`, ...l].slice(0, 14))

  useEffect(() => {
    document.documentElement.dataset.profile = profile
  }, [profile])

  const seg = <T extends string>(value: T, options: readonly T[], set: (v: T) => void, label?: (v: T) => string) => (
    <div className="dev-seg">
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={o === value} onClick={() => set(o)}>
          {label ? label(o) : o}
        </button>
      ))}
    </div>
  )

  return (
    <div className={`dev dev--${layout}${busy ? ' dev--busy' : ''}`}>
      <div className="dev-map">
        <div className="dev-controls">
          <strong>Panel osiedla — harness</strong>
          {seg(slug, OSIEDLA.map((o) => o.slug), (s) => {
            setSlug(s)
            setOpen(true)
          }, (s) => OSIEDLA_BY_SLUG[s].name)}
          {seg(profile, ['student', 'rodzina', 'senior'] as const, setProfile)}
          {seg(horizon, ['chwila', 'stale'] as const, setHorizon)}
          {seg(layout, ['overlay', 'page'] as const, setLayout)}
          {!open && (
            <button type="button" className="dev-open" onClick={() => setOpen(true)}>
              Otwórz panel
            </button>
          )}
        </div>
        <ol className="dev-log" aria-label="Zdarzenia">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      </div>
      {open && (
        <OsiedlePanel
          key={`${slug}-${layout}`}
          osiedle={OSIEDLA_BY_SLUG[slug]}
          profile={profile}
          horizon={horizon}
          layout={layout}
          onBack={() => {
            push('onBack()')
            setOpen(false)
          }}
          onFocusPlace={(ll, p) => push(`onFocusPlace([${ll.join(', ')}]) ${p.name}`)}
          onHoverPlace={(id) => id && push(`onHoverPlace(${id})`)}
          onShowRoute={(r, m) => push(`onShowRoute(${r ? `${r.id}, ${m}` : 'null'})`)}
          onTimelineYear={(y, ev) => push(`onTimelineYear(${y}) ${ev.length} wydarzeń`)}
        />
      )}
    </div>
  )
}
