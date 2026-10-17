# Mock „Siatka” — specyfikacja systemu (prompt dla agentów frontendu)

| | |
|---|---|
| **Status** | Kanoniczna specyfikacja mocka na hackathon (obowiązuje od 2026-10-17) |
| **Źródło decyzji** | Burza mózgów zespołu: [`../notes/2026-10-17-transkrypcja-mock.md`](../notes/2026-10-17-transkrypcja-mock.md) |
| **Relacja do konceptu** | [`koncept-aplikacji.md`](koncept-aplikacji.md) opisuje docelowy produkt. Ten dokument opisuje **demo**: ankieta → mapa → 3 wyróżnione osiedla → przejście 3D → panel osiedla. W razie sprzeczności na potrzeby mocka **wygrywa ten dokument** (także wobec [`../design/visual-system.md`](../design/visual-system.md)). |
| **Kod** | `application/` (React 19 + Vite + TypeScript + maplibre-gl) |

Ten dokument jest „promptem systemowym” dla agentów, którzy budują mock. Ma wystarczyć do zbudowania całości **bez dopytywania**. Jeśli coś jest niejasne, wybierz najprostsze rozwiązanie zgodne z sekcją 0 i dopisz decyzję w sekcji 16.

---

## 0. Zasady nadrzędne (MUST)

1. **Czysty mock frontendowy.** Bez backendu, bez Supabase, bez skryptów Pythona w runtime, bez kluczy API, bez zmiennych środowiskowych wymaganych do startu. Wszystkie dane to pliki statyczne w `application/public/` lub moduły TS w `application/src/mock/`.
2. **Brak globalnych obliczeń w przeglądarce.** Dopasowanie (match) dla miasta jest **przeliczone wcześniej** (offline, T1) i zapisane w GeoJSON. Klient tylko wybiera kolumnę dla profilu i nakłada nadpisania dla 3 wyróżnionych osiedli.
3. **Deterministyczny wynik.** Niezależnie od odpowiedzi w krokach 2 i 3 ankiety, wynik zależy **tylko od profilu z kroku 1**. Krok 2 zmienia wyłącznie prezentację (kolejność i wyróżnienie kategorii), krok 3 zmienia cenę (najem/kupno) i widoczność osi czasu.
4. **Klikalne są dokładnie 3 osiedla:** Powiśle (student), Miasteczko Wilanów (rodzina), Saska Kępa (senior). Każde inne osiedle ma hover, ale klik pokazuje tylko toast.
5. **Wygląd premium:** spokojny, redakcyjny, dużo światła, płynne animacje 60 fps. Lepiej mniej funkcji dopracowanych niż więcej surowych.
6. **Cały tekst UI po polsku**, z poprawnymi znakami diakrytycznymi i polskim formatowaniem liczb (`Intl.NumberFormat('pl-PL')`, spacja jako separator tysięcy, „zł”, „min”, „m²”).
7. **Zależności:** wolno dodać tylko `motion` (framer-motion), `lucide-react`, `@fontsource-variable/inter`, `@fontsource-variable/plus-jakarta-sans`. Nic więcej w `dependencies`. Narzędzia jednorazowe (Playwright, ffmpeg) uruchamiamy przez `npx -y` lub z systemu, bez wpisu do `package.json`.
8. **Uczciwość demo:** w stopce mapy i panelu mała notka „Wersja demonstracyjna — profile wyróżnionych osiedli przygotowane ręcznie na podstawie otwartych danych”. Etykieta „AI” dotyczy tekstów szablonowych i redagowanych.

---

## 1. Cel i scenariusz pokazu (90 s)

1. Ekran startowy z nazwą i obietnicą → „Zacznij”.
2. Trzy szybkie pytania; u góry buduje się zdanie: *„Studiuję, liczą się dla mnie komunikacja i gastronomia, szukam miejsca na chwilę.”*
3. Krótki ekran „Dopasowujemy Warszawę do Ciebie…” (wrażenie analizy).
4. Mapa Warszawy z płynnym gradientem dopasowania. Po przybliżeniu gradient przechodzi w granice wszystkich 143 osiedli. Hover pokazuje kartę z wynikiem i jednym zdaniem „AI”.
5. Panel „Polecane dla Ciebie” z 3 osiedlami; #1 to „Najlepsze dopasowanie”.
6. Klik w #1 → **ujęcie kinowe**: interfejs znika, kamera przelatuje i pochyla się nad osiedlem, wyrastają budynki 3D, reszta miasta gaśnie, wchodzi przelot wideo i zdjęcia, wjeżdża panel osiedla.
7. Panel: podsumowanie AI, statystyki, ważne miejsca na mapie, najkrótsza droga do uczelni lub szkoły, korki w ciągu doby, ceny z linkami do portali, a dla „na stałe” suwak 2026→2030, przy którym statystyki zmieniają się na żywo.

---

## 2. Co jest prawdziwe, a co udawane

| Element | Prawdziwe | Udawane / ręczne |
|---|---|---|
| Granice 143 osiedli (obszary MSI) | ✅ WFS UM Warszawy, `application/public/data/osiedla.geojson` | — |
| Gradient dopasowania i match osiedli niewyróżnionych | ✅ z `data/grid/cell_metrics.json` (wskaźniki OSM i WFS), ważone profilem, przeliczone offline | Przeskalowanie do ładnego zakresu 38–89 % |
| Zdanie „AI” na hoverze (niewyróżnione) | Szablon z prawdziwych wyników kategorii | Tekst generowany szablonem |
| 3 wyróżnione osiedla: statystyki, miejsca, trasy, korki, ceny, oś czasu | Inspirowane prawdziwymi danymi | Ręcznie przygotowane w `application/src/mock/osiedla.ts` |
| Budynki 3D | ✅ wysokości z kafelków OpenFreeMap (`render_height`) | — |
| Wideo przelotu | Nagrane z naszej mapy 3D | Kolorystyka i ziarno „jak z AI” |
| Zdjęcia | Prawdziwe, z licencją (Wikimedia Commons lub własne) | — |

---

## 3. Słownik domenowy

### 3.1 Profile (krok 1)

| `ProfileId` | Tytuł karty | Fragment zdania | Opis na karcie | Ikona (lucide, zapas dla ilustracji) | Akcent | Domyślny horyzont | Wyróżnione osiedle |
|---|---|---|---|---|---|---|---|
| `student` | Student | „Studiuję” | „Uczelnia, znajomi i miasto po zajęciach.” | `Backpack` | fiolet | `chwila` | Powiśle |
| `rodzina` | Rodzina | „Mamy rodzinę” | „Przedszkole, park i spokojne wieczory.” | `UsersRound` | koral | `stale` | Miasteczko Wilanów |
| `senior` | Senior | „Jestem na emeryturze” | „Lekarz blisko, zieleń i kultura na co dzień.” | `Armchair` | morski (teal) | `stale` | Saska Kępa |

Fragmenty zdania są **neutralne płciowo** (zamiast „Jestem studentem”). Zaimek w zdaniu: `student`, `senior` → „dla mnie”, „szukam”; `rodzina` → „dla nas”, „szukamy”.

### 3.2 Kategorie (krok 2, statystyki, hover)

Kolejność w tabeli = kolejność kafelków w kroku 2.

| `CategoryId` | Etykieta | Ikona lucide | Mocna strona (do szablonu) | Słaba strona (do szablonu) | Klucze `metrics_norm` (średnia) |
|---|---|---|---|---|---|
| `cisza` | Cisza | `VolumeX` | „spokojne ulice” | „bywa głośno” | `traffic_disruptions_1km`, `aq_pm25_idw`, `100 − gastronomy_1km` |
| `zielen` | Zieleń | `Trees` | „dużo zieleni” | „mniej zieleni” | `park_dist_m`, `playgrounds_1km`, `aq_pm25_idw` |
| `komunikacja` | Komunikacja | `TramFront` | „świetny dojazd” | „dojazd z przesiadkami” | `metro_dist_m`, `tram_stops_1km`, `transit_stops_count` |
| `gastronomia` | Gastronomia | `UtensilsCrossed` | „bogata gastronomia” | „skromny wybór lokali” | `gastronomy_1km` |
| `sport` | Sport | `Dumbbell` | „miejsca do sportu” | „mało miejsc do sportu” | `sport_places`, `playgrounds_1km` |
| `kultura` | Kultura | `Theater` | „kultura pod ręką” | „do kultury trzeba dojechać” | `events_30d`, `library_dist_m`, `utw_dist_m` |
| `edukacja` | Edukacja i przedszkola | `GraduationCap` | „szkoły i przedszkola blisko” | „szkoły dalej” | `kindergarten_dist_m`, `school_dist_m`, `highschool_dist_m`, `university_dist_m` |
| `zdrowie` | Zdrowie | `HeartPulse` | „przychodnie i apteki obok” | „do lekarza dalej” | `pharmacy_dist_m`, `clinic_dist_m`, `aed_dist_m` |
| `zakupy` | Zakupy | `ShoppingBasket` | „sklepy na co dzień” | „zakupy wymagają dojazdu” | `supermarket_dist_m` |
| `zycie_nocne` | Życie nocne | `Martini` | „życie po zmroku” | „wieczorami cicho” | `gastronomy_1km`, `events_30d` |

`metrics_norm` w `cell_metrics.json` to już „dobroć” 0–100 (100 = najlepiej, także dla wskaźników typu odległość). Brakujące klucze pomijamy w średniej.

### 3.3 Wagi profili (offline, T1) i domyślne priorytety (krok 2)

