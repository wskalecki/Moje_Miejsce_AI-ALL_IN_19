/** Small presentational primitives shared by the osiedle panel sections. */
import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { EASE_EMPHASIZED } from './shared'

/**
 * Number that tweens to `value`, writing straight to the DOM (no React re-render per frame).
 * `from` is used only for the very first animation (e.g. count up from 0).
 */
export function TweenNumber({
  value,
  from,
  duration = 400,
  firstDuration,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number
  from?: number
  duration?: number
  /** Duration of the first real change (e.g. the count-up on entry). */
  firstDuration?: number
  format?: (n: number) => string
  className?: string
}) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(from ?? value)
  const played = useRef(false)
  // Latest formatter / first duration without restarting the tween when only they change.
  const opts = useRef({ format, firstDuration })
  useEffect(() => {
    opts.current = { format, firstDuration }
  })
  // Rendered once; afterwards the tween owns the text node (React never rewrites it).
  const [initial] = useState(() => format(from ?? value))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (Math.abs(current.current - value) < 0.01) return
    const { format, firstDuration } = opts.current
    const ms = !played.current && firstDuration != null ? firstDuration : duration
    if (reduce || ms <= 0) {
      played.current = true
      current.current = value
      el.textContent = format(value)
      return
    }
    const controls = animate(current.current, value, {
      duration: ms / 1000,
      ease: EASE_EMPHASIZED,
      onUpdate: (v) => {
        played.current = true
        current.current = v
        el.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, reduce])
  return (
    <span ref={ref} className={className}>
      {initial}
    </span>
  )
}

export function SectionHead({
  id,
  icon: Icon,
  title,
  aside,
  focusable,
}: {
  id: string
  icon?: LucideIcon
  title: ReactNode
  aside?: ReactNode
  /** Heading can take programmatic focus (tabindex −1), e.g. after the section opens. */
  focusable?: boolean
}) {
  return (
    <header className="op-sec__head">
      <h2 id={id} className="op-sec__title" tabIndex={focusable ? -1 : undefined}>
        {Icon && <Icon size={18} strokeWidth={2} aria-hidden className="op-sec__icon" />}
        {title}
      </h2>
      {aside}
    </header>
  )
}

/**
 * Panel section that folds to its header: the title is a button (aria-expanded) and the body
 * rows open via `grid-template-rows` (CSS only, no per-frame React work). The body mounts on the
 * first open and then stays mounted, so heavy content (charts, galleries) costs nothing until
 * it's wanted and keeps its state across toggles. Controlled with `open` + `onOpenChange`,
 * otherwise uncontrolled from `defaultOpen`.
 */
export function CollapsibleSection({
  id,
  icon: Icon,
  title,
  aside,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  className,
  section,
  sectionRef,
  children,
}: {
  id: string
  icon?: LucideIcon
  title: ReactNode
  /** Extra controls next to the title, shown only while the section is open. */
  aside?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  /** `data-section` name (outline / dev tools). */
  section?: string
  sectionRef?: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = openProp ?? ownOpen
  const [mounted, setMounted] = useState(open)
  if (open && !mounted) setMounted(true)
  const toggle = () => {
    setOwnOpen(!open)
    onOpenChange?.(!open)
  }
  const bodyId = `${id}-body`
  return (
    <section
      ref={sectionRef}
      className={['op-sec', 'op-col', open ? 'is-open' : '', className].filter(Boolean).join(' ')}
      aria-labelledby={id}
      data-section={section}
    >
      <header className="op-sec__head op-col__head">
        <h2 id={id} className="op-sec__title">
          <button type="button" className="op-col__toggle" aria-expanded={open} aria-controls={bodyId} onClick={toggle}>
            {Icon && <Icon size={18} strokeWidth={2} aria-hidden className="op-sec__icon" />}
            <span className="op-col__label">{title}</span>
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden className="op-col__chev" />
          </button>
        </h2>
        {open && aside}
      </header>
      <div id={bodyId} className="op-col__body" inert={!open}>
        <div className="op-col__inner">{mounted && children}</div>
      </div>
    </section>
  )
}
