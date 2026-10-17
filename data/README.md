# Data

**Owner:** data team (see [`docs/team/workstreams.md`](../docs/team/workstreams.md))

Datasets for **Siatka**: 200 m grid (squares in EPSG:2180), per-cell metrics, POI GeoJSON.

## Schemas

- [`docs/data/grid-schema.md`](../docs/data/grid-schema.md)
- [`docs/data/poi-schema.md`](../docs/data/poi-schema.md)
- Agent rule: [`.cursor/rules/data-developer.mdc`](../.cursor/rules/data-developer.mdc)

## Manifest

[`manifest.json`](manifest.json) — paths loaded by the React app.

## Scripts

`generate_grid.py` needs `pyproj`. `uv run` installs it from the script header; ETL code that imports `assign_cell` needs `pyproj` in its own env (e.g. `uv run --with pyproj python your_etl.py`). `validate_data.py` uses the standard library only.

```bash
# Official district boundaries (needed for in_warsaw / district)
uv run data/scripts/fetch_district_boundaries.py

# Full Warsaw grid (not committed: 7.6 MB, 22 860 cells); add --warsaw-only to drop
# cells outside the city (4.5 MB, 13 318 cells)
uv run data/scripts/generate_grid.py -o data/grid/warsaw_grid.geojson

# Sample bbox (committed)
uv run data/scripts/generate_grid.py --bbox 20.98 52.18 21.06 52.24 -o data/samples/warsaw_grid_sample.geojson

python3 data/scripts/validate_data.py
```

## Inventory

| Path | Source | License | Notes |
|------|--------|---------|-------|
| `boundaries/warszawa_dzielnice.geojson` | [WFS m.st. Warszawy `GRANICE_DZIELNIC`](https://wfs.um.warszawa.pl/serwis) | Ponowne wykorzystanie bezpłatne, źródło: Urząd m.st. Warszawy | 18 dzielnic, WGS84, uproszczone ~5 m; pobrane 2026-10-17 |
| `samples/warsaw_grid_sample.geojson` | generated | n/a | 917 cells (200 m), Mokotów / Śródmieście patch |
| `samples/cell_metrics_sample.json` | generated demo | n/a | Synthetic persona scores for 897 of the 917 sample cells (re-keyed from the 1 km demo; 20 cells on the southern edge have no entry) |
| `samples/poi_sample.geojson` | synthetic | n/a | 3 POI for layer spike |
| `poi/transit.geojson` | `lokalizacja-przystanow-komunikacji-miejskiej` (`etl_przystanki.py`) | CC BY — Urząd m.st. Warszawy | 4322 słupki w granicach miasta (bez podmiejskich); brak typu bus/tram; pobrane 2026-10-17 |
| `poi/amenities.geojson` | `toalety` (`etl_toalety.py`) | CC BY — Urząd m.st. Warszawy | 691 toalet; `meta.przewijak`, `bez_barier`, `platna`; pobrane 2026-10-17 |
| `poi/amenities.geojson` | `lokalizacja-defibryzatorow-aed` (`etl_aed.py`) | CC BY — Urząd m.st. Warszawy | 709 AED; `device_availability` to Tak / Nie / Ograniczona (Tak = całodobowy); pobrane 2026-10-17 |
| `poi/environment.geojson` | `monitoring-jakosci-powietrza` (`etl_powietrze.py`) | CC BY — Urząd m.st. Warszawy | 141 stacji, w tym 30 spoza Warszawy (tag `poza_warszawa`, do interpolacji). API daje tylko bieżący pomiar, więc ETL dopisuje każdy do `raw/monitoring-jakosci-powietrza/history.jsonl` i liczy `meta.srednie` (24 h i 7 dni, z liczbą pomiarów `n_*`). Średnie mają sens dopiero przy uruchamianiu co godzinę |
| `poi/culture.geojson` | `kalendarz-wydarzen` (`etl_wydarzenia.py`) | CC BY — Urząd m.st. Warszawy | 384 punkty z 350 wydarzeń z lokalizacją (300 bez punktu pominięte); terminy w ISO 8601 |
| `poi/sport.geojson` | `otwarte-boiska` (`etl_boiska.py`) | CC BY — Urząd m.st. Warszawy | 308 szkół (1227 wierszy pogrupowanych); geokodowane z `wfs:punkty_adresowe` |
| `poi/sport.geojson` | `zajecia-sportowe` (`etl_zajecia_sportowe.py`) | CC BY — Urząd m.st. Warszawy | 513 punktów; punkt z mapy, inaczej geokodowany adres; 108 zajęć tylko z dzielnicą pominięte |
| `lines/utrudnienia.geojson` | `utrudnienia-w-ruchu-drogowym` (`etl_utrudnienia.py`) | CC BY — Urząd m.st. Warszawy | 61 linii/punktów z listą przecinanych komórek `cell_ids` (nie POI) |
| `poi/amenities.geojson` | `eko-punkty` (`etl_ekopunkty.py`) | CC BY — Urząd m.st. Warszawy | 773 punkty: odbiór leków 501, elektroodpady 158, PSZOK 67, jadłodzielnie 47; bez kontaktów |
| `poi/amenities.geojson` | `wolne-miejsca-parkingowe` (`etl_parkingi.py`) | CC BY — Urząd m.st. Warszawy | 18 parkingów (1 bez współrzędnych); wolne miejsca to migawka z `meta.stan_na` |
| `poi/environment.geojson` | `pogoda` (`etl_pogoda.py`) | CC BY — Urząd m.st. Warszawy | 16 stacji drogowych, w tym temperatura nawierzchni; tylko ostatni pomiar |
| `poi/future.geojson` | `budzet-obywatelski` (`etl_budzet_obywatelski.py`) | CC BY — Urząd m.st. Warszawy | 4769 punktów z 3239 projektów 2019–2027 (w realizacji 1050, zrealizowane 3719); bez danych autorów (RODO) |
| `lines/trasy_turystyczne.geojson` | `trasy-turystyczne` (`etl_trasy_turystyczne.py`) | CC BY — Urząd m.st. Warszawy | 9 tras z punktami w `meta.punkty` i `cell_ids` (530 komórek) |

Nieobsłużone zbiory portalu: `konsultacje-spoleczne` (brak współrzędnych), `rejestr-cen-nieruchomosci` (HTTP 500), `linie-dostepne-na-przystanku` i `odjazdy-dla-linii-z-przystanku` (zapytanie na słupek), `lokalizacja-pojazdow-komunikacji-miejskiej` (pozycje co 10 s), `pojazdy-transportu-publicznego`, `segregacja-odpadow`, `typy-odpadow` (bez lokalizacji).
| _TBD_ `grid/cell_metrics.json` | ETL aggregates | n/a | Production metrics |

Raw API dumps → `data/raw/` (gitignored). Large exports: LFS or external link.

### API ETL (portal dane.um.warszawa.pl)

Klucz w `data/.env` (`UM_WARSZAWA_API_KEY=…`, gitignored). Wspólny klient: `scripts/um_api.py`, zapis POI: `scripts/poi_common.py`, geokoder adresów: `scripts/geocode_address.py`. `cell_id` zawsze z `assign_cell` (siatka 200 m, EPSG:2180).

```bash
uv run data/scripts/etl_toalety.py            # pobiera z API do data/raw/, zapisuje data/poi/
uv run data/scripts/etl_toalety.py --offline  # przebudowa z cache
uv run --with pytest --with pyproj pytest data/scripts/tests -q
```
