import { memo } from 'react'
import { PROFILE_ORDER } from '../../app/dictionary'
import type { ProfileId } from '../../app/types'
import { ART_H, ART_W, DISTRICTS_PATH, DOTS } from '../../screens/Intro/warsawArt'
import './ambient.css'
import './warsawArt.css'

interface Dot {
  x: number
  y: number
  s: Record<ProfileId, number>
}

const DOT_LIST: Dot[] = []
for (let i = 0; i < DOTS.length; i += 5) {
  DOT_LIST.push({ x: DOTS[i], y: DOTS[i + 1], s: { student: DOTS[i + 2], rodzina: DOTS[i + 3], senior: DOTS[i + 4] } })
}

const ProfileLayer = memo(function ProfileLayer({ profile }: { profile: ProfileId }) {
  return (
    <g className={`warsaw-art__layer warsaw-art__layer--${profile}`}>
      {DOT_LIST.map((d) => {
        const s = d.s[profile]
        if (s < 2) return null
        return <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={2 + s * 0.95} opacity={0.18 + (s / 9) * 0.82} />
      })}
    </g>
  )
})

/**
 * Warsaw district outlines + the real match grid (downsampled heat points),
 * one layer per profile. Only the active layer is visible; layers crossfade.
 */
export const WarsawArt = memo(function WarsawArt({ profile, className }: { profile: ProfileId | null; className?: string }) {
  return (
    <svg
      className={['warsaw-art', className].filter(Boolean).join(' ')}
      viewBox={`-20 -20 ${ART_W + 40} ${ART_H + 40}`}
      aria-hidden
      data-active={profile ?? 'none'}
    >
      <g className="warsaw-art__grid">
        {DOT_LIST.map((d) => (
          <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={1.7} />
        ))}
      </g>
      {PROFILE_ORDER.map((p) => (
        <ProfileLayer key={p} profile={p} />
      ))}
      <path className="warsaw-art__outline" d={DISTRICTS_PATH} />
    </svg>
  )
})
