/**
 * Survey mad-libs sentence (spec §4.1, §7.3). Pure function, shared by the
 * survey header and the sentence bar on the map.
 *
 *   {fragment}, {liczy się|liczą się} dla {mnie|nas} {list}, {szukam|szukamy} miejsca {horizon}.
 */
import { CATEGORIES, HORIZONS, PROFILES } from '../app/dictionary.ts'
import type { CategoryKey, Horizon, ProfileId } from '../app/types.ts'

export type SlotKind = 'profile' | 'priority' | 'horizon'

export type SentencePart =
  | { type: 'text'; key: string; text: string }
  /** `text === null` → empty slot, rendered as an underlined placeholder "…". */
  | { type: 'slot'; key: string; slot: SlotKind; text: string | null; category?: CategoryKey }

export interface SentenceInput {
  profile: ProfileId | null
  priorities: readonly CategoryKey[]
  horizon: Horizon | null
}

/** "liczą się" for ≥ 2 categories or a single plural one (zakupy, przedszkola i szkoły). */
export function verbFor(priorities: readonly CategoryKey[]): 'liczy się' | 'liczą się' {
  if (priorities.length >= 2) return 'liczą się'
  if (priorities.length === 1 && CATEGORIES[priorities[0]].plural) return 'liczą się'
  return 'liczy się'
}

export function buildSentence(input: SentenceInput): SentencePart[] {
  const def = input.profile ? PROFILES[input.profile] : null
  const pronoun = def?.pronoun ?? 'mnie'
  const verb = def?.verb ?? 'szukam'
  const parts: SentencePart[] = []

  parts.push({ type: 'slot', key: 'profile', slot: 'profile', text: def?.fragment ?? null })
  parts.push({ type: 'text', key: 't-verb', text: `, ${verbFor(input.priorities)} dla ${pronoun} ` })

  if (input.priorities.length === 0) {
    parts.push({ type: 'slot', key: 'priority-empty', slot: 'priority', text: null })
  } else {
    input.priorities.forEach((c, i) => {
      if (i > 0) {
        const sep = i === input.priorities.length - 1 ? ' i ' : ', '
        parts.push({ type: 'text', key: `t-sep-${c}`, text: sep })
      }
      parts.push({ type: 'slot', key: `priority-${c}`, slot: 'priority', text: CATEGORIES[c].sentenceLabel, category: c })
    })
  }

  parts.push({ type: 'text', key: 't-search', text: `, ${verb} miejsca ` })
  parts.push({ type: 'slot', key: 'horizon', slot: 'horizon', text: input.horizon ? HORIZONS[input.horizon].fragment : null })
  parts.push({ type: 'text', key: 't-end', text: '.' })
  return parts
}

/** Plain-text rendering (empty slots as "…"). */
export function sentenceToString(parts: readonly SentencePart[]): string {
  return parts.map((p) => (p.type === 'text' ? p.text : (p.text ?? '…'))).join('')
}
