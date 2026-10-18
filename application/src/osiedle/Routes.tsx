import { MapPinPlus, X } from 'lucide-react'
import { useMemo } from 'react'
import { CATEGORY_ICONS } from '../app/icons'
import type { Route, TravelMode } from '../mock/osiedla'
import { formatKm, formatMin } from '../lib/format'
import { MODE_META, availableModes, defaultMode } from './shared'
import { CollapsibleSection } from './ui'

/** Own start point: none, waiting for the map click, routing, done or failed. */
export type StartStatus = 'none' | 'picking' | 'loading' | 'ok' | 'error'

interface RoutesProps {
  routes: Route[]
  selectedId: string
  mode: TravelMode
  onSelect: (route: Route) => void
  onMode: (mode: TravelMode) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The selected destination re-routed from the user's start point (status `ok`). */
  fromStart?: Route | null
  startStatus?: StartStatus
  /** Pin button: pick a start point on the map (again while picking = cancel). Absent = no map, no button. */
  onPickStart?: () => void
  onClearStart?: () => void
}

const START_LABEL: Record<StartStatus, string> = {
  none: 'Własny punkt startu',
  picking: 'Kliknij punkt na mapie…',
  loading: 'Liczę trasę z wybranego punktu…',
  ok: 'Start: wybrany punkt',
  error: 'Wybierz inny punkt startu',
}

const START_NOTE: Partial<Record<StartStatus, string>> = {
  picking: 'Esc albo ponowne kliknięcie pinezki anuluje.',
  ok: 'Czas pieszo i rowerem z OSRM (OpenStreetMap). Komunikacji nie liczymy z dowolnego punktu.',
  error: 'Nie udało się policzyć trasy z tego punktu. Pokazujemy czasy z osiedla.',
}

const groupKey = (r: Route) => r.group ?? r.id

/**
 * "Najkrótsza droga do…" (spec §4.5 pkt 5), folded by default. With a map, a pin button lets the
 * user set their own start: the destination is then re-routed live (walk + bike, see `osrm.ts`).
 */
export function Routes({
  routes,
  selectedId,
  mode,
  onSelect,
  onMode,
  open,
  onOpenChange,
  fromStart,
  startStatus = 'none',
  onPickStart,
  onClearStart,
}: RoutesProps) {
  const picked = routes.find((r) => r.id === selectedId) ?? routes[0]
  // numbers (and modes) of the own start once routed; the osiedle's otherwise
  const route = startStatus === 'ok' && fromStart ? fromStart : picked
  // One pill per group (e.g. "Uczelnia"); a group with several destinations gets a second row to choose from.
  const groups = useMemo(() => {
    const out: { key: string; first: Route }[] = []
    for (const r of routes) if (!out.some((g) => g.key === groupKey(r))) out.push({ key: groupKey(r), first: r })
    return out
  }, [routes])
  if (!route || !picked) return null
  const alternatives = routes.filter((r) => groupKey(r) === groupKey(route))
  const modes = availableModes(route)
  const activeMode = modes.includes(mode) ? mode : defaultMode(route)
  const minutes = route.minutes[activeMode]

  return (
    <CollapsibleSection id="op-routes-title" title="Droga do…" section="Droga do…" open={open} onOpenChange={onOpenChange}>
      <div className="op-pills" role="radiogroup" aria-label="Rodzaj celu">
        {groups.map((g) => {
          const Icon = CATEGORY_ICONS[g.first.category]
          const on = g.key === groupKey(route)
          return (
            <button key={g.key} type="button" role="radio" aria-checked={on} className={`op-pill${on ? ' is-on' : ''}`} onClick={() => onSelect(on ? picked : g.first)}>
              <Icon size={15} strokeWidth={2.1} aria-hidden />
              {g.first.label}
            </button>
          )
        })}
      </div>
      {alternatives.length > 1 && (
        <div className="op-pills op-pills--dest" role="radiogroup" aria-label="Cel">
          {alternatives.map((r) => {
            const on = r.id === picked.id
            return (
              <button key={r.id} type="button" role="radio" aria-checked={on} className={`op-pill op-pill--dest${on ? ' is-on' : ''}`} onClick={() => onSelect(r)}>
                {r.destinationName}
              </button>
            )
          })}
        </div>
      )}

      {onPickStart && (
        <div className={`op-start is-${startStatus}`}>
          <div className="op-start__row">
            <button
              type="button"
              className="op-start__pick"
              aria-pressed={startStatus === 'picking'}
              onClick={onPickStart}
              title="Wskaż punkt startu na mapie"
            >
              <MapPinPlus size={16} strokeWidth={2.1} aria-hidden />
              <span>{START_LABEL[startStatus]}</span>
            </button>
            {startStatus !== 'none' && startStatus !== 'picking' && (
              <button type="button" className="op-start__clear" onClick={onClearStart} aria-label="Wróć do startu z osiedla" title="Wróć do startu z osiedla">
                <X size={15} strokeWidth={2.3} aria-hidden />
              </button>
            )}
          </div>
          <p className="op-start__note" aria-live="polite">
            {START_NOTE[startStatus] ?? ''}
          </p>
        </div>
      )}

      <div className={`op-route${startStatus === 'loading' ? ' is-busy' : ''}`} aria-busy={startStatus === 'loading'}>
        <div className="op-modes" role="tablist" aria-label="Sposób dojazdu">
          {modes.map((m) => {
            const { icon: Icon, label } = MODE_META[m]
            const on = m === activeMode
            return (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={on}
                className={`op-mode${on ? ' is-on' : ''}`}
                onClick={() => onMode(m)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
                  e.preventDefault()
                  const i = modes.indexOf(m)
                  const next = modes[(i + (e.key === 'ArrowRight' ? 1 : modes.length - 1)) % modes.length]
                  onMode(next)
                  const parent = e.currentTarget.parentElement
                  requestAnimationFrame(() => (parent?.querySelector('[aria-selected="true"]') as HTMLElement | null)?.focus())
                }}
                tabIndex={on ? 0 : -1}
              >
                <Icon size={16} strokeWidth={2.1} aria-hidden />
                <span className="op-mode__label">{label}</span>
                <span className="op-mode__min">{formatMin(route.minutes[m] ?? 0)}</span>
              </button>
            )
          })}
        </div>
        <p className="op-route__summary" aria-live="polite">
          <strong>{route.destinationName}</strong>
          <span>
            {route !== picked && 'z wybranego punktu · '}
            {formatKm(route.distanceM)}
            {minutes != null && ` · ${formatMin(minutes)} ${MODE_META[activeMode].adverb}`}
          </span>
        </p>
      </div>
    </CollapsibleSection>
  )
}
