import { useReducedMotion } from 'motion/react'
import * as m from 'motion/react-m'
import { memo } from 'react'
import type { ProfileId } from '../app/types'
import { Places, type PlacesProps } from './Places'
import { EASE_EMPHASIZED } from './shared'
import './osiedle.css'

interface PlacesPanelProps extends PlacesProps {
  profile: ProfileId
}

/**
 * "Ważne miejsca" as a card in the right column of the osiedle view, next to the pins it drives — out
 * of the place card's scroll. Same rows and accents as the place card; it fades in where it stands.
 */
export const PlacesPanel = memo(function PlacesPanel({ profile, ...places }: PlacesPanelProps) {
  const reduce = useReducedMotion()
  return (
    <m.aside
      className={`op op--side chrome-card accent-${profile}`}
      aria-labelledby="op-places-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: EASE_EMPHASIZED } }}
      transition={{ duration: reduce ? 0.2 : 0.32, ease: EASE_EMPHASIZED }}
    >
      <Places {...places} />
    </m.aside>
  )
})
