# Team workstreams (5 people)

## Roles

| # | Role | Branch examples | Deliverables |
|---|------|-----------------|--------------|
| 1 | **Data platform** | `feat/grid-generator` | `generate_grid.py`, `manifest.json`, `validate_data.py`, samples |
| 2 | **POI ETL** | `feat/poi-transit`, `feat/poi-amenities` | `data/poi/*.geojson` from UM APIs |
| 3 | **Grid analytics** | `feat/cell-metrics` | `cell_metrics.json`, commute heuristic |
| 4 | **Frontend map** | `feat/map-core` | MapLibre + deck.gl, layers, cell panel |
| 5 | **Design / 3D** | `feat/visual-system`, `docs/design` | Ramps, persona UI, pitch assets |

## Dependency graph

```
P1 grid + manifest + samples
 ├── P2 POI ETL
 ├── P3 metrics / scores
 └── P4 map (can start on samples day 1)
P5 design ──► P4 (tokens, mockups)
```

## Daily merge order

1. **Morning:** P1 merges schema/sample fixes → everyone pulls `master`.
2. **Midday:** P2/P3 merge data → P4 rebases and wires layers.
3. **Evening:** P4 + P5 merge demo-ready UI into `master` via PR.

## Git

- One issue ≈ one branch (`feat/...`).
- PR to `master`; see [`.cursor/rules/git-standards.mdc`](../../.cursor/rules/git-standards.mdc).

## Communication

- Blockers on missing API fields → note in issue + `data/README.md`.
- New metric key → update [`grid-schema.md`](../data/grid-schema.md) and inventory.

## MVP checklist (shared)

- [ ] Sample grid visible with 3 personas coloring
- [ ] 3D buildings visible (pitched map)
- [ ] At least one real POI layer from API
- [ ] Cell click shows metrics + 3 narrative bullets
- [ ] Demo work pin + gray-out (heuristic)
