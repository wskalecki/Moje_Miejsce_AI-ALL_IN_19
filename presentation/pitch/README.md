# Pitch: prezentacja i wideo produktowe aplikacji Moje Miejsce

| Plik | Co to jest |
|------|------------|
| [`deck/index.html`](deck/index.html) | Prezentacja (8 slajdów, 16:9) z osadzonym filmem. Otwórz w Chrome. **N** pokazuje notatki i stoper, **F** włącza pełny ekran |
| `deck/media/moje-miejsce-system.mp4` | **Prezentacja systemu**: film 2:25, 1440p, z muzyką, bez lektora — profil seniora, zmiana wag i top 3, Groszówka ze wszystkimi sekcjami, oś czasu z inwestycjami, warstwy 3D, plansza z danymi |
| `deck/export/moje-miejsce-pitch.pdf` | Eksport slajdów do PDF (bez filmu). PPTX z filmem generuje `tools/export-deck.py` (poza gitem — ponad 50 MB) |
| [`skrypt-wystapienia.md`](skrypt-wystapienia.md) | Tekst wystąpienia z czasami (razem ok. 4:35) i źródła liczb |

Skille dla agentów (Claude Code), żeby powtórzyć to samo dla nowej wersji aplikacji albo innego produktu: [`record-app-walkthrough`](../../.claude/skills/record-app-walkthrough/SKILL.md) (nagranie) i [`edit-walkthrough-video`](../../.claude/skills/edit-walkthrough-video/SKILL.md) (montaż).

## Prezentacja systemu (kompozycja `System`)

| Warstwa | Narzędzie |
|---------|-----------|
| Nagranie aplikacji | `tools/record-system.mjs` → `assets/clips/system.mp4` + `system-markers.json` |
| Montaż | Remotion, `video/src/System.tsx`, `video/src/system/` (cięcia od znaczników, zoomy, podpisy, karta „Top 3” na żywo) |
| Ujęcie otwierające | b-roll `assets/broll/aerial2.mp4` (Veo 3.1, wygenerowany wcześniej) + hasło `TAGLINE` w `System.tsx` |
| Muzyka | `assets/music/bed.mp3` (Lyria 3 Pro, wygenerowana wcześniej do `Showcase`), dwa przejścia z przenikaniem |
| Jakość | nagranie 3200×1800 (DPR 2), render `--scale 2` (4K), do prezentacji zmniejszone do 2560×1440 |
| Koszt | 0 zł — żadnych nowych generacji |

```bash
cd application && npx vite --port 5176 --strictPort        # 1. aplikacja
PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node presentation/pitch/tools/record-system.mjs   # 2. nagranie (~4 min)
cd presentation/pitch/video && npm i && npm run render:system   # 3. render 4K (~30 min) → out/moje-miejsce-system.mp4
ffmpeg -i out/moje-miejsce-system.mp4 -vf scale=2560:1440:flags=lanczos -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart ../deck/media/moje-miejsce-system.mp4
```

Surowe nagrania (`assets/clips/*.mp4`, setki MB) i `video/out/` są poza gitem — odtwarza się je powyższymi poleceniami.

## Wideo produktowe z lektorem (kompozycja `Showcase`, wcześniejsza wersja)

Nagrane na starszej wersji aplikacji (nazwa „Okolica”, profil Rodzina, Natolin). Plik wideo nie jest w repo; kod, lektor i muzyka zostają, żeby dało się go odtworzyć.

### Jak powstało

| Warstwa | Narzędzie |
|---------|-----------|
| Montaż, motion design, miks | [Remotion](https://remotion.dev) (`video/`): wideo jako kod w React |
| Nagranie aplikacji | `tools/record-demo.mjs`: Playwright i screencast CDP w 1920×1080 przy ok. 50 kl./s, z rysowanym kursorem, zapisuje znaczniki akcji do `assets/clips/markers.json` |
| Lektor | ElevenLabs v4, głos „Adam”, przez OpenRouter (`tools/tts.py`, tekst w `tools/script.json`) |
| Muzyka | Google Lyria 3 Pro przez OpenRouter (`tools/music_or.py`) |
| B-roll (scena z laptopem, przelot nad Warszawą) | Google Veo 3.1 przez OpenRouter (`tools/video_gen.py`) |
| Kontrola lektora | transkrypcja Gemini (`tools/transcribe.py`) |

Montaż jest sterowany znacznikami z nagrania (`video/src/timeline.ts`). Po zmianie w aplikacji wystarczy nagrać ją ponownie i wyrenderować wideo — cięcia same się dopasują.

```bash
# 1. aplikacja lokalnie
cd application && npx vite --port 5176
# 2. nagranie (Playwright poza package.json, jak w application/scripts/record-flyovers.mjs)
PLAYWRIGHT=/tmp/rec/node_modules/playwright/index.mjs node presentation/pitch/tools/record-demo.mjs
# 3. render
cd presentation/pitch/video && npm i && npm run render
# 4. normalizacja głośności i kopia do prezentacji
ffmpeg -i out/moje-miejsce-showcase.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 256k ../deck/media/moje-miejsce-showcase.mp4
# 5. eksport PDF/PPTX
PLAYWRIGHT=… node presentation/pitch/tools/deck-screens.mjs && python3 presentation/pitch/tools/export-deck.py
```

Klucze: `OPENROUTER_API_KEY` (lektor, muzyka, b-roll) i `GOOGLE_AI_API_KEY` (transkrypcja). Nigdy ich nie commitujemy.

## Licencje i uwagi

- **Remotion** jest darmowy dla osób prywatnych i firm do 3 osób. Przy komercyjnym użyciu w większym zespole potrzebna jest [licencja firmowa](https://remotion.pro/license).
- Lektor, muzyka i b-roll są wygenerowane przez AI. Ujęcia z Veo to ilustracja, a nie prawdziwe miejsca (wieża na horyzoncie przelotu tylko przypomina Pałac Kultury).
- Wszystkie ujęcia aplikacji to prawdziwe nagranie działającej wersji (commit `2b31bc6`, gałąź `feat/unified-place-view`), bez makiet.
