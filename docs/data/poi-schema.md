# POI schema

Points of interest for map layers and per-cell aggregates.

## Files

| Path | Contents |
|------|----------|
| `data/poi/transit.geojson` | Przystanki KM |
| `data/poi/amenities.geojson` | Toalety, boiska, etc. |
| `data/poi/environment.geojson` | AQ sensors |
| `data/poi/culture.geojson` | Wydarzenia (centroids) |

One file per category or a single `poi_all.geojson` — manifest lists all paths.

## Geometry

- **Type:** `Point`
- **CRS:** WGS84 `[lon, lat]`

## Properties

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | `{source}_{sourceId}` |
| `category` | string | yes | See categories below |
| `subtype` | string | yes | e.g. `tram_stop`, `toilet`, `air_sensor` |
| `name` | string | no | Display name |
| `source` | string | yes | Catalog slug or `import` |
| `sourceId` | string | yes | Stable ID from source |
| `cell_id` | string | yes | From `assign_cell(lon, lat)` |
| `tags` | string[] | no | Extra filters |
| `meta` | object | no | Source-specific fields |

### Categories

| `category` | Examples `subtype` |
|------------|-------------------|
| `transit` | `tram_stop`, `bus_stop`, `metro_station` |
| `education` | `school`, `kindergarten`, `university` |
| `sport` | `pitch`, `sports_class` |
| `culture` | `event`, `tourist_route` |
| `environment` | `air_sensor`, `weather_station` |
| `amenity` | `toilet`, `parking`, `aed`, `medicine_disposal`, `e_waste`, `waste_collection`, `food_sharing` |
| `work_pin` | `employer` (demo pins, not from API) |
| `future` | `bo_project`, `consultation`, `planned_metro`, `planned_tram` — „co się tu zmieni” |

## Catalog slug → POI mapping (MVP)

| Catalog slug | `category` | `subtype` | Notes |
|--------------|------------|-----------|--------|
| `lokalizacja-przystanow-komunikacji-miejskiej` | `transit` | `stop` | Point geometry from API |
| `linie-dostepne-na-przystanku` | — | — | Join to stops for `tram_lines_nearby` metric |
| `monitoring-jakosci-powietrza` | `environment` | `air_sensor` | Nearest sensor per cell for AQ |
| `toalety` | `amenity` | `toilet` | `meta.Przewijak`, accessibility |
| `otwarte-boiska` | `sport` | `pitch` | |
| `zajecia-sportowe` | `sport` | `sports_class` | Use location or district centroid |
| `kalendarz-wydarzen` | `culture` | `event` | Point or venue coords |
| `utrudnienia-w-ruchu-drogowym` | — | — | Line/polygon → intersecting cells (not POI point) |
| `rejestr-cen-nieruchomosci` | — | — | District-level → join to cells via `district` |
| `trasy-turystyczne` | `culture` | `tourist_route` | Line → `data/lines/` with `cell_ids` (not POI point); `traces` are `[lat, lon]` |
| `lokalizacja-defibryzatorow-aed` | `amenity` | `aed` | `device_availability` Tak = 24/7 |
| `eko-punkty` | `amenity` | `medicine_disposal`, `e_waste`, `waste_collection`, `food_sharing` | From `typ_punktu[0].rodzaj` |
| `wolne-miejsca-parkingowe` | `amenity` | `parking` | Free spaces are a snapshot (`meta.stan_na`) |
| `pogoda` | `environment` | `weather_station` | Includes road surface temperature |
| `budzet-obywatelski` | `future` | `bo_project` (in progress), `bo_done` (finished) | Needs `rok` + `status`; never copy authors' names (RODO) |
| `konsultacje-spoleczne` | — | — | No coordinates on any record (checked 2026-10-17) |

**Outside catalog (stretch):** RSPO schools, metro stations, parks — `source: "import"`.

## ETL checklist

1. Fetch raw → `data/raw/{slug}/` (gitignored).
2. Normalize to this schema; set `cell_id` for every point.
3. Write GeoJSON; validate with `data/scripts/validate_data.py`.
4. Register the dataset and file in `data/catalog.json`, then `python3 data/scripts/data_catalog.py --render`.
