# Visual system (map + personas)

## Tone

**Urban Arcade** — pastelowa heatmapa na niebieskim niebie, pikselowa siatka dziedzińca + izometryczne „kostki” danych (moodboard zespołu, hackathon 2026). Solarpunk / arcade: miękkie kontury, glow przy aktywnych kafelkach, nie ciemny dashboard.

Źródło koncepcji: [`urban_design.md`](../sources/urban_design.md).

## Score color ramp (0–100)

Niski fit → wysoki fit: **chłód** → **mięta** → **żółty** → **koral** → **róż**.

| Score | Znaczenie | Hex (guide) |
|-------|-----------|-------------|
| 0 | chłodny / niski fit | `#a5d8ff` |
| 25 | błękit–mięta | `#a8d5ba` |
| 50 | neutralny dobry | `#e9d56a` |
| 75 | mocny | `#f4a261` |
| 100 | hotspot | `#e85d8a` |

**Implementation:** `scoreToRgba()` + `SCORE_RAMP_HEX` w `application/src/lib/scoreColor.ts`. Siatka na mapie: `fill-opacity` ~0.82, obrys `#5a6d88` @ 0.55. Lab kafelków: alpha ~0.9, glow `--tile-glow`.

**Missing score:** `#c8d6e5` @ 0.45 alpha; obrys przerywany.

## Grid tile (UI lab)

| Stan | Opis |
|------|------|
| Static | płaski piksel, cienki outline |
| Color pop | uniesienie + zamiana koloru w apexie (~50% keyframe) |
| Interactive | lift + glow bez zmiany koloru (hover / wybór) |

Prototyp: `/lab/grid` (osobna podstrona) → `application/src/pages/GridTileLab.tsx`.

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
