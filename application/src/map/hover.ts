import type { Map as MlMap, MapMouseEvent, PointLike } from 'maplibre-gl'
import { LAYER, SOURCE } from './layers'
import type { OsiedleInfo, Profile } from './types'

/** Below this zoom only featured osiedla react to hover (spec 4.3). */
export const HOVER_MIN_ZOOM = 11.5
const CARD_OFFSET = 16
const EDGE = 12

export interface HoverOptions {
  getProfile: () => Profile
  info: Map<string, OsiedleInfo>
  /** Called only when the osiedle under the cursor changes (never per mousemove). */
  onChange: (id: string | null) => void
  /** Floating card element, positioned via transform in rAF. */
  getCard: () => HTMLElement | null
  /** Extra layers to query (e.g. featured fill, added in T6). */
  extraLayers?: () => string[]
}

/**
 * rAF-throttled hover: one `queryRenderedFeatures` per frame, feature-state on change,
 * card follows the cursor through `style.transform` — React state changes only on osiedle change.
 */
export class HoverController {
  private map: MlMap
  private opts: HoverOptions
  private raf = 0
  private point: { x: number; y: number } | null = null
  private current: string | null = null
  private forced: string | null = null
  private enabled = true

  constructor(map: MlMap, opts: HoverOptions) {
    this.map = map
    this.opts = opts
    map.on('mousemove', this.onMove)
    map.getCanvasContainer().addEventListener('mouseleave', this.onLeave)
    map.on('zoom', this.onZoom)
    map.on('moveend', this.onMoveEnd)
  }

  destroy() {
    this.map.off('mousemove', this.onMove)
    this.map.getCanvasContainer().removeEventListener('mouseleave', this.onLeave)
    this.map.off('zoom', this.onZoom)
    this.map.off('moveend', this.onMoveEnd)
    cancelAnimationFrame(this.raf)
  }

  get hoveredId() {
    return this.current
  }

  setEnabled(on: boolean) {
    this.enabled = on
    if (!on) this.set(null)
  }

  /** Programmatic highlight (e.g. hovering a card in the side panel). Cursor hover still wins. */
  highlight(id: string | null) {
    this.forced = id
    if (!this.point) this.setState(id)
  }

  private onMove = (e: MapMouseEvent) => {
    if (!this.enabled) return
    this.point = { x: e.point.x, y: e.point.y }
    if (!this.raf) this.raf = requestAnimationFrame(this.tick)
  }

  /** Zooming out below the threshold drops hover on non-featured osiedla, even without mouse movement. */
  private onZoom = () => {
    if (!this.current || this.map.getZoom() >= HOVER_MIN_ZOOM) return
    if (!this.opts.info.get(this.current)?.featuredSlug) this.set(null)
  }

  /** The map moved under a still cursor — re-query once. */
  private onMoveEnd = () => {
    if (this.point && this.enabled && !this.raf) this.raf = requestAnimationFrame(this.tick)
  }

  private onLeave = () => {
    this.point = null
    this.set(null)
  }

  private tick = () => {
    this.raf = 0
    const pt = this.point
    if (!pt || !this.enabled) return
    const profile = this.opts.getProfile()
    const layers = [LAYER.fill(profile), ...(this.opts.extraLayers?.() ?? [])].filter((l) => this.map.getLayer(l))
    const hits = this.map.queryRenderedFeatures([pt.x, pt.y] as PointLike, { layers })
    let id: string | null = null
    const zoom = this.map.getZoom()
    for (const f of hits) {
      const fid = (f.properties?.id as string | undefined) ?? null
      if (!fid) continue
      const isFeatured = !!this.opts.info.get(fid)?.featuredSlug
      if (zoom >= HOVER_MIN_ZOOM || isFeatured) {
        id = fid
        if (isFeatured) break
      }
    }
    this.set(id)
    this.position(pt)
  }

  private set(id: string | null) {
    if (id === null && !this.point && this.forced) id = this.forced
    this.setState(id)
  }

  private setState(id: string | null) {
    if (id === this.current) return
    const prev = this.current
    this.current = id
    if (prev) this.featureState(prev, false)
    if (id) this.featureState(id, true)
    this.opts.onChange(id)
  }

  private featureState(id: string, hover: boolean) {
    if (this.map.getSource(SOURCE.osiedla)) this.map.setFeatureState({ source: SOURCE.osiedla, id }, { hover })
    if (this.opts.info.get(id)?.featuredSlug && this.map.getSource(SOURCE.featured))
      this.map.setFeatureState({ source: SOURCE.featured, id }, { hover })
  }

  /** Keep the card inside the map container; flip to the other side of the cursor near edges. */
  private position(pt: { x: number; y: number }) {
    const card = this.opts.getCard()
    if (!card) return
    const box = this.map.getContainer()
    const W = box.clientWidth
    const H = box.clientHeight
    const w = card.offsetWidth || 300
    const h = card.offsetHeight || 200
    let x = pt.x + CARD_OFFSET
    let y = pt.y + CARD_OFFSET
    if (x + w > W - EDGE) x = pt.x - CARD_OFFSET - w
    if (y + h > H - EDGE) y = pt.y - CARD_OFFSET - h
    x = Math.max(EDGE, Math.min(x, W - w - EDGE))
    y = Math.max(EDGE, Math.min(y, H - h - EDGE))
    card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
  }
}
