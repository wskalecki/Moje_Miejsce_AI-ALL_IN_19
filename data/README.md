# Data

**Owner:** data team (see [`docs/team/workstreams.md`](../docs/team/workstreams.md))

Datasets for **Siatka**: 250 m grid (squares in EPSG:2180), per-cell metrics, POI GeoJSON.

## Schemas

- [`docs/data/grid-schema.md`](../docs/data/grid-schema.md)
- [`docs/data/poi-schema.md`](../docs/data/poi-schema.md)
- Agent rule: [`.cursor/rules/data-developer.mdc`](../.cursor/rules/data-developer.mdc)

## Scripts

`generate_grid.py` needs `pyproj`. `uv run` installs it from the script header; ETL code that imports `assign_cell` needs `pyproj` in its own env (e.g. `uv run --with pyproj python your_etl.py`). `validate_data.py` uses the standard library only.

```bash
# Official district boundaries (needed for in_warsaw / district)
uv run data/scripts/fetch_district_boundaries.py

# Neighbourhood (MSI area) boundaries for the map
uv run data/scripts/fetch_osiedla_boundaries.py

# Full Warsaw grid (not committed: 4.9 MB, 14 625 cells); add --warsaw-only to drop
# cells outside the city (2.9 MB, 8 572 cells)
uv run data/scripts/generate_grid.py -o data/grid/warsaw_grid.geojson

# Sample bbox (committed)
uv run data/scripts/generate_grid.py --bbox 20.98 52.18 21.06 52.24 -o data/samples/warsaw_grid_sample.geojson

python3 data/scripts/validate_data.py
```

## Inventory

Kanoniczny spis wszystkich plików z danymi, ich źródeł, licencji i metryk: [`docs/data/katalog-danych.md`](../docs/data/katalog-danych.md), generowany z [`catalog.json`](catalog.json). Każdy commitowany plik `.json`/`.geojson` w `data/` i `application/public/data/` musi być tam zarejestrowany (sprawdza `python3 data/scripts/validate_data.py`).

## Imported from `origin/mikolaj` (city-wide real data)

Snapshot of branch `mikolaj` @ `ece5d00` (2026-10-17), committed here so the app can use it before the branches merge. Files whose names clash with the (gitignored) siatka outputs in `poi/` live in **`poi_mikolaj/`**; the rest keep Mikołaj's paths. ETL code (`scripts/etl_*.py`, `um_api.py`, `poi_common.py`, `geocode_address.py`, `gtfs_feed.py`, `transit_*.py`, tests) and `docs/warsaw-data/` are copied unchanged.

> **Careful:** Mikołaj's scripts still write to `data/poi/<name>.geojson` (`transit`, `culture`, `sport`, `environment`, `future` clash with siatka). After re-running them, move the output to `poi_mikolaj/` and restore siatka outputs (`uv run siatka run` with `SIATKA_OFFLINE=1`, or `data/_local_backup/`). When `mikolaj` is merged into `master`, drop `poi_mikolaj/` and point consumers at `poi/`.

