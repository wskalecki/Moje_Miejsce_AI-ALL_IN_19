# Core

Kanoniczna definicja projektu — aktualizuj, gdy zespół się zgadza na zmianę.

## Dokumenty

| Dokument | Zawartość |
|----------|-----------|
| **[`koncept-aplikacji.md`](koncept-aplikacji.md)** | Pełny koncept produktu (Siatka 200 m, warstwy, persony, MVP, dane) |
| **[`mock-spec.md`](mock-spec.md)** | Specyfikacja mocka na demo: ankieta → mapa → 3 wyróżnione osiedla → przejście 3D → panel osiedla; plan zadań T0–T13 |

## Skrót

- **Problem** — młode osoby i rodziny nie widzą **okolicy na lata** (edukacja, dojazd, środowisko, codzienność) przy wyborze mieszkania.
- **Users** — pary i rodzice 28–38 lat planujący mieszkanie w Warszawie; pracujący w jednym/dwóch punktach miasta.
- **MVP scope** — mapa komórek 200 × 200 m, 3 persony demo, pin pracy + filtr dojazdu, warstwy z API UM (transport, AQ, toalety, sport, wydarzenia, utrudnienia, RCN); szkoły/metro/parki jako import lub faza 2.
- **Architecture** — React → mapa + panel; agregaty siatki w Supabase/Postgres; ETL w `data/`.
- **Data** — [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) + pliki statyczne w `data/` (placówki oświatowe, metro).

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-17 | Stack: React + Supabase | Team template |
| 2026-10-17 | Koncept: mapa kwadratów ~1 km + persony | Czytelny overview miasta pod wybór miejsca na życie (W3) |
| 2026-10-17 | Map stack: MapLibre GL (spike UI) | Siatka/POI z GeoJSON; pełny produkt UI — później (`docs/frontend/map-stack.md`) |
| 2026-10-17 | Kontrakty danych: grid + POI + manifest | `docs/data/`, `data/manifest.json`, `data/scripts/` |
| 2026-10-17 | Siatka: kwadraty 200 m w EPSG:2180 zamiast ~1 km w stopniach | Prawdziwe kwadraty o równym polu; 200 m odróżnia cichą ulicę od arterii. Definicja: `docs/data/grid-schema.md` |
| 2026-10-17 | Demo = czysty mock frontendowy: ankieta (3 kroki) → mapa (gradient → granice osiedli MSI) → 3 wyróżnione osiedla (Powiśle, Miasteczko Wilanów, Saska Kępa) z przejściem kinowym 3D i panelem osiedla | Pierwszy kontakt z produktem ma zachwycić bez globalnych obliczeń; spec: [`mock-spec.md`](mock-spec.md), notatki: [`../notes/2026-10-17-transkrypcja-mock.md`](../notes/2026-10-17-transkrypcja-mock.md) |

Add rows as you decide; keep one line per decision.
