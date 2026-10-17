# Spec dla agenta: geodataset poziomu hałasu – m.st. Warszawa

## 1. Cel

Zbuduj przestrzenny dataset poziomu hałasu środowiskowego dla m.st. Warszawy. Dane mają być zagregowane do dwóch poziomów:

- **(a)** siatka 500 × 500 m,
- **(b)** 18 dzielnic.

Do każdego poziomu dołącz szacunek liczby mieszkańców narażonych na poszczególne poziomy hałasu. Dataset ma służyć do map i porównań między dzielnicami.

Stack sugerowany: Python, `geopandas`, `pyogrio`, `shapely`, `pandas`, `pyarrow`; do PDF (moduł opcjonalny) `pdfplumber` lub `camelot`.

---

## 2. Charakter danych – przeczytaj zanim zaczniesz

Główne źródło to **strategiczne mapy hałasu (SMH)** z dyrektywy 2002/49/WE (END), **runda 2022**.

| Cecha | Wartość |
|---|---|
| Pochodzenie | **wynik modelowania** akustycznego (natężenie ruchu, prędkości, tabor itd.), **nie pomiary** |
| Agregacja czasowa | **średnia długookresowa z całego roku**, jedna wartość na lokalizację |
| Rok odniesienia | **2021** (runda 2022). Poprzednia runda: dane za 2016 (runda 2017). Następna: dane za 2026, termin 30.06.2027, więc jeszcze niedostępne |
| Wskaźniki | **LDWN** (= Lden) i **LN** (= Lnight), dB(A) |
| Rozdzielczość wartości | **pasma 5 dB**: Lden 55–59, 60–64, 65–69, 70–74, ≥75; Lnight 50–54, 55–59, 60–64, 65–69, ≥70. Niższe pasma tylko wtedy, gdy kraj przekazał je dobrowolnie |
| Rozdzielczość przestrzenna | poligony konturów (izofony) |
| Źródła hałasu | raportowane osobno: drogi, kolej, lotnictwo, przemysł. Sprawdź, w której kategorii są tramwaje; w polskich SMH są osobną kategorią |
| Wysokość obliczeniowa | 4 m nad terenem (standard END) |

### Definicje

- **LDWN (Lden)** – roczny średni poziom dźwięku z wagami pór doby:
  - dzień 6–18,
  - wieczór 18–22 (+5 dB),
  - noc 22–6 (+10 dB).

  Uśrednianie jest energetyczne:
  `Lden = 10·log10( (12·10^(Ld/10) + 4·10^((Le+5)/10) + 8·10^((Ln+10)/10)) / 24 )`

- **LN (Lnight)** – roczny średni poziom dźwięku dla pory nocy 22–6.

### ⚠️ Brak danych godzinowych

Nie istnieje publiczny, ogólnomiejski zbiór godzinowych pomiarów hałasu dla Warszawy.

- **Nie dezagreguj** LDWN/LN do godzin.
- **Nie generuj** „profilu dobowego” – z tych danych jest to niemożliwe.

Jedyną składową z rozdzielczością czasową jest opcjonalny moduł pomiarów punktowych wokół Lotniska Chopina (sekcja 7). To dane zdarzeniowe, dobowe i miesięczne z kilku punktów, nie dla całego miasta.

### ⚠️ Rok 2021 = COVID-19

Ruch był wtedy ograniczony; m.in. nocnych operacji lotniczych było mniej niż przed pandemią. Wyniki mogą zaniżać obecny stan. Zapisz to w README.

---

## 3. Źródła

### 3.1 Kontury hałasu (dane główne)

1. **EEA – Noise contours data reported under END 2022 (vector)**
   - Opublikowane 19.03.2026, format GeoPackage / GDB / ESRI REST / WMS, temporal coverage 2021.
   - URL: https://www.eea.europa.eu/en/datahub/datahubitem-view/c952f520-8d71-42c9-b74c-b7eb002f939b
   - **Krok 0:** sprawdź, czy zbiór zawiera Polskę i aglomerację Warszawa. Jeśli nie, przejdź do fallbacków.
   - Zinwentaryzuj i zapisz:
     - CRS,
     - warstwy,
     - pola,
     - unikalne wartości atrybutów źródła, wskaźnika i pasma,
     - licencję.

