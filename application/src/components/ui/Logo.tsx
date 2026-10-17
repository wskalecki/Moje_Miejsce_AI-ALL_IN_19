import { APP_NAME } from '../../app/config'
import './ui.css'

/** Wordmark: a 3 × 3 cell mark + app name. */
export function Logo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <span className={['ui-logo', `ui-logo--${size}`, className].filter(Boolean).join(' ')}>
      <svg className="ui-logo__mark" viewBox="0 0 20 20" aria-hidden>
        {[0, 1, 2].map((y) =>
          [0, 1, 2].map((x) => (
            <rect
              key={`${x}-${y}`}
              x={x * 7}
              y={y * 7}
              width={6}
              height={6}
              rx={1.6}
              fill={x === 1 && y === 1 ? 'var(--accent)' : 'currentColor'}
              opacity={x === 1 && y === 1 ? 1 : 0.22 + ((x + y) % 2) * 0.2}
            />
          )),
        )}
      </svg>
      <span className="ui-logo__name">{APP_NAME}</span>
    </span>
  )
}
