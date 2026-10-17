import { AnimatePresence, motion } from 'motion/react'
import { SkipForward } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { APP_NAME } from '../app/config'
import type { ProfileId } from '../app/types'
import { ACCENTS, EASE } from '../design/tokens'
import type { Osiedle } from '../mock/osiedla'

/** Seconds of the flyover clip shown in the interlude. */
export const VIDEO_SHOW_S = 5.8
const PHOTO_MS = 2600
/** Black dip (CSS `.cin-media` fade) plus the clip fading up from it — the live map is covered after this. */
const MEDIA_FADE_MS = 900
const VIDEO_TIMEOUT_MS = 1500
/** No clip and no photos (e.g. a new osiedle before its flyover is recorded): hold the title over the live 3D map. */
const LIVE_HOLD_MS = 3400
/** The map under the bars (and in the clips) is OpenStreetMap data drawn with OpenMapTiles. */
const MAP_CREDIT = '© OpenStreetMap (ODbL) · OpenMapTiles'

interface InterludeProps {
  osiedle: Osiedle
  profile: ProfileId
  /** Letterbox bars + vignette in. */
  open: boolean
  showTitle: boolean
  /** Start the flyover clip (or the photo fallback). */
  playMedia: boolean
  /** Fired once the media fully covers the live map. */
  onCovered: () => void
  /** Fired when the media part is over (or impossible). */
  onDone: () => void
  onSkip: () => void
}

function fmtCoord(v: number, pos: string, neg: string) {
  return `${Math.abs(v).toFixed(4).replace('.', ',')}° ${v >= 0 ? pos : neg}`
}

