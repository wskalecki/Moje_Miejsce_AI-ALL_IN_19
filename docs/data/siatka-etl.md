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

## Mock: heatmapa i wyniki osiedli (zastąpiony)

> **Od iteracji 2 nieużywany.** Pliki `heat.json` i `osiedla-scores.json` generuje teraz `build_osiedle_metrics.py` z prawdziwych danych (sekcja niżej). Opis zostaje dla historii (tag `mock-v1-msi`).

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

## Prawdziwe wskaźniki osiedli (`build_osiedle_metrics.py`)

Skrypt [`data/scripts/build_osiedle_metrics.py`](../../data/scripts/build_osiedle_metrics.py) zastępuje mock. **Bez ręcznych korekt, priorytetów dzielnic i podłóg dla wyróżnionych osiedli.** Każda liczba pochodzi z jednego ze zbiorów: OSM (siatka), WFS miasta, portal dane.um.warszawa.pl i GTFS (dane Mikołaja z `data/poi_mikolaj/`, `data/lines/`, `data/grid/czasy_przejazdu.geojson`), GIOŚ HAŁAS.

```bash
python3 -I data/scripts/noise/fetch_gios_noise.py              # raz: ~230 MB do data/raw/noise/ (ignorowane)
data/scripts/siatka/.venv/bin/python -I data/scripts/noise/gios_noise.py           # scala kontury, kontrola km²
data/scripts/siatka/.venv/bin/python -I data/scripts/build_osiedle_metrics.py      # ~10 s, waliduje i wypisuje rankingi
```

Wymaga lokalnych wyników siatki (`data/poi/*.geojson`) i cache `data/raw/{osm,city_address_points}` (`uv run siatka run`). Bez pobranego hałasu metryki hałasu mają `null`, a `cisza` liczy się bez nich.

| Plik (`application/public/data/`) | Zawartość | Rozmiar |
|---|---|---|
| `osiedla-metrics.json` | `meta` (reguła, źródła, metody, wagi kategorii i profili) + `osiedla.{id}`: `anchor`, `metrics.{klucz}: {value, unit, source, method}` (68 metryk), `cats`, `match`, `rank`, `blurb` | ~940 KB |
| `osiedla-scores.json` | Dotychczasowy format `{id: {student, rodzina, senior, cats, blurb}}` | ~110 KB |
| `heat.json` | Dotychczasowy format, siatka 250 m, `[lng, lat, wStudent, wRodzina, wSenior]` | ~230 KB |
| `heat-categories.json` | `{categories: [10], spacing_m: 250, points: [[lng, lat, c1..c10]]}`, 0–1, 8264 punkty, do podglądu jednej kategorii | ~555 KB |

**Reguła „w pobliżu” (jedna dla wszystkich metryk `*_1km`):** promień 1 km w linii prostej od **punktu odniesienia osiedla**, czyli punktu adresowego najbliższego średniej wszystkich miejskich punktów adresowych w osiedlu (środek zabudowy, zawsze wewnątrz granicy). `*_in` to liczba obiektów w granicy osiedla. Odległości (`*_dist_m`) są od punktu odniesienia. Udziały (`green_share`, `noise_*_share`) są liczone dokładnie z geometrii jako % powierzchni osiedla. Oceny opierają się na `*_1km`, bo koło ma tę samą powierzchnię dla każdego osiedla; `*_in` zależy od wielkości osiedla i służy tylko do wyświetlania.

**Metryki:** przedszkola, szkoły podstawowe, szkoły średnie, uczelnie, przychodnie, apteki, supermarkety, gastronomia, bary i puby, place zabaw (OSM); biblioteki, UTW (WFS); wydarzenia w ciągu 30 dni, AED, przystanki, odjazdy w dzień roboczy (suma `odjazdy_dzien`), linie, szkoły z otwartymi boiskami i liczba boisk, miejsca zajęć sportowych, projekty BO (liczba i suma kosztów), utrudnienia (portal); odległość do metra, kolei (SKM/KM), parku lub lasu, przedszkola, szkoły, przychodni, apteki i supermarketu; udział parków i lasów ≥ 1 ha w osiedlu i w kole 1 km; PM2.5 z najbliższego czujnika (pomiar godzinowy, poza ocenami); udział powierzchni z hałasem drogowym lub kolejowym Lden ≥ 55/60/65/70 dB (osobno drogi i kolej ≥ 60); mediana czasu dojazdu do centrum (Rondo Dmowskiego) z komórek 200 m, wszystkie środki oraz osobno autobus, tramwaj, metro i kolej.

**Kategorie (0–100):** każda to średnia ważona rang percentylowych metryk wśród 143 osiedli (`meta.category_metrics`), potem ponownie ranga percentylowa. Rozkład jest więc równomierny 0–100 (odchylenie ~29). Remisy, np. zero bibliotek, dostają średnią rangę, dlatego minimum `kultura` wynosi 12.

