import { Pause, Play, TrendingUp } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORIES } from '../app/dictionary'
import { CATEGORY_ICONS } from '../app/icons'
import type { CategoryId, ProfileId } from '../app/types'
import type { Osiedle } from '../mock/osiedla'
import { Ring } from './Ring'
import { EASE_EMPHASIZED, SectionHead, TweenNumber, signed } from './shared'
import {
  FIRST_YEAR,
  LAST_YEAR,
  TIMELINE_YEARS,
  effectYear,
  eventsUpTo,
  isInProgress,
  matchAtYear,
  statDeltasAtYear,
  statsAtYear,
  type TimelineYear,
} from './timelineMath'

const STEP_MS = 1200

function inwestycje(n: number): string {
  if (n === 1) return 'inwestycja'
  const d = n % 10
  const t = n % 100
  return d >= 2 && d <= 4 && (t < 12 || t > 14) ? 'inwestycje' : 'inwestycji'
}

interface TimelineProps {
  osiedle: Osiedle
  profile: ProfileId
  year: TimelineYear
  onYear: (y: TimelineYear) => void
}

/** "Oś czasu 2026 → 2030" (spec §4.6): scrub or play through the years; stats and match follow live. */
export function Timeline({ osiedle, profile, year, onYear }: TimelineProps) {
  const reduce = useReducedMotion()
  const [playing, setPlaying] = useState(false)
  const yearRef = useRef(year)
  useEffect(() => {
    yearRef.current = year
  }, [year])

  // Play: one year per 1,2 s; restart from 2026 when already at the end; stop at 2030.
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      const next = yearRef.current + 1
      if (next > LAST_YEAR) {
        setPlaying(false)
        return
      }
      onYear(next as TimelineYear)
      if (next === LAST_YEAR) setPlaying(false)
    }, STEP_MS)
    return () => window.clearInterval(t)
  }, [playing, onYear])

  const togglePlay = () => {
    if (playing) return setPlaying(false)
    if (year >= LAST_YEAR) onYear(FIRST_YEAR)
    setPlaying(true)
  }

  const events = eventsUpTo(osiedle, year)
  const isBase = year === FIRST_YEAR
  const upcoming = osiedle.timeline.length - events.length
  const base = osiedle.stats
  const at = statsAtYear(osiedle, year)
  const deltas = statDeltasAtYear(osiedle, year)
  const changed = (Object.keys(deltas) as CategoryId[]).sort((a, b) => Math.abs(deltas[b]!) - Math.abs(deltas[a]!))
  const match = matchAtYear(osiedle, profile, year)
  const matchDelta = match - Math.min(99, osiedle.match[profile])
  const eventYears = new Set(osiedle.timeline.map((e) => e.year))
  const progress = (year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)

  return (
    <section className="op-sec op-tl" aria-labelledby="op-tl-title" data-section="Oś czasu 2026 → 2030">
      <SectionHead
        id="op-tl-title"
        title="Oś czasu 2026 → 2030"
        aside={
          <span className="op-tl__badge">
            <TrendingUp size={14} strokeWidth={2.3} aria-hidden />
            Prognoza
          </span>
        }
      />
      <p className="op-sec__lede">Na podstawie planów miasta (MPZP, inwestycje, budżet obywatelski). To szacunek, nie gwarancja.</p>

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
                {year}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="op-tl__match">
            <Ring value={match} size={64} duration={900} changeDuration={400} label={`Dopasowanie w ${year}: ${match}%`} />
            <p>
              dopasowanie
              <br />w {year}
              {matchDelta !== 0 && <span className={`op-chip op-chip--delta ${matchDelta > 0 ? 'is-up' : 'is-down'}`}>{signed(matchDelta)}</span>}
            </p>
          </div>
        </div>
        <p className="op-tl__count" aria-live="polite">
          {isBase
            ? events.length === 0
              ? 'Stan na dziś'
              : `Stan na dziś · ${events.length} ${inwestycje(events.length)} w toku`
            : events.length === 0
              ? 'Jeszcze bez inwestycji'
              : `${events.length} ${inwestycje(events.length)} do ${year} r.`}
        </p>

        <div className="op-tl__control">
          <button type="button" className="op-tl__play" onClick={togglePlay} aria-label={playing ? 'Zatrzymaj' : 'Odtwórz'} aria-pressed={playing}>
            {playing ? <Pause size={16} strokeWidth={0} fill="currentColor" aria-hidden /> : <Play size={16} strokeWidth={0} fill="currentColor" aria-hidden />}
          </button>
          <div className="op-tl__slider" style={{ '--p': progress } as CSSProperties}>
            <div className="op-tl__rail" aria-hidden>
              <span className="op-tl__rail-fill" />
              {TIMELINE_YEARS.map((y, i) => (
                <span
                  key={y}
                  className={`op-tl__stop${eventYears.has(y) ? ' has-event' : ''}${y <= year ? ' is-past' : ''}`}
                  style={{ '--i': i / (TIMELINE_YEARS.length - 1) } as CSSProperties}
                />
              ))}
            </div>
            <input
              type="range"
              min={FIRST_YEAR}
              max={LAST_YEAR}
              step={1}
              value={year}
              aria-label="Rok prognozy"
              aria-valuetext={`${year}, ${events.length} ${inwestycje(events.length)}`}
              onChange={(e) => {
                setPlaying(false)
                onYear(Number(e.target.value) as TimelineYear)
              }}
            />
            <div className="op-tl__ticks">
              {TIMELINE_YEARS.map((y, i) => (
                <button
                  key={y}
                  type="button"
                  tabIndex={-1}
                  className={y === year ? 'is-on' : undefined}
                  style={{ '--i': i / (TIMELINE_YEARS.length - 1) } as CSSProperties}
                  onClick={() => {
                    setPlaying(false)
                    onYear(y)
                  }}
                >
                  {y}
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
            ? 'Rok 2026 to stan obecny — inwestycje w toku zaczną działać od 2027 r. Przesuń suwak, żeby zobaczyć kolejne lata.'
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
      <ol className="op-tl__events">
        <AnimatePresence initial={false}>
          {events.map((e) => {
            const Icon = CATEGORY_ICONS[e.category]
            const fresh = e.year === year
            const pending = isInProgress(e, year)
            return (
              <motion.li
                key={e.id}
                layout={!reduce}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.18 } }}
                transition={{ duration: 0.4, ease: EASE_EMPHASIZED }}
                className={`op-ev${fresh ? ' is-fresh' : ''}`}
              >
                <span className="op-ev__dot" aria-hidden />
                <div className="op-ev__card">
                  <div className="op-ev__meta">
                    <span className="op-ev__year">{e.year}</span>
                    {pending ? (
                      <span className="op-ev__status is-build">w toku</span>
                    ) : (
                      <span className={`op-ev__status is-${e.status === 'w budowie' ? 'build' : e.status === 'zakończona' ? 'done' : 'plan'}`}>{e.status}</span>
                    )}
                  </div>
                  <h4 className="op-ev__title">{e.title}</h4>
                  <p className="op-ev__desc">{e.description}</p>
                  <div className="op-ev__foot">
                    <span className="op-ev__cat">
                      <Icon size={14} strokeWidth={2.1} aria-hidden />
                      {CATEGORIES[e.category].label}
                    </span>
                    {(Object.entries(e.statDeltas) as [CategoryId, number][]).map(([c, d]) => (
                      <span key={c} className={`op-chip op-chip--delta ${pending ? 'is-pending' : d > 0 ? 'is-up' : 'is-down'}`}>
                        {CATEGORIES[c].label.split(' ')[0]} {signed(d)}
                      </span>
                    ))}
                    {pending && <span className="op-ev__from">efekt od {effectYear(e)} r.</span>}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ol>
      {upcoming > 0 && (
        <p className="op-tl__more">
          {upcoming === 1 ? 'Jeszcze 1 inwestycja' : `Jeszcze ${upcoming} ${inwestycje(upcoming)}`} do {LAST_YEAR} r. Przesuń suwak dalej.
        </p>
      )}
    </section>
  )
}

/** Collapsed teaser for horizon `chwila` (spec §4.5 pkt 9). */
export function TimelineTeaser({ name, onExpand }: { name: string; onExpand: () => void }) {
  return (
    <section className="op-sec" aria-labelledby="op-tl-teaser" data-section="Oś czasu 2026 → 2030">
      <div className="op-teaser">
        <span className="op-teaser__icon" aria-hidden>
          <TrendingUp size={20} strokeWidth={2.2} />
        </span>
        <div>
          <h2 id="op-tl-teaser" className="op-teaser__title">
            Planujesz zostać na dłużej?
          </h2>
          <p className="op-teaser__text">Zobacz, jak {name} zmieni się do 2030 roku.</p>
          <button type="button" className="op-teaser__btn" onClick={onExpand}>
            Pokaż prognozę
          </button>
        </div>
      </div>
    </section>
  )
}
