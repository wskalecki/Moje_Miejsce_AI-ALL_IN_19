# Moje Miejsce

**Znajdź w Warszawie okolicę, która pasuje do Twojego życia, zanim zaczniesz szukać mieszkania.**

Zespół nr **19 AI ALL IN** · **Warsaw Open Data Hackathon 2026** (17–18.10.2026, 42 Warsaw) · wyzwanie **3 „Warszawa: Twój ruch!”**

| | |
|---|---|
| Prezentacja (8 slajdów, z filmem) | PDF (zapasowy): [`3_AI-ALL-IN_mojeMiejsce/3_AI-ALL-IN_mojeMiejsce (plik zapasowy).pdf`](3_AI-ALL-IN_mojeMiejsce/3_AI-ALL-IN_mojeMiejsce%20(plik%20zapasowy).pdf) · [`3_AI-ALL-IN_mojeMiejsce/pitch/deck/index.html`](3_AI-ALL-IN_mojeMiejsce/pitch/deck/index.html) · PDF: [`3_AI-ALL-IN_mojeMiejsce/pitch/deck/export/moje-miejsce-pitch.pdf`](3_AI-ALL-IN_mojeMiejsce/pitch/deck/export/moje-miejsce-pitch.pdf) |
| Film prezentujący system (2:25) | [`3_AI-ALL-IN_mojeMiejsce/pitch/deck/media/moje-miejsce-system.mp4`](3_AI-ALL-IN_mojeMiejsce/pitch/deck/media/moje-miejsce-system.mp4) |
| Skrypt wystąpienia | [`3_AI-ALL-IN_mojeMiejsce/pitch/skrypt-wystapienia.md`](3_AI-ALL-IN_mojeMiejsce/pitch/skrypt-wystapienia.md) |

## Co robi aplikacja

1. **Profil.** Użytkownik wybiera etap życia (student, rodzina, senior), zaznacza, co jest dla niego ważne (np. cisza, zieleń, kultura, gastronomia), i czy szuka najmu, czy kupna.
2. **Mapa dopasowania.** Mapa ciepła całej Warszawy pokazuje, gdzie okolica najlepiej pasuje do jego wag. Suwaki 0–5 zmieniają wynik na żywo, a ranking 143 osiedli (obszary Miejskiego Systemu Informacji) aktualizuje się od razu.
3. **Panel osiedla.** Dla wybranego osiedla: wynik w każdej kategorii na tle średniej Warszawy, ważne miejsca w pobliżu z czasem dojścia, czas dojazdu komunikacją do trzech centrów biurowych, ceny mieszkań z Rejestru Cen Nieruchomości, hałas oraz oś czasu 2026–2030 z inwestycjami miejskimi i projektami budżetu obywatelskiego.
4. **Warstwy.** Na mapie można włączyć punkty z danych miasta (przystanki, szkoły, apteki, zieleń, kultura, sport i inne) oraz widok 3D wybranych osiedli.

Wszystkie liczby pochodzą z otwartych danych, bez ręcznych korekt. Opisy w panelu powstają ze stałego szablonu na podstawie metryk.

## Wykorzystane dane miejskie

Pełny wykaz 42 zbiorów z licencjami, metodami i datami pobrania jest w katalogu danych [`data/catalog.json`](data/catalog.json), opisanym w [`docs/data/katalog-danych.md`](docs/data/katalog-danych.md). Zweryfikowane endpointy i pułapki API opisuje [`docs/data/zrodla-danych.md`](docs/data/zrodla-danych.md).

**Otwarte dane m.st. Warszawy:**

