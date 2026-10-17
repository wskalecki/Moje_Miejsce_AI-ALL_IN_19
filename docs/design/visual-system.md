# Visual system (map + personas)

## Tone

Urban, calm, data-forward — inspired by heatmap paving in [`urban_design.md`](../sources/urban_design.md) (gradient cubes), adapted for a dark map UI.

## Score color ramp (0–100)

Use for grid cell fill (persona score). Interpolate in HSL for smooth steps.

| Score | Color | Hex (guide) |
|-------|-------|-------------|
| 0–25 | cool / low fit | `#3d4f6f` |
| 25–50 | neutral | `#5a7a8c` |
| 50–75 | good | `#4a9b7f` |
| 75–100 | strong fit | `#c9e265` |

**Implementation:** `scoreToColor(score: number): [r,g,b,a]` in `application/src/lib/scoreColor.ts` — alpha ~0.55 on grid, 0.85 on hover.

**Missing score:** `#4a4a4a` at 0.35 alpha; border dashed.

## Typography

- UI: system stack or **DM Sans** / **Inter** (if loaded in `index.html`)
- Headings: semibold; map labels: 11–12px

## Persona cards

| Persona | Key | Accent |
|---------|-----|--------|
| Kasia — spokój | `kasia` | `#7eb8da` |
| Marek — centrum | `marek` | `#e8a87c` |
| Ania & Tomek — rodzina | `ania_tomek` | `#9bcf7f` |

Copy from [`koncept-aplikacji.md`](../core/koncept-aplikacji.md).

## Map chrome

- Full viewport map; floating panel right (cell detail) and top bar (persona + layers).
- Layer toggles: chips, multi-select (transport, AQ, sport, …).
- Commute filter: cells over max minutes → `#1a1a1a` @ 0.7 overlay.

## 3D buildings

**MVP (vector tiles):**

- Default extrusion color from style.
- Optional: `fill-extrusion-color` interpolate on `height` — low `#c4c4c4`, high `#e8e4dc`.

**Stretch (custom footprints):**

- Residential `#d4cfc7`, commercial `#b8c4d4`, highlight selection `#f5e6a8`.

## POI glyphs

| Category | Color | Size |
|----------|-------|------|
| transit | `#ffffff` | 6px |
| amenity | `#f0c674` | 5px |
| sport | `#9bcf7f` | 5px |
| environment | `#7eb8da` | 5px |
| culture | `#e8a87c` | 5px |

## Accessibility

- Do not rely on color alone: show numeric score in cell panel.
- Min contrast 4.5:1 on panel text (light text on `#1e1e24` panel).