| Kategoria | `student` | `rodzina` | `senior` |
|---|---|---|---|
| cisza | 0,02 | 0,14 | 0,16 |
| zielen | 0,04 | 0,18 | 0,14 |
| komunikacja | 0,22 | 0,10 | 0,12 |
| gastronomia | 0,16 | 0,02 | 0,04 |
| sport | 0,10 | 0,10 | 0,02 |
| kultura | 0,12 | 0,04 | 0,12 |
| edukacja | 0,12 | 0,22 | 0,00 |
| zdrowie | 0,02 | 0,10 | 0,22 |
| zakupy | 0,06 | 0,10 | 0,16 |
| zycie_nocne | 0,14 | 0,00 | 0,02 |
| **Domyślnie zaznaczone (max 4)** | komunikacja, gastronomia, życie nocne, sport | edukacja, zieleń, cisza, zakupy | zdrowie, zakupy, cisza, kultura |

### 3.4 Horyzont (krok 3)

| `Horizon` | Tytuł | Fragment zdania | Opis | Skutek |
|---|---|---|---|---|
| `chwila` | Na chwilę | „na chwilę” | „Wynajem — pokażemy ceny najmu.” | Ceny najmu (zł/m²/mies.); oś czasu zwinięta do zajawki |
| `stale` | Na stałe | „na stałe” | „Kupno — pokażemy ceny zakupu i to, jak okolica zmieni się do 2030 roku.” | Ceny zakupu (zł/m²); pełna oś czasu 2026→2030 |

---

## 4. Przepływ i ekrany

Maszyna stanów ekranów: `intro → ankieta(1,2,3) → dopasowanie → mapa → przejscie(slug) → osiedle(slug) → (powrót) mapa`.

### 4.0 Ekran startowy (`/`)

- Pełny ekran, tło: ciepły papier (`--color-bg`) z wolno dryfującymi, rozmytymi plamami trzech akcentów (CSS, `filter: blur(80px)`, pętla 24 s, `transform` + `opacity` tylko) i cienkim konturem dzielnic Warszawy jako SVG (z `data/boundaries/warszawa_dzielnice.geojson`, uproszczony do jednego `path`, `stroke` ink 8 %).
- Treść wycentrowana pionowo, wyrównana do lewej w kolumnie 640 px:
  - mikro-nagłówek: „HACKATHON W3 · WARSZAWA: TWÓJ RUCH!”
  - nazwa: **„Siatka”** (display-xl). Nazwa to stała `APP_NAME` w `src/app/config.ts` (zmiana nazwy = jedna linia).
  - obietnica (h2, kolor secondary): „Znajdź okolicę w Warszawie, która pasuje do Twojego życia — zanim zaczniesz szukać mieszkania.”
  - przycisk główny **„Zacznij”** (ikona `ArrowRight`), pod nim: „3 pytania · 30 sekund · bez logowania”.
- Stopka: „Dane: m.st. Warszawa (otwarte dane), © współtwórcy OpenStreetMap, OpenFreeMap”.
- Enter uruchamia „Zacznij”. W tle (po zamontowaniu) prefetch chunku mapy i `osiedla_scored.geojson`.

### 4.1 Ankieta (`/ankieta?krok=1|2|3`)

Układ wspólny:

- Góra: pasek postępu z 3 segmentami + „Krok N z 3”; przycisk „Wstecz” (`ArrowLeft`; z kroku 1 wraca do intro).
- Pod paskiem: **zdanie mad-libs** (h1, display font), aktualizowane na żywo, z `aria-live="polite"`. Puste sloty to podkreślony placeholder „…”. Wypełniony slot to pigułka w kolorze akcentu profilu (przed wyborem profilu: ink). Zmiana treści slotu animowana (`motion` `layout` + fade 200 ms).
- Szablon zdania:
  - `{fragmentProfilu}, {liczy się | liczą się} dla {mnie | nas} {listaPriorytetów}, {szukam | szukamy} miejsca {na chwilę | na stałe}.`
  - `liczą się`, gdy wybrano ≥ 2 kategorie albo jedyną kategorią są „zakupy”; w przeciwnym razie `liczy się`.
  - lista: etykiety małą literą, łączone „, ” i „ i ” przed ostatnią („komunikacja, gastronomia i sport”). „Edukacja i przedszkola” w zdaniu skracamy do „przedszkola i szkoły”.
  - Przykład (rodzina, ustawienia domyślne): „Mamy rodzinę, liczą się dla nas przedszkola i szkoły, zieleń, cisza i zakupy, szukamy miejsca na stałe.”
- Przejście między krokami: wyjście `x: -24, opacity 0`, wejście `x: 24 → 0`, 320 ms, easing `--ease-emphasized`. Wstecz odwraca kierunek.

**Krok 1 — „Na jakim etapie życia jesteś?”**

- Trzy duże karty w rzędzie (min. 280 × 340 px), `role="radiogroup"`, każda `role="radio"`. Na karcie: ilustracja (`/illustrations/{profile}.svg`, duotone w akcencie profilu; zapasowo ikona lucide 56 px w kole 120 px w `accent-soft`), tytuł (h2), opis (body).
- Hover: uniesienie `translateY(-4px)` i `--shadow-lg`; zaznaczenie: obwódka 2 px akcentu i ikona `Check` w rogu.
- Po wyborze: akcent całej aplikacji zmienia się na akcent profilu (`data-profile` na `<html>`), priorytety i horyzont ustawiają się na domyślne z tabel 3.3 i 3.4. Po 400 ms automatyczne przejście do kroku 2.
- Klawiatura: strzałki zmieniają wybór, Enter/Spacja potwierdza.

**Krok 2 — „Co jest dla Ciebie najważniejsze?”**

- Podtytuł: „Wybierz do 4. Zaznaczyliśmy to, co zwykle liczy się na Twoim etapie życia.”
- Siatka 5 × 2 kafelków (ikona + etykieta), `role="group"`, każdy kafelek to `button` z `aria-pressed`. Kolejność wyboru jest zapamiętywana (ważna dla hovera, patrz 4.3).
- Licznik „3 / 4” obok podtytułu. Próba zaznaczenia piątego: kafelek lekko się trzęsie (±4 px, 240 ms), pod siatką pojawia się podpowiedź „Maksymalnie 4 — odznacz coś, żeby wybrać inne.” (znika po 2,5 s).
- „Dalej” aktywne przy ≥ 1 wybranej kategorii.

**Krok 3 — „Na jak długo szukasz miejsca?”**

- Dwie duże karty (`role="radiogroup"`): „Na chwilę” (ikona `KeyRound`) i „Na stałe” (ikona `House`), opisy z tabeli 3.4. Domyślnie zaznaczona wartość z profilu.
- Przycisk główny: **„Pokaż moją Warszawę”** (`ArrowRight`). Enter = to samo.

### 4.2 Ekran „Dopasowanie” (1,8 s, bez osobnego URL)

- Pełny ekran, tło jak intro, w centrum zdanie z ankiety (h2) i trzy linie pojawiające się co 500 ms z ikoną `Check` animowaną z `Loader2`:
  1. „Łączymy 24 wskaźniki z otwartych danych Warszawy…”
  2. „Oceniamy {N} osiedli pod Twój profil…” (`N` = liczba obiektów w GeoJSON, obecnie 143)
  3. „Gotowe — mamy dla Ciebie 3 propozycje.”
- Po 1,8 s (albo wcześniej po kliknięciu lub Enter) crossfade 500 ms do mapy. Mapa ładuje się pod spodem już od wejścia na ten ekran.

### 4.3 Mapa (`/mapa`)

**Układ (≥ 1280 px):**

| Strefa | Zawartość |
|---|---|
| Lewy górny róg (24 px od krawędzi) | Logo „Siatka” (h3, display font) + pasek zdania: skrócone zdanie jako 3 pigułki (profil, priorytety jako ikony, horyzont). Klik w pigułkę profilu otwiera popover z 3 profilami i **natychmiast przełącza profil** (tryb prezentera). Klik w pigułkę priorytetów lub horyzontu wraca do odpowiedniego kroku ankiety. |
| Lewa kolumna (top 96 px, szer. 360 px) | Szklany panel **„Polecane dla Ciebie”** (patrz niżej). |
| Lewy dolny róg | Legenda: pasek gradientu profilu, podpisy „niższe” i „wyższe dopasowanie”, pod spodem podpowiedź zależna od zoomu: < 12 „Przybliż, żeby zobaczyć osiedla”, ≥ 12 „Najedź na osiedle, żeby zobaczyć szczegóły”. |
| Prawy górny róg | Kontrolki: przybliż, oddal, „Cała Warszawa” (`Maximize2`, wraca do kamery startowej). Własne przyciski w stylu systemu, nie domyślne kontrolki MapLibre. |
| Dół, środek | Miejsce na toast. |
| Prawy dolny róg | Atrybucja (kompaktowa) + notka demo (micro). |

**Kamera startowa:** `center [21.0122, 52.2297]`, `zoom 10.4`, `pitch 0`, `bearing 0`. Po załadowaniu mapy: `easeTo({ zoom: 10.8, duration: 1600 })`, panel boczny wjeżdża z lewej (`x: -24 → 0`, 420 ms, opóźnienie 300 ms), karty w panelu kaskadowo co 80 ms. Granice: `maxBounds` ≈ `[[20.75, 52.03], [21.40, 52.43]]`, `minZoom 9.5`, `maxZoom 18`, `maxPitch 70`.

**Gradient (zoom < 12):** warstwa `heatmap` z punktów środków komórek (`heat_points.geojson`), waga z kolumny profilu. Bez widocznych pojedynczych kropek. Szczegóły w sekcji 5.

**Osiedla (zoom ≥ 12):** gradient płynnie przechodzi w wypełnienia i kontury **wszystkich** osiedli (przejście w przedziale zoom 11,5–12,5). Wypełnienie barwione dopasowaniem do profilu, kontur cienki. Nazwy osiedli jako etykiety mapy od zoom 13.

**Hover (wszystkie osiedla, zoom ≥ 11,5 oraz wyróżnione na każdym zoomie):**

