# Koncept aplikacji — wybór miejsca na życie w Warszawie

**Robocza nazwa:** **Siatka** (mapa komórek ~1×1 km pomagająca zaplanować mieszkanie pod przyszłość rodziny)

**Wyzwanie hackathonu:** W3 „Warszawa: Twój ruch!” — aplikacja wspiera **świadomy wybór lokalizacji** (gdzie mieszkać, jak się poruszać, jak żyć w mieście na lata).

---

## Problem

Młode osoby i młode rodziny planujące mieszkanie w Warszawie dostają setki ogłoszeń, ale **brakuje im jednego obrazu okolicy na przyszłość**: czy w promieniu codziennego życia są przedszkola i szkoły, jak wygląda dojazd do pracy, czy powietrze i hałas nie będą problemem, czy jest zielenie, kultura, sport — i czy okolica „rośnie” razem z rodziną (liceum, uczelnia, bezpieczeństwo).

**Siatka** nie zastępuje portalu ogłoszeniowego — **porządkuje decyzję geograficzną** przed szukaniem konkretnego mieszkania.

---

## Dla kogo

- **Para 28–35 lat**, pierwsze lub drugie mieszkanie, myślą o dziecku w horyzoncie 2–5 lat.
- **Rodzice z małym dzieckiem**, szukający lepszej codzienności (przedszkole, toalety, boisko, spokój vs. centrum).
- **Osoba pracująca w jednym punkcie** (biuro, kampus, szpital) — chce **ograniczyć mapę** do rozsądnych czasów dojazdu.

---

## Główna idea UX: mapa kwadratów ~1 km × 1 km

| Element | Opis |
|--------|------|
| **Komórka siatki** | Stały podział Warszawy na kwadraty ~1 km (WGS84: ~0,009° szer., ~0,014° dł. przy 52°N). Jedna komórka = jeden „kafelek oceny życia”. |
| **Kolor / intensywność** | Wynik **profilu użytkownika** (wagi warstw) — nie jedna „prawda”, tylko dopasowanie do persony i filtrów. |
| **Klik w komórkę** | Panel szczegółów: liczniki w rejonie, najbliższe POI, szacowany dojazd do pracy, mini-wykres jakości powietrza, link do trendu cen (dzielnica). |
| **Pin pracy** | Użytkownik zaznacza **miejsce pracy** → komórki poza limitem czasu dojazdu **wyciszane** (szary overlay) lub odfiltrowane. |
| **Tryb warstw** | Włącz/wyłącz: edukacja, sport, kultura, środowisko, transport, bezpieczeństwo (wg dostępności danych). |
| **„Plamy” (heatmapy zagregowane)** | Zamiast setek pinów: **gęstość** w komórce — sport, wydarzenia kulturowe, restauracje (proxy), zieleń — czytelne na skali miasta. |

**Dlaczego 1 km:** wystarczająco dużo, by zobaczyć **sąsiedztwo i dzielnicę**, wystarczająco mało, by porównać **konkurencyjne lokalizacje** bez mikroskopii ulicy.

---

## Warstwy danych i funkcje produktu

### Edukacja (ścieżka rodziny)

| Potrzeba użytkownika | W produkcie | Źródło (katalog / hackathon) |
|---------------------|-------------|------------------------------|
| Przedszkola, szkoły podstawowe, licea | Liczba placówek w komórce + dystans do najbliższej; filtr „ścieżka 0–6 / 7–15 / 16–19 / studia” | **Poza bieżącym katalogiem API** — rejestr placówek (GIS UM / RSPO / import do `data/`). *W katalogu:* nazwy placówek oświatowych pojawiają się przy **otwarte-boiska** (szkoły jako host boisk) — **słabe proxy**, nie pełna mapa szkół. |
| Uczelnie | Punkty + wpływ na scoring „studia blisko” | Import uczelni (współrzędne) — **poza katalogiem** |
| Boiska przy szkołach | Plama sportowa + dostępność godzinowa | `otwarte-boiska` |
| Zajęcia dla dzieci / rodziny | Liczba ofert w dzielnicy / komórce | `zajecia-sportowe` (filtr `dedicated`) |

