/**
 * Minimal top bar: Moje Miejsce brand + profile switcher.
 */
import { APP_NAME } from '../../app/config'
import { navigate } from '../../app/router'
import type { ProfileId } from '../../app/types'
import { Logo } from '../../components/ui'
import { ProfileDropdown } from './ProfileDropdown'
import './sentenceBar.css'

export interface SentenceBarProps {
  hidden?: boolean
  profile: ProfileId
  onProfileChange: (profile: ProfileId) => void
}

export function SentenceBar({ hidden = false, profile, onProfileChange }: SentenceBarProps) {
  return (
    <div className="sbar" data-hidden={hidden || undefined} aria-hidden={hidden || undefined} inert={hidden || undefined}>
      <nav className="sbar__bar sbar__bar--minimal" aria-label={APP_NAME}>
        <button
          type="button"
          className="sbar__logo"
          onClick={() => navigate('/', { direction: -1 })}
          aria-label={`${APP_NAME} — wróć na start`}
        >
          <Logo />
        </button>
        <div className="sbar__actions">
          <ProfileDropdown profile={profile} onChange={onProfileChange} />
        </div>
      </nav>
    </div>
  )
}