- Podświetlenie: `feature-state.hover` → wyższe krycie wypełnienia, kontur 2 px w akcencie.
- Pływająca karta (szer. 300 px), 16 px od kursora, utrzymywana w granicach ekranu, pojawia się po 80 ms (fade + `y: 4 → 0`, 140 ms), znika 100 ms po opuszczeniu osiedla:
  - nazwa (h3) i dzielnica (small, secondary),
  - pierścień dopasowania 44 px z wartością „87 %”,
  - 3 mini paski kategorii: **pierwsze 3 priorytety z kroku 2** w kolejności wyboru (gdy jest ich mniej, uzupełnij kategoriami o najwyższej wadze profilu); pasek 0–100, etykieta i liczba,
  - wiersz „AI” z ikoną `Sparkles`: zdanie z szablonu (sekcja 7.2) albo `tagline` z `osiedla.ts` dla wyróżnionych,
  - dla wyróżnionych dodatkowo miniatura zdjęcia (64 px) i stopka „Kliknij, żeby zobaczyć osiedlo →”.
- Pozycja karty aktualizowana przez `ref` i `transform` w `requestAnimationFrame`. **Nie przez stan React na każdym `mousemove`**: stan zmienia się tylko przy zmianie osiedla pod kursorem.

**Wyróżnione osiedla (3):**

- Zawsze widoczne (każdy zoom): poświata konturu (szeroka rozmyta linia + ostra linia 2 px) w akcencie **profilu, do którego osiedle należy** (Powiśle fiolet, Miasteczko Wilanów koral, Saska Kępa teal).
- Pulsujący znacznik HTML w punkcie `center`: kropka 14 px + pierścień rozchodzący się co 2,2 s; nad nim pigułka z nazwą i dopasowaniem, np. „Powiśle · 96 %”.
- Osiedle przypisane do wybranego profilu: większy znacznik (18 px), pigułka z odznaką **„Najlepsze dopasowanie”** i numerem „#1”, wyższy `z-index`.
- Klik (w poligon, znacznik albo kartę w panelu) → przejście kinowe (4.4).

**Panel „Polecane dla Ciebie”:**

- Nagłówek: „Polecane dla Ciebie” (h3) + podtytuł „Na podstawie Twoich odpowiedzi”.
- 3 karty posortowane: najpierw osiedle profilu, potem pozostałe malejąco po `match[profil]`. Karta: miniatura 72 × 72 (radius 12), nazwa, dzielnica, pigułka dopasowania, `tagline` (1 linia, wielokropek). Karta #1 ma odznakę „Najlepsze dopasowanie” i obwódkę w akcencie.
- Hover karty → podświetlenie osiedla na mapie (ten sam `feature-state`) i lekkie powiększenie znacznika. Klik → przejście kinowe. Karty są `button`-ami osiągalnymi Tabem.
- Zmiana profilu w popoverze: karty przestawiają się animacją `layout` (400 ms), gradient i wypełnienia zmieniają kolor przez przejścia paint (600 ms).

**Klik w osiedle niewyróżnione:** toast na dole: ikona `Clock` + „Pełny profil tego osiedla wkrótce” (2,4 s, naraz najwyżej jeden, kolejny klik resetuje licznik).

### 4.4 Przejście kinowe (`/mapa/:slug`, faza `przejscie`)

To najważniejsze ujęcie demo. Oś czasu liczona od kliknięcia (t = 0). Wszystkie fazy w jednym module `src/map/cinematic.ts` jako sekwencja `async` z możliwością przerwania (`AbortController`).

| t (ms) | Co się dzieje |
|---|---|
| 0 | Blokada interakcji mapy (`dragPan`, `scrollZoom` itd. wyłączone). Zapamiętanie kamery do powrotu. Hover off. |
| 0–300 | Wygaszenie interfejsu (panel, pasek zdania, legenda, kontrolki): `opacity 0`, `y: 8`. |
| 0–1200 | **Tryb nocny:** warstwa maski `cinematic-dim` (świat z dziurą w kształcie osiedla) `fill-opacity 0 → 0.62` w kolorze `--night-bg`. Podkład przechodzi na paletę nocną (sekcja 5.4) przez przejścia paint. Kontury innych osiedli `→ 0`. Poświata wybranego osiedla zwiększa szerokość i jasność. `map.setSky(...)` nocne. |
| 0–3200 | `map.flyTo({ center, zoom: 16, pitch: 60, bearing: cameraBearing, duration: 3200, curve: 1.42, easing: easeInOutCubic })`. |
| 600–1800 | Warstwa `buildings-3d`: `fill-extrusion-opacity 0 → 0.92`, wysokość „wyrasta” (animacja mnożnika wysokości 0 → 1 w `rAF`, przez `setPaintProperty` z `['*', ['get','render_height'], k]`, najwyżej 30 aktualizacji). |
| 3200 → | Powolna orbita: `easeTo({ bearing: cameraBearing + 24, duration: 9000, easing: t => t })`. |
| 3400–4000 | **Interludium:** nad mapą pojawia się warstwa pełnoekranowa (`opacity 0 → 1`, 600 ms): od góry i dołu wsuwają się czarne pasy kinowe (do proporcji 2,39 : 1), startuje wideo przelotu. Pierwsza klatka wideo odpowiada kamerze z końca `flyTo` (patrz T8), więc przejście jest niewidoczne. |
| 4000–10000 | Wideo (6 s, bez dźwięku, `muted playsInline`). Lewy dół, nad pasem: nazwa osiedla (display-l, biały), dzielnica + `tagline` (body). Prawy dół: „Pomiń” (`SkipForward`). |
| 10000–14000 | 2 zdjęcia z `heroImages` z efektem Ken Burns (skala 1,0 → 1,08 i przesunięcie 2 %, 2,6 s każde), crossfade 700 ms. |
| 14000–14700 | Interludium znika (fade 700 ms) i odsłania żywą mapę 3D (orbita trwa). Mapa wraca z trybu nocnego do **dziennego 3D** (1200 ms): podkład dzienny, budynki w ciepłej jasnej palecie, maska `cinematic-dim` → `ink` 0,18. |
| 14200–14800 | Panel osiedla wjeżdża z prawej (`x: 40 → 0`, `opacity`, 600 ms, `--ease-emphasized`), sekcje kaskadowo co 60 ms. Na mapie kaskadowo (co 80 ms) pojawiają się znaczniki ważnych miejsc. Faza = `osiedle`. |

Zasady:

- **Pomiń**: przycisk, Esc, Spacja, Enter albo klik w interludium. Od razu przechodzi do kroku z t = 14000 (fade 400 ms).
- **Drugie wejście** w to samo osiedle w tej sesji: bez interludium (sam `flyTo` + panel); `visited` w stanie.
- **Wideo się nie ładuje** (brak `canplay` w ciągu 1500 ms od startu interludium albo błąd) → pomiń wideo i pokaż od razu zdjęcia.
- **`prefers-reduced-motion`**: bez orbity, bez Ken Burns, bez pulsowania; `jumpTo` do kamery docelowej + fade 400 ms; interludium tylko ze statycznym zdjęciem (2 s) albo całkiem pominięte.
- **Głębokie łącze** `/mapa/powisle` bez wcześniejszej mapy: mapa startuje od razu w kamerze docelowej, bez interludium, panel otwarty.
- **Parametr `?szybko=1`** (do prób): pomija interludium zawsze.

### 4.5 Panel osiedla (`/mapa/:slug`, faza `osiedle`)

Prawy, szklany panel (`--glass-strong`): szer. 520 px (≥ 1600 px: 560 px), pełna wysokość z marginesem 16 px, przewijany wewnętrznie, nagłówek sekcji „przyklejony” podczas przewijania. Mapa 3D pozostaje interaktywna po lewej (przesuwanie, obrót prawym przyciskiem; `padding` kamery uwzględnia panel). Kolejność sekcji:

