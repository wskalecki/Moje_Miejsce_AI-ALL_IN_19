import { ExternalLink, Pause, Play, TrendingUp } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../app/dictionary'
import { CATEGORY_ICONS } from '../app/icons'
import type { CategoryId, ProfileId } from '../app/types'
import type { Osiedle, TimelineEvent } from '../mock/osiedla'
import { Ring } from './Ring'
import { EASE_EMPHASIZED, signed } from './shared'
import { SectionHead, TweenNumber } from './ui'
import {
  FIRST_YEAR,
  LAST_YEAR,
  TIMELINE_STOPS,
  effectYear,
  eventsAtStop,
  eventsUpTo,
  groupByStop,
  isInProgress,
  matchAtYear,
  statDeltasAtYear,
  statsAtYear,
  stopIndex,
  stopLabel,
  stopRangeLabel,
  toStop,
  undatedEvents,
  yearLabel,
  type TimelineYear,
} from './timelineMath'

const STEP_MS = 1400
const LAST_INDEX = TIMELINE_STOPS.length - 1
const TITLE = `Oś czasu: dziś → ${LAST_YEAR}`

function inwestycje(n: number): string {
  if (n === 1) return 'inwestycja'
  const d = n % 10
  const t = n % 100
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? 'inwestycje' : 'inwestycji'
}

interface TimelineProps {
  osiedle: Osiedle
  profile: ProfileId
  /** Current stop (any year snaps to the stop it belongs to). */
  year: TimelineYear
  onYear: (y: TimelineYear) => void
  /** Today's match (the map pill); the forecast adds the investments' effect to it. */
  baseMatch?: number
}

/**
 * "Oś czasu" (spec §4.6): scrub or play through round 5-year stops (Dziś → 2030 → … → 2045);
 * stats and match follow live. Undated plans are listed apart and never counted.
 */
