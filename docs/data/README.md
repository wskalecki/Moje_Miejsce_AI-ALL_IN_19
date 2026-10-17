# Data documentation

Canonical schemas and ETL conventions for **Siatka** (200 m grid in EPSG:2180 + POI).

## Documents

| Document | Contents |
|----------|----------|
| **[`katalog-danych.md`](katalog-danych.md)** | **Kanoniczny spis źródeł, zbiorów, metryk (z definicjami), założeń i plików z danymi.** Generowany z [`data/catalog.json`](../../data/catalog.json); zgodność sprawdza `python3 data/scripts/validate_data.py` |
| **[`START-here-data-dev.md`](START-here-data-dev.md)** | Onboarding — kolejność zadań dla data dev |
| [`grid-schema.md`](grid-schema.md) | Grid geometry, cell IDs, metrics, persona scores |
| [`poi-schema.md`](poi-schema.md) | POI GeoJSON fields, categories, catalog slug mapping |
| **[`zrodla-danych.md`](zrodla-danych.md)** | **Zweryfikowane źródła danych: wywołania API, pułapki, statusy, decyzje „dlaczego to źródło”** — sprawdź przed szukaniem danych |
| [`siatka-etl.md`](siatka-etl.md) | Framework ETL `data/scripts/siatka`: uruchomienie, dodawanie wskaźników (1 plik), zasady liczenia |

## Flow

1. **Grid** — `uv run data/scripts/generate_grid.py …` produces `data/grid/warsaw_grid.geojson` (full city) or a sample bbox. ETL gets `cell_id` from its `assign_cell(lon, lat)`, which needs `pyproj` in the env.
2. **POI ETL** — scripts under `data/scripts/` fetch Warsaw open data → `data/poi/*.geojson` with `cell_id`.
3. **Metrics** — aggregate per cell → `data/grid/cell_metrics.json` (or enrich grid GeoJSON).
4. **Manifest** — [`data/manifest.json`](../../data/manifest.json) lists paths the React app loads.

## Samples (frontend dev)

Committed under [`data/samples/`](../../data/samples/) so the map works without full ETL or API keys.

## Agents

Data work with Claude/Cursor: rule [`.cursor/rules/data-developer.mdc`](../../.cursor/rules/data-developer.mdc).

## Catalog

API slugs: [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) (parent `hackathon/` repo).