| Źródło | Zbiory |
|---|---|
| [Portal otwartych danych (API)](https://dane.um.warszawa.pl) | przystanki komunikacji miejskiej, toalety, defibrylatory AED, otwarte boiska szkolne, zajęcia sportowe, monitoring jakości powietrza, kalendarz wydarzeń, utrudnienia w ruchu, budżet obywatelski 2019–2027, trasy turystyczne, eko-punkty, parkingi, pogoda (stacje ZOM) |
| [Usługi mapowe (WFS)](https://wfs.um.warszawa.pl/serwis) | granice dzielnic, obszary MSI (osiedla), biblioteki, uniwersytety trzeciego wieku, wejścia do metra, punkty adresowe, budynki |
| [Rejestr Cen Nieruchomości](https://architektura.um.warszawa.pl/udostepniane-dane-rcn1) | transakcje lokali mieszkalnych |

**Inne otwarte źródła:** rozkład jazdy ZTM w formacie GTFS ([mirror M. Kuranowskiego](https://mkuran.pl/gtfs/)), strategiczne mapy hałasu GIOŚ (Lden i Lnight, 2022), OpenStreetMap (szkoły, przedszkola, apteki, przychodnie, sklepy, parki, gastronomia, planowane linie metra i tramwaju, budynki 3D), trasy piesze i rowerowe OSRM, geokoder Nominatim oraz zdjęcia z Wikimedia Commons na licencjach CC.

Dane: © m.st. Warszawa, GIOŚ, ZTM Warszawa, współtwórcy OpenStreetMap (ODbL).

## Założenia projektu

Pełna lista założeń z uzasadnieniem jest w sekcji `assumptions` w [`data/catalog.json`](data/catalog.json). Najważniejsze:

- **Jednostki przestrzenne.** Siatka zespołu to kwadraty 250 m w układzie EPSG:2180 ([`docs/data/grid-schema.md`](docs/data/grid-schema.md)). Wyniki agregujemy do 143 osiedli MSI i 14 576 kwartałów ulicznych.
- **Odległości.** Liczymy w linii prostej w EPSG:2180, a metryki „w promieniu 1 km” obejmują obiekty w tym promieniu. Czas pieszo w interfejsie to odległość × 1,3 przy 78 m/min.
- **Czasy przejazdu komunikacją.** Własny router na rozkładzie GTFS (Connection Scan Algorithm) z dojściem pieszym do 800 m i przesiadkami pieszymi do 400 m, z co najmniej 60 s na przesiadkę. Liczymy średnią dla przyjazdów 07:30–09:00 w dzień roboczy. Rozkład nie obejmuje Kolei Mazowieckich ani WKD.
- **Ocena.** Wynik kategorii to pozycja względna osiedla na tle całej Warszawy (percentyl). Wagi kategorii dla profili są jawne i jednakowe dla wszystkich osiedli.
- **Ceny.** Z RCN bierzemy tylko lokale mieszkalne sprzedane na wolnym rynku, o powierzchni od 15 m² i cenie 3–60 tys. zł/m².
- **Polityka danych.** Wyłącznie źródła miejskie, publiczne lub otwarte. Żadnych danych zebranych z portali ogłoszeniowych i żadnych danych osobowych: imion i nazwisk autorów projektów budżetu obywatelskiego nie kopiujemy.

## Technologie

| Warstwa | Narzędzia |
|---|---|
| Aplikacja | React 19, TypeScript, Vite, MapLibre GL JS, Motion, lucide-react; podkład mapy OpenFreeMap |
| Dane i ETL | Python 3.11+ (uv), Shapely, pyproj; skrypty w [`data/scripts/`](data/scripts/), framework wskaźników w [`data/scripts/siatka/`](data/scripts/siatka/) |
| Routing komunikacji | GTFS ZTM + własny router CSA ([`data/scripts/transit_router.py`](data/scripts/transit_router.py)) |
| Wideo i prezentacja | Remotion, Playwright, ffmpeg ([`3_AI-ALL-IN_mojeMiejsce/pitch/`](3_AI-ALL-IN_mojeMiejsce/pitch/)) |
| Wdrożenie | Netlify ([`application/netlify.toml`](application/netlify.toml)) |

Przy pracy korzystaliśmy z asystentów AI (Claude Code, Cursor).

## Uruchomienie

Aplikacja działa bez kluczy API i bez backendu: czyta przygotowane pliki z [`application/public/data/`](application/public/data/). Wymaga Node.js 20+ (zalecany 22).

```bash
cd application
npm install
npm run dev
```

Potem otwórz adres podany przez Vite (zwykle `http://localhost:5173`).

Testy aplikacji: `npm test`. Testy skryptów danych: `uv run --with pytest --with pyproj --with shapely pytest data/scripts/tests -q`.

**Odświeżenie danych** jest opcjonalne, bo gotowe pliki są w repozytorium. Zbiory z portalu API wymagają klucza `UM_WARSZAWA_API_KEY` w pliku `data/.env`, który nie jest w repozytorium. Kolejność kroków opisują [`data/README.md`](data/README.md) i [`docs/data/siatka-etl.md`](docs/data/siatka-etl.md).

## Struktura repozytorium

| Folder | Zawartość |
|---|---|
| [`application/`](application/) | Aplikacja Moje Miejsce (React + Vite + MapLibre) |
| [`data/`](data/) | Katalog danych, wyniki ETL i skrypty |
| [`docs/`](docs/) | Dokumentacja: dane ([`docs/data/`](docs/data/)), koncept i specyfikacja ([`docs/core/`](docs/core/)), notatki |
| [`3_AI-ALL-IN_mojeMiejsce/`](3_AI-ALL-IN_mojeMiejsce/) | Prezentacja, film i narzędzia do nagrań |
| [`pomysly-mati/`](pomysly-mati/) | Ranking pomysłów z początku hackathonu |

## Jak pracujemy

1. **`master`** to gałąź integracyjna. Nie commitujemy na niej feature’ów ani fixów.
2. **Jedna zmiana = jedna gałąź:** `feat/krótki-slug` lub `fix/krótki-slug`, potem merge do `master` (PR mile widziany).
3. **Commity:** `feat: short title`, `fix: short title` (Conventional Commits).
4. Szczegóły: [`CLAUDE.md`](CLAUDE.md), reguły Cursor: [`.cursor/rules/git-standards.mdc`](.cursor/rules/git-standards.mdc).
