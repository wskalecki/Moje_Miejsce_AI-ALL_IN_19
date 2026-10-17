import { memo, useEffect, useState } from 'react'
import type { ProfileId } from '../../app/types'
import { Logo } from '../../components/ui'
import { ART_H, ART_W, DISTRICTS_PATH, DOTS } from '../Intro/warsawArt'

/** Match dots of the active profile (same downsampled grid as the intro art). */
function dotsFor(profile: ProfileId) {
  const k = profile === 'student' ? 2 : profile === 'rodzina' ? 3 : 4
  const out: { x: number; y: number; s: number }[] = []
  for (let i = 0; i < DOTS.length; i += 5) out.push({ x: DOTS[i], y: DOTS[i + 1], s: DOTS[i + k] })
  return out
}

const Art = memo(function Art({ profile }: { profile: ProfileId }) {
  const dots = dotsFor(profile)
  return (
    <svg className="map-skel__svg" viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid meet" aria-hidden>
      <g className="map-skel__grid">
        {dots.map((d) => (
          <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={2.2} />
        ))}
      </g>
      <g className="map-skel__heat">
        {dots.map((d) =>
          d.s < 2 ? null : <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={3 + d.s * 1.6} opacity={0.12 + (d.s / 9) * 0.5} />,
        )}
      </g>
      <path className="map-skel__outline" d={DISTRICTS_PATH} pathLength={1} />
    </svg>
  )
})

/**
 * Loading state of `/mapa` (spec §4.3, QA #8): the city drawn from the same data the map will show,
 * placed where the map's home camera frames Warsaw, with a scanning sweep, a ghost "Polecane" panel
 * and a quiet status pill. Cross-fades into the live map when it is ready.
 */
export function MapSkeleton({
  profile,
  done,
  error = false,
  panel = true,
}: {
  profile: ProfileId
  done: boolean
  error?: boolean
  /** Ghost "Polecane" panel (off for deep links straight into an osiedle). */
  panel?: boolean
}) {
  // unmount after the cross-fade so the looping animations stop costing frames
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = window.setTimeout(() => setGone(true), 900)
    return () => window.clearTimeout(t)
  }, [done])
  if (gone && done) return null
  return (
    <div className={`map-skel accent-${profile}`} data-done={done || undefined} aria-hidden={done || undefined}>
      <div className="map-skel__frame">
        <Art profile={profile} />
        <div className="map-skel__sweep" />
      </div>
      {panel && (
      <div className="map-skel__panel" aria-hidden>
        <i className="map-skel__line map-skel__line--title" />
        <i className="map-skel__line map-skel__line--sub" />
        {[0, 1, 2].map((i) => (
          <span key={i} className="map-skel__card" style={{ animationDelay: `${i * 120}ms` }}>
            <i className="map-skel__thumb" />
            <span>
              <i className="map-skel__line" />
              <i className="map-skel__line map-skel__line--short" />
            </span>
          </span>
        ))}
      </div>
      )}
      <div className="map-skel__status" role="status">
        <Logo />
        <span className="map-skel__msg">{error ? 'Nie udało się wczytać mapy. Odśwież stronę.' : 'Wczytujemy mapę Warszawy…'}</span>
        {!error && <span className="map-skel__bar" aria-hidden />}
      </div>
    </div>
  )
}
