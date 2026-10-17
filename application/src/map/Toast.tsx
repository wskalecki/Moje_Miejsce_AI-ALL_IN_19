import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

const TOAST_MS = 2400

/** Bottom-centre toast; every new `seq` restarts the 2.4 s timer (one toast at a time, spec 4.3). */
export function Toast({ seq, message }: { seq: number; message: string }) {
  const [visibleSeq, setVisibleSeq] = useState(0)
  useEffect(() => {
    if (!seq) return
    const show = window.setTimeout(() => setVisibleSeq(seq), 0)
    const hide = window.setTimeout(() => setVisibleSeq(0), TOAST_MS)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [seq])
  const visible = visibleSeq !== 0 && visibleSeq === seq
  return (
    <div className={`smap-toast${visible ? ' is-visible' : ''}`} role="status" aria-live="polite">
      {visible && (
        <span className="smap-toast__inner" key={seq}>
          <Clock size={16} strokeWidth={2} aria-hidden />
          {message}
        </span>
      )}
    </div>
  )
}
