# Data documentation

Canonical schemas and ETL conventions for **Siatka** (250 m grid in EPSG:2180 + POI).

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
4. **Catalog** — register every new file, source and metric in [`data/catalog.json`](../../data/catalog.json) and run `python3 data/scripts/data_catalog.py --render`.

## Samples (frontend dev)

[`data/samples/warsaw_grid_sample.geojson`](../../data/samples/warsaw_grid_sample.geojson) is a small grid patch (geometry only). There are no synthetic metric samples: the app reads the real outputs in `application/public/data/`.

## Agents

Data work with Claude/Cursor: rule [`.cursor/rules/data-developer.mdc`](../../.cursor/rules/data-developer.mdc).

## Catalog

API slugs: [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) (parent `hackathon/` repo).
