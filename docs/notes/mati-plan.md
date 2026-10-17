# Plan Matiego: Siatka + ulepszenia

Wersja Matiego (gałąź `feat/mati-siatka`). Baza to koncept Jana ([`koncept-aplikacji.md`](../core/koncept-aplikacji.md)) i kontrakty danych ([`docs/data/`](../data/)), do których dochodzą ulepszenia opisane niżej. Każdy kawałek ma być zgodny z kontraktami, żeby dało się go wydzielić jako PR do konkretnego issue.

## Decyzje

| # | Decyzja | Dlaczego |
|---|---------|----------|
| 1 | Siatka i ID z `generate_grid.py` (komórka ok. 1 km, `assign_cell`) | Kontrakt zespołu |
| 2 | Wyniki person liczone w ETL i zapisane w `cell_metrics.json` (pliki statyczne, bez Supabase) | Kontrakt zespołu: frontend tylko prezentuje |
| 3 | Dodatkowo `metrics_norm` (0–100 na metrykę) i katalog wskaźników `indicators.json` | Umożliwia późniejsze suwaki wag i wyjaśnianie oceny |
| 4 | Persony: `kasia`, `marek`, `ania_tomek` + **`senior`** | Prośba o grupę seniorów, rozszerzenie niczego nie psuje |
| 5 | Normalizacja metryk progami (`good` → 100, `bad` → 0), wynik persony to średnia ważona dostępnych metryk | Każdą ocenę da się wyjaśnić jednym zdaniem |
| 6 | Brak danych → `null` (nigdy `0`) | Kontrakt zespołu |
| 7 | Hałas: zbiór z `feat/noise-dataset` (EEA 2022) przeliczony na 1 km, do tego czasu `null` | Bez dublowania pracy |
| 8 | Ceny: RCN z API (obecnie HTTP 500), w razie potrzeby źródło zapasowe na poziomie dzielnicy | Kontrakt przewiduje `rcn_m2_median_district` |
| 9 | Przy każdej metryce źródło, licencja i data pobrania | Zaufanie i punkty za „wykorzystanie danych” |
| 10 | Token API miasta w zmiennej `UM_WARSZAWA_API_KEY` (plik `data/.env`, nigdy w repo) | Ta sama nazwa co u Mikołaja |

## Framework `data/scripts/siatka/`

**Zasada: nowe dane = nowy plik w `src/siatka/indicators/`.**

- **Zbiór danych (`@dataset`)** to funkcja zwracająca listę punktów (`POI`) z kategorią i podtypem zgodnymi z [`poi-schema.md`](../data/poi-schema.md). Surowe odpowiedzi są cache'owane w `data/raw/`.
- **Wskaźnik** to deklaracja oparta na gotowych typach (`NearestDistance`, `CountWithin`, `CountInCell`, `IdwValue`, `DistrictValue`) albo własna klasa. Każdy ma klucz metryki, etykietę, jednostkę, progi, kierunek (czy więcej znaczy lepiej) i źródło.
- **`uv run siatka run`** pobiera dane, liczy metryki, normalizuje, liczy wyniki person i narrację, a potem zapisuje:
  - `data/grid/warsaw_grid_1km.geojson`,
  - `data/grid/cell_metrics.json`,
  - `data/grid/indicators.json`,
  - `data/poi/*.geojson`,
  - zaktualizowany `manifest.json`,
  - tabelę źródeł w `data/README.md`.

  Na koniec uruchamia `validate_data.py`.

## Zadania

Status: ⬜ do zrobienia · 🔄 w toku · ✅ zrobione

| # | Zadanie | Status |
|---|---------|--------|
| 1 | Gałąź `feat/mati-siatka` na aktualnym `master` | ✅ |
| 2 | PR [#23](https://github.com/wskalecki/wwa42hackathon_ai_all_in/pull/23): pełny zasięg siatki + `in_warsaw`/`district` | ✅ (czeka na review) |
| 3 | Framework: model, rejestr, geometria, cache, normalizacja, persony, zapis zgodny z kontraktami, CLI, testy | 🔄 |
| 4 | Wskaźniki bez tokenu: metro, edukacja (OSM), parki, place zabaw, apteki i przychodnie, gastronomia, biblioteki, UTW, tramwaje | ⬜ |
| 5 | Wskaźniki z API miasta (wymaga tokenu): przystanki, toalety (przewijak), boiska, zajęcia sportowe, AQ (IDW ze 141 stacji), wydarzenia, utrudnienia, AED, RCN | ⬜ |
| 6 | „Co się tu zmieni”: BO w realizacji, konsultacje, sporządzane MPZP, planowane metro i tramwaje (OSM), kategoria POI `future` | ⬜ |
| 7 | Czas dojazdu: pinezki demo, heurystyka z premią za metro i tramwaj, 2 pinezki (gorszy czas) | ⬜ |
| 8 | Bezpieczeństwo na poziomie dzielnic (KSP) z komunikatem o ograniczeniach | ⬜ |
| 9 | Hałas z `feat/noise-dataset` → 1 km | ⬜ (czeka na zbiór) |
| 10 | Frontend: wczytanie pełnych danych, wybór persony z seniorem, panel komórki, warstwy, pinezka pracy, 3D | ⬜ |
| 11 | Narracja AI (Bielik) z liczb komórki | ⬜ |
| 12 | 3 scenariusze demo pod pitch 5 min | ⬜ |

## Blokery i informacje dla zespołu

- **Token API miasta:** potrzebny w `data/.env` (`UM_WARSZAWA_API_KEY`). Mikołaj ma działający.
- **RCN:** API zwraca HTTP 500 (raport Mikołaja).
- **Demo w koncepcie trwa 8–10 min**, a regulamin daje 5 min + 2 min Q&A.
