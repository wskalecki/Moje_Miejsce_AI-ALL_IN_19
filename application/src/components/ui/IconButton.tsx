import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import './ui.css'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  /** Accessible name (required — the button has no visible text). */
  label: string
}

/** 40 × 40 glass button (spec §8.3). */
export function IconButton({ icon: Icon, label, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={['ui-icon-btn', className].filter(Boolean).join(' ')} {...rest}>
      <Icon size={18} strokeWidth={2} aria-hidden />
    </button>
  )
}
