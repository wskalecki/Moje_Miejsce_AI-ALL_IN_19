import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import './ui.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'md' | 'lg'
  iconLeft?: LucideIcon
  iconRight?: LucideIcon
  children: ReactNode
}

/** Pill button (spec §8.3). Primary = accent fill; the right icon nudges 3 px on hover. */
export function Button({
  variant = 'primary',
  size = 'md',
  iconLeft: IconLeft,
  iconRight: IconRight,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={['ui-btn', `ui-btn--${variant}`, `ui-btn--${size}`, className].filter(Boolean).join(' ')} {...rest}>
      {IconLeft && <IconLeft className="ui-btn__icon ui-btn__icon--left" size={18} strokeWidth={2.2} aria-hidden />}
      <span>{children}</span>
      {IconRight && <IconRight className="ui-btn__icon ui-btn__icon--right" size={18} strokeWidth={2.2} aria-hidden />}
    </button>
  )
}
