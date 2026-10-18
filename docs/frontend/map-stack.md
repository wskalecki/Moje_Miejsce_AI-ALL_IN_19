# Map stack (frontend)

**Decision:** MapLibre GL JS; 3D buildings from vector tile **fill-extrusion**.

**Implemented spike (2026-10-17):** siatka i POI jako warstwy MapLibre (`fill` / `line` / `circle`). deck.gl — opcjonalnie później.

## Why

| Need | Choice |
|------|--------|
| Web React app | `maplibre-gl` |
| 250 m colored grid | MapLibre GeoJSON `fill` + `line` (data-driven `score`) |
| 3D buildings | MapLibre extrusion from style layer `building` |
| Colorable buildings (MVP) | Data-driven `fill-extrusion-color` by height; stretch: GeoJSON footprints in `data/buildings/` |
| POI | MapLibre `circle` layer (lub deck.gl później) |

Avoid Cesium / Three-only map for hackathon scope. Use Blender → GLB in `3_AI-ALL-IN_mojeMiejsce/models/` for pitch only.

## Dependencies

```bash
cd application
npm install maplibre-gl
```

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_MAP_STYLE_URL` | MapLibre style JSON URL (MapTiler, Protomaps, etc.) |
| `VITE_MAP_API_KEY` | Provider API key when required (append per provider docs) |

Never commit real keys. See `application/.env.example`.

### MapTiler example

```
VITE_MAP_STYLE_URL=https://api.maptiler.com/maps/streets-v2/style.json?key=YOUR_KEY
```

Use a style that includes 3D buildings (streets-v2 / basic-v2 with building layer).

## Layer order (bottom → top)

1. MapLibre base + hillshade / landuse
2. MapLibre **building** fill-extrusion (3D)
3. MapLibre **grid** fill + line
4. MapLibre **commute mask** (fill, filtered-out cells) — TODO
5. MapLibre **POI** circles
6. HTML **work pin** marker — TODO

## Data loading

1. Read the generated files in `application/public/data/` (list and definitions: [`docs/data/katalog-danych.md`](../data/katalog-danych.md)).
2. Load grid GeoJSON + `cell_metrics.json`; join on `cell_id` / feature `id`.
3. Load POI files listed in manifest.

There are no synthetic samples: local dev uses the same real files.

## Camera (demo)

- **Center:** Warsaw ~ `[21.01, 52.23]`
- **Zoom:** 11–13 city overview; 14+ cell detail
- **Pitch:** 45–60° for 3D buildings
- **Bearing:** ~-20° (optional)

## Performance

- Full grid 8 572 polygons with `--warsaw-only` (2.9 MB raw, ≈ 0.33 MB gzip) — fine as one GeoJSON source.
- Show the grid `line` layer only from zoom 13 (`minzoom: 13`); below that the 250 m outlines blur into noise and cost draw time. Keep the `fill` layer at all zooms.
- If slow: simplify properties, use `updateTriggers`, or switch grid to PMTiles (post-MVP).

## Code entry

- [`application/src/components/GridMap.tsx`](../../application/src/components/GridMap.tsx) — spike implementation
- Persona color: [`docs/design/visual-system.md`](../design/visual-system.md)

## References

- [MapLibre fill extrusion](https://maplibre.org/maplibre-style-spec/layers/#fill-extrusion)
- [MapLibre GeoJSON source](https://maplibre.org/maplibre-style-spec/sources/#geojson)
