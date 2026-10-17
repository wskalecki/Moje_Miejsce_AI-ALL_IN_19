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

const MAX_TEXT = 220

function show(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value === true) return 'tak'
  if (value === false) return 'nie'
  if (Array.isArray(value)) return value.length ? value.join(', ') : null
  const text = String(value)
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT).trimEnd()}…` : text
}

function date(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('pl-PL', { dateStyle: 'medium', timeStyle: 'short' })
}

/** "12.3 (z 18 pomiarów)", so a thin average is visible as such. */
function average(window: Record<string, number | null> | undefined, key: string): string | null {
  const value = window?.[key]
  const n = window?.[`n_${key}`] ?? 0
  if (value === null || value === undefined || !n) return null
  return `${value} (z ${n} ${n === 1 ? 'pomiaru' : 'pomiarów'})`
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
    case 'parking':
      return [['Miejsc', m.miejsca], ['Wolne (w chwili pobrania)', m.wolne], ['Stan na', date(m.stan_na)],
        ['Płatności', m.platnosci], ['Zarządca', m.zarzadca]]
    case 'medicine_disposal':
    case 'e_waste':
    case 'waste_collection':
    case 'food_sharing':
      return [['Rodzaj', m.rodzaj], ['Adres', m.adres], ['Gdzie', m.opis_lokalizacji], ['Całodobowo', m.calodobowo]]
    case 'weather_station':
      return [['Powietrze (°C)', m.temperatura_powietrza], ['Nawierzchnia (°C)', m.temperatura_nawierzchni],
        ['Wilgotność (%)', m.wilgotnosc], ['Wiatr (m/s)', m.wiatr_predkosc], ['Pomiar', date(m.czas_pomiaru)]]
    case 'bo_project':
    case 'bo_done':
      return [['Edycja', m.edycja], ['Opis', m.opis], ['Koszt (zł)', m.koszt_zl], ['Lokalizacja', m.lokalizacja],
        ['Dla kogo', m.dla_kogo], ['Tematy', tags]]
    case 'road_works':
      return [['Rodzaj', tags], ['Od', date(m.od)], ['Do', date(m.do) ?? 'bez daty końca'], ['Ulice', m.ulice]]
    case 'tourist_route':
      return [['Długość (km)', m.dlugosc_km], ['Opis', m.opis],
        ['Punkty', Array.isArray(m.punkty) ? m.punkty.map((p: { nazwa?: string }) => p.nazwa).filter(Boolean) : null]]
    case 'air_sensor': {
      const avg = (m.srednie ?? {}) as Record<string, Record<string, number | null>>
      return [
        ['PM2.5 śr. 24 h (µg/m³)', average(avg['24h'], 'pm25')],
        ['PM2.5 śr. 7 dni (µg/m³)', average(avg['7d'], 'pm25')],
        ['PM10 śr. 24 h (µg/m³)', average(avg['24h'], 'pm10')],
        ['NO₂ śr. 24 h (µg/m³)', average(avg['24h'], 'no2')],
        ['Teraz PM2.5 / PM10', [m.pm25, m.pm10].every((v) => v === null || v === undefined)
          ? null : `${m.pm25 ?? '—'} / ${m.pm10 ?? '—'}`],
        ['Indeks teraz', m.indeks],
        ['Ostatni pomiar', date(m.czas_pomiaru)],
      ]
    }
    default:
      return []
  }
}

export function poiPopupHtml(props: Record<string, unknown>): string {
  const subtype = String(props.subtype ?? '')
  const meta = parsed<Record<string, unknown>>(props.meta, {})
  const tags = parsed<string[]>(props.tags, [])
  const style = subtypeStyle(subtype)

  const districts = parsed<string[]>(props.districts, [])
  const area: Row = districts.length ? ['Dzielnice', districts] : ['Dzielnica', props.district]
  const rows = [...detailRows(subtype, meta, tags), area]
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
