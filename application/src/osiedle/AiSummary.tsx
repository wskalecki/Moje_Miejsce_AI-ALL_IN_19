import { Sparkles } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

/** Slugs whose summary was already revealed in this session (reveal only on first open). */
const revealed = new Set<string>()
const TOTAL_MS = 1100

/** "Podsumowanie AI" (spec §4.5 pkt 2): word-by-word reveal, ≤ 1,2 s, first open only. */
export function AiSummary({ slug, text }: { slug: string; text: string }) {
  const reduce = useReducedMotion()
  const [animate] = useState(() => !revealed.has(slug) && !reduce)
  useEffect(() => {
    revealed.add(slug)
  }, [slug])
  const words = text.split(/\s+/)
  const step = TOTAL_MS / Math.max(1, words.length)

  return (
    <section className="op-sec op-ai" aria-labelledby="op-ai-title" data-section="W skrócie">
      <h2 id="op-ai-title" className="op-ai__label">
        <Sparkles size={15} strokeWidth={2.2} aria-hidden />
        W skrócie
      </h2>
      <p className={`op-ai__text${animate ? ' is-revealing' : ''}`}>
        {animate && <span className="sr-only">{text}</span>}
        {animate
          ? words.map((w, i) => (
              <span key={i} className="op-ai__word" style={{ animationDelay: `${Math.round(i * step)}ms` }} aria-hidden>
                {w}{' '}
              </span>
            ))
          : text}
      </p>
      <p className="op-note">Tekst z szablonu, liczby z otwartych danych (OSM, ZTM, GIOŚ, m.st. Warszawa)</p>
    </section>
  )
}
