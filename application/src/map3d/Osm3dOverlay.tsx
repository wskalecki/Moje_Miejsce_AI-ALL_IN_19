/**
 * UI of the osiedle 3D view (over the map, left of the panel): the building legend, the traffic
 * hour control and the name card of a clicked public building.
 */
import { Popup, type MapLayerMouseEvent } from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BUILDING_KIND_LABEL, isPublicBuilding, type BuildingKind, type BuildingProps } from '../lib/osm3d/buildingStyle'
import type { AreaLayers } from './AreaLayers'
import { BuildingLegend } from './BuildingLegend'
import { useBuildingFocus } from './store'
import { TrafficControl } from './TrafficControl'
import './map3d.css'

interface Osm3dOverlayProps {
  area: AreaLayers
  /** Kinds highlighted from outside (e.g. the category of the place hovered in the panel). */
  focusKinds?: readonly BuildingKind[] | null
}

/** The legend starts collapsed where it would cover much of the free map area. */
const compact = () => window.matchMedia('(max-width: 767px), (max-height: 859px)').matches

export function Osm3dOverlay({ area, focusKinds = null }: Osm3dOverlayProps) {
  const [legendKind, setLegendKind] = useState<BuildingKind | null>(null)
  const storeFocus = useBuildingFocus()
  const [trafficOn, setTrafficOn] = useState(true)
  const [defaultOpen] = useState(() => !compact())

  // focus priority: legend row under the pointer → shared store (panel) → hovered place category
  const focus = useMemo<readonly BuildingKind[] | null>(
    () => (legendKind ? [legendKind] : (storeFocus ?? (focusKinds?.length ? focusKinds : null))),
    [legendKind, storeFocus, focusKinds],
  )
  useEffect(() => {
    area.setFocus(focus)
  }, [area, focus])
  useEffect(() => () => area.setFocus(null), [area])

  // traffic off → plain asphalt
  useEffect(() => {
    if (!trafficOn) area.setTraffic(null)
  }, [area, trafficOn])
  const onHour = useCallback((h: number) => {
    if (trafficOn) area.setTraffic(h)
  }, [area, trafficOn])

  // public building name card on click
  useEffect(() => {
    const map = area.map
    const id = area.ids.bld
    // the scene may have been rebuilt (dev reload) — never bind to a missing layer
    if (!map.getLayer(id)) return
    const popup = new Popup({ closeButton: false, closeOnClick: false, className: 'm3d-popup', offset: 10, maxWidth: '260px' })
    const close = () => {
      popup.remove()
      area.select(null)
    }
    const onClick = (e: MapLayerMouseEvent) => {
      const f = e.features?.[0]
      const p = f?.properties as BuildingProps | undefined
      if (!f || !p || !isPublicBuilding(p)) return close()
      area.select(Number(f.id ?? p.id))
      const el = document.createElement('div')
      el.className = 'm3d-popup__body'
      const kind = document.createElement('span')
      kind.className = 'm3d-popup__kind'
      kind.textContent = BUILDING_KIND_LABEL[p.kind]
      el.append(kind)
      if (p.name) {
        const name = document.createElement('strong')
        name.className = 'm3d-popup__name'
        name.textContent = p.name
        el.append(name)
      }
      popup.setLngLat(e.lngLat).setDOMContent(el).addTo(map)
    }
    const onMapClick = (e: MapLayerMouseEvent) => {
      if (!map.getLayer(id) || !map.queryRenderedFeatures(e.point, { layers: [id] }).length) close()
    }
    const onMove = (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties as BuildingProps | undefined
      map.getCanvas().style.cursor = p && isPublicBuilding(p) ? 'pointer' : ''
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }
    map.on('click', id, onClick)
    map.on('click', onMapClick)
    map.on('mousemove', id, onMove)
    map.on('mouseleave', id, onLeave)
    return () => {
      map.off('click', id, onClick)
      map.off('click', onMapClick)
      map.off('mousemove', id, onMove)
      map.off('mouseleave', id, onLeave)
      map.getCanvas().style.cursor = ''
      close()
    }
  }, [area])

  const doc = area.data.traffic
  return (
    <div className="m3d">
      <BuildingLegend counts={area.data.kindCounts} onFocusKind={setLegendKind} defaultOpen={defaultOpen} />
      {doc && <TrafficControl doc={doc} enabled={trafficOn} onEnabled={setTrafficOn} onHour={onHour} />}
    </div>
  )
}

export default Osm3dOverlay
