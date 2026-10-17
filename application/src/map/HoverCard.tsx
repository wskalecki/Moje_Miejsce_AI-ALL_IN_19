import { ArrowRight, Sparkles } from 'lucide-react'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { MatchRing } from '../components/ui/MatchRing'
import { categoryLabel, hoverCategories } from './tokens'
import type { FeaturedInfo, OsiedleInfo, Profile } from './types'

interface HoverCardProps {
  info: OsiedleInfo | null
  featured: FeaturedInfo | null
  profile: Profile
  priorities?: readonly string[]
}

const SHOW_DELAY = 80
const HIDE_DELAY = 100

/**
 * Floating osiedle card. Content changes only when the hovered osiedle changes;
 * position is written by HoverController through the forwarded ref.
 */
export const HoverCard = forwardRef<HTMLDivElement, HoverCardProps>(function HoverCard(
  { info, featured, profile, priorities },
  ref,
) {
  // keep the last osiedle while the card fades out (derived during render, no effect needed)
  const [shown, setShown] = useState<OsiedleInfo | null>(info)
  if (info && info !== shown) setShown(info)
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(false)

  useEffect(() => {
    const show = !!info
    const t = window.setTimeout(
      () => {
        visibleRef.current = show
        setVisible(show)
      },
      show ? (visibleRef.current ? 0 : SHOW_DELAY) : HIDE_DELAY,
    )
    return () => window.clearTimeout(t)
  }, [info])

  const o = shown
  const cats = hoverCategories(profile, priorities)
  const isFeatured = !!(o && featured && o.featuredSlug === featured.slug)
  const blurb = o ? (isFeatured ? featured!.tagline : o.blurb[profile]) : ''

  return (
    <div ref={ref} className={`smap-card${visible && o ? ' is-visible' : ''}`} aria-hidden={!visible}>
      {o && (
        <div className="smap-card__inner">
          <div className="smap-card__head">
            {isFeatured && <img className="smap-card__thumb" src={featured!.thumb} alt="" loading="lazy" />}
            <div className="smap-card__title">
              <h3>{o.name}</h3>
              <p>{o.district}</p>
            </div>
            <MatchRing key={o.id + profile} value={o.match[profile]} size={44} duration={520} />
          </div>
          <ul className="smap-card__bars">
            {cats.map((c) => (
              <li key={c}>
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
              Kliknij, żeby zobaczyć osiedle <ArrowRight size={14} strokeWidth={2.2} aria-hidden />
            </p>
          )}
        </div>
      )}
    </div>
  )
})