### Codzienność z dzieckiem

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| Toalety publiczne (przewijak) | Gęstość + „najbliższa z przewijakiem” | `toalety` (`Przewijak`, `Dostępność`, geometria) |
| Parki / zieleń | % zieleni w komórce lub dystans do parku | **Poza katalogiem** (np. poligony parków / OSM) — warstwa docelowa |
| Hałas / ruch uliczny (poziom wysoki) | Indeks „napięcia ruchu”: utrudnienia + gęstość przystanków + parking | `utrudnienia-w-ruchu-drogowym`, `lokalizacja-przystanow-komunikacji-miejskiej`, opcjonalnie `wolne-miejsca-parkingowe` |

### Transport i dojazd do pracy

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| Przystanki, tramwaje | Gęstość przystanków; „ile linii tramwajowych w 500 m” | `lokalizacja-przystanow-komunikacji-miejskiej`, `linie-dostepne-na-przystanku`, `odjazdy-dla-linii-z-przystanku` |
| Metro | Dystans do stacji (docelowo stacje WM) | **Stacje metro: poza katalogiem** (import). W katalogu jest tylko tabor w `pojazdy-transportu-publicznego`. |
| Korki / utrudnienia | Heatmapa aktywnych utrudnień przecinających komórkę | `utrudnienia-w-ruchu-drogowym` (`geo`) |
| Czas do pracy | **Isochrona** lub szacunek: środek komórki → pin pracy (MVP: prosty model: metro+tram+pieszo, bez pełnego routingu) | Obliczenia + przystanki/odjazdy; opcjonalnie OSRM / Google tylko demo |

### Środowisko

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| Jakość powietrza | Kolor komórki wg najbliższego sensora / średniej PIJP | `monitoring-jakosci-powietrza` |
| Pogoda (kontekst) | Tooltip „typowy komfort outdoor” | `pogoda` (opcjonalnie) |

### Kultura, restauracje, życie miejskie

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| Kultura / wydarzenia | Plama „kultura” — liczba wydarzeń w komórce / dzielnicy | `kalendarz-wydarzen` |
| Restauracje | Plama gastronomii | **Poza katalogiem** (OSM / licencja komercyjna) — w MVP: proxy przez gęstość wydarzeń + centrum historyczne |
| Trasy spacerowe | Bonus „rekreacja” | `trasy-turystyczne` |

### Bezpieczeństwo i „patologie”

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| Mapa przestępczości / zdarzeń | Heatmapa (z **anonimizacją**, agregacja do komórki 1 km — bez adresów) | **Poza katalogiem** (KWP / otwarte statystyki dzielnic). **Wymaga ostrożnej prezentacji** (etyka, brak stygmatyzacji osiedli). |
| Wysokość zabudowy | Średnia / max wysokość w komórce — „kanyon” vs „niska zabudowa” | **Poza katalogiem** (BDOT / modele 3D UM) |

### Finanse (pewność planowania)

| Potrzeba | W produkcie | Źródło |
|----------|-------------|--------|
| „Czy na to stać?” | Mediana ceny m² w dzielnicy / trend | `rejestr-cen-nieruchomosci` (po `dzielnica`, rok) |

---

## Scoring — jak z kwadratów robi się rekomendacja

1. Użytkownik wybiera **personę** (lub ręcznie suwaki wag).
2. Opcjonalnie: **pin pracy** + max czas dojazdu (np. 35 min).
3. Dla każdej komórki liczymy **wynik 0–100** z normalizowanych wskaźników:

