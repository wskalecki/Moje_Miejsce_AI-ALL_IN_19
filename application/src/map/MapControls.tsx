import { Maximize2, Minus, Plus } from 'lucide-react'
import { memo } from 'react'

interface MapControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

/** Top-right camera controls in the app's glass style (spec 4.3). */
export const MapControls = memo(function MapControls({ onZoomIn, onZoomOut, onReset }: MapControlsProps) {
  return (
    <div className="smap-controls" role="toolbar" aria-label="Sterowanie mapą">
      <div className="smap-controls__group">
        <button type="button" onClick={onZoomIn} aria-label="Przybliż" title="Przybliż">
          <Plus size={18} strokeWidth={2} />
        </button>
        <button type="button" onClick={onZoomOut} aria-label="Oddal" title="Oddal">
          <Minus size={18} strokeWidth={2} />
        </button>
      </div>
      <button type="button" className="smap-controls__single" onClick={onReset} aria-label="Cała Warszawa" title="Cała Warszawa">
        <Maximize2 size={16} strokeWidth={2} />
      </button>
    </div>
  )
})
