---
name: record-app-walkthrough
description: Nagrywa płynny, powtarzalny przejazd po funkcjach aplikacji webowej (screen recording 1920×1080 z kursorem i znacznikami akcji) przez Playwright + CDP screencast, gotowy do montażu. Użyj, gdy ktoś chce nagrać demo / walkthrough / product video / prezentację systemu, pokazać funkcjonalności aplikacji na filmie, „nagraj jak działa aplikacja”, „zrób screencast”. Pierwszy krok przed skillem edit-walkthrough-video.
---

# Nagranie przejazdu po aplikacji (Playwright + CDP screencast)

Wynik: **jedno ciągłe nagranie** `NAME.mp4` (domyślnie 3200×1800 = viewport 1600×900 × DPR 2, żeby zoomy w montażu były ostre; `DPR=1.2` daje 1920×1080; 30 kl./s, H.264) + `NAME-markers.json` z czasem każdego kroku („beatu”). Montaż (skill `edit-walkthrough-video`) tnie nagranie po nazwach znaczników, więc po zmianie w aplikacji wystarczy nagrać jeszcze raz — cięcia dopasują się same.

Dlaczego tak, a nie nagrywanie ekranu ręcznie: skrypt jest powtarzalny (nowa wersja aplikacji = nowe nagranie w 4 min), ruch kursora jest płynny i ludzki, nie ma literówek ani zawahań, a znaczniki dają montażowi dokładne czasy. Nic nie kosztuje — żadnych płatnych modeli.

Działający przykład w tym repo: `presentation/pitch/tools/record-system.mjs` (ankieta → mapa → zmiana wag → osiedle → oś czasu → warstwy 3D).

## Wymagania

- Node 18+, ffmpeg (`brew install ffmpeg`), Python 3 + Pillow (do arkuszy kontrolnych).
- Playwright **poza** `package.json` projektu (jednorazowe narzędzie):
  ```bash
  mkdir -p /tmp/rec && cd /tmp/rec && npm i playwright && npx playwright install chromium
  export PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs
  ```
- Uruchomiona aplikacja lokalnie na **własnym porcie** (inne sesje mogą zajmować domyślny), np. `cd application && npx vite --port 5176 --strictPort` w tle. Po pracy zatrzymaj serwer.

## Procedura

### 1. Ustal scenariusz z użytkownikiem
Spisz listę kroków: co klikamy, w jakiej kolejności, jaki stan ma być widać na końcu (np. „profil Senior, zmiana wag pokazuje inne top 3, powrót, klik w Groszówkę, wszystkie sekcje panelu, kończymy warstwami 3D”). Każdy krok = jeden znacznik `mark('nazwa')`.

### 2. Rozpoznanie (nie zgaduj selektorów)
Dla każdego ekranu uruchom `scripts/explore.mjs` (zrzut + lista widocznych kontrolek z nazwami do lokatorów):
```bash
node .claude/skills/record-app-walkthrough/scripts/explore.mjs http://localhost:5176/ /tmp/explore intro
```
Obejrzyj PNG narzędziem Read. Dla głębszych stanów (po modalu, po kliknięciu) skopiuj skrypt i dopisz kroki przed `dump()`. Sprawdź też, **co się dzieje po kliknięciu** — np. przycisk kategorii może otwierać popover, który trzeba zamknąć („Gotowe”), bo inaczej zasłoni następny cel.

Preferowane lokatory (od najbardziej odpornych): `getByRole('button', { name })`, `getByRole('slider', { name })`, `locator('.klasa', { hasText })`, `[data-section="…"]`. Unikaj współrzędnych na sztywno — wyjątek: ruch „w pustą przestrzeń”, żeby kursor nie zasłaniał treści.

### 3. Napisz skrypt
Skopiuj `scripts/record.mjs` obok projektu (np. `presentation/<coś>/tools/record-<nazwa>.mjs`) i edytuj **tylko sekcję SCRIPT**. Dostępne pomocniki:

