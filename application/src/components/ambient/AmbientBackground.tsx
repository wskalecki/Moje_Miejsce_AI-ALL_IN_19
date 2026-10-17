import './ambient.css'

/**
 * Warm paper background with three slowly drifting, blurred accent blobs
 * (spec §4.0). Pure CSS, transform + opacity only.
 */
export function AmbientBackground({ intensity = 1 }: { intensity?: number }) {
  return (
    <div className="ambient" aria-hidden style={{ opacity: intensity }}>
      <span className="ambient__blob ambient__blob--student" />
      <span className="ambient__blob ambient__blob--rodzina" />
      <span className="ambient__blob ambient__blob--senior" />
      <span className="ambient__grain" />
    </div>
  )
}
