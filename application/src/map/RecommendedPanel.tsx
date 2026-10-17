import { Crown } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { PROFILE_ICONS } from '../app/icons'
import { sortFeatured } from './featured'
import { PROFILE_LABEL } from './tokens'
import type { FeaturedInfo, FeaturedSlug, Profile } from './types'
import { PROFILES } from './types'

interface RecommendedPanelProps {
  featured: FeaturedInfo[]
  profile: Profile
  highlighted: FeaturedSlug | null
  onHover: (slug: FeaturedSlug | null) => void
  onSelect: (slug: FeaturedSlug) => void
  /** When provided, a presenter profile switch is shown in the panel header. */
  onProfileChange?: (p: Profile) => void
}

const EASE = [0.16, 1, 0.3, 1] as const

/** Glass side panel "Polecane dla Ciebie" (spec 4.3): own osiedle first, then by match. */
export function RecommendedPanel({ featured, profile, highlighted, onHover, onSelect, onProfileChange }: RecommendedPanelProps) {
  const reduce = useReducedMotion()
  const list = sortFeatured(featured, profile)

  return (
    <motion.section
      className="smap-rec"
      aria-labelledby="smap-rec-title"
      initial={reduce ? false : { opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.42, delay: 0.3, ease: EASE }}
    >
      <header className="smap-rec__head">
        <div>
          <h2 id="smap-rec-title">Polecane dla Ciebie</h2>
          <p>Na podstawie Twoich odpowiedzi</p>
        </div>
        {onProfileChange && (
          <div className="smap-rec__switch" role="radiogroup" aria-label="Profil (tryb prezentera)">
            {PROFILES.map((p) => {
              const Icon = PROFILE_ICONS[p]
              return (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={p === profile}
                  aria-label={PROFILE_LABEL[p]}
                  title={PROFILE_LABEL[p]}
                  className={p === profile ? 'is-active' : undefined}
                  data-p={p}
                  onClick={() => onProfileChange(p)}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden />
                </button>
              )
            })}
          </div>
        )}
      </header>

      <ol className="smap-rec__list">
        {list.map((f, i) => {
          const best = f.profile === profile
          return (
            <motion.li
              key={f.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                layout: { duration: 0.4, ease: EASE },
                opacity: { duration: 0.32, delay: 0.42 + i * 0.08 },
                y: { duration: 0.32, delay: 0.42 + i * 0.08, ease: EASE },
              }}
            >
              <button
                type="button"
                className={['smap-rec__card', best ? 'is-best' : '', highlighted === f.slug ? 'is-hl' : ''].filter(Boolean).join(' ')}
                onMouseEnter={() => onHover(f.slug)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(f.slug)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(f.slug)}
              >
                <img className="smap-rec__thumb" src={f.thumb} alt="" loading="lazy" width={72} height={72} />
                <span className="smap-rec__body">
                  {best && (
                    <span className="smap-rec__badge">
                      <Crown size={12} strokeWidth={2.4} aria-hidden />
                      Najlepsze dopasowanie
                    </span>
                  )}
                  <span className="smap-rec__name">{f.name}</span>
                  <span className="smap-rec__district">{f.district}</span>
                  <span className="smap-rec__tagline">{f.tagline}</span>
                </span>
                <span className="smap-rec__match tabular" aria-label={`Dopasowanie ${f.match[profile]}%`}>
                  {f.match[profile]}
                  <small>%</small>
                </span>
              </button>
            </motion.li>
          )
        })}
      </ol>
    </motion.section>
  )
}
