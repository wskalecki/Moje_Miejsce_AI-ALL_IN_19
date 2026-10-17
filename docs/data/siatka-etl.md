# Framework ETL `siatka`: jak liczyć metryki i dodawać dane

Kod: [`data/scripts/siatka/`](../../data/scripts/siatka/) (Python ≥ 3.11, [uv](https://docs.astral.sh/uv/)). Produkuje pliki zgodne z [`grid-schema.md`](grid-schema.md) i [`poi-schema.md`](poi-schema.md).

## Uruchomienie

```bash
cd data/scripts/siatka
uv sync                       # raz
uv run siatka list            # wskaźniki, zbiory, brakujące wagi person
uv run siatka run             # pobierz → policz → zapisz pliki → validate_data.py
uv run siatka run --only aq_pm25_idw sport_places   # podgląd, NIC nie zapisuje
uv run pytest -q
```

- **Klucz do portalu miasta:** `UM_WARSZAWA_API_KEY=…` w `data/.env`. Bez klucza zbiory z portalu dają `null`, a reszta działa.
- **Cache:** wszystkie odpowiedzi trafiają do `data/raw/` (git je ignoruje). Ponowny przebieg trwa kilka sekund.
  - `SIATKA_REFRESH=1` wymusza ponowne pobranie danych,
  - `SIATKA_OFFLINE=1` pracuje wyłącznie z cache (np. na demo bez internetu).

## Co powstaje

| Plik | Zawartość |
|---|---|
| `data/grid/warsaw_grid_1km.geojson` | Siatka: tylko komórki w granicach Warszawy (608), z `district` |
| `data/grid/cell_metrics.json` | Kontrakt: `scores` (4 persony), `metrics`, `narrative.pl`. **Rozszerzenia:** `metrics_norm` (0–100), `narrative_by_persona`, `district` |
| `data/grid/indicators.json` | Opis każdej metryki: etykieta, jednostka, progi, kategoria UI, źródła z datą pobrania; wagi person; lista zbiorów |
| `data/poi/{category}.geojson` | Punkty do warstw mapy, z `cell_id` |
| `data/manifest.json`, `data/README.md` | Aktualizowane automatycznie (tabela źródeł między znacznikami `siatka:inventory`) |

## Jak dodać nowe dane (zwykle jeden plik)

Utwórz moduł w `src/siatka/indicators/`. Jest wykrywany automatycznie.

```python
from siatka.indicator import NearestDistance
from siatka.model import POI, dataset
from siatka.sources import osm   # albo um_api, city_wfs, address

@dataset("osm_dentist", osm.OSM_SOURCE)          # klucz zbioru + źródło (licencja, URL)
def dentists():
    return osm.pois(['["amenity"="dentist"]'], source_key="osm", category="amenity", subtype="dentist")

INDICATORS = [
    NearestDistance(
        key="dentist_dist_m",                        # klucz w cell_metrics.json (snake_case)
        label="Najbliższy dentysta",
        category="zdrowie",                          # grupa w UI (siatka.indicator.CATEGORIES)
        good=400, bad=2000,                          # 400 m → 100 pkt, 2 km → 0 pkt
        datasets=("osm_dentist",),
    ),
]
```

Następnie, jeśli metryka ma wpływać na ocenę, dodaj jej wagę (0–3) w `src/siatka/personas.py`.

**Gotowe typy wskaźników** (`siatka/indicator.py`):

| Typ | Liczy | Przykład |
|---|---|---|
| `NearestDistance` | metry do najbliższego punktu (filtr `where=`) | przedszkole, AED |
| `CountWithin` | liczba punktów w promieniu (`distinct=True` liczy unikalne `source_id`) | place zabaw, utrudnienia |
| `IdwValue` | interpolacja wartości z punktów | PM2.5 ze stacji |
| `NearestPolygonDistance` | metry do krawędzi wielokąta (0 wewnątrz) | parki, lasy |
| `DistrictValue` | jedna wartość na dzielnicę | ceny RCN, przestępczość |

**Źródła** (`siatka/sources/`):
- `um_api.get(akcja, payload)`: portal miasta,
- `city_wfs.point_pois(warstwa, …)`: miejski WFS, oba układy współrzędnych obsłużone,
- `osm.pois([...])` / `osm.polygons([...])`: OpenStreetMap,
- `address.geocode("ul. X 12")`: miejskie punkty adresowe.

Pułapki poszczególnych źródeł opisuje [`zrodla-danych.md`](zrodla-danych.md).

## Zasady liczenia

- **Odległości** liczone od środka komórki w EPSG:2180 (metry).
- **Normalizacja** przez jawne progi: `good` daje 100, `bad` daje 0, liniowo pomiędzy, z obcięciem do zakresu. Kierunek wynika z tego, czy `good` jest większe od `bad`.
- **Wynik persony** to średnia ważona dostępnych metryk. Gdy dane obejmują mniej niż 40% sumy wag persony, wynik to `null`. **Brak danych to zawsze `null`, nigdy `0`.**
- **Narracja** to 2 największe atuty (iloczyn oceny i wagi) i 1 słabość spośród metryk o wadze ≥ 1,5, w obu przypadkach z prawdziwą liczbą. W `narrative.pl` trafia narracja persony głównej (`ania_tomek`), w `narrative_by_persona` narracje wszystkich.
- **Jeden niedziałający zbiór nie zatrzymuje przebiegu:** jego metryki dostają `null`, a błąd trafia do `indicators.json` i tabeli w `data/README.md`.

## Zmiana siatki

Siatka jest w jednym miejscu: `src/siatka/grid.py`. Opakowuje zespołowy `data/scripts/generate_grid.py`, z którego biorą się ID komórek i `assign_cell`. Przy zmianie standardu siatki (np. 500 m) wystarczy zmienić `Grid.build()` i `Grid.assign()`. Wskaźniki i zbiory danych zostają bez zmian.

## Mock: heatmapa i wyniki osiedli

Skrypt [`data/scripts/build_mock_scores.py`](../../data/scripts/build_mock_scores.py) (czysty Python 3, bez sieci i zależności) liczy z lokalnych plików `data/grid/*`, `data/poi/*` i `data/boundaries/warszawa_osiedla.geojson` dwa statyczne pliki dla frontendu (commitowane, serwowane z Netlify):

| Plik | Zawartość |
|---|---|
| `application/public/data/heat.json` | `{bbox, spacing_m: 250, profiles, points: [[lng, lat, wStudent, wRodzina, wSenior], …]}`, wagi 0–1 do warstwy MapLibre `heatmap` (~5,8 tys. punktów, ~190 KB) |
| `application/public/data/osiedla-scores.json` | `{<id osiedla>: {student, rodzina, senior (0–100), cats: {10 kategorii UI: 0–100}, blurb: {profil: zdanie}}}` dla 143 osiedli |

Metoda (to **mock na demo**, nie model rekomendacji):

1. Siatka punktów co 125 m w granicach osiedli. W każdym punkcie: gęstość POI wg podtypu (jądro Gaussa, σ = 400 m) oraz `metrics_norm` komórek ~1 km interpolowane IDW.
2. Mapowanie na 10 kategorii UI, m.in.: `cisza` to odwrotność gęstości gastronomii i przystanków + brak utrudnień + zieleń + odległość od centrum; `zielen` to park/las + PM2.5; `komunikacja` to metro (odległość) + tramwaj + przystanki; `zycieNocne` to gastronomia + wydarzenia + uczelnie.
3. `cats` osiedla to średnia z punktów wewnątrz poligonu (czyli ważona powierzchnią), rozciągnięta między osiedlami do 5–98.
4. Dopasowanie profilu to średnia ważona `cats` (wagi w `WEIGHTS` w skrypcie) × łagodny priorytet dzielnicy (`DISTRICT_PRIOR`), przeskalowana do 35–91.
5. Nadpisania na demo: Powiśle (student, 96), Błonia Wilanowskie (rodzina, 95) i Saska Kępa (senior, 96) zajmują 1. miejsce. Ich kluczowe kategorie są podbite, a na heatmapie mają wzmocnienie gaussowskie wokół centroidu.
6. Heatmapa: wynik profilu w punkcie minus 0,55 × średnia trzech profili (żeby wzory się różniły), × priorytet dzielnicy, skalowane percentylami (p35–p99,5) i podniesione do potęgi 1,4. Punkty z wagą < 0,05 są pomijane.
7. `blurb`: 2 najmocniejsze kategorie i 1 słabość, wstawione w szablony zależne od poziomu dopasowania. Szablon wybiera hash `id|profil`, więc wynik jest deterministyczny.

Uruchomienie: `python3 data/scripts/build_mock_scores.py` (ok. 8 s). Skrypt waliduje wyniki (liczba osiedli, zakresy, nadpisania na 1. miejscu, rozmiar pliku < 700 KB) i wypisuje top 5 dla każdego profilu.