1. **Hero** (wys. 300 px, radius 20): odtwarzane w pętli wyciszone wideo przelotu albo galeria zdjęć (strzałki, kropki, autoplay co 5 s z Ken Burns). Na hero: przycisk „← Mapa” (lewy górny), podpis źródła zdjęcia (micro, prawy dolny). Pod hero: nazwa (h1), „{dzielnica} · obszar MSI {nazwa MSI}” gdy się różni (np. „Wilanów · obszar MSI Błonia Wilanowskie”), `tagline`, **pierścień dopasowania** 88 px (licznik od 0 do wartości w 900 ms) z podpisem „dopasowania dla profilu {Student|Rodzina|Senior}”. Odznaka „Najlepsze dopasowanie”, jeśli `osiedle.profile === profil`.
2. **Podsumowanie AI**: etykieta „Podsumowanie AI” z `Sparkles`, `aiSummary` (2–4 zdania) odsłaniany słowo po słowie (łącznie ≤ 1,2 s, tylko przy pierwszym otwarciu), pod spodem micro „Wygenerowane na podstawie otwartych danych · wersja demo”.
3. **Jak wypada dla Ciebie**: 10 poziomych pasków kategorii (ikona, etykieta, pasek, liczba 0–100), posortowanych: najpierw priorytety z kroku 2 (z odznaką „Twój priorytet”), potem malejąco po wadze profilu. Pasek priorytetu w akcencie, pozostałe w `ink` 24 %. Wartości animują się przy wejściu i przy zmianie roku osi czasu. Pod paskami opcjonalny przełącznik „Porównaj ze średnią Warszawy” (cienki znacznik 50 na każdym pasku). **Decyzja:** paski, bez radaru.
4. **Ważne miejsca**: lista 4–8 `highlights` (ikona kategorii, nazwa, opis 1 linia, „350 m · 5 min pieszo”). Każde miejsce ma znacznik HTML na mapie 3D (koło 32 px, ikona, obwódka w akcencie). Hover pozycji ↔ powiększenie znacznika (1,15) i odwrotnie. Klik pozycji → `easeTo` do miejsca (zoom 16,5, 900 ms) i dymek z nazwą.
5. **Najkrótsza droga do…**: pigułki celów z `routes` (np. „Uczelnia”, „Szkoła”, „Przychodnia”, „Park”), kolejność ustala dane; pierwszy cel wybrany domyślnie. Zakładki trybów: Pieszo (`Footprints`), Rower (`Bike`), Komunikacja (`TramFront`), Auto (`Car`), z czasem w min na każdej zakładce; brakujący tryb ukryty. Wybór celu rysuje trasę na mapie: linia w akcencie 5 px z białą obwódką 8 px, animowane „rysowanie” przez `line-gradient` po `line-progress` (900 ms); znacznik startu („Ty”, środek osiedla) i celu (ikona kategorii). Kamera `fitBounds` trasy z paddingiem `{ right: szerokośćPanelu + 48, top: 80, bottom: 80, left: 80 }`, pochylenie 45°, 1000 ms. Pod zakładkami: „{nazwa celu} · {dystans} km · {min} min {tryb}”.
6. **Dojazd**: lista `commute` (np. „Centrum (Rondo Dmowskiego)”, „Mordor (Służewiec)”, „Kampus UW”, „Lotnisko Chopina”) z czasami dla trybów; najszybszy tryb pogrubiony.
7. **Korki w ciągu doby**: wykres SVG 24 słupków (`traffic[0..23]`, indeks 0–100). Kolor słupka: < 35 `--color-ok`, 35–65 `--color-warn`, > 65 `--color-bad`. Oś: 0, 6, 12, 18, 24. Znacznik bieżącej godziny. Hover lub fokus słupka → dymek „8:00 · duże korki (78)” (progi: < 35 „płynnie”, 35–65 „umiarkowanie”, > 65 „duże korki”). Pod wykresem **podpowiedź** (sekcja 7.4) z ikoną `Lightbulb`.
8. **Ceny**: przełącznik segmentowy „Najem / Kupno” (domyślnie z horyzontu; zmiana nie zmienia horyzontu globalnie). Najem: „{rent} zł/m² mies.”, pod spodem „ok. {rent × 45} zł miesięcznie za 45 m²”. Kupno: „{buy} zł/m²”, pod spodem „ok. {buy × 55 / 1000} tys. zł za 55 m²”. Obok pigułka różnicy wobec średniej Warszawy („+12 % vs Warszawa”). Przyciski „Zobacz oferty na Otodom” i „Zobacz oferty na Morizon” (`ExternalLink`, `target="_blank" rel="noopener noreferrer"`, URL najmu albo kupna zależnie od przełącznika). Micro: „Szacunek demonstracyjny na podstawie ofert z portali i RCN (dzielnica)”.
9. **Oś czasu 2026 → 2030** (sekcja 4.6). Dla `chwila`: zwinięta karta „Planujesz zostać na dłużej? Zobacz, jak {nazwa} zmieni się do 2030 roku.” + przycisk „Pokaż prognozę”, który przełącza horyzont na `stale` i rozwija sekcję.
10. **Stopka panelu**: „Wróć do mapy” (przycisk drugorzędny) i notka demo.

**Powrót do mapy** („← Mapa”, „Wróć do mapy”, Esc, przycisk wstecz przeglądarki): panel wyjeżdża (300 ms), znaczniki i trasa znikają, budynki `opacity → 0` (800 ms), maska → 0, `flyTo` do zapamiętanej kamery z `pitch 0, bearing 0` (1800 ms), interfejs mapy wraca (fade 300 ms po zakończeniu lotu), URL `/mapa`.

### 4.6 Oś czasu (tylko `stale`)

- Suwak lat 2026–2030 (krok 1 rok, etykiety pod każdym rokiem, natywny `input type=range` ostylowany, strzałki klawiatury), obok przycisk „Odtwórz” (`Play`/`Pause`): automatycznie przesuwa po 1,2 s na rok.
- Domyślnie 2026 = stan bazowy (`stats`). Dla roku `Y` wartości = `stats[c] + Σ statDeltas[c]` po wszystkich wydarzeniach `timeline` z `year ≤ Y`, przycięte do 0–100. Match = `match[profil] + Σ matchDelta`, przycięty do 0–99.
- Zmiana roku: paski kategorii i pierścień dopasowania animują się (400 ms, liczby z tweenem), obok zmienionych pasków chip „+6” (zielony) lub „−3” (czerwony); karty inwestycji z `year ≤ Y` pojawiają się na liście (tytuł, rok, status „planowana / w budowie / zakończona”, opis 1–2 zdania, kategoria); inwestycje z `coord` dostają znacznik na mapie (romb, animacja „opadania” 300 ms). Kamera się nie rusza.
- Nad suwakiem etykieta „Prognoza” z `TrendingUp` i micro „Na podstawie planów miasta (MPZP, inwestycje, budżet obywatelski). To szacunek, nie gwarancja.”

---

## 5. Mapa — specyfikacja techniczna

### 5.1 Podkład

- Styl: **OpenFreeMap Positron** `https://tiles.openfreemap.org/styles/positron` (bez klucza). Źródło wektorowe ma id `openmaptiles`, budynki są w `source-layer: "building"` (pola `render_height`, `render_min_height`), glify mają fonty `Noto Sans Regular` i `Noto Sans Bold`.
- Po `load` ocieplamy paletę (`setPaintProperty` na istniejących warstwach, dopasowanie po id/typie): tło `#F4F0EA`, woda `#D6E2EA`, zieleń/parki `#E4EADB`, drogi główne `#FFFFFF`, drogi drugorzędne `#FBF8F3`. Ukrywamy etykiety POI i numery dróg; zostawiamy nazwy dzielnic i dużych ulic (stonowane, ink 45 %).
- `attributionControl: { compact: true }`. `fadeDuration: 200`. `pixelRatio`: domyślny (bez wymuszania 2 na ekranach 1×).

### 5.2 Źródła i warstwy (kolejność od dołu)

| # | id warstwy | Typ | Źródło | Uwagi |
|---|---|---|---|---|
| 1 | (podkład Positron) | — | `openmaptiles` | ocieplony, 5.1 |
| 2 | `heat` | `heatmap` | `heat` → `/data/heat_points.geojson` | `maxzoom 13` |
| 3 | `osiedla-fill` | `fill` | `osiedla` → `/data/osiedla_scored.geojson`, `promoteId: "id"` | |
| 4 | `osiedla-line` | `line` | `osiedla` | |
| 5 | `cinematic-dim` | `fill` | `dim` (generowane w kliencie: prostokąt świata z dziurą osiedla) | domyślnie `opacity 0` |
| 6 | `featured-glow` | `line` | `featured` (3 poligony wyróżnionych, filtr z `osiedla`) | `line-blur 6`, `line-width 10`, `opacity 0.45` |
| 7 | `featured-line` | `line` | `featured` | `line-width 2`, kolor = akcent profilu osiedla |
| 8 | `buildings-3d` | `fill-extrusion` | `openmaptiles` / `building` | `minzoom 13`, domyślnie `opacity 0` |
| 9 | `route-casing`, `route-line` | `line` | `route` (`lineMetrics: true`) | tylko w fazie `osiedle` |
| 10 | `osiedla-label` | `symbol` | `osiedla-labels` → `/data/osiedla_labels.geojson` | `minzoom 13`, `Noto Sans Regular` 12 px, ink 55 %, halo białe 1,5 |
| — | znaczniki HTML | `maplibregl.Marker` | — | wyróżnione, ważne miejsca, inwestycje, start i cel trasy |

### 5.3 Wyrażenia (punkt wyjścia; dostroić wizualnie, zachowując progi)

`P` = aktywny profil, kolumny `m_student | m_rodzina | m_senior` (0–100) w osiedlach i `h_student | h_rodzina | h_senior` (0–1) w punktach.

```js
// heat
'heatmap-weight':    ['interpolate', ['linear'], ['get', `h_${P}`], 0.35, 0, 1, 1],
'heatmap-radius':    ['interpolate', ['linear'], ['zoom'], 9, 14, 10, 22, 11, 38, 12, 70, 13, 120],
'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 12, 1.4],
'heatmap-color':     HEAT_RAMP[P], // 5.4
'heatmap-opacity':   ['interpolate', ['linear'], ['zoom'], 11.5, 0.85, 12.5, 0],

// osiedla-fill
'fill-color':   ['interpolate', ['linear'], ['get', `m_${P}`], 38, ACCENT_SOFT[P], 70, ACCENT_MID[P], 95, ACCENT[P]],
'fill-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0, 12.5,
                 ['case', ['boolean', ['feature-state', 'hover'], false], 0.62, 0.38]],

// osiedla-line
'line-color':   ['case', ['boolean', ['feature-state', 'hover'], false], ACCENT[P], 'rgba(22,22,29,0.22)'],
'line-width':   ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0.8],
'line-opacity': ['interpolate', ['linear'], ['zoom'], 11.5, 0, 12.5, 1],

// buildings-3d
'fill-extrusion-color':  ['interpolate', ['linear'], ['get', 'render_height'], 0, BLD_LOW, 60, BLD_HIGH],
'fill-extrusion-height': ['*', ['get', 'render_height'], K],       // K animowane 0 → 1
'fill-extrusion-base':   ['*', ['get', 'render_min_height'], K],
'fill-extrusion-vertical-gradient': true,
```

Zmiana profilu = `setPaintProperty` z nową kolumną. Najpierw ustaw `*-transition: { duration: 600 }`.

Kolumna `h_*` jest przeskalowana percentylowo do 0–1 (sekcja 7.1). Siatka ma dziś 608 komórek co ok. 1 km (`warsaw_grid_1km.geojson`), stąd duże promienie. Po przejściu ETL na komórki 200 m ten sam skrypt T1 generuje gęstsze punkty; wtedy promienie zmniejszamy mniej więcej o połowę (stała `HEAT_RADIUS_SCALE` w `src/map/layers/heat.ts`).

### 5.4 Palety mapy

