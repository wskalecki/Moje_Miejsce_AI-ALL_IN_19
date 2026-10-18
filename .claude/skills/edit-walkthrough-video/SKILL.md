---
name: edit-walkthrough-video
description: Montuje profesjonalny, dynamiczny film z nagrania aplikacji (Remotion, wideo jako kod React) — zoomy kamery w stylu Screen Studio, okno przeglądarki, rozdziały, podpisy funkcji, nakładki z danymi, ujęcie otwierające i plansza końcowa; renderuje ostre MP4 (2880×1620 → 1440p) i sprawdza klatki. Użyj po skillu record-app-walkthrough, gdy ktoś chce zmontować demo / product video / prezentację systemu / showcase, „zrób z nagrania film”, „zmontuj wideo”. Domyślnie bez kosztów (bez lektora i muzyki).
---

# Montaż filmu z nagrania (Remotion)

Wejście: nagranie `assets/clips/NAME.mp4` + `NAME-markers.json` (skill `record-app-walkthrough`).
Wyjście: `video/out/<nazwa>.mp4` (render 2880×1620, 30 kl./s) + kopia 2560×1440 do prezentacji.

**Koszt: 0 zł.** Remotion, ffmpeg i nagranie są darmowe. Płatne są tylko opcjonalne dodatki generowane przez AI (patrz „Opcjonalnie: dźwięk i b-roll”). Licencja Remotion: darmowa dla osób prywatnych i firm do 3 osób, większe firmy potrzebują licencji.

Działający projekt w tym repo — kopiuj z niego, nie pisz od zera:

| Plik (`3_AI-ALL IN_Moje Miejsce/pitch/video/src/`) | Co zawiera |
|---|---|
| `components/ui.tsx` | `Recording` (odtwarza kawałki nagrania), `Camera` (eased zoom po kluczach), `BrowserFrame`, `Chapter`, `Callouts`, `Paper` (tło), `Logo`, `SceneFade`, `sec()` |
| `system/timeline.ts` | lista cięć (EDL): segmenty `{from, to, rate}` liczone od znaczników, kolejność scen, `PLACED`, `TOTAL_FRAMES` |
| `system/scenes.tsx` | sceny: `Shot` (tło + rozdział + okno + kamera + podpisy), `chain()` podpisów, karta „Top 3” zmieniająca się na żywo |
| `System.tsx`, `Root.tsx` | złożenie scen z przenikaniem, rejestracja kompozycji |
| `scenes/Brand.tsx`, `scenes/Outro.tsx` | ujęcie otwierające z hasłem, animowana plansza z danymi (`Data`), zamknięcie |
| `theme.ts` | kolory i fonty skopiowane z tokenów aplikacji — film wygląda jak produkt |

## Procedura

### 1. Projekt
Najprościej dodać nową kompozycję do istniejącego `3_AI-ALL IN_Moje Miejsce/pitch/video` (wspólne komponenty). Dla innego produktu skopiuj cały katalog `video/` bez `node_modules` i `out`, podmień `theme.ts` (kolory, fonty z design tokens aplikacji) i `Logo`.
```bash
cd "3_AI-ALL IN_Moje Miejsce/pitch/video" && npm i
```
`remotion.config.ts` ustawia `publicDir` na `../assets` — nagrania, b-roll i dźwięki leżą w `3_AI-ALL IN_Moje Miejsce/pitch/assets` i są dostępne przez `staticFile('clips/NAME.mp4')`.

### 2. Lista cięć (`timeline.ts`)
Importuj znaczniki i zapisz każdą scenę jako segmenty nagrania z prędkością:
```ts
import rec from '../../../assets/clips/NAME-markers.json'
const m = rec.markers
export const SEG = {
  map: [
    { from: m.map + 0.4, to: m.solo, rate: 1.4 },   // spokojnie: widz czyta
    { from: m.preview, to: m.reweight, rate: 2.0 }, // klikanie w popovery: szybciej
  ],
}
```
Reguły prędkości: 1.0–1.3 tam, gdzie dzieje się coś kluczowego (zmiana rankingu, przelot kamery); 1.4–1.6 zwykłe przejścia; 1.8–2.0 powtarzalne klikanie, przewijanie, czekanie. Długość sceny = `segsLen(SEG.x)`. Moment akcji w scenie: `at(SEG.x, 'beat', plusSekundŹródła)` — używaj go do kamer i podpisów, nigdy stałych sekund.

Kolejność scen + `XFADE = 0.5` (przenikanie) → `PLACED`, `TOTAL_FRAMES`.

### 3. Sceny (`scenes.tsx`)
Każda scena aplikacji to `Shot`: tło `Paper`, etykieta rozdziału (`['01', 'Profil w 30 sekund']`), okno przeglądarki z nagraniem i kamera:
```tsx
cam={[
  { t: 0, s: 1, x: 0.5, y: 0.5 },                  // cały ekran
  { t: at(S, 'scores') + 0.6, s: 1.6, x: 0, y: 0.55 }, // zoom na lewy panel
]}
```
`s` = powiększenie, `x/y` = punkt ostrości (0–1 kadru). Przesunięcie jest przycinane, by kadr zawsze był wypełniony: **`x: 0` = przyklejone do lewej krawędzi, `x: 1` = do prawej**. Panele przy krawędzi kadruj przez `x: 0` / `x: 1`, a nie `x: 0.3` (to obcina panel). Zoom 1.1–1.25, gdy trzeba widzieć panel i mapę; 1.4–1.6 tylko na sam panel/formularz.

