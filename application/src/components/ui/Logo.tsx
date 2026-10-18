import { APP_NAME } from '../../app/config'
import './ui.css'

/** Rounded rect path with per-corner radii [tl, tr, br, bl]. */
function cell(x: number, y: number, s: number, [tl, tr, br, bl]: readonly [number, number, number, number]): string {
  return [
    `M${x + tl} ${y}`,
    `H${x + s - tr}`,
    tr ? `A${tr} ${tr} 0 0 1 ${x + s} ${y + tr}` : '',
    `V${y + s - br}`,
    br ? `A${br} ${br} 0 0 1 ${x + s - br} ${y + s}` : '',
    `H${x + bl}`,
    bl ? `A${bl} ${bl} 0 0 1 ${x} ${y + s - bl}` : '',
    `V${y + tl}`,
    tl ? `A${tl} ${tl} 0 0 1 ${x + tl} ${y}` : '',
    'Z',
  ].join('')
}

const R = 1.6
const O = 4.4
/** The 8 neighbours of the centre cell; outer corners rounded so the ring reads as an "O". */
const RING: { d: string; opacity: number }[] = [
  { d: cell(0, 0, 6, [O, R, R, R]), opacity: 0.3 },
  { d: cell(7, 0, 6, [R, R, R, R]), opacity: 0.46 },
  { d: cell(14, 0, 6, [R, O, R, R]), opacity: 0.3 },
  { d: cell(0, 7, 6, [R, R, R, R]), opacity: 0.46 },
  { d: cell(14, 7, 6, [R, R, R, R]), opacity: 0.46 },
  { d: cell(0, 14, 6, [R, R, R, O]), opacity: 0.3 },
  { d: cell(7, 14, 6, [R, R, R, R]), opacity: 0.46 },
  { d: cell(14, 14, 6, [R, R, O, R]), opacity: 0.3 },
]

/**
 * Wordmark: "your" cell (accent) — "Moje Miejsce" — and its neighbourhood,
 * the eight cells around it rounded into a ring — plus the app name.
 */
export function Logo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <span className={['ui-logo', `ui-logo--${size}`, className].filter(Boolean).join(' ')}>
      <svg className="ui-logo__mark" viewBox="0 0 20 20" aria-hidden>
        {RING.map((c, i) => (
          <path key={i} d={c.d} fill="currentColor" opacity={c.opacity} />
        ))}
        <rect x={7} y={7} width={6} height={6} rx={3} fill="var(--accent)" />
      </svg>
      <span className="ui-logo__name">{APP_NAME}</span>
    </span>
  )
}