| Token | Dzień | Noc (przejście kinowe) |
|---|---|---|
| tło | `#F4F0EA` | `#0B0E17` |
| woda | `#D6E2EA` | `#101A2A` |
| zieleń | `#E4EADB` | `#0F1A17` |
| drogi | `#FFFFFF` | `#1C2233` |
| `BLD_LOW` → `BLD_HIGH` | `#EEE8E0` → `#D8D0C4` | `#262C3D` → `#3A4258` |
| maska `cinematic-dim` | ink `#16161D` @ 0,18 | `#0B0E17` @ 0,62 |
| niebo `setSky` | — | `sky-color #0B0E17`, `horizon-color #2B3150`, `fog-color #141A2C`, `sky-horizon-blend 0.6`, `horizon-fog-blend 0.5`, `fog-ground-blend 0.25` |
| światło `setLight` | `anchor: map, position: [1.4, 200, 35], color: #FFF4E6, intensity: 0.35` | `color: #C9D4FF, intensity: 0.45` |

`HEAT_RAMP[P]` (po `heatmap-density`): `0 → rgba(akcent, 0)`, `0.2 → ACCENT_SOFT @ 0.55`, `0.45 → ACCENT_MID @ 0.7`, `0.75 → ACCENT @ 0.82`, `1 → ACCENT_DEEP @ 0.9`. Wartości kolorów w 8.1.

---

## 6. Dane i kontrakty

### 6.1 Pliki

| Plik | Kto tworzy | Zawartość |
|---|---|---|
| `application/public/data/osiedla.geojson` | ✅ jest (commit b718042, `data/scripts/fetch_osiedla_boundaries.py`) | 143 obszary MSI: `id` (slug), `name`, `district`, `area_km2`. Nie modyfikujemy, to wynik pobrania. |
| `application/public/data/osiedla_scored.geojson` | T1 (`data/scripts/build_mock_layers.py`) | Te same geometrie + `m_student`, `m_rodzina`, `m_senior` (int 0–100), `c_{CategoryId}` (int 0–100, 10 pól), `featured` (0/1), `featured_slug` (string lub brak) |
| `application/public/data/osiedla_labels.geojson` | T1 | Punkty etykiet (`polylabel` / `shapely.Polygon.representative_point`) z `id`, `name` |
| `application/public/data/heat_points.geojson` | T1 | Punkty środków komórek `in_warsaw` z `h_student`, `h_rodzina`, `h_senior` (0–1, 2 miejsca po przecinku) |
| `application/src/mock/osiedla.ts` | T2 (inny agent, w toku) | Pełne profile 3 wyróżnionych osiedli (6.2) |
| `application/src/mock/profiles.ts`, `categories.ts` | T3 | Tabele 3.1–3.4 jako stałe TS |
| `application/public/media/{slug}/` | T2 (zdjęcia), T8 (wideo) | `01.avif`…`06.avif` (1600 px, ≤ 250 KB), `thumb.avif` (160 px, ≤ 20 KB), `flyover.mp4`, `flyover.webm` (opcjonalnie), `poster.avif` |
| `application/public/illustrations/{profile}.svg` | T2 | Ilustracje kart profilu (duotone, `currentColor` + akcent) |

### 6.2 Kontrakt `osiedla.ts` (oczekiwany kształt)

Plik przygotowuje inny agent. **Obowiązuje rzeczywisty plik.** Jeśli nazwy pól się różnią, UI czyta dane wyłącznie przez `src/mock/adapter.ts`, który mapuje plik na poniższe typy. Danych w `osiedla.ts` nie przerabiamy pod UI.

```ts
export type ProfileId = 'student' | 'rodzina' | 'senior'
export type CategoryId = 'cisza' | 'zielen' | 'komunikacja' | 'gastronomia' | 'sport'
  | 'kultura' | 'edukacja' | 'zdrowie' | 'zakupy' | 'zycie_nocne'
export type TravelMode = 'pieszo' | 'rower' | 'komunikacja' | 'auto'
export type LngLat = [number, number]

export interface FeaturedOsiedle {
  slug: 'powisle' | 'miasteczko-wilanow' | 'saska-kepa'
  msiId: string                    // id w osiedla.geojson: 'powisle' | 'blonia-wilanowskie' | 'saska-kepa'
  name: string                     // wyświetlana nazwa, np. 'Miasteczko Wilanów'
  district: string
  profile: ProfileId               // profil, dla którego to osiedle jest #1
  tagline: string                  // ≤ 70 znaków
  aiSummary: string                // 2–4 zdania
  center: LngLat
  cameraBearing: number            // stopnie; kierunek ujęcia kinowego
  cameraZoom?: number              // domyślnie 16
  match: Record<ProfileId, number> // 0–100; match[profile] ≥ 94 i najwyższy w mieście
  heroImages: { src: string; alt: string; credit: string }[]   // ≥ 3
  video?: { mp4: string; webm?: string; poster: string }
  stats: Record<CategoryId, number>                              // 0–100, stan 2026
  highlights: { id: string; name: string; category: CategoryId; coord: LngLat;
                description: string; distanceM?: number; walkMin?: number }[]
  prices: { rentPerM2: number; buyPerM2: number; cityRentPerM2: number; cityBuyPerM2: number; asOf: string }
  traffic: number[]                // dokładnie 24 wartości 0–100, indeks = godzina
  commute: { id: string; label: string; minutes: Partial<Record<TravelMode, number>> }[]
  routes: { id: string; label: string; category: CategoryId; destinationName: string;
            geometry: GeoJSON.LineString; distanceM: number;
            minutes: Partial<Record<TravelMode, number>> }[]
  timeline: { id: string; year: 2026 | 2027 | 2028 | 2029 | 2030; title: string; description: string;
              category: CategoryId; status: 'planowana' | 'w budowie' | 'zakończona';
              coord?: LngLat; statDeltas: Partial<Record<CategoryId, number>>; matchDelta?: number }[]
  portals: { name: 'Otodom' | 'Morizon'; rentUrl: string; buyUrl: string }[]
}
export const FEATURED: FeaturedOsiedle[]
```

**Miasteczko Wilanów:** w MSI nie ma osobnego obszaru „Miasteczko Wilanów”, leży w obszarze **„Błonia Wilanowskie”** (`msiId: 'blonia-wilanowskie'`). Na mapie podświetlamy cały ten poligon, ale wyświetlamy nazwę „Miasteczko Wilanów”. W hero podtytuł: „Wilanów · obszar MSI Błonia Wilanowskie”. Etykieta mapy `osiedla-label` dla tego obiektu też pokazuje „Miasteczko Wilanów”.

### 6.3 Nadpisania w kliencie (adapter)

Po pobraniu `osiedla_scored.geojson` adapter (jednorazowo, przed `addSource`):

1. Dla 3 obiektów z `featured_slug` ustawia `m_*` = `FEATURED.match[*]` i `c_*` = `FEATURED.stats[*]`, a `name` = nazwa wyświetlana.
2. Dla każdego profilu `P` przycina `m_P` osiedli niewyróżnionych do `max(m_P) ≤ FEATURED[profil P].match[P] − 5`. Dzięki temu #1 jest zawsze najwyżej na mapie.

---

## 7. Algorytmy deterministyczne

### 7.1 Dopasowanie (offline, T1, `data/scripts/build_mock_layers.py`, uruchamiany `uv run`)

1. Wczytaj `data/grid/cell_metrics.json` (`cells[id].metrics_norm`) i środki komórek z `data/grid/warsaw_grid_1km.geojson` (`properties.center`; plik siatki wskazany flagą `--grid`, żeby dało się podmienić na siatkę 200 m).
2. Dla każdej komórki policz `c_k` = średnią z kluczy kategorii k (tabela 3.2; `100 − gastronomy_1km` dla ciszy). Potem `raw_P = Σ_k w_Pk · c_k` (wagi 3.3).
3. **Punkty gradientu:** `h_P` = percentyl `raw_P` wśród komórek (0–1).
4. **Osiedla:** `c_k(osiedle)` = średnia `c_k` komórek, których środek leży w poligonie. Gdy takich komórek nie ma (małe osiedla przy siatce 1 km), bierzemy średnią ważoną odwrotnością odległości z 4 najbliższych środków do `representative_point`. `raw_P(osiedle)` liczymy tak samo jak dla komórki.
5. `m_P` = `round(38 + 51 · percentyl(raw_P wśród 143 osiedli))`, czyli zakres 38–89.
6. `featured` / `featured_slug` dla `powisle`, `blonia-wilanowskie` (→ `miasteczko-wilanow`), `saska-kepa`.
7. Etykiety: `representative_point` każdego poligonu. Dopisać źródło i metodę w `docs/data/zrodla-danych.md`.

### 7.2 Zdanie „AI” na hoverze (osiedla niewyróżnione)

- `K` = kategorie z wagą profilu ≥ 0,10.
- `s1, s2` = dwie kategorie z `K` o najwyższym `c_k`; `w` = kategoria z `K` o najniższym `c_k`.
- Jeśli `c_w ≥ 70`: `„{Mocna(s1)} i {mocna(s2)} — mocny wybór dla Ciebie.”`
- W przeciwnym razie: `„{Mocna(s1)} i {mocna(s2)}, ale {słaba(w)}.”` (wielka litera tylko na początku).
- Przykład: „Dużo zieleni i spokojne ulice, ale dojazd z przesiadkami.”

### 7.3 Zdanie ankiety

Patrz 4.1. Implementacja jako czysta funkcja `buildSentence(state): SentencePart[]` (części: tekst stały i sloty), żeby te same dane renderowały ankietę i pasek na mapie. Funkcja ma testy jednostkowe dla przypadków 0, 1 i 4 priorytetów, „zakupy” jako jedynego priorytetu oraz profilu `rodzina`.

### 7.4 Podpowiedź korków