Podpisy (`Callouts`) — po jednym na funkcję, 4–8 słów + jedna linijka źródła/szczegółu; `chain([...], end)` układa je jeden po drugim. W filmie bez lektora podpisy niosą narrację: mów, **co** widz widzi i **skąd** są dane.

Nakładki z danymi (jak karta „Top 3”): wartości bierz z logu nagrania (`console.log` w skrypcie), czasy z `at()`; każda zmiana = animacja wejścia wierszy (spring, stagger).

Ujęcie otwierające: `<Brand tagline="…" />` (b-roll + logo + hasło). Plansza końcowa: `<Data pace={0.6} />` — liczby z `data/catalog.json`, nie wymyślone.

### 4. Kontrola klatek przed renderem (obowiązkowo)
```bash
npx tsc --noEmit -p .
npx remotion compositions src/index.ts                       # długość filmu
npx remotion still src/index.ts System /tmp/s_45.jpg --frame=1350 --image-format=jpeg
```
Wyrenderuj 15–25 klatek (po 2–3 na scenę: wejście, środek, zmiana), złóż w arkusz (`record-app-walkthrough/scripts/contact-sheet.py` działa też na gotowym MP4) i obejrzyj Read-em. Szukaj: przyciętych paneli (popraw `x` kamery), zawijających się nagłówków, podpisów zasłaniających akcję, ujęć bez treści.

### 5. Render i plik do prezentacji — ostrość
Rozmyty tekst ma trzy źródła i trzeba usunąć wszystkie:
1. **Nagranie za małe pod zoom** — kamera 1.6× w oknie 1536 px rozciąga nagranie 1920 px. Nagrywaj z `DPR=2` (3200×1800, domyślnie w `record.mjs`).
2. **Render 1080p** — podpisy, karty i tekst dorysowane w Remotion też wychodzą miękko na ekranach retina/4K. Renderuj z `--scale 1.5` (2880×1620); układ zostaje w pikselach 1920×1080. Skala musi dawać całkowite piksele (`1.3333` dla 1440p wywala `stitchFramesToVideo`), a `--scale 2` (4K) przy filmie 2,5 min potrafi paść po ponad godzinie z braku pamięci — nie warto.
3. **Za mocna kompresja** — CRF 23–24 w 1080p rozmywa drobny tekst. Do prezentacji zmniejsz render do 1440p (supersampling) i koduj CRF ~20.
```bash
npx remotion render src/index.ts System out/nazwa.mp4 --codec h264 --crf 16 --scale 1.5 --audio-bitrate 320k --concurrency 4 --timeout 120000 > render.log 2>&1   # dodaj --muted, jeśli bez dźwięku
ffmpeg -i out/nazwa.mp4 -vf scale=2560:1440:flags=lanczos -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart ../deck/media/nazwa.mp4
```
Render filmu 2–3 min w skali 1.5 trwa ~40 min; pełny log zapisuj do pliku, bo po `| tail` błąd ginie, a status wyjścia jest z `tail` (w 1080p ~10–15 min — do szybkich podglądów). Plik do repo/prezentacji ma mieć **< 100 MB** (GitHub odrzuca od 100 MB, ostrzega od 50 MB); gdy wychodzi więcej, podnieś CRF o 1–2. Raz na koniec obejrzyj gotowy MP4 przez `contact-sheet.py --every 4`.

Czekając na render w tle, nie odpytuj w pętli `pgrep -f "remotion render"` — wzorzec łapie sam siebie i pętla nigdy się nie kończy. Używaj powiadomienia o zakończeniu zadania.

## Muzyka z istniejącego utworu (darmowa)
Jeśli w `assets/music/` jest już utwór, użyj go ponownie. Gdy jest krótszy od filmu, zagraj go dwa razy z 3-sekundowym przenikaniem na cięciu sceny, a drugie przejście przesuń tak, by naturalne zakończenie utworu wypadło na ostatniej klatce — gotowy wzór w `System.tsx` (`firstPass` / `secondPass`). Głośność 0.8, wejście 1.5 s, wyciszenie 1.4 s; w kodowaniu do prezentacji `loudnorm=I=-16`.

## Opcjonalnie: dźwięk i b-roll (płatne, OpenRouter)
Tylko gdy użytkownik wprost chce lektora/muzykę/ujęcia AI — zapytaj o zgodę na koszt (~5 USD za całość). Działające skrypty: `3_AI-ALL IN_Moje Miejsce/pitch/tools/tts.py` (ElevenLabs v4 przez `/api/v1/audio/speech`), `music_or.py` (Lyria 3 Pro, wymaga `stream: true`), `video_gen.py` (Veo 3.1, `/api/v1/videos`), `transcribe.py` (Gemini — kontrola, czy lektor mówi dokładnie tekst ze skryptu). Kompozycja `Showcase` pokazuje ściszanie muzyki pod lektorem. Gemini TTS potrafi dopisywać własne zdania — zawsze transkrybuj i porównuj. Klucze tylko w `.env`, nigdy w repo.

## Czego nie robić
- Nie wpisuj fałszywych URL-i ani danych, których nie ma w aplikacji/katalogu.
- Nie commituj `node_modules/`, `out/`, surowych nagrań ani plików > 50 MB.
- Nie zmieniaj istniejących kompozycji, gdy robisz nową — dodaj nową obok.
