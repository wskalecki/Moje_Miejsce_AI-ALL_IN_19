# Start here — data developer

**Cel:** dostarczyć pliki z [`manifest.json`](../../data/manifest.json), żeby mapa mogła pokazać siatkę i POI w całej Warszawie.

## 1. Przeczytaj (15 min)

| Dokument | Po co |
|----------|--------|
| [`grid-schema.md`](grid-schema.md) | ID komórek, metryki, persony |
| [`poi-schema.md`](poi-schema.md) | GeoJSON POI + mapowanie slugów API |
| [`.cursor/rules/data-developer.mdc`](../../.cursor/rules/data-developer.mdc) | Reguły dla Claude/Cursor |

Koncept produktu: [`docs/core/koncept-aplikacji.md`](../core/koncept-aplikacji.md).

## 2. Narzędzia w repo

```bash
# Siatka ~1 km (pełna Warszawa → data/grid/, duży plik)
python3 data/scripts/generate_grid.py -o data/grid/warsaw_grid_1km.geojson

# Walidacja po każdym ETL
python3 data/scripts/validate_data.py
```

W Pythonie / skryptach ETL:

```python
from data.scripts.generate_grid import assign_cell
cell_id = assign_cell(lon, lat)
```

## 3. Kolejność pracy (MVP)

1. Pełna siatka + zaktualizowany `manifest.json` (`files.grid`, `bbox`).
2. POI z katalogu UM → `data/poi/*.geojson` (przystanki, toalety, AQ, sport, wydarzenia).
3. `data/grid/cell_metrics.json` — agregaty i `scores` dla `kasia`, `marek`, `ania_tomek`.
4. Wiersze w [`data/README.md`](../../data/README.md) (źródło, licencja, data).

**Surowe API:** `data/raw/` (gitignored). **Małe próbki:** już są w `data/samples/`.

## 4. Frontend (ktoś inny / później)

Mapa w `application/` ładuje ścieżki z manifestu. Po podmianie plików produkcyjnych zarejestruj je w `application/src/lib/hackathonData.ts` (importy) **lub** dodaj dynamiczne `fetch` — do ustalenia przy merge.

Spike mapy: `npm run dev` w `application/` (patrz [`docs/setup/README.md`](../setup/README.md)).

## 5. Gałęzie

`feat/nazwa-etl` z `master` (po merge PR z kontraktami). Jeden ETL ≈ jedna gałąź.