- Rano: `pk` = argmax `traffic[6..10]`; `best` = argmin `traffic[5..11]` z pominięciem `pk`, a przy remisie godzina najbliższa `pk`. `pct = round((traffic[pk] − traffic[best]) / traffic[pk] · 100)`.
- Tekst: „Rano korki są największe około {pk}:00. Wyjedź o {best}:00 — będzie o ok. {pct}% luźniej.”
- Gdy `traffic[pk] < 35`: „Tu rzadko stoi się w korkach — możesz wyjeżdżać, kiedy chcesz.”
- Druga linia (popołudnie, okno 14–20) z tym samym algorytmem: „Po południu szczyt około {pk}:00, najlepiej wracać o {best}:00.”

### 7.5 Formatowanie

`formatPLN(n)` → „12 450 zł”; `formatPerM2(n)` → „18 900 zł/m²”; `formatMin(n)` → „14 min”; `formatKm(m)` → „2,3 km” (1 miejsce po przecinku, przecinek dziesiętny); procenty bez spacji: „87%”, a w pierścieniu duża liczba i mały znak „%”.

---

## 8. Design system

### 8.1 Tokeny (`src/design/tokens.css`)

```css
:root {
  /* Neutralne (ciepły papier) */
  --color-bg: #F6F3EE;
  --color-surface: #FFFFFF;
  --color-ink: #16161D;          /* tekst główny */
  --color-ink-2: #4A4A57;        /* tekst drugorzędny */
  --color-ink-3: #8A8A99;        /* podpisy, placeholdery */
  --color-line: #E7E2DA;         /* separatory */
  --color-ok: #2E9E6A;
  --color-warn: #E3A33B;
  --color-bad: #D9534F;

  /* Akcenty profili */
  --student: #7C5CFF;  --student-soft: #EEEAFF;  --student-mid: #B3A2FF;  --student-deep: #3D22B8;
  --rodzina: #FF6B4A;  --rodzina-soft: #FFEDE6;  --rodzina-mid: #FFAA7A;  --rodzina-deep: #C2361A;  /* koral + bursztyn w mid */
  --senior:  #13A396;  --senior-soft:  #DFF5F2;  --senior-mid:  #6FD0C4;  --senior-deep:  #0B6B62;

  /* Akcent aktywny — przełączany przez [data-profile] na <html> */
  --accent: var(--student); --accent-soft: var(--student-soft);
  --accent-mid: var(--student-mid); --accent-deep: var(--student-deep);

  /* Noc (przejście kinowe) */
  --night-bg: #0B0E17;  --night-surface: rgba(14, 18, 30, 0.62);  --night-ink: #F3F1EC;

  /* Szkło */
  --glass: rgba(255, 255, 255, 0.72);
  --glass-strong: rgba(255, 255, 255, 0.86);   /* panele z długim tekstem — kontrast AA */
  --glass-border: rgba(255, 255, 255, 0.65);
  --glass-hairline: rgba(22, 22, 29, 0.06);
  --glass-blur: blur(18px) saturate(1.4);

  /* Promienie */
  --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-xl: 28px; --r-pill: 999px;

  /* Cienie */
  --shadow-sm: 0 1px 2px rgba(22, 22, 29, 0.06);
  --shadow-md: 0 8px 24px -6px rgba(22, 22, 29, 0.12);
  --shadow-lg: 0 24px 60px -12px rgba(22, 22, 29, 0.22);
  --shadow-glow: 0 0 0 1px color-mix(in srgb, var(--accent) 22%, transparent),
                 0 10px 32px -6px color-mix(in srgb, var(--accent) 40%, transparent);

  /* Odstępy (siatka 4 px) */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 20px;
  --s-6: 24px; --s-8: 32px; --s-10: 40px; --s-14: 56px; --s-20: 80px;

  /* Ruch */
  --d-fast: 120ms; --d-base: 200ms; --d-slow: 320ms; --d-slower: 600ms; --d-cinema: 1200ms;
  --ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-emphasized: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-cinema: cubic-bezier(0.65, 0, 0.35, 1);

  /* Warstwy */
  --z-map: 0; --z-chrome: 10; --z-panel: 20; --z-hover: 30; --z-toast: 40; --z-cinema: 50;
}
[data-profile="rodzina"] { --accent: var(--rodzina); --accent-soft: var(--rodzina-soft); --accent-mid: var(--rodzina-mid); --accent-deep: var(--rodzina-deep); }
[data-profile="senior"]  { --accent: var(--senior);  --accent-soft: var(--senior-soft);  --accent-mid: var(--senior-mid);  --accent-deep: var(--senior-deep); }
```

Te same wartości eksportujemy z `src/design/tokens.ts` dla wyrażeń MapLibre (MapLibre nie czyta zmiennych CSS).

### 8.2 Typografia

- **Display:** Plus Jakarta Sans Variable (`@fontsource-variable/plus-jakarta-sans`), 600–800, nagłówki i nazwy osiedli.
- **UI i tekst:** Inter Variable (`@fontsource-variable/inter`), 400–600, `font-feature-settings: "cv11", "ss01"`; liczby w statystykach `font-variant-numeric: tabular-nums`.
- Oba fonty mają `latin-ext` (polskie znaki). `font-display: swap`; preload pliku Inter.

| Token | Rozmiar / interlinia | Grubość | Tracking | Font |
|---|---|---|---|---|
| `display-xl` | 72 / 76 px (≤ 1440: 60 / 64) | 800 | −0.035em | display |
| `display-l` | 48 / 52 px | 700 | −0.03em | display |
| `h1` | 32 / 38 px | 700 | −0.02em | display |
| `h2` | 24 / 30 px | 600 | −0.015em | display |
| `h3` | 18 / 24 px | 600 | −0.01em | display |
| `body` | 15 / 22 px | 400 | 0 | UI |
| `small` | 13 / 18 px | 500 | 0 | UI |
| `micro` | 11 / 14 px | 600 | +0.08em, WERSALIKI | UI |

### 8.3 Komponenty bazowe (`src/components/ui/`)

`Button` (primary: tło `--accent`, biały tekst, radius pill, wys. 48, hover jaśniejszy o 6 % + `--shadow-glow`, active `scale(0.98)`; secondary: szkło + obwódka hairline; ghost), `IconButton` (40 × 40, szkło), `Chip` / `Tile` (aria-pressed), `GlassPanel` (`--glass` lub `--glass-strong`, `backdrop-filter: var(--glass-blur)`, obwódka `--glass-border`, wewnętrzna linia `--glass-hairline`, `--shadow-lg`, radius `--r-xl`), `MatchRing` (SVG, grubość 10 % średnicy, ścieżka ink 8 %, łuk w akcencie z zaokrąglonym końcem, licznik), `CategoryBar`, `Toast`, `Tooltip`, `Segmented`, `Badge` („Najlepsze dopasowanie”: tło `--accent-soft`, tekst `--accent-deep`, ikona `Crown`).

**Mikrointerakcje:** fokus `outline: 2px solid var(--accent); outline-offset: 2px` (tylko `:focus-visible`); hover kart uniesienie 2–4 px; liczby w pierścieniu i paskach z tweenem; ikona `ArrowRight` w CTA przesuwa się o 3 px na hover.

---

## 9. Architektura aplikacji

```
application/
  netlify.toml                  # T12 (albo w katalogu głównym repo z base = "application")
  public/
    _redirects                  # /*  /index.html  200
    data/  media/  illustrations/
  src/
    main.tsx                    # import fontów, tokens.css, maplibreSetup
    app/
      App.tsx                   # przełącznik ekranów + AnimatePresence
      config.ts                 # APP_NAME, URL stylu, stałe kamery
      router.ts                 # mini-router na History API (bez zależności)
      store.tsx                 # Context + useReducer + sessionStorage
    design/ tokens.css  tokens.ts  global.css
    components/ui/…
    screens/
      Intro/  Survey/  Matching/  MapScreen/  OsiedlePanel/
    map/
      MapView.tsx               # jedna instancja mapy na całe życie aplikacji
      basemap.ts                # ocieplenie palety, dzień/noc
      layers/ heat.ts  osiedla.ts  featured.ts  buildings.ts  route.ts  dim.ts
      markers/ FeaturedMarker.tsx  HighlightMarker.tsx  InvestmentMarker.tsx
      cinematic.ts              # sekwencja 4.4, przerywalna
      hover.ts                  # feature-state + karta przez ref
    mock/
      osiedla.ts                # T2
      profiles.ts  categories.ts  adapter.ts
    lib/ sentence.ts  traffic.ts  format.ts  timeline.ts  (+ *.test.ts)
```

- **Stan** (`store.tsx`): `{ profile: ProfileId | null, priorities: CategoryId[], horizon: Horizon | null, timelineYear: number, visited: string[] }`, zapis w `sessionStorage['siatka.mock.v1']`. Akcje: `setProfile` (ustawia też domyślne priorytety i horyzont), `togglePriority`, `setHorizon`, `setYear`, `markVisited`, `reset`.
- **Adresy:** `/`, `/ankieta?krok=1|2|3`, `/mapa`, `/mapa/:slug`. Wejście na `/mapa` bez profilu → profil `rodzina`, horyzont `stale`. Skróty prezentera: `?profil=student|rodzina|senior&horyzont=chwila|stale` ustawia stan i przechodzi na mapę; `Shift+R` resetuje do intro.
- **Mapa** jest montowana raz (od ekranu „Dopasowanie”) i nie jest odmontowywana; ekrany mapy i panelu to nakładki. Ankieta i intro nie zależą od chunku mapy (`React.lazy` dla `MapView` i `OsiedlePanel`, prefetch na intro).
- Istniejące `src/components/GridMap.tsx` i `src/lib/supabase.ts` zostają w repo, ale nie są importowane przez mock (bez wymagania `.env`).

---

## 10. Wydajność, responsywność, dostępność

**Wydajność (laptop, Chrome, 1440 × 900):**

