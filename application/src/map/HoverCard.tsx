import { ArrowRight, Sparkles } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState, type CSSProperties } from 'react'
import { MatchRing } from '../components/ui/MatchRing'
import type { Fact } from './metrics'
import { CATEGORY_COLORS, categoryLabel } from './tokens'
import type { CategoryKey, FeaturedInfo, OsiedleInfo, Profile } from './types'

export interface HoverCardData {
  info: OsiedleInfo
  /** Weighted match for the current weights (0–100). */
  match: number
  /** Rank among all osiedla for the current weights (1 = best). */
  rank: number
  total: number
  cats: CategoryKey[]
  solo: CategoryKey | null
  facts: Fact[]
  factsFrom: 'metrics' | 'poi' | null
}

interface HoverCardProps {
  data: HoverCardData | null
  featured: FeaturedInfo | null
  profile: Profile
}

const SHOW_DELAY = 80
const HIDE_DELAY = 100

/**
 * Floating osiedle card. Content changes only when the hovered osiedle (or the weights) change;
 * position is written by HoverController through the forwarded ref.
 */
export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(function HoverCard({ data, featured, profile }, ref) {
  // keep the last osiedle while the card fades out (derived during render, no effect needed)
  const [shown, setShown] = useState<HoverCardData | null>(data)
  if (data && data !== shown) setShown(data)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)

  const show = !!data
  useEffect(() => {
    const t = window.setTimeout(
      () => {
        visibleRef.current = show
        setVisible(show)
      },
      show ? (visibleRef.current ? 0 : SHOW_DELAY) : HIDE_DELAY,
    )
    return () => window.clearTimeout(t)
  }, [show])

  const d = shown
  const o = d?.info
  const isFeatured = !!(o && featured && o.featuredSlug === featured.slug)
  const blurb = o ? (isFeatured && featured!.tagline ? featured!.tagline : o.blurb[profile]) : ''

  return (
    <div ref={ref} className={`smap-card${visible && d ? ' is-visible' : ''}`} aria-hidden={!visible}>
      {d && o && (
        <div className="smap-card__inner">
          <div className="smap-card__head">
            {isFeatured && (
              <img
                className="smap-card__thumb"
                src={featured!.thumb}
                alt=""
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget
                  if (featured!.thumbFallback && !img.src.endsWith(featured!.thumbFallback)) img.src = featured!.thumbFallback
                  else img.style.display = 'none'
                }}
              />
            )}
            <div className="smap-card__title">
              <h3>{o.name}</h3>
              <p>{o.district}</p>
              <p className="smap-card__rank tabular">
                {d.rank}. miejsce na liście {d.total} okolic Warszawy
              </p>
            </div>
            <MatchRing key={o.id} value={d.match} size={44} duration={520} />
          </div>
          {d.facts.length > 0 && (
            <div className="smap-card__facts">
              <ul>
                {d.facts.map((f) => (
                  <li key={f.cat + f.text} className="tabular">
                    <i style={{ background: CATEGORY_COLORS[f.cat] }} aria-hidden />
                    {f.text}
                  </li>
                ))}
              </ul>
              <small>
                {d.factsFrom === 'metrics' ? 'W promieniu ok. 1 km od środka okolicy' : 'W promieniu ok. 1 km — miejsca z mapy'} · dane miejskie i OpenStreetMap
                {d.facts.some((f) => f.cat === 'cisza') ? ', GIOŚ' : ''}
              </small>
            </div>
          )}
          <ul className="smap-card__bars">
            {d.cats.map((c) => (
              <li key={c} className={c === d.solo ? 'is-solo' : undefined} style={{ '--cat': CATEGORY_COLORS[c] } as CSSProperties}>
                <span className="smap-card__bar-label">{categoryLabel(c)}</span>
                <span className="smap-card__bar">
                  <i style={{ transform: `scaleX(${Math.max(0.02, o.cats[c] / 100)})` }} />
                </span>
                <span className="smap-card__bar-value tabular">{o.cats[c]}</span>
              </li>
            ))}
          </ul>
          {blurb && (
            <p className="smap-card__ai">
              <Sparkles size={14} strokeWidth={2} aria-hidden />
              <span>{blurb}</span>
            </p>
          )}
          {isFeatured && (
            <p className="smap-card__cta">
              Kliknij, by poznać tę okolicę bliżej <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
            </p>
          )}
        </div>
      )}
    </div>
  )
})
