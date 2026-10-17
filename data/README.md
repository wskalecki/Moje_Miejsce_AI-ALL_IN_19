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
| _TBD_ `poi/transit.geojson` | `lokalizacja-przystanow-komunikacji-miejskiej` | UM open data | |
| _TBD_ `grid/cell_metrics.json` | ETL aggregates | n/a | Production metrics |

Raw API dumps → `data/raw/` (gitignored). Large exports: LFS or external link.