- Średnio ≥ 55 fps (cel 60) podczas: przesuwania i zoomowania mapy z gradientem, hovera po osiedlach, `flyTo` z wyrastaniem budynków i orbity.
- `backdrop-filter` tylko na panelach (≤ 40 % ekranu); w trakcie `flyTo` interfejs jest ukryty (`visibility: hidden` po fade).
- Animacje DOM tylko przez `transform` i `opacity`. Hover bez re-renderu React przy każdym ruchu myszy. Animacje paint MapLibre przez wbudowane `*-transition`, a nie przez `rAF` (wyjątek: mnożnik wysokości budynków ≤ 30 klatek).
- Budżety: JS początkowy (intro + ankieta) ≤ 120 KB gzip; chunk mapy ≤ 330 KB gzip; dane mapy łącznie ≤ 1,2 MB; zdjęcie hero ≤ 250 KB; wideo ≤ 6 MB na osiedle. Wideo `preload="none"`, a `preload="auto"` dopiero po hoverze karty lub znacznika danego osiedla.
- Pierwszy render intro (LCP) ≤ 1,5 s lokalnie (`vite preview`).

**Responsywność:**

- Cel: 1280–1920 px szerokości (testy 1280 × 800, 1440 × 900, 1920 × 1080).
- 768–1279 px: panel „Polecane” zwijany do przycisku; panel osiedla 440 px nad mapą.
- < 768 px (degradacja): ankieta w jednej kolumnie; na mapie zamiast hovera tap pokazuje kartę (drugi tap w wyróżnione otwiera osiedle); „Polecane” jako dolny arkusz z poziomą karuzelą; przejście kinowe bez orbity, interludium z samym wideo; panel osiedla jako pełnoekranowy arkusz z mapą na górnych 35 % wysokości.

**Dostępność:**

- Cała ankieta obsługiwana klawiaturą (Tab, strzałki, Spacja, Enter, Esc = Wstecz). Poprawne role (`radiogroup` / `radio`, `aria-pressed`, `aria-live` dla zdania).
- Lista „Polecane” i wszystkie sekcje panelu osiągalne Tabem; Esc zamyka panel i pomija interludium. Fokus przenoszony do nagłówka panelu po otwarciu i z powrotem na kartę po zamknięciu.
- Kontrast tekstu ≥ 4,5 : 1 (stąd `--glass-strong` pod dłuższym tekstem); dopasowanie zawsze także jako liczba, nie tylko kolor.
- `prefers-reduced-motion` respektowane (4.4). Mapa ma `aria-label="Mapa dopasowania osiedli Warszawy"`. Wykres korków ma tabelę ukrytą wizualnie (`sr-only`).
- `<html lang="pl">`, tytuł strony „Siatka — znajdź swoją okolicę w Warszawie”, favicon i meta `og:` z grafiką.

---

## 11. Wdrożenie (Netlify)

- `netlify.toml` w katalogu głównym repo:

