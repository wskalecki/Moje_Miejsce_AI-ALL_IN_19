import { AnimatePresence, LayoutGroup, useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { useMemo } from 'react'
import type { SentencePart, SlotKind } from '../../lib/sentence'
import './sentence.css'

interface Token {
  key: string
  kind: 'word' | 'slot'
  text: string | null
  slot?: SlotKind
  /** No space before this token (punctuation). */
  glue: boolean
  /** Punctuation glued to this token ("zdrowie,") — rendered in the same unbreakable unit. */
  suffix?: string
}

function tokenize(parts: readonly SentencePart[]): Token[] {
  const tokens: Token[] = []
  let pendingSpace = false
  for (const part of parts) {
    if (part.type === 'slot') {
      tokens.push({ key: part.key, kind: 'slot', text: part.text, slot: part.slot, glue: !pendingSpace && tokens.length > 0 })
      pendingSpace = false
      continue
    }
    // Split text into words and punctuation, remembering where spaces were.
    const re = /(\s+)|([^\s,.]+)|([,.])/g
    let m: RegExpExecArray | null
    let i = 0
    while ((m = re.exec(part.text))) {
      if (m[1]) {
        pendingSpace = true
        continue
      }
      const text = m[2] ?? m[3]
      const glue = !pendingSpace && tokens.length > 0
      pendingSpace = false
      // "," / "." never starts a line: keep it in the same nowrap unit as the token before it
      if (m[3] && glue) {
        const prev = tokens[tokens.length - 1]
        prev.suffix = (prev.suffix ?? '') + text
        i++
        continue
      }
      tokens.push({ key: `${part.key}-${i++}`, kind: 'word', text, glue })
    }
  }
  return tokens
}

export interface SentenceProps {
  parts: readonly SentencePart[]
  /** Slot kind to emphasise (the one the current survey step fills). */
  activeSlot?: SlotKind | null
  size?: 'lg' | 'md'
  className?: string
  /** Render as a live region (survey header). */
  live?: boolean
  as?: 'h1' | 'h2' | 'p'
}

/**
 * Mad-libs sentence: static words + slot pills tinted with the active accent.
 * Words and pills animate their position when the sentence reflows.
 */
export function Sentence({ parts, activeSlot = null, size = 'lg', className, live = false, as = 'p' }: SentenceProps) {
  const reduce = useReducedMotion()
  const tokens = useMemo(() => tokenize(parts), [parts])
  const Tag = as
  const plain = parts.map((p) => (p.type === 'text' ? p.text : (p.text ?? '…'))).join('')
  const layout = reduce ? false : ('position' as const)
  const t = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as const }

  return (
    <Tag className={['sentence', `sentence--${size}`, className].filter(Boolean).join(' ')} aria-live={live ? 'polite' : undefined}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden className="sentence__visual">
        <LayoutGroup>
          <AnimatePresence initial={false} mode="popLayout">
            {tokens.map((tk, i) => {
              const gap = tokens[i + 1] && !tokens[i + 1].glue && 'sentence__gap'
              return tk.kind === 'word' ? (
                <m.span key={tk.key} layout={layout} transition={t} className={['sentence__word', gap].filter(Boolean).join(' ')}>
                  {tk.text}
                  {tk.suffix}
                </m.span>
              ) : (
                <m.span
                  key={tk.key}
                  layout={layout}
                  transition={t}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  className={['sentence__unit', gap].filter(Boolean).join(' ')}
                >
                  <span
                    className={[
                      'sentence__slot',
                      tk.text === null && 'sentence__slot--empty',
                      activeSlot && tk.slot === activeSlot && 'sentence__slot--active',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {tk.text ?? '…'}
                  </span>
                  {tk.suffix}
                </m.span>
              )
            })}
          </AnimatePresence>
        </LayoutGroup>
      </span>
    </Tag>
  )
}
