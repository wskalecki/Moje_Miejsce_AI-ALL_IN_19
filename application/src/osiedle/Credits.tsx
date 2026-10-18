import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { HeroImage, OsiedleSlug } from '../mock/osiedla'

interface CreditEntry {
  file: string
  author: string
  license: string
  licenseUrl?: string
  source?: string
}

let cache: Promise<Record<string, CreditEntry[]>> | null = null
function loadCredits() {
  cache ??= fetch('/osiedla/credits.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  return cache
}

/**
 * Photo credits footnote: from `public/osiedla/credits.json`, falling back to `heroImages[].credit`.
 * One folded line ("Zdjęcia: autorzy i licencje"); the list (and its fetch) only once opened.
 */
export function Credits({ slug, images }: { slug: OsiedleSlug; images: HeroImage[] }) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<CreditEntry[] | null>(null)
  useEffect(() => {
    if (!open) return
    let alive = true
    void loadCredits().then((all) => alive && setEntries(all[slug] ?? null))
    return () => {
      alive = false
    }
  }, [slug, open])

  return (
    <div className={`op-credits${open ? ' is-open' : ''}`}>
      <h2 className="op-credits__title">
        <button type="button" className="op-credits__toggle" aria-expanded={open} aria-controls="op-credits-list" onClick={() => setOpen((o) => !o)}>
          Zdjęcia: autorzy i licencje
          <ChevronDown size={14} strokeWidth={2.2} aria-hidden className="op-credits__chev" />
        </button>
      </h2>
      <ol id="op-credits-list" hidden={!open}>
        {entries
          ? entries.map((e, i) => (
              <li key={e.file}>
                <span className="op-credits__n">{i + 1}.</span>{' '}
                {e.source ? (
                  <a href={e.source} target="_blank" rel="noopener noreferrer">
                    {e.author}
                  </a>
                ) : (
                  e.author
                )}
                {', '}
                {e.licenseUrl ? (
                  <a href={e.licenseUrl} target="_blank" rel="noopener noreferrer">
                    {e.license}
                  </a>
                ) : (
                  e.license
                )}
                {e.source?.includes('wikimedia.org') && ', Wikimedia Commons'}
              </li>
            ))
          : images.map((img, i) => (
              <li key={img.src}>
                <span className="op-credits__n">{i + 1}.</span> {img.credit.replace(/^fot\.\s*/, '')}
              </li>
            ))}
      </ol>
    </div>
  )
}
