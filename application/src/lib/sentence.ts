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
  /** Name at most this many priorities; beyond that the last ones collapse to
   *  "jeszcze N inne" (priorities are unlimited since iteration 2). */
  maxNamed?: number
}

/** "jeszcze 2 inne" / "jeszcze 5 innych" (Polish plural after a numeral). */
export function othersLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  const few = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
  return `jeszcze ${n} ${few ? 'inne' : 'innych'}`
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
    const max = Math.max(2, input.maxNamed ?? Infinity)
    const collapse = input.priorities.length > max
    const named = collapse ? input.priorities.slice(0, max - 1) : input.priorities
    const total = named.length + (collapse ? 1 : 0)
    named.forEach((c, i) => {
      if (i > 0) parts.push({ type: 'text', key: `t-sep-${c}`, text: i === total - 1 ? ' i ' : ', ' })
      parts.push({ type: 'slot', key: `priority-${c}`, slot: 'priority', text: CATEGORIES[c].sentenceLabel, category: c })
    })
    if (collapse) {
      parts.push({ type: 'text', key: 't-sep-others', text: ' i ' })
      parts.push({ type: 'slot', key: 'priority-others', slot: 'priority', text: othersLabel(input.priorities.length - named.length) })
    }
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
