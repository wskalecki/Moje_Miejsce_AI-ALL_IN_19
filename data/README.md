# Data

**Owner:** data team (see [`docs/team/workstreams.md`](../docs/team/workstreams.md))

Datasets for **Siatka**: 1 km grid, per-cell metrics, POI GeoJSON.

## Schemas

- [`docs/data/grid-schema.md`](../docs/data/grid-schema.md)
- [`docs/data/poi-schema.md`](../docs/data/poi-schema.md)
- Agent rule: [`.cursor/rules/data-developer.mdc`](../.cursor/rules/data-developer.mdc)

## Manifest

[`manifest.json`](manifest.json) — paths loaded by the React app.

## Scripts

```bash
# Official district boundaries (needed for in_warsaw / district)
uv run data/scripts/fetch_district_boundaries.py

# Full Warsaw grid (large); add --warsaw-only to drop cells outside the city
python3 data/scripts/generate_grid.py -o data/grid/warsaw_grid_1km.geojson

# Sample bbox (committed)
python3 data/scripts/generate_grid.py --bbox 20.98 52.18 21.06 52.24 -o data/samples/warsaw_grid_sample.geojson

python3 data/scripts/validate_data.py
```

## Inventory

| Path | Source | License | Notes |
|------|--------|---------|-------|
| `boundaries/warszawa_dzielnice.geojson` | [WFS m.st. Warszawy `GRANICE_DZIELNIC`](https://wfs.um.warszawa.pl/serwis) | Ponowne wykorzystanie bezpłatne, źródło: Urząd m.st. Warszawy | 18 dzielnic, WGS84, uproszczone ~5 m; pobrane 2026-10-17 |
| `samples/warsaw_grid_sample.geojson` | generated | n/a | 42 cells, Mokotów patch |
| `samples/cell_metrics_sample.json` | generated demo | n/a | Persona scores for sample grid |
| `samples/poi_sample.geojson` | synthetic | n/a | 3 POI for layer spike |
| _TBD_ `poi/transit.geojson` | `lokalizacja-przystanow-komunikacji-miejskiej` | UM open data | |
| _TBD_ `grid/cell_metrics.json` | ETL aggregates | n/a | Production metrics |

Raw API dumps → `data/raw/` (gitignored). Large exports: LFS or external link.
