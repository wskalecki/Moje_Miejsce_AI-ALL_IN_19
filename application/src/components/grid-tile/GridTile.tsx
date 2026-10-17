import { type CSSProperties, type ReactNode } from 'react'
import { rgbaToCss, scoreToRgba } from '../../lib/scoreColor'
import './grid-tile.css'

export type GridTileVariant = 'static' | 'color-pop' | 'interactive'

export type GridTileProps = {
  /** `null` = szary kafelek (poza strefą / obramowanie) */
  score: number | null
  /** Used by color-pop when animating between persona scores */
  targetScore?: number | null
  variant: GridTileVariant
  /** Triggers color-pop keyframes (increment or toggle from parent) */
  animateKey?: number
  /** Stagger for wave propagation (ms) */
  animationDelayMs?: number
  selected?: boolean
  label?: string
  className?: string
  onClick?: () => void
  children?: ReactNode
}

function scoreStyle(score: number | null, alpha = 0.9): CSSProperties {
  const [r, g, b, a] = scoreToRgba(score, alpha)
  return {
    '--tile-from': rgbaToCss([r, g, b, a]),
    '--tile-to': rgbaToCss([r, g, b, a]),
    backgroundColor: rgbaToCss([r, g, b, a]),
  } as CSSProperties
}

export function GridTile({
  score,
  targetScore,
  variant,
  animateKey = 0,
  animationDelayMs = 0,
  selected = false,
  label,
  className = '',
  onClick,
  children,
}: GridTileProps) {
  const toScore = targetScore ?? score
  const muted = score == null && (targetScore ?? null) == null
  const from = scoreToRgba(score, muted ? 0.55 : 0.9)
  const to = scoreToRgba(toScore, muted ? 0.55 : 0.9)
  const popAnimating = variant === 'color-pop' && animateKey > 0
  const style = {
    '--tile-from': rgbaToCss(from),
    '--tile-to': rgbaToCss(to),
    '--tile-delay': `${animationDelayMs}ms`,
    ...(popAnimating ? {} : scoreStyle(score, muted ? 0.55 : 0.9)),
  } as CSSProperties

  const classes = [
    'grid-tile',
    `grid-tile--${variant}`,
    muted ? 'grid-tile--muted' : '',
    selected ? 'grid-tile--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const isInteractive = variant === 'interactive' || Boolean(onClick)

  return (
    <div className="grid-tile-wrap">
      <button
        type="button"
        className={classes}
        style={style}
        data-animate-key={animateKey}
        aria-pressed={selected}
        aria-label={label ?? `Kratka, wynik ${score}`}
        onClick={onClick}
        disabled={!isInteractive && !onClick}
      >
        <span className="grid-tile__face" aria-hidden="true" />
        {children}
      </button>
      {label && <span className="grid-tile__caption">{label}</span>}
    </div>
  )
}
