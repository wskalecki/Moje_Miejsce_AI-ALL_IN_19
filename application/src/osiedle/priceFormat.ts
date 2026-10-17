/** Price wording for the "Ceny" section (spec §4.5 pkt 8, decision log §16). */
import { formatNumber } from '../lib/format.ts'

const mln = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** Whole-flat price: "1,09 mln zł" from 1 mln up, otherwise "870 tys. zł". */
export function formatFlatPrice(pln: number): string {
  if (pln >= 995_000) return `${mln.format(Math.round(pln / 10_000) / 100)} mln zł`
  return `${formatNumber(Math.round(pln / 1000))} tys. zł`
}

/** Pill vs the Warsaw average: "+11% vs Warszawa", or "jak średnia Warszawy" when it rounds to 0. */
export function cityDiffLabel(value: number, city: number): string {
  const diff = Math.round(((value - city) / city) * 100)
  if (diff === 0) return 'jak średnia Warszawy'
  return `${diff > 0 ? '+' : '−'}${Math.abs(diff)}% vs Warszawa`
}
