# wwa42hackathon_ai_all_in

Repozytorium zespołu **AI All In** na **Warsaw Open Data Hackathon 2026**.

- **Kiedy:** sob. 17.10 – niedz. 18.10.2026
- **Gdzie:** kampus 42 Warsaw, al. Solidarności 171B
- **Wyzwanie:** W3 „Warszawa: Twój ruch!” (kategoria otwarta, min. 1 zbiór otwartych danych m.st. Warszawy)

## Struktura repozytorium

| Folder | Zawartość |
|--------|-----------|
| [`application/`](application/) | Frontend React (Vite + TypeScript) z Supabase |
| [`docs/`](docs/) | Dokumentacja — notatki, decyzje, setup |
| [`data/`](data/) | Zbiory danych i eksporty |
| [`presentation/`](presentation/) | Modele 3D i grafiki do demo i slajdów |
| [`pomysly-mati/`](pomysly-mati/) | Ranking pomysłów (`POMYSLY.md`, `POMYSLY_W1_W2.md`) i generator ocen |

## Quick start

1. Przeczytaj [`docs/setup/README.md`](docs/setup/README.md).
2. Skonfiguruj Supabase w `application/.env` (patrz `application/.env.example`).
3. W katalogu `application/`: `npm install` → `npm run dev`.

## Gałęzie

| Gałąź | Zawartość |
|---|---|
| `master` | Gałąź główna (domyślna) — pracujemy stąd |
| `pomysly-mati` | Historia rankingu pomysłów (zsynchronizowane w `pomysly-mati/`) |

## Jak pracujemy

1. Feature’y na krótkich gałęziach (np. `jan-ideas`), merge do `master` przez pull request.
2. `master` trzyma aktualny szkielet projektu i dokumentację.