| Wskaźnik (przykład) | Persona „spokój” | Persona „centrum” | Persona „rodzina w ruchu” |
|--------------------|------------------|-------------------|----------------------------|
| Zieleń / niska hałas | wysoka waga | niska | średnia |
| Wydarzenia / kultura | niska | wysoka | średnia |
| Edukacja 0–19 lat | średnia | niska | **wysoka** |
| Jakość powietrza | wysoka | średnia | wysoka |
| Czas do pracy | średnia | niska (akceptuje dłużej za kulturę) | **wysoka** |
| Sport / boiska | średnia | niska | wysoka |
| Toalety + przewijak | niska | niska | **wysoka** |
| Cena m² (dzielnica) | wysoka (tańsze obrzeża) | niska | wysoka |
| „Bezpieczeństwo” (agregat) | wysoka | średnia | wysoka |

4. Mapa pokazuje **top N komórek** + krótka narracja: „Dlaczego ten kwadrat pasuje do Ciebie”.

---

## Trzy persony demo (predefiniowane profile)

### 1. **Kasia — „Spokój na obrzeżach”** (28 lat, pierwsze mieszkanie)

- **Motywacja:** większe mieszkanie, cisza, park, powietrze; akceptuje dłuższy dojazd 2–3× w tygodniu do biura na Mokotowie.
- **Praca (demo):** pin w centrum biznesowym (Mokotów).
- **Filtry:** max 45 min dojazdu; waga: zieleń, AQ, cena, niska gęstość utrudnień; kultura — niska.
- **Story na pitch:** „Nie szukamy kawalerki w Śródmieściu — szukamy **miejsca, gdzie dziecko wyrośnie przy parku**, a my nie bankrutujemy na m²”.

### 2. **Marek — „Życie na scenie”** (32 lata, singiel / para bez dzieci)

- **Motywacja:** teatr, koncerty, restauracje, życie po 18:00; mały metraż, blisko metra.
- **Praca (demo):** pin w Pałacu Kultury / Śródmieście.
- **Filtry:** max 25 min pieszo+metro; waga: wydarzenia, przystanki/metro, gęstość „kultury”; edukacja — wyłączona.
- **Story:** „Chcę **wychodzić z drzwi w miasto**, nie w korku z Wilanowa”.

### 3. **Ania i Tomek — „Rodzina w ruchu”** (34 i 36 lat, córka 2 lata, drugie dziecko w planach)

- **Motywacja:** **równowaga** — dobre przedszkole w 15 min, dojazd do pracy <35 min (jedno z rodziców w Fabryce Tramwajów / Ochota, drugie w Mordorze), toalety z przewijakiem, boisko, przystępna cena.
- **Praca (demo):** **dwa piny** (MVP: średni czas lub „gorszy z dwóch”).
- **Filtry:** wagi na edukację, toalety, sport, dojazd, AQ; umiarkowana kultura.
- **Story:** „Nie wybieramy dzielnicy z Instagrama — wybieramy **kwadrat, w którym ułoży się nasze życie na 15 lat**”.

*(Trzecia persona celowo **nie** jest skrajnością — to **główny user produktu** pod hackathon W3.)*

---

## Przepływ demo (8–10 min)

1. Ekran startowy: „Gdzie w Warszawie ułożysz swoje życie?” — wybór persony.
2. Mapa siatki całej Warszawy — legenda warstw.
3. Automatyczne ustawienie pinu pracy (persona) → mapa się **przycina** (czas dojazdu).
4. Przełączenie warstwy „Edukacja” / „Sport” / „Powietrze” — zmiana kolorów komórek.
5. Klik w **polecany kwadrat** (np. Włochy vs Powiśle vs Ursynów) — panel porównawczy.
6. Krótki **timeline rodziny**: „2026 przedszkole → 2032 szkoła → 2040 liceum” (szacunki dystansów, nie prognozy demografii).
7. Zamknięcie: „Dane z otwartych API Warszawy + Wasza decyzja” — CTA do eksploracji własnego pinu pracy.

---

## MVP hackathon (co musi działać)

### W zakresie (must have)