/** Letterboxed title card with the flyover clip (spec 4.4, "interludium"). */
export function Interlude({ osiedle, profile, open, showTitle, playMedia, onCovered, onDone, onSkip }: InterludeProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [media, setMedia] = useState<'none' | 'video' | 'photos' | 'live'>('none')
  const [visible, setVisible] = useState(false)
  const [photo, setPhoto] = useState(0)
  const done = useRef(false)
  const covered = useRef(false)
  const cb = useRef({ onCovered, onDone })
  useEffect(() => {
    cb.current = { onCovered, onDone }
  })

  const owner = ACCENTS[osiedle.profile]
  const match = osiedle.match[profile]
  const photos = osiedle.heroImages.slice(0, 2)

  const finish = () => {
    if (done.current) return
    done.current = true
    cb.current.onDone()
  }
  const cover = () => {
    if (covered.current) return
    covered.current = true
    window.setTimeout(() => cb.current.onCovered(), MEDIA_FADE_MS)
  }

  // Start the clip; fall back to photos when it cannot play in time.
  useEffect(() => {
    if (!playMedia) return
    const v = videoRef.current
    let started = false
    const fallback = () => {
      if (started) return
      started = true
      if (photos.length) {
        setMedia('photos')
        setVisible(true)
        cover()
      } else {
        // nothing to cut to: the daylight 3D map itself is the shot, the title stays a moment longer
        setMedia('live')
        cb.current.onCovered()
      }
    }
    const timer = window.setTimeout(fallback, VIDEO_TIMEOUT_MS)
    const onPlaying = () => {
      if (started) return
      started = true
      window.clearTimeout(timer)
      setMedia('video')
      setVisible(true)
      cover()
    }
    if (v) {
      v.addEventListener('playing', onPlaying)
      v.addEventListener('error', fallback, true)
      v.currentTime = 0
      v.play().catch(fallback)
    } else fallback()
    return () => {
      window.clearTimeout(timer)
      v?.removeEventListener('playing', onPlaying)
      v?.removeEventListener('error', fallback, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playMedia])

  // Video: hand over to the live map a little before the clip ends.
  useEffect(() => {
    if (media !== 'video') return
    const v = videoRef.current
    if (!v) return
    const onTime = () => {
      if (v.currentTime >= VIDEO_SHOW_S) finish()
    }
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', finish)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', finish)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media])

  useEffect(() => {
    if (media !== 'live') return
    const t = window.setTimeout(finish, LIVE_HOLD_MS)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media])

  // Photos: Ken Burns, crossfade, then done.
  useEffect(() => {
    if (media !== 'photos') return
    const t1 = window.setTimeout(() => setPhoto(1), PHOTO_MS)
    const t2 = window.setTimeout(finish, PHOTO_MS * Math.max(1, photos.length))
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media])

  const letters = osiedle.name.split(' ')
  let li = 0
  const style = {
    '--cin-accent': owner.accent,
    '--cin-accent-mid': owner.mid,
    '--cin-progress': `${VIDEO_SHOW_S}s`,
  } as CSSProperties

  return (
    <div
      className={`cin-interlude${open ? ' is-open' : ''}${visible ? ' has-media' : ''}${media === 'live' ? ' is-live' : ''}`}
      style={style}
      onClick={onSkip}
    >
      <div className="cin-live-scrim" aria-hidden />
      <div className={`cin-media${visible ? ' is-visible' : ''}`} aria-hidden>
        <video
          ref={videoRef}
          className={`cin-media__video${media === 'video' ? ' is-on' : ''}`}
          src={`/osiedla/${osiedle.slug}/flyover.mp4`}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        {media === 'photos' &&
          photos.map((p, i) => (
            <img key={p.src} src={p.src} alt="" className={`cin-media__photo${photo === i ? ' is-on' : ''}`} decoding="async" />
          ))}
        <div className="cin-media__grade" />
      </div>

      <div className="cin-bar cin-bar--top">
        <span className="cin-bar__meta">
          {fmtCoord(osiedle.center[1], 'N', 'S')} · {fmtCoord(osiedle.center[0], 'E', 'W')}
        </span>
        <span className="cin-bar__meta cin-bar__district">Warszawa · {osiedle.district}</span>
      </div>
      <div className="cin-bar cin-bar--bottom">
        <span className={`cin-bar__progress${visible ? ' is-running' : ''}`} aria-hidden />
        <span className="cin-bar__meta cin-bar__caption">
          {media === 'photos'
            ? (photos[photo] ?? photos[0])?.credit
            : media === 'video'
              ? `${APP_NAME} · ujęcie 3D z otwartych danych · ${MAP_CREDIT}`
              : `${APP_NAME} · ${osiedle.name} · ${MAP_CREDIT}`}
        </span>
        <button
          type="button"
          className="cin-skip"
          onClick={(e) => {
            e.stopPropagation()
            onSkip()
          }}
        >
          Pomiń
          <SkipForward size={15} strokeWidth={2.2} aria-hidden />
          <kbd>Esc</kbd>
        </button>
      </div>

      <AnimatePresence>
        {showTitle && (
          <motion.div
            key="title"
            className="cin-title"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, filter: 'blur(6px)', transition: { duration: 0.6, ease: EASE.cinema } }}
          >
            <motion.p
              className="cin-title__kicker"
              initial={{ opacity: 0, y: 10, letterSpacing: '0.42em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.24em' }}
              transition={{ duration: 1.1, ease: EASE.emphasized }}
            >
              <span className="cin-title__dot" />
              <span className="cin-title__kicker-text">
                {osiedle.district} · {match}% dopasowania
              </span>
            </motion.p>
            <h2 className="cin-title__name" aria-label={osiedle.name}>
              {letters.map((word, wi) => (
                <span key={wi} className="cin-title__word" aria-hidden>
                  {[...word].map((ch) => {
                    const i = li++
                    return (
                      <motion.span
                        key={i}
                        className="cin-title__ch"
                        initial={{ opacity: 0, y: '0.42em', rotateX: -70, filter: 'blur(14px)' }}
                        animate={{ opacity: 1, y: '0em', rotateX: 0, filter: 'blur(0px)' }}
                        transition={{ duration: 1.05, delay: 0.12 + i * 0.05, ease: EASE.emphasized }}
                      >
                        {ch}
                      </motion.span>
                    )
                  })}
                </span>
              ))}
            </h2>
            <motion.span
              className="cin-title__rule"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: EASE.cinema }}
            />
            <motion.p
              className="cin-title__tagline"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.75 + li * 0.02, ease: EASE.emphasized }}
            >
              {osiedle.tagline}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
