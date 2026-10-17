# Core

Kanoniczna definicja projektu — aktualizuj, gdy zespół się zgadza na zmianę.

## Dokumenty

| Dokument | Zawartość |
|----------|-----------|
| **[`koncept-aplikacji.md`](koncept-aplikacji.md)** | Pełny koncept produktu (Siatka 1 km, warstwy, persony, MVP, dane) |

## Skrót

- **Problem** — młode osoby i rodziny nie widzą **okolicy na lata** (edukacja, dojazd, środowisko, codzienność) przy wyborze mieszkania.
- **Users** — pary i rodzice 28–38 lat planujący mieszkanie w Warszawie; pracujący w jednym/dwóch punktach miasta.
- **MVP scope** — mapa komórek ~1×1 km, 3 persony demo, pin pracy + filtr dojazdu, warstwy z API UM (transport, AQ, toalety, sport, wydarzenia, utrudnienia, RCN); szkoły/metro/parki jako import lub faza 2.
- **Architecture** — React → mapa + panel; agregaty siatki w Supabase/Postgres; ETL w `data/`.
- **Data** — [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) + pliki statyczne w `data/` (placówki oświatowe, metro).

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-17 | Stack: React + Supabase | Team template |
| 2026-10-17 | Koncept: mapa kwadratów ~1 km + persony | Czytelny overview miasta pod wybór miejsca na życie (W3) |

Add rows as you decide; keep one line per decision.