| Funkcja | Do czego |
|---|---|
| `mark('beat')` | znacznik czasu — wołaj **przed** akcją |
| `moveTo(x, y, ms)` | płynny ruch kursora (ease in-out) |
| `hover(loc, ms)` / `click(loc, ms)` | najazd i klik z animowanym „ripple” |
| `dragSlider(loc, frac)` / `setRange(loc, value)` | przeciągnięcie suwaka jak człowiek |
| `scrollTo(sel)` | płynne przewinięcie sekcji do widoku (lepsze niż kółko myszy) |
| `wheel(dy, steps, at)` | przewijanie kółkiem w punkcie |
| `cursorVisible(false/true)` | schowaj kursor na czas animacji kamery |
| `opt('nazwa', async () => …)` | krok opcjonalny: brak kontrolki = ostrzeżenie zamiast wywalenia całego nagrania |
| `wait(ms)` | pauza na przeczytanie |

Zasady, które robią różnicę:
- **Rozgrzej cache** przed startem screencastu (odwiedź najcięższe widoki, odczekaj, wyczyść `localStorage`/`sessionStorage`, wróć na start) — inaczej w nagraniu będą ładujące się kafelki/zdjęcia.
- Po każdej zmianie na ekranie daj **1,5–3 s** na przeczytanie. Montaż i tak przyspieszy nudne fragmenty (playbackRate), ale nie wydłuży za krótkich.
- Długie animacje (przelot kamery 3D) — `cursorVisible(false)`, a potem `waitFor` na element docelowy z dużym timeoutem.
- Kroki, które mogą zniknąć po zmianach w UI, owiń w `opt()`; kluczowe zostaw bez — niech nagranie się wywali, jeśli ścieżka jest zła.
- Jeśli montaż ma pokazać wartości zmieniające się w UI (np. ranking), **wypisz je do logu** (`console.log`) w momencie znacznika — przydadzą się do nakładek.

### 4. Nagraj
```bash
BASE=http://localhost:5176 NAME=system OUT_DIR=presentation/pitch/assets/clips \
  PLAYWRIGHT=$PLAYWRIGHT node path/to/record-<nazwa>.mjs
```
Trwa tyle, ile scenariusz + ~15 s rozgrzewki + kodowanie (w 3200×1800 ok. 5–10 min; plik ~350 MB — nie do gita). Na końcu wypisuje liczbę klatek i średni fps (dobrze: 25–50). `--keep-frames` zostawia klatki JPEG do debugowania.

### 5. Sprawdź nagranie (obowiązkowo)
```bash
python3 .claude/skills/record-app-walkthrough/scripts/contact-sheet.py presentation/pitch/assets/clips/system.mp4 /tmp/sheets --every 5
```
Obejrzyj każdy arkusz (Read). Szukaj: niezamkniętych popoverów, kliknięć w zły element, ładujących się kafelków, kursora zasłaniającego treść, pustych ekranów. Popraw skrypt i nagraj ponownie — to tanie.

## Typowe problemy

| Objaw | Przyczyna / rozwiązanie |
|---|---|
| `locator.click: element is not enabled` | brakuje wcześniejszego wyboru (np. przycisk „Dalej” aktywny dopiero po zaznaczeniu opcji) |
| timeout na elemencie po kliknięciu | klik trafił w nakładkę (popover, tooltip) — zamknij ją lub przesuń kursor; sprawdź ostatnią klatkę z `--keep-frames` |
| `strict mode violation` | lokator pasuje do kilku elementów — `exact: true`, `.first()` albo węższy kontener |
| przewijanie nic nie robi | kółko trafia w zły kontener — użyj `scrollTo('[data-section="…"]')` |
| szarpane klatki / niski fps | obciążona maszyna (inne przeglądarki, rendery) — zamknij je i nagraj jeszcze raz |
| macOS: brak `timeout` | nie używaj polecenia `timeout` w skryptach powłoki |

## Czego nie robić
- Nie commituj surowych nagrań (setki MB, limit GitHuba 100 MB/plik) — trzymaj je w `.gitignore`, commituj skrypt i `*-markers.json`.
- Nie instaluj Playwrighta do `package.json` aplikacji.
- Nie zostawiaj uruchomionych serwerów i przeglądarek po pracy.