2. **Fallback A – serwis mapowy m.st. Warszawy (SMH 2022)**
   - Poszukaj usług WFS/WMS (GetCapabilities).
   - WMS to tylko obraz: użyj go wyłącznie do wizualnej kontroli, nie do obliczeń powierzchni.
   - Jeśli wektora nie da się pozyskać, opisz w README rekomendację wniosku o udostępnienie informacji o środowisku do Biura Ochrony Środowiska UM. Wniosku nie składaj.

3. **Fallback B – INSPIRE, runda 2017 (dane za 2016), WFS na iip.ekoportal.gov.pl**
   - Zweryfikowane endpointy:
     - `https://iip.ekoportal.gov.pl/geoserver/DF4_8_AggRail2017Lden/wfs?service=wfs&version=2.0.0&request=GetCapabilities`
     - `https://iip.ekoportal.gov.pl/geoserver/DF4_8_AggRail2017Lnight/wfs?service=wfs&version=2.0.0&request=GetCapabilities`
     - `https://iip.ekoportal.gov.pl/geoserver/DF4_8_AggAir2017Lnight/wfs?...`
   - Pozostałe endpointy prawdopodobnie mają wzór `DF4_8_Agg{Road|Rail|Air|Ind}2017{Lden|Lnight}`. Zweryfikuj każdy przez GetCapabilities.
   - Rekordy oznacz `data_year = 2016`.

### 3.2 Dane o narażeniu (walidacja)

- **EEA – Reported data on noise exposure 2022** (xlsx, wersja z listopada 2024; NIE ta oznaczona „superseded”).
  - Zawiera liczbę osób w pasmach 5 dB per źródło per aglomeracja.
  - Ta sama strona EEA co wyżej.

- **POH Mazovia, załącznik nr 4 (Warszawa)** – wartości dla całego miasta z SMH Warszawa 2022:
  - URL: https://swmww.esesja.pl/zalaczniki/301581/zalacznik-nr-4-warszawa_2856249.pdf
  - Mieszkańcy z przekroczeniem dopuszczalnego LDWN, hałas drogowy:
    - 37 200 osób przy przekroczeniu o 1–5 dB,
    - 6 400 przy 5–10 dB,
    - 400 przy 10–15 dB.
  - NHA (znaczna uciążliwość):
    - drogowy 113 201,
    - tramwajowy 12 107,
    - lotniczy 6 016,
    - kolejowy 1 182.
  - NHSD (zaburzenia snu): drogowy 27 015.
  - NIHD (choroba niedokrwienna serca): 141.
  - Ok. 20 500 osób mieszka w zasięgu hałasu lotniczego LDWN > 55 dB.
  - Ludność miasta przyjęta w SMH: 1 663 588.
  - ⚠️ „Przekroczenia” odnoszą się do polskich dopuszczalnych poziomów, które zależą od przeznaczenia terenu. To **inna miara** niż bezwzględne pasma END – nie porównuj ich 1:1.

