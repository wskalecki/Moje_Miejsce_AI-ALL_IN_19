/** Polish number formatting (spec §7.5). Uses a regular space as thousands separator. */
const int = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0, useGrouping: true })
const oneDecimal = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** pl-PL skips grouping for 4-digit numbers and uses NBSP; normalise both. */
function group(n: number): string {
  const rounded = Math.round(n)
  const s = int.format(rounded).replace(/ | /g, ' ')
  if (Math.abs(rounded) >= 1000 && Math.abs(rounded) < 10000 && !s.includes(' ')) {
    return s.replace(/(\d)(\d{3})$/, '$1 $2')
  }
  return s
}

export function formatNumber(n: number): string {
  return group(n)
}

export function formatPLN(n: number): string {
  return `${group(n)} zł`
}

export function formatPerM2(n: number): string {
  return `${group(n)} zł/m²`
}

export function formatMin(n: number): string {
  return `${Math.round(n)} min`
}

/** Metres → "2,3 km". */
export function formatKm(m: number): string {
  return `${oneDecimal.format(m / 1000)} km`
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`
}
