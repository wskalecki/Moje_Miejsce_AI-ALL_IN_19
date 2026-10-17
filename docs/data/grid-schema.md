# Grid schema (200 m cells)

## Purpose

Stable partition of Warsaw into 200 m × 200 m cells. Each cell is one map polygon, one metrics bucket, and one scoring unit for personas.

## Files

| Path | Description |
|------|-------------|
| `data/grid/warsaw_grid.geojson` | Full city grid. Generated, kept out of git by `data/.gitignore` (4.5 MB with `--warsaw-only`, 7.6 MB without) |
| `data/grid/cell_metrics.json` | Scores and metrics keyed by `cell_id` |
| `data/samples/warsaw_grid_sample.geojson` | Small bbox for local dev (917 cells, committed) |

```bash
# Full city; uv installs pyproj from the script header
uv run data/scripts/generate_grid.py --warsaw-only -o data/grid/warsaw_grid.geojson
```

## Geometry

- **Grid CRS:** EPSG:2180 (ETRS89 / Poland CS92, metres). Cells are exact squares in this system.
- **Origin:** E `620000`, N `470000` (`ORIGIN_E`, `ORIGIN_N` in `data/scripts/generate_grid.py`), the south-west corner of cell `r000_c000`, south-west of Warsaw.
- **Cell size:** `CELL_SIZE_M = 200` metres.
- **Row / col** of a point with EPSG:2180 coordinates (E, N):
  - `row = floor((N − 470000) / 200)`, grows south → north
  - `col = floor((E − 620000) / 200)`, grows west → east
- **Cell ID:** `cell_r{row:03d}_c{col:03d}` (see [Cell ID format](#cell-id-format)).
- **Output:** GeoJSON in WGS84 (EPSG:4326), `[longitude, latitude]`, coordinates rounded to 7 decimals (about 1 cm). Because the squares are defined in EPSG:2180, in lon/lat every cell is rotated about 1.6° clockwise and measures ≈ 0.0029° lon × 0.0018° lat. Do not rebuild cells from lon/lat steps; use `assign_cell`, `cell_polygon` and `cell_center`.
- **Extent:** the generator writes every cell whose centre lies inside `WARSAW_BBOX = (20.85, 52.09, 21.28, 52.37)` (west, south, east, north; official borders span lon 20.852–21.271, lat 52.098–52.368). The bbox only selects which cells are written: cell IDs depend only on the EPSG:2180 origin, so they are the same in the sample, the full grid and any ETL output.
- **Cell counts** (full city, measured 2026-10-17, about 8 s per run on a laptop):

  | Command | Cells | Rows | Cols | File size |
  |---------|-------|------|------|-----------|
  | `uv run data/scripts/generate_grid.py -o …` | 22 860 | 5–163 | 30–180 | 7.6 MB (≈ 1.0 MB gzip) |
  | `… --warsaw-only` | 13 318 | 11–160 | 32–176 | 4.5 MB (≈ 0.5 MB gzip) |

- **Check value:** Palace of Culture (21.0060, 52.2318) → `cell_r084_c084` (covered by `data/scripts/tests/`).

Changing CELL_SIZE_M or the origin changes every cell ID: agree it with the team first.

### Metadata

The FeatureCollection carries a top-level `metadata` object:

| Field | Value |
|-------|-------|
| `gridVersion` | `2`. Version 1 was the old ~1 km degree grid; its cell IDs do not match this grid. |
| `crs` | `"EPSG:2180"`, the CRS the cells are defined in (coordinates are still WGS84) |
| `cellSizeM` | `200` |
| `origin` | `[620000, 470000]`, E and N in EPSG:2180 |
| `districtsSource` | `"data/boundaries/warszawa_dzielnice.geojson"`, or `null` if that file was missing |

## Cell feature properties (`warsaw_grid*.geojson`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Same as feature `id`, e.g. `cell_r084_c084` |
| `row` | integer | yes | Row index from origin (south → north) |
| `col` | integer | yes | Col index from origin (west → east) |
| `center` | `[lon, lat]` | yes | Centre of the square, converted to WGS84 |
| `in_warsaw` | boolean \| null | no | `true` if the cell overlaps Warsaw (official district borders); `null` if boundaries were not available. Overlap is tested at 9 points per cell (centre, corners, edge midpoints), so a few cells with only a sliver of the city get `false` |
| `district` | string \| null | no | Warsaw district of the cell center, or of the first sampled point inside the city for border cells |

Feature-level `id` must match `properties.id`.

## District boundaries

`data/boundaries/warszawa_dzielnice.geojson` — 18 districts from the city WFS (`GRANICE_DZIELNIC`), converted to WGS84 by `data/scripts/fetch_district_boundaries.py`. `generate_grid.py` reads it to fill `in_warsaw` and `district`. Helpers for ETL: `load_districts()`, `district_at(lon, lat, districts)`.

## Cell ID format

```
cell_r{row:03d}_c{col:03d}
```

`row` / `col` are computed in EPSG:2180 from the origin and `CELL_SIZE_M` (see `assign_cell` in `data/scripts/generate_grid.py`). Warsaw uses rows 11–160 and cols 32–176.

ETL scripts get IDs from `assign_cell(lon, lat)`. Importing it needs `pyproj` in the environment, e.g. `uv run --with pyproj python your_etl.py`, or a PEP 723 header with `dependencies = ["pyproj>=3.6"]` like the one in `generate_grid.py`.

## Cell metrics (`cell_metrics.json`)

```json
{
  "schemaVersion": 1,
  "gridVersion": 2,
  "generatedAt": "ISO-8601",
  "personas": ["kasia", "marek", "ania_tomek"],
  "cells": {
    "cell_r084_c084": {
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

- **`gridVersion`** names the grid the `cell_id`s belong to (`2` = this 200 m grid).
- **Scores** are integers `0–100` per persona (precomputed for demo).
- **Missing data** → JSON `null`, not `0`.
- **Metrics** keys are snake_case; document new keys in `data/README.md` inventory.
- Frontend colors cells from `scores[activePersona]` using the ramp in [`docs/design/visual-system.md`](../design/visual-system.md).

## Merging grid + metrics

**Option A (runtime):** app loads grid GeoJSON + `cell_metrics.json`, joins on `id`.

**Option B (build):** ETL writes scores into grid `properties` before deploy.

MVP uses **Option A** with files listed in `data/manifest.json`.