- **GIOŚ API** (https://dane.gios.gov.pl/, moduł HAŁAS)
  - Przejrzyj dokumentację. Moduł podaje m.in. dane o osobach i obiektach wrażliwych w przedziałach hałasu oraz o działaniach naprawczych.
  - Użyj go, jeśli ma rozbicie przydatne dla Warszawy.

### 3.3 Granice i ludność

- **Granice dzielnic:**
  - PRG (GUGiK) – w Warszawie dzielnice odpowiadają jednostkom ewidencyjnym; albo
  - warstwa dzielnic z portalu otwartych danych m.st. Warszawy.
  - Kontrola: 18 dzielnic, suma powierzchni ≈ 517 km².

- **Ludność:**
  - GUS – siatka ludności 1 km (NSP 2021) jako baza;
  - GUS BDL – liczba ludności dzielnic jako kontrola.
  - Wartość z SMH (1 663 588) może się różnić od NSP 2021, bo to inne źródło i inna definicja ludności. Udokumentuj, którą bazę przyjmujesz.

- **Budynki mieszkalne:**
  - BDOT10k – warstwa budynków z funkcją mieszkalną i liczbą kondygnacji, jeśli jest dostępna;
  - służy do rozkładu dasymetrycznego ludności.

---

## 4. Pipeline

1. **Pobranie i inwentaryzacja** – pobierz dane z sekcji 3 i zapisz `sources.md`: URL, data pobrania, licencja, rok danych, runda mapowania.

2. **CRS** – obliczenia rób w **EPSG:2180** (PUWG 1992). Eksport webowy w EPSG:4326.

3. **Czyszczenie** – przytnij kontury do granicy Warszawy. Napraw geometrie (`make_valid`) i usuń nakładanie się poligonów w obrębie tej samej pary źródło × wskaźnik.

4. **Normalizacja** – sprowadź wszystko do jednej tabeli konturów (schemat w 5.1).

5. **Nie sumuj pasm między źródłami.**
   - Poziomy z różnych źródeł sumują się energetycznie, a z pasm 5 dB nie da się tego zrobić dokładnie.
   - Trzymaj źródła osobno.
   - Opcjonalnie dodaj warstwę `all_sources_max`: najwyższe pasmo spośród źródeł w danym miejscu. Opisz ją jako przybliżenie dolnej granicy hałasu łącznego.

6. **Siatka 500 m**
   - Siatka w EPSG:2180, wyrównana do pełnych 500 m, przycięta do granic miasta.
   - Dla każdej kombinacji komórka × źródło × wskaźnik policz:
     - udział powierzchni w każdym paśmie,
     - pasmo dominujące (o największej powierzchni),
     - pasmo maksymalne.

7. **Ludność (dasymetrycznie)**
   - Rozłóż ludność z siatki 1 km na budynki mieszkalne, proporcjonalnie do: powierzchnia zabudowy × liczba kondygnacji. Gdy brak kondygnacji, użyj samej powierzchni.
   - Każdemu budynkowi przypisz pasmo w jego centroidzie, osobno dla każdego źródła i wskaźnika.
   - Zagreguj wyniki do siatki 500 m i do dzielnic.
   - Kolumna wynikowa: `pop_est`, wyraźnie oznaczona jako szacunek.

8. **Dzielnice** – dla każdej kombinacji dzielnica × źródło × wskaźnik × pasmo policz:
   - powierzchnię,
   - udział powierzchni,
   - `pop_est`,
   - udział ludności.

9. **(Opcjonalnie) wskaźniki zdrowotne NHA, NHSD, NIHD**
   - Metody wg rozporządzenia MKiŚ, Dz.U. 2022 poz. 2795 (zał. III END w brzmieniu dyrektywy 2020/367).
   - Jako poziom reprezentatywny pasma przyjmij jego środek i opisz to założenie.
   - Porównaj sumy miejskie z wartościami z POH (3.2) i raportuj rozbieżność. Z powodu pasm i rozkładu ludności może być duża.

10. **Walidacja** – sekcja 8.

---

## 5. Schematy wyjściowe

### 5.1 `warsaw_noise_contours.gpkg` (warstwa `contours`)

| pole | typ | opis |
|---|---|---|
| `source` | text | `road` / `rail` / `tram` / `air` / `industry` / `all_sources_max` |
| `indicator` | text | `lden` / `lnight` |
| `band_min_db` | int | dolna granica pasma |
| `band_max_db` | int, nullable | górna granica (null dla pasma otwartego, np. ≥75) |
| `data_year` | int | 2021 lub 2016 |
| `mapping_round` | int | 2022 / 2017 |
| `origin` | text | `eea_end_2022` / `um_warszawa_smh2022` / `inspire_2017` |
| `geometry` | MultiPolygon | EPSG:2180 |

### 5.2 `warsaw_noise_grid_500m.parquet` + `.gpkg`

**Format długi:**
`cell_id, source, indicator, band_min_db, band_max_db, area_m2, area_share, pop_est, data_year`

**Warstwa podsumowania do map:**
`cell_id, source, indicator, dominant_band_min_db, max_band_min_db, pop_est_total, geometry`

### 5.3 `warsaw_noise_by_district.csv`

`district_name, district_code, source, indicator, band_min_db, band_max_db, area_km2, area_share, pop_est, pop_share, data_year, origin`

### 5.4 (opcjonalnie) `warsaw_noise_health_by_district.csv`

`district_name, nha_road, nha_rail, nha_tram, nha_air, nhsd_road, nhsd_rail, nhsd_tram, nhsd_air, nihd_road, method_note`

### 5.5 `maps/`

Kartogramy dzielnic (PNG), m.in.:
- udział ludności przy drogowym Lden ≥ 65 dB,
- udział ludności przy drogowym Lnight ≥ 55 dB,
- mapa siatki z pasmem dominującym.

Wersja interaktywna HTML jest opcjonalna.

### 5.6 `README.md`

Opisz:
- zawartość plików i słownik pól,
- charakter danych: modelowane, roczne LDWN/LN, pasma 5 dB, rok 2021,
- metodę rozkładu ludności,
- ograniczenia,
- licencje.

---

## 6. Ograniczenia, które muszą trafić do README

- Dane są modelowane, a nie mierzone, i liczone na wysokości 4 m. Nie są równoważne hałasowi wewnątrz budynków.
- Wartości to roczne średnie długookresowe w pasmach 5 dB, bez rozdzielczości godzinowej.
- Rok 2021 był pod wpływem COVID-19.
- Pasma poniżej Lden 55 i Lnight 50 mogą nie istnieć.
- Ludność per pasmo to szacunek dasymetryczny.
- Tych samych osób nie wolno sumować między źródłami.

---

## 7. Moduł opcjonalny: pomiary wokół Lotniska Chopina

To jedyne dane z rozdzielczością czasową.

- **Źródło:** miesięczne sprawozdania z ciągłego monitoringu hałasu Lotniska Chopina (PPL). Strona `https://www.lotnisko-chopina.pl/pl/monitoring-halasu.html` (adres z publikacji z lat 2018–2022, zweryfikuj).
- **Charakter danych:**
  - pomiary w kilku stałych punktach, m.in. P1 Załuski, P3 Mysiadło, „Onkologia”, „Meral”;
  - zdarzenia akustyczne (LAeq i LAmax pojedynczej operacji) oraz zestawienia dobowe i miesięczne dla dnia i nocy.
- To **nie są** godzinowe średnie dla miasta. Nie interpoluj ich przestrzennie.
- **Wynik:**
  - `chopin_monitoring_daily.csv` (`station_id, date, laeq_day, laeq_night, n_events_day, n_events_night, source_pdf`),
  - `chopin_stations.gpkg` (punkty).
- Dane wyciągasz z PDF, więc ręcznie zweryfikuj co najmniej 3 miesiące.
- Lotnisko Warszawa-Babice – zrób to samo, jeśli sprawozdania są publiczne.

---

## 8. Definition of Done

- [ ] `sources.md` z URL, datami pobrania, licencjami, rokiem danych
- [ ] 18 dzielnic, suma powierzchni ≈ 517 km²
- [ ] suma `pop_est` = przyjęta baza ludności (±2%), z udokumentowaną różnicą względem SMH (1 663 588)
- [ ] suma osób w pasmach (`road` / `lden`) dla miasta porównana z EEA exposure xlsx dla aglomeracji Warszawa; różnica opisana (cel < 20%)
- [ ] brak nakładających się poligonów w ramach jednej pary źródło × wskaźnik
- [ ] każdy rekord ma `data_year` i `origin`
- [ ] README zawiera wszystkie ograniczenia z sekcji 6
- [ ] kontrola wizualna:
  - pasma drogowe układają się wzdłuż głównych tras,
  - najwyższe narażenie wypada w centrum i na zachodzie miasta (zgodnie z POH)

---

## 9. Czego NIE robić

- Nie generuj danych godzinowych ani „typowego profilu dobowego” z LDWN/LN.
- Nie sumuj liczby osób narażonych między źródłami.
- Nie licz „przekroczeń norm” bez danych o przeznaczeniu terenu (dopuszczalne poziomy zależą od rodzaju terenu chronionego). Trzymaj się bezwzględnych pasm.
- Nie mieszaj rund 2017 i 2022 bez pola `data_year`.
- Nie zastępuj braków danych wartościami wymyślonymi lub interpolowanymi. Zapisz je jako braki w README.
