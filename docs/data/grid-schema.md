# Grid schema (1 km cells)

## Purpose

Stable partition of Warsaw into ~1 km × 1 km cells. Each cell is one map polygon, one metrics bucket, and one scoring unit for personas.

## Files

| Path | Description |
|------|-------------|
| `data/grid/warsaw_grid_1km.geojson` | Full city grid (generated, may be gitignored if large) |
| `data/grid/cell_metrics.json` | Scores and metrics keyed by `cell_id` |
| `data/samples/warsaw_grid_sample.geojson` | Small bbox for local dev |

## Geometry

- **CRS:** WGS84 (EPSG:4326), GeoJSON `[longitude, latitude]`.
- **Type:** `Polygon`, axis-aligned rectangles (not equal-area; good enough for hackathon UX).
- **Steps** (at ~52°N, per product concept):
  - **Latitude:** `0.009°` ≈ 1 km
  - **Longitude:** `0.014°` ≈ 1 km
- **Extent:** `WARSAW_BBOX = (20.85, 52.10, 21.28, 52.37)` — covers the whole city (official borders span lon 20.852–21.271, lat 52.098–52.368). The south edge stays at the origin so cell IDs never change; a ~200 m sliver of southern Wilanów is outside the grid. Use `--warsaw-only` to drop cells outside the city (608 cells instead of 930).
- **Origin:** south-west corner of the Warsaw bounding box used by the generator (`GRID_ORIGIN_LON`, `GRID_ORIGIN_LAT` in `data/scripts/generate_grid.py`). All cell edges align to this global grid.

## Cell feature properties (`warsaw_grid_*.geojson`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Same as feature `id`, e.g. `cell_r042_c018` |
| `row` | integer | yes | Row index from origin (south → north) |
| `col` | integer | yes | Col index from origin (west → east) |
| `center` | `[lon, lat]` | yes | Polygon centroid |
| `in_warsaw` | boolean \| null | no | `true` if the cell overlaps Warsaw (official district borders); `null` if boundaries were not available |
| `district` | string \| null | no | Warsaw district of the cell center, or of the first sampled point inside the city for border cells |

Feature-level `id` must match `properties.id`.

## District boundaries

`data/boundaries/warszawa_dzielnice.geojson` — 18 districts from the city WFS (`GRANICE_DZIELNIC`), converted to WGS84 by `data/scripts/fetch_district_boundaries.py`. `generate_grid.py` reads it to fill `in_warsaw` and `district` (standard library only). Helpers for ETL: `load_districts()`, `district_at(lon, lat, districts)`.

## Cell ID format

```
cell_r{row:03d}_c{col:03d}
```

`row` / `col` are computed from origin and step sizes (see `assign_cell` in `data/scripts/generate_grid.py`).

## Cell metrics (`cell_metrics.json`)

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601",
  "personas": ["kasia", "marek", "ania_tomek"],
  "cells": {
    "cell_r042_c018": {
      "scores": { "kasia": 72, "marek": 41, "ania_tomek": 68 },
      "metrics": {
        "transit_stops_count": 12,
        "tram_lines_nearby": 3,
        "aq_pm25_nearest": 18.2,
        "toilets_with_changing_table": 1,
        "sport_places": 4,
        "events_30d": 7,
        "rcn_m2_median_district": 12500
      },
      "narrative": {
        "pl": ["Sentence 1.", "Sentence 2.", "Sentence 3."]
      },
      "commute_heuristic_min": { "mokotow_demo": 28 }
    }
  }
}
```

### Rules

- **Scores** are integers `0–100` per persona (precomputed for demo).
- **Missing data** → JSON `null`, not `0`.
- **Metrics** keys are snake_case; document new keys in `data/README.md` inventory.
- Frontend colors cells from `scores[activePersona]` using the ramp in [`docs/design/visual-system.md`](../design/visual-system.md).

## Merging grid + metrics

**Option A (runtime):** app loads grid GeoJSON + `cell_metrics.json`, joins on `id`.

**Option B (build):** ETL writes scores into grid `properties` before deploy.

MVP uses **Option A** with files listed in `data/manifest.json`.