| Path | Source (ETL) | License | Contents |
|------|--------------|---------|----------|
| `poi_mikolaj/transit.geojson` | `lokalizacja-przystanow-komunikacji-miejskiej` (`etl_przystanki.py`) + [GTFS Warszawa](https://mkuran.pl/gtfs/warsaw.zip) (`etl_gtfs_przystanki.py`) | CC BY — Urząd m.st. Warszawy; ZTM (dane), M. Kuranowski (GTFS), © OSM | 4322 słupki (`meta.linie`, `tryby`, `odjazdy_dzien` na dzień roboczy 2026-10-19) + 38 stacji metra + 43 stacje kolei (SKM/KM) |
| `poi_mikolaj/amenities.geojson` | `toalety`, `lokalizacja-defibryzatorow-aed`, `eko-punkty`, `wolne-miejsca-parkingowe` | CC BY — Urząd m.st. Warszawy | 691 toalet, 709 AED, 773 eko-punktów, 18 parkingów |
| `poi_mikolaj/culture.geojson` | `kalendarz-wydarzen` (`etl_wydarzenia.py`) | CC BY — Urząd m.st. Warszawy | 384 punkty z 350 wydarzeń (z terminami ISO 8601) |
| `poi_mikolaj/sport.geojson` | `otwarte-boiska` (`etl_boiska.py`), `zajecia-sportowe` (`etl_zajecia_sportowe.py`) | CC BY — Urząd m.st. Warszawy | 308 szkół z otwartymi boiskami (1227 wierszy pogrupowanych), 513 zajęć sportowych |
| `poi_mikolaj/environment.geojson` | `monitoring-jakosci-powietrza`, `pogoda` | CC BY — Urząd m.st. Warszawy | 141 czujników (PM2.5, PM10, NO2…; 30 spoza miasta), 16 stacji pogodowych |
| `poi_mikolaj/future.geojson` | `budzet-obywatelski` (`etl_budzet_obywatelski.py`) | CC BY — Urząd m.st. Warszawy | 4769 punktów z 3239 projektów BO 2019–2027 (1050 w realizacji, 3719 zrealizowanych), `meta.koszt_zl`; bez autorów (RODO) |
| `lines/utrudnienia.geojson` | `utrudnienia-w-ruchu-drogowym` | CC BY — Urząd m.st. Warszawy | 61 utrudnień (linie/punkty) z `cell_ids` |
| `lines/trasy_turystyczne.geojson` | `trasy-turystyczne` | CC BY — Urząd m.st. Warszawy | 9 tras |
| `grid/czasy_przejazdu.geojson` | GTFS (`etl_czasy_przejazdu.py`, `transit_router.py`) | jak GTFS | 8 572 komórki 250 m: `t.{centrum,rondo_daszynskiego,sluzewiec}.{wszystkie,autobus,tramwaj,metro,kolej} = [średnia, min, max, n]` min, przyjazd 07:30–09:00 w dzień roboczy. Bez KM/WKD (Wesoła, Wawer, Ursus zawyżone) |

**What is committed vs. ignored.** Committed: the files above (~19 MB), boundaries, samples, scripts, and the app-facing outputs in `application/public/data/`. Ignored and rebuildable: siatka outputs in `poi/` and `grid/` (OSM layers: education, clinics, pharmacies, supermarkets, gastronomy, parks/forests, playgrounds; city WFS libraries/metro entrances), API caches in `raw/` (BO dumps contain authors' names, GTFS zip ~100 MB), noise contours cache, `_local_backup/`.

## Inventory — siatka ETL

<!-- siatka:inventory:start -->

Generowane przez `uv run siatka run` — nie edytuj ręcznie.

| Zbiór (dataset) | Źródło | Licencja | Pobrano | POI | Dane miasta |
|---|---|---|---|---|---|
| `osm_clinic` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:49:28+00:00 | 895 | nie |
| `osm_gastronomy` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:50:37+00:00 | 3383 | nie |
| `osm_kindergarten` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:40:25+00:00 | 1169 | nie |
| `osm_parks` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:43:07+00:00 | 986 | nie |
| `osm_pharmacy` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:39:43+00:00 | 605 | nie |
| `osm_planned_rail` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:49:59+00:00 | 2236 | nie |
| `osm_playground` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:39:12+00:00 | 3106 | nie |
| `osm_school_primary` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:41:05+00:00 | 435 | nie |
| `osm_school_secondary` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:41:05+00:00 | 250 | nie |
| `osm_supermarket` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:38:38+00:00 | 526 | nie |
| `osm_tram_stops` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:42:18+00:00 | 662 | nie |
| `osm_university` | [OpenStreetMap (Overpass API)](https://www.openstreetmap.org/copyright) | ODbL 1.0 — © współtwórcy OpenStreetMap | 2026-10-17T11:41:41+00:00 | 126 | nie |
| `um_aed` | [dane.um.warszawa.pl — Lokalizacja defibrylatorów (AED)](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:23+00:00 | 709 | tak |
| `um_air_quality` | [dane.um.warszawa.pl — Monitoring jakości powietrza](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:20+00:00 | 111 | tak |
| `um_bo_in_progress` | [dane.um.warszawa.pl — Budżet obywatelski](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:49:28+00:00 | 1000 | tak |
| `um_events` | [dane.um.warszawa.pl — Kalendarz wydarzeń](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:22+00:00 | 343 | tak |
| `um_pitches` | [dane.um.warszawa.pl — Otwarte boiska](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:47:22+00:00 | 1126 | tak |
| `um_road_works` | [dane.um.warszawa.pl — Utrudnienia w ruchu drogowym](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:23+00:00 | 374 | tak |
| `um_stops` | [dane.um.warszawa.pl — Lokalizacja przystanków komunikacji miejskiej](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:45+00:00 | 4480 | tak |
| `um_toilets` | [dane.um.warszawa.pl — Toalety](https://dane.um.warszawa.pl/pl/catalogue) | CC BY — Urząd m.st. Warszawy | 2026-10-17T11:46:17+00:00 | 695 | tak |
| `wfs_libraries` | [WFS m.st. Warszawy — BIBLIOTEKI](https://wfs.um.warszawa.pl/serwis?service=WFS&request=GetCapabilities) | Ponowne wykorzystanie bezpłatne; źródło: Urząd m.st. Warszawy | 2026-10-17T11:43:08+00:00 | 267 | tak |
| `wfs_metro_entrances` | [WFS m.st. Warszawy — METRO_WEJSCIA](https://wfs.um.warszawa.pl/serwis?service=WFS&request=GetCapabilities) | Ponowne wykorzystanie bezpłatne; źródło: Urząd m.st. Warszawy | 2026-10-17T11:41:41+00:00 | 233 | tak |
| `wfs_utw` | [WFS m.st. Warszawy — UNIWERSYTETY_TRZECIEGO_WIEKU](https://wfs.um.warszawa.pl/serwis?service=WFS&request=GetCapabilities) | Ponowne wykorzystanie bezpłatne; źródło: Urząd m.st. Warszawy | 2026-10-17T11:43:08+00:00 | 35 | tak |

<!-- siatka:inventory:end -->
