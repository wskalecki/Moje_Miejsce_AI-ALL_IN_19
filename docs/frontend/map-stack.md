# Map stack (frontend)

**Decision:** MapLibre GL JS + deck.gl on the same map; 3D buildings from vector tile **fill-extrusion**.

## Why

| Need | Choice |
|------|--------|
| Web React app | `maplibre-gl` + `@deck.gl/*` |
| ~1 km colored grid | deck.gl `GeoJsonLayer` (or MapLibre fill) |
| 3D buildings | MapLibre extrusion from style layer `building` |
| Colorable buildings (MVP) | Data-driven `fill-extrusion-color` by height; stretch: GeoJSON footprints in `data/buildings/` |
| POI | deck.gl `ScatterplotLayer` / MapLibre circles |

Avoid Cesium / Three-only map for hackathon scope. Use Blender → GLB in `presentation/models/` for pitch only.

## Dependencies

```bash
cd application
npm install maplibre-gl @deck.gl/core @deck.gl/layers @deck.gl/react @deck.gl/mapbox
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
3. deck.gl **grid** polygons (semi-transparent fill + outline)
4. deck.gl **commute mask** (gray extruded or fill for filtered-out cells)
5. deck.gl **POI** points
6. MapLibre / HTML **work pin** marker

## Data loading

1. Fetch [`data/manifest.json`](../../data/manifest.json) (dev: import from `@data` alias or `public/data` copy).
2. Load grid GeoJSON + `cell_metrics.json`; join on `cell_id` / feature `id`.
3. Load POI files listed in manifest.

Paths for local dev: [`data/samples/`](../../data/samples/) via Vite alias `@data` → `../data`.

## Camera (demo)

- **Center:** Warsaw ~ `[21.01, 52.23]`
- **Zoom:** 11–13 city overview; 14+ cell detail
- **Pitch:** 45–60° for 3D buildings
- **Bearing:** ~-20° (optional)

## Performance

- Full grid ~ hundreds of polygons — fine as one GeoJSON.
- If slow: simplify properties, use `updateTriggers`, or switch grid to PMTiles (post-MVP).

## Code entry

- [`application/src/components/GridMap.tsx`](../../application/src/components/GridMap.tsx) — spike implementation
- Persona color: [`docs/design/visual-system.md`](../design/visual-system.md)

## References

- [MapLibre fill extrusion](https://maplibre.org/maplibre-style-spec/layers/#fill-extrusion)
- [deck.gl MapboxOverlay](https://deck.gl/docs/api-reference/mapbox/mapbox-overlay) (works with MapLibre map instance)
