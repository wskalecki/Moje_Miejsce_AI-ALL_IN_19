/**
 * Workplace address -> point, from the official address points of m.st. Warszawa (WFS
 * wfs:punkty_adresowe, the register used by data/scripts/geocode_address.py). Only addresses
 * in Warsaw; an address that is not in the register is reported, never approximated.
 */

export const ADDRESS_WFS = 'https://wms2.um.warszawa.pl/geoserver/wfs/wfs'

export interface Place {
  lon: number
  lat: number
  label: string
}

interface AddressFeature {
  properties: { NAZWA_ULICY?: string | null; NUMER_PORZADKOWY?: string | null }
  geometry: { type: string; coordinates: number[] } | null
}

const STREET_PREFIX = /^(ul\.?|ulica|al\.?|aleja|aleje|pl\.?|plac|os\.?|osiedle|rondo)\s+/i
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`

export async function geocodeAddress(
  street: string,
  number: string,
  fetchJson: (url: string) => Promise<{ features: AddressFeature[] }>,
): Promise<Place> {
  const name = street.trim().replace(STREET_PREFIX, '').trim()
  const no = number.trim()
  if (!name || !no) throw new Error('Podaj ulicę i numer budynku.')
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: 'wfs:punkty_adresowe',
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    count: '5',
    // exact number, or a compound one that contains it ("10/16"); the exact one wins below
    cql_filter:
      `NAZWA_ULICY ILIKE ${quote(`%${name}%`)} AND (NUMER_PORZADKOWY = ${quote(no)} ` +
      `OR NUMER_PORZADKOWY LIKE ${quote(`${no}/%`)} OR NUMER_PORZADKOWY LIKE ${quote(`%/${no}`)})`,
  })
  const { features } = await fetchJson(`${ADDRESS_WFS}?${params}`)
  const points = features.filter((f) => f.geometry?.type === 'Point')
  const hit = points.find((f) => f.properties.NUMER_PORZADKOWY === no) ?? points[0]
  if (!hit?.geometry) throw new Error(`Nie znaleziono adresu „${name} ${no}” w rejestrze adresów m.st. Warszawy.`)
  const [lon, lat] = hit.geometry.coordinates
  return { lon, lat, label: `${hit.properties.NAZWA_ULICY ?? name} ${hit.properties.NUMER_PORZADKOWY ?? no}` }
}