```toml
[build]
  base = "application"
  command = "npm ci && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/media/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- Bez zmiennych środowiskowych. `npm run build` (`tsc -b && vite build`) przechodzi bez błędów i ostrzeżeń TS.
- Wdrożenie: `npx -y netlify-cli deploy --prod` z konta zespołu (wymaga zalogowania człowieka; agent przygotowuje konfigurację, sprawdza `netlify deploy` (draft), jeśli sesja istnieje, a w przeciwnym razie zostawia instrukcję w raporcie). Adres produkcyjny dopisać do `application/README.md`.

---

## 12. Kryteria akceptacji

Każde kryterium sprawdzamy ręcznie albo przez przeglądarkę sterowaną przez agenta (T13).

1. `cd application && npm ci && npm run build` kończy się sukcesem; `npm run lint` bez błędów; aplikacja startuje bez pliku `.env`.
2. `/` pokazuje nazwę „Siatka”, obietnicę i przycisk „Zacznij”; Enter przechodzi do kroku 1.
3. W kroku 1 wybór karty strzałkami i Enterem działa; po wyborze akcent UI zmienia kolor na kolor profilu i po ok. 400 ms pojawia się krok 2.
4. Zdanie u góry ankiety po wyborze „Rodzina” i domyślnych ustawieniach brzmi dokładnie: „Mamy rodzinę, liczą się dla nas przedszkola i szkoły, zieleń, cisza i zakupy, szukamy miejsca na stałe.”
5. W kroku 2 domyślnie są zaznaczone 4 kategorie z tabeli 3.3; zaznaczenie piątej jest blokowane z podpowiedzią; „Dalej” jest nieaktywne przy 0 zaznaczonych.
6. „Wstecz” działa na każdym kroku (z kroku 1 wraca do intro), zachowując odpowiedzi; przycisk wstecz przeglądarki działa tak samo.
7. Po „Pokaż moją Warszawę” pojawia się ekran „Dopasowanie” z 3 liniami i po ≤ 2 s mapa.
8. Na zoomie 10–11 widać płynny gradient w akcencie profilu, bez rozróżnialnych pojedynczych kropek; gradient różni się wyraźnie między trzema profilami (zrzuty).
9. Przy przybliżaniu od 11,5 do 12,5 gradient płynnie przechodzi w wypełnienia i kontury 143 osiedli; na zoomie ≥ 13 widać nazwy osiedli.
10. Hover nad dowolnym osiedlem pokazuje kartę z nazwą, dzielnicą, dopasowaniem w %, 3 paskami (pierwsze 3 priorytety z ankiety) i zdaniem „AI”; karta nie wychodzi poza ekran i znika po opuszczeniu osiedla.
11. Trzy wyróżnione osiedla mają poświatę konturu, pulsujący znacznik i pigułkę z nazwą na każdym zoomie; osiedle wybranego profilu ma odznakę „Najlepsze dopasowanie” i najwyższy wynik ze wszystkich 143.
12. Panel „Polecane dla Ciebie” pokazuje 3 karty w kolejności: osiedle profilu, potem pozostałe malejąco po dopasowaniu; hover karty podświetla osiedle na mapie.
13. Przełączenie profilu w popoverze paska zdania zmienia gradient, wypełnienia, kolejność kart i akcent bez przeładowania strony, z animacją ≤ 600 ms.
14. Klik w osiedle niewyróżnione pokazuje toast „Pełny profil tego osiedla wkrótce” przez ok. 2,4 s; nic poza tym się nie dzieje.
15. Klik w wyróżnione osiedle (poligon, znacznik albo kartę) uruchamia przejście kinowe: interfejs znika, kamera leci do pitch ok. 60°, budynki 3D wyrastają, reszta miasta ciemnieje, wybrane osiedle świeci, potem wideo i zdjęcia z pasami kinowymi, na końcu wjeżdża panel. URL zmienia się na `/mapa/{slug}`.
16. „Pomiń”, Esc, Spacja i Enter przerywają interludium i od razu otwierają panel; drugie wejście w to samo osiedle pomija interludium.
17. Gdy plik wideo nie istnieje lub nie ładuje się, przejście nadal się kończy (same zdjęcia), bez błędu w konsoli poza 404 zasobu.
18. Panel osiedla zawiera w kolejności: hero, Podsumowanie AI, paski 10 kategorii (priorytety z odznaką „Twój priorytet”), Ważne miejsca (ze znacznikami na mapie), Najkrótsza droga do…, Dojazd, Korki w ciągu doby, Ceny, Oś czasu.
19. Wybór celu w „Najkrótsza droga do…” rysuje animowaną trasę na mapie i dopasowuje kamerę tak, że trasa nie jest zasłonięta panelem; zakładki trybów pokazują czasy w minutach.
20. Wykres korków ma 24 słupki w 3 kolorach, dymek po najechaniu i podpowiedź zgodną z algorytmem 7.4 (test jednostkowy na danych każdego z 3 osiedli).
21. Ceny: dla „Na chwilę” domyślnie najem (zł/m² mies. i kwota za 45 m²), dla „Na stałe” kupno (zł/m² i kwota za 55 m²); przyciski Otodom i Morizon otwierają się w nowej karcie z właściwym URL.
22. Dla „Na stałe” suwak 2026→2030 (mysz, strzałki, „Odtwórz”) zmienia na żywo paski, pierścień dopasowania i listę inwestycji oraz dodaje znaczniki inwestycji na mapie; dla „Na chwilę” widać zajawkę, a „Pokaż prognozę” rozwija oś czasu.
23. „← Mapa”, „Wróć do mapy”, Esc i wstecz przeglądarki wracają do widoku miasta (pitch 0, poprzednia kamera, interfejs mapy widoczny, budynki ukryte).
24. Bezpośrednie wejście na `/mapa/saska-kepa` (także po odświeżeniu na Netlify) otwiera panel Saskiej Kępy bez błędów.
25. `?profil=senior&horyzont=chwila` otwiera mapę z profilem senior i najmem; `Shift+R` wraca do intro z wyczyszczonym stanem.
26. Trace wydajności Chrome podczas `flyTo` i orbity na laptopie: średnio ≥ 55 fps, brak długich zadań > 100 ms po załadowaniu danych.
27. Przy `prefers-reduced-motion: reduce` nie ma orbity, pulsowania ani Ken Burns, a całe demo da się przejść.
28. Lighthouse (desktop) dla `/`: Accessibility ≥ 90, Performance ≥ 85; brak błędów w konsoli na całej ścieżce demo.
29. Przy 1280 × 800 nic się nie nakłada (panel „Polecane”, legenda, kontrolki, panel osiedla); przy 390 × 844 da się przejść całą ścieżkę (ankieta → mapa → osiedle).
30. Cały tekst UI jest po polsku, z poprawnymi znakami diakrytycznymi i polskim formatem liczb; w kodzie i commitach nie ma kluczy API.

---

## 13. Poza zakresem

- Prawdziwe przeliczanie dopasowania w przeglądarce, suwaki wag, własne kategorie, pin pracy, izochrony.
- Pełne profile osiedli innych niż 3 wyróżnione (tylko hover i toast).
- Backend, Supabase, logowanie, zapis profilu, udostępnianie linku z wynikami.
- Prawdziwy routing (OSRM, Google), żywe dane o korkach, żywe ceny z portali (linki wyjściowe to statyczne URL wyszukiwań).
- Prawdziwa generacja tekstów lub wideo przez model AI w runtime.
- Porównywarka osiedli, ulubione, eksport PDF.
- Wersje językowe inne niż polska; tryb ciemny całej aplikacji (noc tylko w przejściu kinowym).
- Pełna jakość na urządzeniach mobilnych (wystarczy łagodna degradacja z sekcji 10).
- Mapa przestępczości i inne wrażliwe warstwy.

---

## 14. Plan realizacji

Każde zadanie to **jeden commit** na gałęzi funkcji (zgodnie z `CLAUDE.md`), wykonywany przez agenta typu **subagent**, z komunikatem w formacie `feat|fix|docs|chore: …` i bez stopek o współautorstwie AI. Zależności w nawiasach. Zadania bez wzajemnych zależności mogą iść równolegle (T1, T2, T3; potem T4 i T5).

| # | Zadanie | Właściciel | Zależy od | Pliki | Kryterium ukończenia |
|---|---|---|---|---|---|
| T0 | Granice osiedli MSI | subagent | — | `data/scripts/fetch_osiedla_boundaries.py`, `data/boundaries/warszawa_osiedla.geojson`, `application/public/data/osiedla.geojson` | ✅ **Zrobione** (b718042): 143 obszary, `id`, `name`, `district`, `area_km2` |
| T1 | Warstwy dopasowania (offline) | subagent | T0 | `data/scripts/build_mock_layers.py`, `application/public/data/{osiedla_scored,osiedla_labels,heat_points}.geojson`, wpis w `docs/data/zrodla-danych.md` | Skrypt `uv run` odtwarza pliki; `m_*` w 38–89 dla niewyróżnionych; 3 obiekty z `featured_slug`; łączny rozmiar ≤ 1,2 MB; sanity: Powiśle w górnym kwartylu `m_student`, osiedla obrzeży w górnej połowie `m_rodzina` dla zieleni |
| T2 | Treści i zdjęcia 3 osiedli | subagent (w toku) | — | `application/src/mock/osiedla.ts`, `application/public/media/{slug}/*`, `application/public/illustrations/*.svg` | Plik zgodny z 6.2 (lub udokumentowany adapter); ≥ 3 zdjęcia z licencją i `credit` na osiedle; `traffic` ma 24 wartości; ≥ 3 trasy z geometrią po ulicach; ≥ 3 wydarzenia osi czasu 2027–2030; `match[profile]` ≥ 94 |
| T3 | Design system, szkielet aplikacji, routing | subagent | — | `src/design/*`, `src/components/ui/*`, `src/app/*`, `src/mock/{profiles,categories}.ts`, `src/lib/{format,sentence}.ts` + testy, `index.html` | Fonty i tokeny działają; mini-router obsługuje 4 adresy, wstecz przeglądarki i deep link; store z `sessionStorage`; intro (4.0) gotowe; strona pokazowa `/dev/ui` (tylko DEV) z komponentami bazowymi; kryteria 1, 2, 30 |
| T4 | Ankieta + ekran „Dopasowanie” | subagent | T3 | `src/screens/Survey/*`, `src/screens/Matching/*` | Kryteria 3–7; obsługa samą klawiaturą sprawdzona; animacje 320 ms |
| T5 | Mapa: podkład, gradient, osiedla, hover | subagent | T1, T3 | `src/map/MapView.tsx`, `basemap.ts`, `layers/{heat,osiedla}.ts`, `hover.ts`, `src/mock/adapter.ts`, `src/screens/MapScreen/*` (legenda, kontrolki, pasek zdania) | Kryteria 8–10, 13 (w części mapy); zrzuty 3 profili na zoomie 10,8 i 13 |
| T6 | Wyróżnione osiedla + panel „Polecane” + toast | subagent | T2, T5 | `src/map/layers/featured.ts`, `markers/FeaturedMarker.tsx`, `src/screens/MapScreen/Recommended*.tsx`, `Toast` | Kryteria 11–14 |
| T7 | Przejście kinowe + 3D | subagent | T6 | `src/map/{cinematic,layers/buildings,layers/dim}.ts`, `src/screens/MapScreen/CinemaOverlay.tsx` | Kryteria 15–17, 23, 27; sekwencja przerywalna; trace ≥ 55 fps (kryterium 26) |
| T8 | Nagranie wideo przelotów | subagent | T7 | `src/screens/dev/RecordFlyover.tsx` (trasa `/dev/nagranie/:slug`, tylko DEV), `application/scripts/record-flyover.mjs`, `public/media/{slug}/flyover.{mp4,webm}`, `poster.avif` | Patrz niżej; 3 pliki MP4 ≤ 6 MB, 1920 × 1080, 30 fps, 6 s; pierwsza klatka = kamera końcowa `flyTo` |
| T9 | Panel osiedla: sekcje | subagent | T2, T7 | `src/screens/OsiedlePanel/*`, `src/map/layers/route.ts`, `markers/HighlightMarker.tsx`, `src/lib/traffic.ts` + testy | Kryteria 18–21, 24 |
| T10 | Oś czasu 2026→2030 | subagent | T9 | `src/screens/OsiedlePanel/Timeline*.tsx`, `src/lib/timeline.ts` + testy, `markers/InvestmentMarker.tsx` | Kryterium 22; testy sumowania delt i przycinania 0–100 |
| T11 | Dopracowanie, dostępność, wydajność, mobile | subagent | T4–T10 | różne | Kryteria 25–29; przegląd zgodności z sekcjami 8 i 10; budżety rozmiarów spełnione (`vite build` raport) |
| T12 | Wdrożenie Netlify | subagent | T11 | `netlify.toml`, `application/public/_redirects`, `application/README.md` | Build na Netlify przechodzi; deep link i odświeżenie działają (kryterium 24 na produkcji); adres w README |
| T13 | Test end-to-end w przeglądarce | subagent | T12 | brak zmian w kodzie (ewentualne poprawki jako osobne `fix:`) | Przejście kryteriów 1–30 przez Playwright lub Chrome DevTools MCP dla 3 profili i obu horyzontów; zrzuty przy 1280 × 800 i 1920 × 1080; raport z listą niespełnionych kryteriów |

**T8 — szczegóły nagrania:**

1. Trasa `/dev/nagranie/:slug` renderuje samą mapę (bez UI) w trybie nocnym z budynkami (`K = 1`), `preserveDrawingBuffer: true`, `pixelRatio 2`, okno 1920 × 1080.
2. `window.__seek(frame)` ustawia kamerę deterministycznie: start = kamera końcowa `flyTo` (`center`, `zoom 16`, `pitch 60`, `bearing cameraBearing`), w ciągu 180 klatek `bearing += 24°` i `zoom 16 → 16.5`; potem czeka na `map.once('idle')`.
3. Skrypt Playwright (`npx -y playwright@latest`, bez wpisu do `package.json`) zapisuje 180 klatek PNG do katalogu tymczasowego.
4. ffmpeg (systemowy) składa klatki z „wyglądem AI”: `-vf "eq=contrast=1.06:saturation=1.15:gamma=0.97,vignette=angle=PI/5,noise=alls=5:allf=t+u,format=yuv420p" -c:v libx264 -profile:v high -crf 24 -movflags +faststart -r 30`, bez audio. Opcjonalnie WebM VP9 `-crf 34 -b:v 0`. Poster = klatka 0.
5. Jeśli zespół ma dostęp do generatora wideo AI (obraz → wideo), może podmienić plik na wygenerowany, **o tej samej nazwie, długości i pierwszej klatce**.

---

## 15. Ryzyka

| Ryzyko | Mitygacja |
|---|---|
| OpenFreeMap niedostępny podczas pokazu | Stała `MAP_STYLE_URL` w `config.ts` z zapasem `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` (wtedy budynki 3D tylko, jeśli styl je ma); przed pokazem otworzyć demo, żeby kafelki były w cache przeglądarki |
| Gradient z siatki ~1 km wygląda „kropkowo” | Większe promienie (5.3), percentylowa waga; w ostateczności rozmycie przez `heatmap-intensity`; po siatce 200 m — mniejsze promienie |
| Przejście kinowe przycina się na słabszym laptopie | Wyrastanie budynków ≤ 30 aktualizacji; `?szybko=1`; wyłączenie `setSky`, jeśli trace pokazuje spadki |
| Brak zdjęć z czystą licencją | Wikimedia Commons (CC BY / CC BY-SA, podpis w `credit`) albo własne zdjęcia zespołu; zapasowo klatki z wideo przelotu |
| Wielkość poligonu „Błonia Wilanowskie” (8 km²) vs „Miasteczko Wilanów” | Kamera i znacznik w `center` Miasteczka; nazwa wyświetlana nadpisana (6.2) |
| Nazwy pól w `osiedla.ts` różnią się od 6.2 | Adapter `src/mock/adapter.ts`; UI nie czyta pliku bezpośrednio |

---

## 16. Dziennik decyzji mocka

| Data | Decyzja |
|---|---|
| 2026-10-17 | Zwrot z mapy siatki z personami na mock: ankieta (3 kroki) → mapa (gradient → osiedla MSI) → 3 wyróżnione osiedla → przejście kinowe 3D → panel osiedla |
| 2026-10-17 | Nazwa produktu bez zmian: „Siatka” (stała `APP_NAME`) |
| 2026-10-17 | Fragmenty zdania w ankiecie neutralne płciowo („Studiuję”, „Mamy rodzinę”, „Jestem na emeryturze”) |
| 2026-10-17 | Statystyki kategorii jako paski, bez radaru |
| 2026-10-17 | „Miasteczko Wilanów” = poligon MSI „Błonia Wilanowskie” z nadpisaną nazwą |
| 2026-10-17 | Podkład: OpenFreeMap Positron (bez klucza); noc tylko w przejściu kinowym, widok osiedla w dziennym 3D |
