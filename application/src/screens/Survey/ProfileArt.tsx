import { PROFILE_ICONS } from '../../app/icons'
import type { ProfileId } from '../../app/types'

/**
 * Survey step 1 art: the profile "face" (icon medallion) sitting on its own patch of the
 * ~1 km grid — same cell language as the logo and the map, tinted with the profile accent.
 */
const COLS = 11
const ROWS = 6
const CELL = 18
const GAP = 4
const PITCH = CELL + GAP

/** Where the bright cells cluster around the medallion, per profile (grid coordinates). */
const SHAPE: Record<ProfileId, { cx: number; cy: number; spread: number; seed: number }> = {
  student: { cx: 5, cy: 2.5, spread: 3.6, seed: 1 },
  rodzina: { cx: 5, cy: 2.5, spread: 4.4, seed: 2 },
  senior: { cx: 5, cy: 2.5, spread: 4, seed: 3 },
}

function cells(p: ProfileId) {
  const { cx, cy, spread, seed } = SHAPE[p]
  const out: { x: number; y: number; o: number }[] = []
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.25) / spread
      const noise = 0.5 + 0.5 * Math.sin(x * 2.3 + y * 3.7 + seed * 5.1)
      const v = Math.max(0, 1 - d) ** 1.5 * (0.55 + 0.45 * noise)
      out.push({ x, y, o: 0.06 + v * 0.7 })
    }
  }
  return out
}

const CELLS: Record<ProfileId, ReturnType<typeof cells>> = {
  student: cells('student'),
  rodzina: cells('rodzina'),
  senior: cells('senior'),
}

export function ProfileArt({ profile }: { profile: ProfileId }) {
  const Icon = PROFILE_ICONS[profile]
  return (
    <span className="profile-art" aria-hidden>
      <svg className="profile-art__grid" viewBox={`0 0 ${COLS * PITCH - GAP} ${ROWS * PITCH - GAP}`} preserveAspectRatio="xMidYMid slice">
        {CELLS[profile].map((c) => (
          <rect key={`${c.x}-${c.y}`} x={c.x * PITCH} y={c.y * PITCH} width={CELL} height={CELL} rx={5} opacity={c.o} />
        ))}
      </svg>
      <span className="profile-art__face">
        <Icon size={30} strokeWidth={1.8} />
      </span>
    </span>
  )
}