| Kategoria | Metryki (waga; „−” = mniej znaczy lepiej) |
|---|---|
| cisza | hałas ≥ 60 dB − 0,45; hałas ≥ 65 dB − 0,25; gastronomia w 1 km − 0,15; odjazdy w 1 km − 0,15 |
| zielen | udział parków i lasów 0,4; to samo w kole 1 km 0,3; odległość do parku lub lasu − 0,3 |
| komunikacja | odjazdy 0,3; linie 0,1; metro − 0,2; kolej − 0,1; czas do centrum − 0,3 |
| gastronomia | lokale w 1 km 1,0 |
| sport | szkoły z boiskami 0,45; miejsca zajęć 0,35; place zabaw 0,2 |
| kultura | biblioteki 0,4; wydarzenia 30 dni 0,45; UTW 0,15 |
| edukacja | przedszkola 0,35; szkoły podstawowe 0,35; średnie 0,15; odległość do przedszkola − 0,075 i do szkoły − 0,075 |
| zdrowie | przychodnie 0,4; apteki 0,35; odległość do przychodni − 0,1; AED 0,15 |
| zakupy | supermarkety 0,7; odległość do supermarketu − 0,3 |
| zycieNocne | bary i puby 0,5; gastronomia 0,2; uczelnie 0,15; wydarzenia 0,15 |

**Dopasowanie profilu** to średnia ważona 10 kategorii z wagami `PROFILE_WEIGHTS` czytanymi wprost z `application/src/app/dictionary.ts`. Bez przeskalowania, więc zakresy to: student 7–92, rodzina 16–82, senior 19–79.

**Heatmapy:** siatka 250 m w granicach osiedli, te same metryki liczone od każdego punktu. Udziały zieleni i hałasu liczone są w kwadracie 1 × 1 km z rastra 50 m. Kategorie to rangi percentylowe wśród punktów (`heat-categories.json`, 0–1). `heat.json` zawiera rangę percentylową dopasowania profilu podniesioną do kwadratu (to tylko kontrast wizualny); punkty z wagą < 0,05 są pominięte. Uwaga: dopasowania profili są silnie skorelowane (osiedla 0,91–0,97, heatmapa 0,89–0,97), bo prawie wszystkie kategorie poza zielenią i ciszą rosną z gęstością zabudowy. Aby mapy profili wyraźniej się różniły, UI powinien liczyć gradient z `heat-categories.json` według wag suwaków.

**Opisy (`blurb`)** zawierają tylko liczby: 2 najmocniejsze kategorie profilu (waga ≥ 0,1) i najsłabszą, np. „17 przedszkoli i 6 szkół podstawowych w promieniu 1 km; …. Słabiej: 19 przystanków i 3 849 odjazdów dziennie w 1 km, do centrum ok. 39 min.”

**Znane ograniczenia danych:**
- Zajęcia sportowe pochodzą tylko z oferty miejskich OSiR-ów (513), a wydarzenia tylko z miejskiego kalendarza (339 punktów w oknie 30 dni).
- Czasy dojazdu nie obejmują KM i WKD.
- Parki i lasy to tylko obiekty OSM ≥ 1 ha (bez skwerów).
- Tramwaj jest wliczony w hałas kolejowy, bo GIOŚ nie ma osobnej warstwy.

### Uczciwe rankingi (143 osiedla, przebieg 2026-10-17)

Wyróżnione osiedla (miejsce, w nawiasie dopasowanie):

| Osiedle | student | rodzina | senior |
|---|---|---|---|
| Powiśle (Śródmieście) | #8 (85) | #23 (67) | #7 (73) |
| Błonia Wilanowskie (Wilanów) | #50 (65) | #39 (62) | #40 (63) |
| Saska Kępa (Praga-Południe) | #29 (74) | #57 (55) | #73 (51) |

Dlaczego tak:
- **Błonia Wilanowskie** mają słabą komunikację: 19 przystanków i 3 849 odjazdów w 1 km, do metra Imielin 2 km, do centrum 39 min. Zieleń w kole 1 km zajmuje tylko 3%.
- **Saska Kępa** ma mało dużej zieleni (1% powierzchni, park ≥ 1 ha 660 m od środka zabudowy). Hałas ≥ 60 dB obejmuje tam 58% powierzchni, a miejski kalendarz nie ma w promieniu 1 km żadnego wydarzenia w ciągu 30 dni.

Top 10 dla każdego profilu:

| # | student | rodzina | senior |
|---|---|---|---|
| 1 | Muranów (Śródmieście) 92 | Stare Bielany (Bielany) 82 | Stare Bielany (Bielany) 79 |
| 2 | Nowolipki (Wola) 90 | Słodowiec (Bielany) 80 | Słodowiec (Bielany) 78 |
| 3 | Mirów (Wola) 89 | Natolin (Ursynów) 78 | Śródmieście Północne (Śródmieście) 76 |
| 4 | Śródmieście Północne (Śródmieście) 89 | Muranów (Śródmieście) 77 | Natolin (Ursynów) 76 |
| 5 | Śródmieście Południowe (Śródmieście) 87 | Ursynów Północny (Ursynów) 77 | Muranów (Śródmieście) 75 |
| 6 | Nowa Praga (Praga-Północ) 86 | Jelonki Północne (Bemowo) 75 | Ursynów Północny (Ursynów) 75 |
| 7 | Stare Bielany (Bielany) 85 | Szczęśliwice (Ochota) 73 | Powiśle (Śródmieście) 73 |
| 8 | Powiśle (Śródmieście) 85 | Koło (Wola) 71 | Jelonki Północne (Bemowo) 72 |
| 9 | Stary Mokotów (Mokotów) 84 | Rakowiec (Ochota) 70 | Grochów (Praga-Południe) 70 |
| 10 | Stara Praga (Praga-Północ) 84 | Nowolipki (Wola) 70 | Nowolipki (Wola) 70 |