export function Timeline({ osiedle, profile, year: rawYear, onYear, baseMatch }: TimelineProps) {
  const reduce = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const year = toStop(rawYear)
  const index = stopIndex(year)
  const indexRef = useRef(index)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  // Play: one stop per 1,4 s; restart from "Dziś" when already at the end; stop at the last stop.
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      const next = indexRef.current + 1
      if (next > LAST_INDEX) {
        setPlaying(false)
        return
      }
      onYear(TIMELINE_STOPS[next])
      if (next === LAST_INDEX) setPlaying(false)
    }, STEP_MS)
    return () => window.clearInterval(t)
  }, [playing, onYear])

  const togglePlay = () => {
    if (playing) return setPlaying(false)
    if (index >= LAST_INDEX) onYear(FIRST_YEAR)
    setPlaying(true)
  }
  const pick = (y: TimelineYear) => {
    setPlaying(false)
    onYear(y)
  }

  const events = eventsUpTo(osiedle, year)
  const groups = groupByStop(osiedle, year)
  const undated = undatedEvents(osiedle)
  const isBase = year === FIRST_YEAR
  const upcoming = osiedle.timeline.length - undated.length - events.length
  const base = osiedle.stats
  const at = statsAtYear(osiedle, year)
  const deltas = statDeltasAtYear(osiedle, year)
  const changed = (Object.keys(deltas) as CategoryId[]).sort((a, b) => Math.abs(deltas[b]!) - Math.abs(deltas[a]!))
  const today = baseMatch ?? osiedle.match[profile]
  const match = matchAtYear(osiedle, profile, year, today)
  const matchDelta = match - Math.min(99, today)
  const progress = index / LAST_INDEX
  const when = isBase ? 'dziś' : `w ${year}`
  const countText = isBase
    ? events.length === 0
      ? 'Stan na dziś'
      : `Stan na dziś · ${events.length} ${inwestycje(events.length)} w toku`
    : events.length === 0
      ? `Do ${year} r. bez znanych inwestycji`
      : `${events.length} ${inwestycje(events.length)} do ${year} r.`

  return (
    <section className="op-sec op-tl" aria-labelledby="op-tl-title" data-section={TITLE}>
      <SectionHead
        id="op-tl-title"
        title={TITLE}
        aside={
          <span className="op-tl__badge">
            <TrendingUp size={14} strokeWidth={2.3} aria-hidden />
            Prognoza
          </span>
        }
      />
      <p className="op-sec__lede">Szacunek z planów miasta (MPZP, inwestycje, budżet obywatelski), co 5 lat.</p>

      <div className="op-tl__stage">
        <div className="op-tl__top">
          <div className="op-tl__year" aria-hidden>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={year}
                initial={reduce ? { opacity: 0 } : { y: '45%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { y: '-45%', opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE_EMPHASIZED }}
              >
                {stopLabel(year)}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="op-tl__match">
            <Ring value={match} size={44} duration={900} changeDuration={400} label={`Dopasowanie ${when}: ${match}%`} />
            <p>
              dopasowanie
              <br />
              {when}
              {matchDelta !== 0 && <span className={`op-chip op-chip--delta ${matchDelta > 0 ? 'is-up' : 'is-down'}`}>{signed(matchDelta)}</span>}
            </p>
          </div>
        </div>
        <p className="op-tl__count" aria-live="polite">
          {countText}
        </p>

        <div className="op-tl__control">
          <button type="button" className="op-tl__play" onClick={togglePlay} aria-label={playing ? 'Zatrzymaj' : 'Odtwórz'} aria-pressed={playing}>
            {playing ? <Pause size={16} strokeWidth={0} fill="currentColor" aria-hidden /> : <Play size={16} strokeWidth={0} fill="currentColor" aria-hidden />}
          </button>
          <div className="op-tl__slider" style={{ '--p': progress } as CSSProperties}>
            <div className="op-tl__rail" aria-hidden>
              <span className="op-tl__rail-fill" />
              {TIMELINE_STOPS.map((y, i) => (
                <span
                  key={y}
                  className={`op-tl__stop${eventsAtStop(osiedle, y).length > 0 ? ' has-event' : ''}${y <= year ? ' is-past' : ''}`}
                  style={{ '--i': i / LAST_INDEX } as CSSProperties}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={LAST_INDEX}
              step={1}
              value={index}
              aria-label="Rok prognozy"
              aria-valuetext={`${isBase ? 'Dziś' : `${year} r.`}, ${events.length} ${inwestycje(events.length)}`}
              onChange={(e) => pick(TIMELINE_STOPS[Number(e.target.value)])}
            />
            <div className="op-tl__ticks">
              {TIMELINE_STOPS.map((y, i) => (
                <button
                  key={y}
                  type="button"
                  tabIndex={-1}
                  className={y === year ? 'is-on' : undefined}
                  style={{ '--i': i / LAST_INDEX } as CSSProperties}
                  onClick={() => pick(y)}
                >
                  {stopLabel(y)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h3 className="op-tl__sub">{isBase ? 'Punkt wyjścia: dziś' : `Co się zmieni do ${year} r.`}</h3>
      {changed.length === 0 ? (
        <p className="op-tl__empty">
          {isBase
            ? events.length > 0
              ? 'Inwestycje w toku zadziałają od 2027 r. Przesuń suwak.'
              : 'Przesuń suwak, żeby zobaczyć prognozę.'
            : year === LAST_YEAR
              ? `Znane inwestycje nie zmieniają ocen kategorii do ${year} r.`
              : 'Bez zmian względem dziś. Przesuń suwak, żeby zobaczyć kolejne lata.'}
        </p>
      ) : (
        <ul className="op-tl__changes">
          <AnimatePresence initial={false}>
            {changed.map((c) => {
              const Icon = CATEGORY_ICONS[c]
              const d = deltas[c]!
              const lo = Math.min(base[c], at[c])
              return (
                <motion.li
                  key={c}
                  layout={!reduce}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE_EMPHASIZED }}
                  className="op-tl__change"
                >
                  <Icon size={16} strokeWidth={2} aria-hidden className="op-tl__change-icon" />
                  <span className="op-tl__change-label">{CATEGORIES[c].label}</span>
                  <span className="op-tl__change-bar" aria-hidden>
                    <span className="op-tl__change-base" style={{ transform: `scaleX(${lo / 100})` }} />
                    <span
                      className={`op-tl__change-delta ${d > 0 ? 'is-up' : 'is-down'}`}
                      style={{ left: `${lo}%`, width: `${Math.abs(d)}%` }}
                    />
                  </span>
                  <span className="op-tl__change-nums">
                    <span className="op-tl__change-from">{base[c]}</span>
                    <span aria-hidden> → </span>
                    <TweenNumber value={at[c]} from={base[c]} duration={400} className="op-tl__change-to" />
                  </span>
                  <span className={`op-chip op-chip--delta ${d > 0 ? 'is-up' : 'is-down'}`}>{signed(d)}</span>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
      )}

      <h3 className="op-tl__sub">Inwestycje</h3>
      {groups.length === 0 && (
        <p className="op-tl__empty">
          {upcoming > 0
            ? `Na dziś nic się tu nie buduje. ${upcoming === 1 ? 'Jedna inwestycja' : `${upcoming} ${inwestycje(upcoming)}`} do ${LAST_YEAR} r. — przesuń suwak.`
            : 'Brak znanych inwestycji z terminem.'}
        </p>
      )}
      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <motion.div
            key={g.stop}
            className="op-tl__group"
            layout={!reduce}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.3, ease: EASE_EMPHASIZED }}
          >
            <p className={`op-tl__group-label${g.stop === year ? ' is-on' : ''}`}>{stopRangeLabel(g.stop)}</p>
            <ol className="op-tl__events">
              <AnimatePresence initial={false}>
                {g.events.map((e) => (
                  <EventCard key={e.id} event={e} year={year} fresh={g.stop === year} reduce={!!reduce} />
                ))}
              </AnimatePresence>
            </ol>
          </motion.div>
        ))}
      </AnimatePresence>
      {upcoming > 0 && groups.length > 0 && (
        <p className="op-tl__more">
          {upcoming === 1 ? 'Jeszcze 1 inwestycja' : `Jeszcze ${upcoming} ${inwestycje(upcoming)}`} do {LAST_YEAR} r. Przesuń suwak dalej.
        </p>
      )}

      {undated.length > 0 && (
        <div className="op-tl__group is-undated">
          <p className="op-tl__group-label">Bez terminu</p>
          <p className="op-tl__note">Miasto nie podało daty, więc nie wliczamy ich do prognozy.</p>
          <ol className="op-tl__events">
            {undated.map((e) => (
              <EventCard key={e.id} event={e} year={year} fresh={false} reduce={!!reduce} undated />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function EventCard({ event: e, year, fresh, reduce, undated }: { event: TimelineEvent; year: number; fresh: boolean; reduce: boolean; undated?: boolean }) {
  const Icon = CATEGORY_ICONS[e.category]
  const pending = !undated && isInProgress(e, year)
  const muted = pending || undated
  const done = e.status === 'zakończona' || e.status === 'zrealizowana'
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } }}
      transition={{ duration: 0.4, ease: EASE_EMPHASIZED }}
      className={`op-ev${fresh ? ' is-fresh' : ''}${undated ? ' is-undated' : ''}`}
    >
      <span className="op-ev__dot" aria-hidden />
      <div className="op-ev__card">
        <div className="op-ev__meta">
          <span className="op-ev__year" title={e.yearNote}>
            {yearLabel(e)}
          </span>
          {pending && !done ? (
            <span className="op-ev__status is-build">w toku</span>
          ) : (
            <span className={`op-ev__status is-${done ? 'done' : e.status === 'w budowie' ? 'build' : 'plan'}`}>{e.status}</span>
          )}
        </div>
        <h4 className="op-ev__title">
          {/* with a cited source the title is a link; its ::after stretches over the whole card */}
          {e.sourceUrl ? (
            <a className="op-ev__link" href={e.sourceUrl} target="_blank" rel="noopener noreferrer" title={e.sourceTitle}>
              {e.title}
              <ExternalLink size={13} strokeWidth={2.2} aria-hidden className="op-ev__ext" />
              <span className="op-ev__hint">{`. Źródło${e.sourceTitle ? `: ${e.sourceTitle}` : ''} (nowa karta)`}</span>
            </a>
          ) : (
            e.title
          )}
        </h4>
        <p className="op-ev__desc">{e.description}</p>
        <div className="op-ev__foot">
          <span className="op-ev__cat">
            <Icon size={14} strokeWidth={2.1} aria-hidden />
            {CATEGORIES[e.category].label}
          </span>
          {(Object.entries(e.statDeltas) as [CategoryId, number][]).map(([c, d]) => (
            <span key={c} className={`op-chip op-chip--delta ${muted ? 'is-pending' : d > 0 ? 'is-up' : 'is-down'}`}>
              {CATEGORIES[c].label.split(' ')[0]} {signed(d)}
            </span>
          ))}
          {pending && <span className="op-ev__from">efekt od {effectYear(e)} r.</span>}
        </div>
      </div>
    </motion.li>
  )
}
