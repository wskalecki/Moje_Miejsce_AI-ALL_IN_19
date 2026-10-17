# Lokalne bryły budynków (demo)

Plik `osm_buildings_sample.geojson` zawiera footprinty **way** z OpenStreetMap w bbox siatki próbki (~16k obiektów). Aplikacja ładuje go przez `fetch` (nie bundluje do JS).

## Regeneracja

```bash
python3 data/scripts/fetch_osm_buildings.py
```

Skrypt woła `data/scripts/fetch_osm_buildings_overpass.mjs` (Node + Overpass). Przy 502/429 ponawia zapytanie.

## Dopasowanie do POI

- Auto: punkt POI → najmniejszy wielokąt zawierający punkt (`localServiceBuildings.ts`).
- Ręcznie: tryb „Koloruj budynek” zapisuje `osm_id` + kategorię w stanie React.
- W GeoJSON możesz też edytować `properties.category` / `poi_id` przed demo.
