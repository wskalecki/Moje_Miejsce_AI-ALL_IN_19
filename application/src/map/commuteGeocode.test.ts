import { test } from 'node:test'
import assert from 'node:assert/strict'
import { geocodeAddress } from './commuteGeocode.ts'

function addressPoint(street: string, number: string, lon: number, lat: number) {
  return { type: 'Feature', properties: { NAZWA_ULICY: street, NUMER_PORZADKOWY: number }, geometry: { type: 'Point', coordinates: [lon, lat] } }
}

test('a street and number resolve to the city address point', async () => {
  let asked = ''
  const fetchJson = async (url: string) => {
    asked = url
    return { features: [addressPoint('ulica Marszałkowska', '10', 21.0167, 52.2155)] }
  }

  const place = await geocodeAddress('ul. Marszałkowska', '10', fetchJson)

  assert.deepEqual(place, { lon: 21.0167, lat: 52.2155, label: 'ulica Marszałkowska 10' })
  const cql = new URL(asked).searchParams.get('cql_filter')
  assert.equal(cql, "NAZWA_ULICY ILIKE '%Marszałkowska%' AND (NUMER_PORZADKOWY = '10' OR NUMER_PORZADKOWY LIKE '10/%' OR NUMER_PORZADKOWY LIKE '%/10')")
  assert.equal(new URL(asked).searchParams.get('srsName'), 'EPSG:4326')
})

test('quotes in the input cannot break the filter', async () => {
  let asked = ''
  const fetchJson = async (url: string) => {
    asked = url
    return { features: [addressPoint("ulica O'Briena", '1', 21, 52.2)] }
  }

  await geocodeAddress("O'Briena", "1'", fetchJson)

  assert.equal(
    new URL(asked).searchParams.get('cql_filter'),
    "NAZWA_ULICY ILIKE '%O''Briena%' AND (NUMER_PORZADKOWY = '1''' OR NUMER_PORZADKOWY LIKE '1''/%' OR NUMER_PORZADKOWY LIKE '%/1''')",
  )
})

test('an address missing from the city register is an error, not a guess', async () => {
  const fetchJson = async () => ({ features: [] })

  await assert.rejects(geocodeAddress('Nieistniejąca', '999', fetchJson), /Nie znaleziono adresu/)
})

test('a compound number is used only when the exact one is missing, and the label says which', async () => {
  const both = async () => ({
    features: [addressPoint('ulica Marszałkowska', '10/16', 21.01, 52.21), addressPoint('ulica Marszałkowska', '10', 21.02, 52.22)],
  })
  const onlyCompound = async () => ({ features: [addressPoint('ulica Marszałkowska', '10/16', 21.01, 52.21)] })

  assert.equal((await geocodeAddress('Marszałkowska', '10', both)).label, 'ulica Marszałkowska 10')
  assert.equal((await geocodeAddress('Marszałkowska', '10', onlyCompound)).label, 'ulica Marszałkowska 10/16')
})
