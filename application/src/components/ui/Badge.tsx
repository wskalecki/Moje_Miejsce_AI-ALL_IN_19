import { Crown, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import './ui.css'

export interface BadgeProps {
  icon?: LucideIcon | null
  children?: ReactNode
  className?: string
}

/** Accent-soft pill; defaults to the "Najlepsze dopasowanie" badge with a crown. */
export function Badge({ icon = Crown, children = 'Najlepsze dopasowanie', className }: BadgeProps) {
  const Icon = icon
  return (
    <span className={['ui-badge', className].filter(Boolean).join(' ')}>
      {Icon && <Icon size={13} strokeWidth={2.4} aria-hidden />}
      {children}
    </span>
  )
}
