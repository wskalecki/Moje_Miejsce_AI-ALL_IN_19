/** Small decorative dot grid ("siatka") with a deterministic radial falloff. */
export function DotPatch({ seed = 0, cols = 13, rows = 7 }: { seed?: number; cols?: number; rows?: number }) {
  const cx = (cols - 1) * (0.5 + 0.12 * Math.sin(seed * 2.1))
  const cy = (rows - 1) * (0.5 + 0.18 * Math.cos(seed * 1.7))
  const dots = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - cx) / cols, (y - cy) / rows) * 2.4
      const v = Math.max(0, 1 - d) * (0.75 + 0.25 * Math.sin((x * 3 + y * 5 + seed * 7) * 0.9))
      dots.push(<circle key={`${x}-${y}`} cx={x * 16 + 8} cy={y * 16 + 8} r={1.2 + v * 3.6} opacity={0.12 + v * 0.7} />)
    }
  }
  return (
    <svg className="dot-patch" viewBox={`0 0 ${cols * 16} ${rows * 16}`} preserveAspectRatio="xMidYMid slice" aria-hidden>
      {dots}
    </svg>
  )
}
