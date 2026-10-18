import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Osiedle } from '../mock/osiedla'

export interface HeroVideo {
  mp4?: string
  webm?: string
  poster?: string
}

interface HeroProps {
  osiedle: Osiedle
  /** Explicit video; `undefined` = try `/osiedla/<slug>/flyover.{webm,mp4}`; `false` = photos only. */
  video?: HeroVideo | false
  /** False while the "Zdjęcia" section is folded: autoplay and the video pause. */
  active?: boolean
}

const AUTOPLAY_MS = 5000
/** Video that hasn't produced a frame by then is treated as missing (spec §4.4). */
const VIDEO_TIMEOUT_MS = 2500

type VideoState = 'probing' | 'ok' | 'fail'

/**
 * Hero (spec §4.5 pkt 1): looping muted flyover video when it exists, otherwise a Ken Burns
 * crossfade gallery (arrows, dots, autoplay every 5 s). The gallery is always mounted under
 * the video, so a missing or broken video never leaves a blank frame.
 */
export function Hero({ osiedle, video, active = true }: HeroProps) {
  const reduce = useReducedMotion()
  const photos = osiedle.heroImages
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<'video' | 'photos'>('video')
  const [paused, setPaused] = useState(false)
  const [videoState, setVideoState] = useState<VideoState>(video === false ? 'fail' : 'probing')
  const videoRef = useRef<HTMLVideoElement>(null)

  const src: HeroVideo | null =
    video === false
      ? null
      : (video ?? {
          webm: `/osiedla/${osiedle.slug}/flyover.webm`,
          mp4: `/osiedla/${osiedle.slug}/flyover.mp4`,
          poster: photos[0]?.src,
        })

  useEffect(() => {
    if (videoState !== 'probing') return
    const t = window.setTimeout(() => setVideoState((s) => (s === 'probing' ? 'fail' : s)), VIDEO_TIMEOUT_MS)
    return () => window.clearTimeout(t)
  }, [videoState, osiedle.slug])

  const showVideo = videoState === 'ok' && mode === 'video'

  useEffect(() => {
    const v = videoRef.current
    if (!v || videoState !== 'ok') return
    if (showVideo && !reduce && active) void v.play().catch(() => {})
    else v.pause()
  }, [showVideo, videoState, reduce, active])

  const go = useCallback(
    (next: number) => {
      setMode('photos')
      setIndex(((next % photos.length) + photos.length) % photos.length)
    },
    [photos.length],
  )

  // Autoplay through photos (not while the video is showing, hovered, focused or reduced motion).
  useEffect(() => {
    if (reduce || paused || !active || showVideo || photos.length < 2) return
    const t = window.setTimeout(() => setIndex((i) => (i + 1) % photos.length), AUTOPLAY_MS)
    return () => window.clearTimeout(t)
  }, [index, reduce, paused, active, showVideo, photos.length])

  const credit = showVideo ? 'Przelot nagrany z mapy Siatki · © OpenStreetMap' : photos[index]?.credit

  return (
    <div
      className="op-hero"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="op-hero__stage"
        role="group"
        aria-roledescription="galeria"
        aria-label={`Zdjęcia: ${osiedle.name}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1)
          if (e.key === 'ArrowLeft') go(index - 1)
        }}
      >
        {photos.map((p, i) => (
          <figure
            key={p.src}
            className={`op-hero__slide${i === index ? ' is-active' : ''}`}
            data-kb={i % 3}
            aria-hidden={i !== index || showVideo}
          >
            <img src={p.src} alt={p.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} />
          </figure>
        ))}

        {src && videoState !== 'fail' && (
          <video
            key={osiedle.slug}
            ref={videoRef}
            className={`op-hero__video${showVideo ? ' is-active' : ''}`}
            autoPlay={!reduce}
            muted
            loop
            playsInline
            preload="auto"
            poster={src.poster}
            aria-label={`Przelot nad osiedlem ${osiedle.name}`}
            onPlaying={() => setVideoState('ok')}
            onLoadedData={() => setVideoState('ok')}
            onError={() => setVideoState('fail')}
          >
            {src.webm && <source src={src.webm} type="video/webm" onError={() => {}} />}
            {src.mp4 && (
              <source
                src={src.mp4}
                type="video/mp4"
                // The last <source> failing means the video can't play at all.
                onError={() => setVideoState('fail')}
              />
            )}
          </video>
        )}

        <div className="op-hero__scrim" aria-hidden />
      </div>

      {photos.length > 1 && (
        <>
          <button type="button" className="op-hero__arrow op-hero__arrow--prev" onClick={() => go(index - 1)} aria-label="Poprzednie zdjęcie">
            <ChevronLeft size={18} strokeWidth={2.4} aria-hidden />
          </button>
          <button type="button" className="op-hero__arrow op-hero__arrow--next" onClick={() => go(index + 1)} aria-label="Następne zdjęcie">
            <ChevronRight size={18} strokeWidth={2.4} aria-hidden />
          </button>
        </>
      )}

      <div className="op-hero__bottom">
        <div className="op-hero__dots" role="tablist" aria-label="Wybierz zdjęcie">
          {videoState === 'ok' && (
            <button
              type="button"
              role="tab"
              aria-selected={showVideo}
              className={`op-hero__dot op-hero__dot--video${showVideo ? ' is-active' : ''}`}
              onClick={() => setMode('video')}
              aria-label="Przelot wideo"
            >
              <Play size={9} strokeWidth={0} fill="currentColor" aria-hidden />
            </button>
          )}
          {photos.map((p, i) => {
            const isOn = !showVideo && i === index
            return (
              <button
                key={p.src}
                type="button"
                role="tab"
                aria-selected={isOn}
                aria-label={`Zdjęcie ${i + 1} z ${photos.length}`}
                className={`op-hero__dot${isOn ? ' is-active' : ''}`}
                onClick={() => go(i)}
              >
                {isOn && !reduce && !paused && <span className="op-hero__dot-fill" style={{ animationDuration: `${AUTOPLAY_MS}ms` }} />}
              </button>
            )
          })}
        </div>
        {credit && <p className="op-hero__credit">{credit}</p>}
      </div>
    </div>
  )
}
