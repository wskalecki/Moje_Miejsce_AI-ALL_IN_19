# Data documentation

Canonical schemas and ETL conventions for **Siatka** (1 km grid + POI).

## Documents

| Document | Contents |
|----------|----------|
| [`grid-schema.md`](grid-schema.md) | Grid geometry, cell IDs, metrics, persona scores |
| [`poi-schema.md`](poi-schema.md) | POI GeoJSON fields, categories, catalog slug mapping |

## Flow

1. **Grid** — `data/scripts/generate_grid.py` produces `warsaw_grid_1km.geojson` (full city) or sample bbox.
2. **POI ETL** — scripts under `data/scripts/` fetch Warsaw open data → `data/poi/*.geojson` with `cell_id`.
3. **Metrics** — aggregate per cell → `data/grid/cell_metrics.json` (or enrich grid GeoJSON).
4. **Manifest** — [`data/manifest.json`](../../data/manifest.json) lists paths the React app loads.

## Samples (frontend dev)

Committed under [`data/samples/`](../../data/samples/) so the map works without full ETL or API keys.

## Agents

Data work with Claude/Cursor: rule [`.cursor/rules/data-developer.mdc`](../../.cursor/rules/data-developer.mdc).

## Catalog

API slugs: [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) (parent `hackathon/` repo).