- Siatka 1 km z **kolorowaniem** pod 3 persony.
- **Pin pracy** + prosty filtr czasu dojazdu (heurystyka OK).
- Warstwy z katalogu: **przystanki**, **powietrze**, **toalety**, **boiska**, **zajęcia sportowe**, **wydarzenia**, **utrudnienia**, **RCN** (po dzielnicy).
- Panel komórki z **liczbami** i 3 zdaniami „dlaczego tu”.
- Demo **3 person** bez logowania.

### Poza MVP (nice to have)

- Pełne szkoły / przedszkola / uczelnie (import).
- Metro, parki, wysokość zabudowy, przestępczość.
- Routing OSRM, porównanie dwóch miejsc pracy.
- Konto użytkownika, zapis profilu (Supabase).

### Ryzyka

| Ryzyko | Mitigacja |
|--------|-----------|
| Brak szkół w API katalogu | Import CSV do `data/` + geokodowanie; na demo — 1 dzielnica pełna, reszta przybliżona |
| Crime heatmap | Tylko agregat 1 km, komunikat o ograniczeniach danych |
| Czas dojazdu bez Google | Szacunek: odległość ÷ średnia prędkość + bonus za metro w komórce |
| Restauracje | OSM lub warstwa wyłączona w MVP |

---

## Mapowanie na pliki katalogu (`warsaw_open_data_catalog.json`)

| Slug | Rola w aplikacji |
|------|------------------|
| `lokalizacja-przystanow-komunikacji-miejskiej` | Transport, dojazd, gęstość |
| `linie-dostepne-na-przystanku` | Tramwaje / linie w sąsiedztwie |
| `odjazdy-dla-linii-z-przystanku` | Częstotliwość (opcjonalnie) |
| `utrudnienia-w-ruchu-drogowym` | Korki / ruch (heatmapa) |
| `monitoring-jakosci-powietrza` | Warstwa AQ |
| `toalety` | Rodzice, dostępność, przewijak |
| `otwarte-boiska` | Sport + słabe powiązanie ze szkołami |
| `zajecia-sportowe` | Plama sportowa (agregat) |
| `kalendarz-wydarzen` | Plama kultury |
| `trasy-turystyczne` | Rekreacja |
| `rejestr-cen-nieruchomosci` | Koszt życia (dzielnica) |
| `pogoda` | Kontekst (opcjonalnie) |
| `wolne-miejsca-parkingowe` | Presja samochodowa (opcjonalnie) |

**Do zasilenia poza katalogiem:** placówki oświatowe, uczelnie, stacje metra, parki, wysokość zabudowy, restauracje, statystyki bezpieczeństwa.

---

## Architektura (szkic)

```
[React mapa siatki] ← wskaźniki per komórka (Postgres / JSON w Supabase)
        ↑
[ETL / skrypty w data/] ← API UM (token) + importy statyczne (szkoły, metro)
        ↑
[Edge Function opcjonalnie] ← odświeżanie AQ, utrudnień, wydarzeń
```

- **Precompute** agregaty do siatki (hackathon: offline job, nie live przy każdym zoomie).
- **Persony** = zapisane zestawy wag w JSON (bez konta).

---

## Decyzje do podjęcia zespołem

| Temat | Propozycja |
|-------|------------|
| Nazwa produktu | Siatka / inna? |
| Dokładność siatki | 1 km vs 500 m |
| Źródło szkół | RSPO vs ręczny CSV |
| Etyka mapy przestępczości | Pokazać w MVP czy tylko w roadmapie |
| W3 „Twój ruch” | Akcent na **dojazd + transport + codzienne trasy rodziny** |

---

## Powiązane dokumenty

- [`urban_design.md`](../sources/urban_design.md) — inspiracja wizualna (heatmapy, warstwy, narracja).
- Katalog API: [`warsaw_open_data_catalog.json`](../../../warsaw_open_data_catalog.json) (repo nadrzędne `hackathon/`).
