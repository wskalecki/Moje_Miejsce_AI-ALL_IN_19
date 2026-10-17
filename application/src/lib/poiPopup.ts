import { subtypeStyle } from './poiStyles'

type Row = [label: string, value: unknown]

/** MapLibre returns nested GeoJSON properties as JSON strings. */
function parsed<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

function show(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value === true) return 'tak'
  if (value === false) return 'nie'
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  return String(value)
}

function date(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })
}

function detailRows(subtype: string, m: Record<string, unknown>, tags: string[]): Row[] {
  switch (subtype) {
    case 'toilet':
      return [['Przewijak', m.przewijak], ['Bez barier', m.bez_barier], ['Płatna', m.platna], ['Godziny', m.godziny]]
    case 'aed':
      return [['Całodobowy', m.calodobowy], ['Godziny', m.godziny], ['Gdzie', m.umiejscowienie],
        ['Adres', m.adres], ['Opis', m.opis_lokalizacji]]
    case 'stop':
      return [['Zespół / słupek', m.zespol && m.slupek ? `${m.zespol} / ${m.slupek}` : null]]
    case 'pitch':
      return [['Adres', m.adres], ['Obiekty', tags], ['Liczba obiektów', m.liczba_obiektow]]
    case 'sports_class':
      return [['Miejsce', m.miejsce], ['Adres', m.adres], ['Dni', m.dni], ['Godzina', m.godzina],
        ['Dla kogo', m.dla_kogo], ['Rodzaj', tags]]
    case 'event':
      return [['Miejsce', m.miejsce], ['Adres', m.adres], ['Najbliższy termin', date(m.pierwszy_termin)],
        ['Terminów', m.liczba_terminow], ['Kategorie', tags]]
    case 'air_sensor':
      return [['PM2.5 (µg/m³)', m.pm25], ['PM10 (µg/m³)', m.pm10], ['NO₂ (µg/m³)', m.no2],
        ['Indeks', m.indeks], ['Pomiar', date(m.czas_pomiaru)]]
    default:
      return []
  }
}

export function poiPopupHtml(props: Record<string, unknown>): string {
  const subtype = String(props.subtype ?? '')
  const meta = parsed<Record<string, unknown>>(props.meta, {})
  const tags = parsed<string[]>(props.tags, [])
  const style = subtypeStyle(subtype)

  const rows = [...detailRows(subtype, meta, tags), ['Dzielnica', props.district] as Row]
    .map(([label, value]) => [label, show(value)] as const)
    .filter(([, value]) => value !== null)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value as string)}</dd>`)
    .join('')

  const url = typeof meta.url === 'string' && /^https?:\/\//.test(meta.url) ? meta.url : null
  const link = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Szczegóły →</a>`
    : ''

  return `
    <div class="poi-popup">
      <p class="poi-popup__type" style="--poi-color:${style.color}">${escapeHtml(style.label)}</p>
      <h3>${escapeHtml(String(props.name ?? style.label))}</h3>
      ${rows ? `<dl>${rows}</dl>` : ''}
      ${link}
    </div>`
}
