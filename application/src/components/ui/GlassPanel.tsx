import type { HTMLAttributes } from 'react'
import './ui.css'

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** `strong` for panels with long text (AA contrast). */
  strength?: 'default' | 'strong'
}

export function GlassPanel({ strength = 'default', className, ...rest }: GlassPanelProps) {
  return <div className={['ui-glass', strength === 'strong' && 'ui-glass--strong', className].filter(Boolean).join(' ')} {...rest} />
}
