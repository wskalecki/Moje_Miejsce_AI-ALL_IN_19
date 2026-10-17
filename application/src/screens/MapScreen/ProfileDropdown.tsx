import { useEffect, useRef, useState } from 'react'
import { PROFILE_ORDER, PROFILES } from '../../app/dictionary'
import { PROFILE_ICONS } from '../../app/icons'
import type { ProfileId } from '../../app/types'

interface ProfileDropdownProps {
  profile: ProfileId
  onChange: (profile: ProfileId) => void
}

export function ProfileDropdown({ profile, onChange }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const ActiveIcon = PROFILE_ICONS[profile]

  return (
    <div className="sbar-profile" ref={rootRef}>
      <button
        type="button"
        className="sbar-profile__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Profil: ${PROFILES[profile].title}. Otwórz listę profili`}
        onClick={() => setOpen((v) => !v)}
      >
        <ActiveIcon size={18} strokeWidth={2.15} aria-hidden />
      </button>
      {open && (
        <div className="sbar-profile__menu" role="listbox" aria-label="Profil" aria-activedescendant={`sbar-profile-${profile}`}>
          {PROFILE_ORDER.map((p) => {
            const Icon = PROFILE_ICONS[p]
            const selected = p === profile
            return (
              <button
                key={p}
                id={`sbar-profile-${p}`}
                type="button"
                role="option"
                aria-selected={selected}
                className={`sbar-profile__opt${selected ? ' is-active' : ''}`}
                title={PROFILES[p].title}
                aria-label={PROFILES[p].title}
                onClick={() => {
                  onChange(p)
                  setOpen(false)
                }}
              >
                <Icon size={18} strokeWidth={2.15} aria-hidden />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
