/**
 * UI of the osiedle 3D view (over the map, left of the panel): advanced building colours and traffic.
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

export function Osm3dOverlay({ area, focusKinds = null }: Osm3dOverlayProps) {
  const [legendKind, setLegendKind] = useState<BuildingKind | null>(null)
  const storeFocus = useBuildingFocus()
  const [colorByKind, setColorByKind] = useState(false)
  const [trafficOn, setTrafficOn] = useState(false)

  useEffect(() => {
    area.setColorMode(colorByKind ? 'byKind' : 'base')
  }, [area, colorByKind])

  const focus = useMemo<readonly BuildingKind[] | null>(
    () => (legendKind ? [legendKind] : (storeFocus ?? (focusKinds?.length ? focusKinds : null))),
    [legendKind, storeFocus, focusKinds],
  )
  useEffect(() => {
    area.setFocus(focus)
  }, [area, focus])
  useEffect(() => () => area.setFocus(null), [area])

  useEffect(() => {
    if (!trafficOn) area.setTraffic(null)
  }, [area, trafficOn])
  const onHour = useCallback(
    (h: number) => {
      if (trafficOn) area.setTraffic(h)
    },
    [area, trafficOn],
  )

  useEffect(() => {
    const map = area.map
    const id = area.ids.bld
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
      <details className="m3d-card m3d-advanced">
        <summary className="m3d-advanced__sum">Zaawansowane</summary>
        <div className="m3d-advanced__body">
          <label className="m3d-advanced__opt">
            <input type="checkbox" checked={colorByKind} onChange={(e) => setColorByKind(e.target.checked)} />
            <span>Kolory budynków według typu (szkoły, mieszkania…)</span>
          </label>
          {colorByKind && (
            <BuildingLegend counts={area.data.kindCounts} onFocusKind={setLegendKind} defaultOpen={false} nested />
          )}
          {doc && (
            <>
              <label className="m3d-advanced__opt">
                <input
                  type="checkbox"
                  checked={trafficOn}
                  onChange={(e) => {
                    setTrafficOn(e.target.checked)
                  }}
                />
                <span>Korki na drogach (rozkład ZTM)</span>
              </label>
              {trafficOn && <TrafficControl doc={doc} enabled={trafficOn} onEnabled={setTrafficOn} onHour={onHour} nested />}
            </>
          )}
        </div>
      </details>
    </div>
  )
}

export default Osm3dOverlay
