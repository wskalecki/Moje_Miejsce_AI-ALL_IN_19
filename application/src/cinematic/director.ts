import type { Map as MlMap } from 'maplibre-gl'

type PaddingOptions = { top: number; bottom: number; left: number; right: number }

type Ticker = (now: number, dt: number) => void

const ZERO_PAD: PaddingOptions = { top: 0, bottom: 0, left: 0, right: 0 }
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * One rAF loop that owns the "living camera" after the fly-in: a slow orbit (bearing), a padding
 * tween that slides the subject left when the panel opens, and small paint tickers (outline glint).
 * The orbit pauses on any user gesture and while another camera animation runs, then resumes softly.
 */
export class Director {
  private raf = 0
  private last = 0
  private orbitSpeed = 0
  private orbitOn = false
  /** 0..1 orbit throttle — ramps so the orbit never starts or stops with a jerk. */
  private throttle = 0
  private resumeAt = 0
  private held = false
  private pad: { from: PaddingOptions; to: PaddingOptions; start: number; dur: number } | null = null
  private tickers = new Set<Ticker>()
  private readonly offs: (() => void)[] = []
  /** Milliseconds of inactivity before the orbit resumes after a user gesture. */
  resumeDelay = 9000

  private readonly map: MlMap

  constructor(map: MlMap) {
    this.map = map
    const onUser = (e: { originalEvent?: Event }) => {
      if (!e.originalEvent) return
      this.throttle = 0
      this.resumeAt = performance.now() + this.resumeDelay
    }
    for (const ev of ['mousedown', 'touchstart', 'wheel', 'dragstart', 'rotatestart'] as const) {
      this.map.on(ev, onUser)
      this.offs.push(() => this.map.off(ev, onUser))
    }
  }

  private ensure() {
    if (this.raf) return
    this.last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(64, now - this.last) / 1000
      this.last = now
      this.frame(now, dt)
      this.raf = this.orbitOn || this.pad || this.tickers.size || this.throttle > 0 ? requestAnimationFrame(loop) : 0
    }
    this.raf = requestAnimationFrame(loop)
  }

  private frame(now: number, dt: number) {
    const map = this.map
    const busy = map.isMoving() || this.held || now < this.resumeAt
    const want = this.orbitOn && !busy ? 1 : 0
    // critically damped-ish ramp: ~1.6 s to full speed, ~0.5 s to stop
    const rate = want > this.throttle ? 0.62 : 2.2
    this.throttle += (want - this.throttle) * Math.min(1, rate * dt * 1.6)
    if (Math.abs(want - this.throttle) < 0.002) this.throttle = want

    const opts: { bearing?: number; padding?: PaddingOptions } = {}
    if (this.throttle > 0 && !map.isMoving()) opts.bearing = map.getBearing() + this.orbitSpeed * this.throttle * dt
    if (this.pad && !map.isMoving()) {
      const t = Math.min(1, (now - this.pad.start) / this.pad.dur)
      const k = easeInOut(t)
      const f = this.pad.from
      const to = this.pad.to
      opts.padding = {
        top: f.top + (to.top - f.top) * k,
        bottom: f.bottom + (to.bottom - f.bottom) * k,
        left: f.left + (to.left - f.left) * k,
        right: f.right + (to.right - f.right) * k,
      }
      if (t >= 1) this.pad = null
    }
    if (opts.bearing !== undefined || opts.padding) map.jumpTo(opts)
    for (const t of this.tickers) t(now, dt)
  }

  startOrbit(degPerSec: number) {
    this.orbitSpeed = degPerSec
    this.orbitOn = true
    this.ensure()
  }

  stopOrbit(immediate = false) {
    this.orbitOn = false
    if (immediate) this.throttle = 0
  }

  /** Hold the orbit (e.g. while a route is shown); `false` releases it after the usual delay. */
  hold(on: boolean) {
    this.held = on
    if (!on) this.resumeAt = performance.now() + this.resumeDelay
    this.ensure()
  }

  /** Pause the orbit for the resume delay without a user gesture (camera moved by the app). */
  nudge() {
    this.throttle = 0
    this.resumeAt = performance.now() + this.resumeDelay
  }

  tweenPadding(to: Partial<PaddingOptions>, dur: number) {
    const cur = { ...ZERO_PAD, ...this.map.getPadding() }
    const target = { ...ZERO_PAD, ...to }
    if (dur <= 0) {
      this.pad = null
      this.map.jumpTo({ padding: target })
      return
    }
    this.pad = { from: cur, to: target, start: performance.now(), dur }
    this.ensure()
  }

  addTicker(t: Ticker): () => void {
    this.tickers.add(t)
    this.ensure()
    return () => this.tickers.delete(t)
  }

  stopAll() {
    this.orbitOn = false
    this.throttle = 0
    this.pad = null
    this.tickers.clear()
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  destroy() {
    this.stopAll()
    this.offs.forEach((f) => f())
  }
}
