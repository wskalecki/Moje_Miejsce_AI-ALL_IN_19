# Raport pochodzenia danych w mocku (application/)

> **Archiwalny audyt z 17.10.2026.** Aktualny stan źródeł i definicje metryk są w [`katalog-danych.md`](katalog-danych.md); naruszenia (np. ceny scrapowane z portali) wykrywa `python3 data/scripts/validate_data.py`.

Audyt z **17.10.2026**, gałąź `feat/mati-siatka`. Sprawdziliśmy każdą liczbę i każdy fakt widoczny w UI mocka i ustaliliśmy, skąd pochodzi. Kod aplikacji nie był zmieniany.

**Wniosek w jednym zdaniu:** dane bazowe są prawdziwe (granice MSI, OSM, portal miasta, OSRM, Wikimedia Commons). Wszystko, co **wyróżnia** trzy pokazowe osiedla, jest jednak ustawione ręcznie: 1. miejsce, wyniki 94–97%, paski kategorii, korki, czasy dojazdu, „Podsumowanie AI” i zmiany na osi czasu. Kilka faktów w opisach jest nieaktualnych albo błędnych (lista w sekcji 3).

Jak sprawdzaliśmy:
- ponowne uruchomienie `build_mock_scores.py` w kopii, w 4 wariantach,
- Nominatim i Overpass dla 18 miejsc,
- API Commons dla 18 zdjęć,
- odczyt cytowanych stron z cenami i inwestycjami,
- OSRM dla 9 tras dojazdu,
- GTFS z gałęzi `origin/mikolaj`.

Legenda statusów:
- **PRAWDZIWE**: wartość wprost ze źródła, sprawdzona na próbce.
- **POCHODNE**: policzone z prawdziwych danych jawną metodą.
- **SZACOWANE**: wiarygodny rząd wielkości, ale nikt tego nie zmierzył.
- **WYMYŚLONE**: wartość ustawiona ręcznie pod narrację albo niezgodna ze źródłem.

## 1. Tabela zbiorcza

| Element w UI | Status | Źródło | Uwagi |
|---|---|---|---|
| Granice 143 osiedli (`public/data/osiedla.geojson`) | **PRAWDZIWE** | WFS m.st. Warszawy, warstwa `ns92528565:MSI` (aktualność: maj 2026), skrypt `data/scripts/fetch_osiedla_boundaries.py` | Uproszczenie 4 m (`coverage_simplify`), pokrycie 99,99% powierzchni dzielnic. Licencja: ponowne wykorzystanie bezpłatne, trzeba podać „Urząd m.st. Warszawy” (jest na intro). „Miasteczko Wilanów” nie jest obszarem MSI, w UI używamy całego obszaru „Błonia Wilanowskie” (ok. 8 km²) |
| Dane wejściowe heatmapy i wyników (`data/grid/*`, `data/poi/*`) | **PRAWDZIWE** | ETL `data/scripts/siatka`, przebieg 17.10.2026 11:51 UTC: OSM (Overpass), portal dane.um.warszawa.pl (przystanki, toalety, boiska, AED, PM2.5, wydarzenia, utrudnienia, BO), miejski WFS (wejścia metra, biblioteki, UTW) | 20 031 POI, 608 komórek 1 km, 24 wskaźniki, **żaden zbiór nie zgłosił błędu** (`indicators.json`). PM2.5 to pomiar z jednej godziny. „Utrudnienia” to roboty drogowe, a nie natężenie ruchu |
| Paski 10 kategorii dla 140 zwykłych osiedli (`osiedla-scores.json` → `cats`) | **POCHODNE** | `data/scripts/build_mock_scores.py` | Ręcznie dobrane wagi i formuły (np. `cisza` = brak gastronomii i przystanków + zieleń + odległość od centrum, **bez danych o hałasie**). Rozciągnięte między osiedlami do 5–98, więc pokazują pozycję względną, nie bezwzględną. Skrypt jest deterministyczny: ponowne uruchomienie daje pliki identyczne co do bajtu |
| % dopasowania zwykłych osiedli | **POCHODNE + strojone** | j.w. | Średnia ważona kategorii × **ręczny „priorytet dzielnicy”** (`DISTRICT_PRIOR`, mnożniki 0,85–1,26, np. Wilanów ×1,26 dla rodziny, Śródmieście ×0,85), przeskalowane do 35–91. Do tego frontend (`map/data.ts`) przycina każde zwykłe osiedle do wartości o 5 pkt niższej niż wyróżnione |
| % dopasowania 3 wyróżnionych osiedli (96 / 96 / 97) | **WYMYŚLONE** | `OVERRIDES` w skrypcie (96/95/96), a potem `match` w `mock/osiedla.ts` | Bez nadpisań: Powiśle 88% (**4. miejsce** dla studenta), Błonia Wilanowskie 73% (**30.** dla rodziny), Saska Kępa 64% (**62.** dla seniora). Szczegóły w sekcji 2 |
| Paski kategorii 3 wyróżnionych osiedli (`stats`) | **WYMYŚLONE** | Ręcznie wpisane w `mock/osiedla.ts`, nadpisują wynik skryptu | Wyliczone wartości są inne: Wilanów `kultura` 58 w UI vs 24 ze skryptu, `zdrowie` 80 vs 49, `komunikacja` 52 vs 31; Saska Kępa `zieleń` 88 vs 5 bez podbicia (Park Skaryszewski leży w obszarze MSI Kamionek); Powiśle `cisza` 28 vs 10 |
| Heatmapa (`heat.json`) i grafika na intro (`warsawArt.ts`, pochodna heatmapy) | **POCHODNE + strojone** | j.w. | Kontrast (−0,55 × średnia profili), priorytet dzielnicy i **gaussowskie podbicie (σ 700 m, do 2 km)** wokół 3 osiedli. Bez podbić średnia waga w promieniu 600 m spada z 0,98 do 0,36 (Wilanów) i z 0,97 do 0,30 (Saska Kępa) |
| Zdania w dymku zwykłych osiedli (`blurb`) | **POCHODNE (szablon)** | j.w. | 2 najmocniejsze kategorie + 1 słabość wstawione w gotowe szablony. Treść wynika z liczb, ale konkretne sformułowania („studencki klimat”, „ruch uliczny”) to szablon, a nie fakt o miejscu |
| Komunikat „Łączymy 24 wskaźniki…”, „Oceniamy 143 osiedli” | **PRAWDZIWE** (z zastrzeżeniem) | `indicators.json` (24 wskaźniki), MSI (143) | Mock korzysta bezpośrednio z 11 z 24 wskaźników `metrics_norm` oraz z gęstości POI |
| Nazwy i współrzędne „Miejsc” (`highlights`) | **PRAWDZIWE** | OSM, Nominatim | 18/18 obiektów istnieje, każde w promieniu 150 m (15 z 18: 0–50 m). Sekcja 3.3 |
| Opisy miejsc | **PRAWDZIWE z błędami** | Strony obiektów | Elektrownia Powiśle „z XIX wieku” (jest z 1904 r.), „kino”, „SOR” w Medicover, czasy metra. Sekcja 3.3 |
| Odległość i czas pieszo do miejsc (`distanceM`, `walkMin`) | **POCHODNE** | OSRM (routing.openstreetmap.de, profil pieszy) | Zgodne z długością tras w `routes`. Czas pieszo: 70–82 m/min. Park Skaryszewski: odległość do wejścia, a nie do punktu na mapie |
| Trasy „Najkrótsza droga do…” (`routes.geometry`, `distanceM`) | **PRAWDZIWE** | OSRM FOSSGIS (`routed-foot`, `routed-bike`), dane © OpenStreetMap (ODbL) | Geometria i długość z OSRM. Minuty pieszo i rowerem są zaokrąglone (ok. 75 m/min pieszo, ok. 13–14 km/h rowerem) |
| Dojazd w szczycie (`commute`) | **SZACOWANE** | Brak (`zrodla-danych.md` §5: „nasze szacunki”) | Porównanie z GTFS i OSRM w sekcji 3.4. Rząd wielkości się zgadza, ale np. Powiśle → centrum komunikacją 12 min wobec 16–17 min z rozkładu |
| Korki w ciągu doby (`traffic`, 24 wartości) i podpowiedź „Wyjedź o 9:30… ok. 30% luźniej” | **WYMYŚLONE** | Brak | Kształt krzywych jest wymyślony (typowy dwugarbny profil). Podpowiedź jest liczona algorytmem z tej krzywej, więc „30%” też nie ma pokrycia w pomiarze |
| Ceny zakupu (zł/m²) | **PRAWDZIWE (wybór z zakresu)** | Domiporta, Adresowo, SonarHome, Domus Global (X 2026) | Wartości ofertowe, część jest już nieaktualna. Sekcja 3.2 |
| Ceny najmu (zł/m²) i „ok. X zł za 45 m²” | **SZACOWANE** (Wilanów, Warszawa: PRAWDZIWE) | znajdznajem.pl, Domiporta | Dla Powiśla i Saskiej Kępy źródło nie podaje osiedla ani dzielnicy, to nasz szacunek |
| Średnia Warszawy 17 975 zł/m² i 84 zł/m² | **PRAWDZIWE** | Adresowo IX 2026 (średnia ofertowa), znajdznajem.pl (17.10.2026) | 17 975 to cena **ofertowa**. Transakcyjnie NBP II kw. 2026: 16 723 (rynek wtórny) |
| Napis „Szacunek demonstracyjny na podstawie ofert z portali i **RCN** (dzielnica)” | **BŁĘDNE** | – | RCN nie zostało użyte (API portalu zwraca HTTP 500). Do poprawy w copy |
| Oś czasu: inwestycje i lata | **PRAWDZIWE / częściowo** | Artykuły i strony urzędu (sekcja 3.1) | 2 z 12 potwierdzone w całości. 1 wydarzenie **nieaktualne** (konkurs na Park Kazimierzowski unieważniony). Kilka lat to nasze założenia |
| Oś czasu: zmiany kategorii (`statDeltas`) i dopasowania (`matchDelta`) | **WYMYŚLONE** | Brak | Żadne źródło nie kwantyfikuje wpływu inwestycji. Liczby +2…+8 to nasza ocena |
| „Podsumowanie AI” (`aiSummary`) | **WYMYŚLONE (tekst redakcyjny)** | Napisany ręcznie, **nie wygenerowany przez model** | Fakty w środku w większości prawdziwe, kilka błędów (sekcja 3.3). Etykieta „AI” jest myląca, dopóki tekst nie jest generowany |
| Hasła (`tagline`) | **Copy redakcyjne** | – | Ogólnie zgodne z faktami |
| Linki do portali (Otodom, Morizon) | **PRAWDZIWE** | Ścieżki sprawdzone ręcznie (`zrodla-danych.md` §5) | – |
| Zdjęcia (18) | **PRAWDZIWE** | Wikimedia Commons, `public/osiedla/credits.json` | Autor i licencja zgodne z Commons 18/18. Brakuje informacji o modyfikacji (sekcja 3.5) |
| Filmy przelotu (`flyover.mp4/webm`, `poster.jpg`) | **POCHODNE** | Nagrane z naszej mapy (`cinematic/__record`, `scripts/record-flyovers.mjs`, styl OpenFreeMap Positron) | W `Hero.tsx` tylko „© OpenStreetMap”. W `Interlude.tsx` **brak atrybucji OSM** (wymóg ODbL) |

## 2. Ręczne strojenie wyników: ile zmienia

Ponownie uruchomiliśmy `build_mock_scores.py` na kopii w katalogu tymczasowym, na tych samych lokalnych danych. Wariant „obecny” odtwarza commitowane pliki co do bajtu. W pozostałych wariantach wyłączyliśmy kolejno:
- `OVERRIDES`, czyli nadpisanie wyniku, podbicie kluczowych kategorii o 55% luki do 100, progi minimalne `SHOWCASE_FLOORS` i gaussowskie podbicie na heatmapie,
- `DISTRICT_PRIOR`.

**Dopasowanie (%) i miejsce w rankingu 143 osiedli dla profilu „właściciela”:**

| Osiedle (profil) | Obecnie | Bez nadpisań | Bez priorytetu dzielnicy | Bez obu (czyste dane) |
|---|---|---|---|---|
| Powiśle (student) | 96, #1 | 88, **#4** | 96, #1 | 88, **#7** |
| Błonia Wilanowskie / Miasteczko Wilanów (rodzina) | 95, #1 | 73, **#30** | 95, #1 | 62, **#80** |
| Saska Kępa (senior) | 96, #1 | 64, **#62** | 96, #1 | 59, **#72** |

**Kto byłby na 1. miejscu bez strojenia:**
- bez nadpisań: student → Muranów (91), rodzina → Ursynów Północny (91), senior → Sady Żoliborskie (91),
- bez nadpisań i bez priorytetów dzielnic: student → Muranów, rodzina → Słodowiec, senior → Słodowiec.

**Kategorie, które zmienia nadpisanie** (wynik skryptu → bez nadpisań):
- Błonia Wilanowskie: zieleń 92 → 46, edukacja 93 → 58, sport 85 → 36, cisza 88 → 71,
- Saska Kępa: zieleń 90 → **5**, cisza 80 → 20, zdrowie 92 → 67, komunikacja 73 → 39, kultura 86 → 65, zakupy 84 → 64,
- Powiśle: komunikacja 91 → 80 (reszta prawie bez zmian, bo Powiśle i tak wypada wysoko).

**Efekty uboczne:**
- Podbicie kategorii „seniorskich” Saskiej Kępy podnosi też jej wynik dla rodziny z 56% (#108) do 90% (#3).
- Priorytet dzielnicy przesuwa całe dzielnice. Bez niego średnia waga heatmapy „rodzina” w Białołęce spada z 0,30 do 0,20. Ponad 4 700 z 5 819 punktów heatmapy „rodzina” zmienia wagę o więcej niż 0,05.
- Komentarz w skrypcie uzasadnia progi „wiedzą lokalną, której dane POI nie oddają” (bulwary, parki Wilanowa, Park Skaryszewski). Częściowo to prawda: Park Skaryszewski leży w obszarze MSI Kamionek, a nie Saska Kępa. Liczby w UI nie pochodzą jednak z żadnego pomiaru.

**Co mówią surowe dane o 3 osiedlach** (liczby POI w promieniu 1 km od `center`, z `data/poi`):

| | Przedszkola | Szkoły podst. | Licea | Place zabaw | Przychodnie | Apteki | Gastronomia | Przystanki tram. |
|---|---|---|---|---|---|---|---|---|
| Powiśle | 10 | 2 | 5 | 14 | 15 | 9 | 252 | 3 |
| Miasteczko Wilanów | 19 | 7 | 2 | 61 | 14 | 11 | 70 | 12 |
| Saska Kępa | 13 | 9 | 8 | 31 | 5 | 8 | 91 | 9 |

Wniosek: Wilanów naprawdę wyróżnia się przedszkolami i placami zabaw (19 przedszkoli w 1 km, więc pomysł „12 przedszkoli w 1 km” z `mock-iteracja-2.md` trzeba zastąpić liczbą z danych). Powiśle naprawdę wyróżnia się gastronomią. Saska Kępa nie wyróżnia się w danych zdrowiem: ma 5 przychodni w 1 km wobec 14–15 u pozostałych.

## 3. Co jest wymyślone / szacowane

### 3.1 Oś czasu (12 inwestycji)

| Wydarzenie | Werdykt | Problem |
|---|---|---|
| Powiśle 2026: plan miejscowy Powiśla Północnego | częściowo | Ponowne wyłożenie (26.05–01.07.2026) potwierdzone. **Źródło nie mówi o ograniczeniu wysokości zabudowy** |
| Powiśle 2027: Park Kazimierzowski i skwer „Agatona” | **BŁĘDNE** | 4,3 ha i 2,2 ha się zgadzają, ale **konkurs unieważniono 16.01.2026** po wyroku KIO ([archikonkurs](https://archikonkurs.pl/konkurs/352/)). „ZZW rozstrzygnął konkurs” jest nieprawdą, a rok 2027 jest nierealny |
| Powiśle 2029: arkady pod mostem średnicowym | częściowo | Koncepcja istnieje, nie ma finansowania. Źródło podaje prace na średnicy od 2031 i ten odcinek ok. 2035, więc rok 2029 jest sprzeczny ze źródłem |
| Powiśle 2030: przebudowa linii średnicowej | potwierdzone, rok umowny | Prace główne „po 2030 r.” |
| Wilanów 2026: SP nr 300 | **status błędny** | Przetarg 28/WIR/2026 dotyczy **dostosowania do potrzeb osób ze szczególnymi potrzebami**, a nie „rozładowania tłoku”. To etap przetargu, nie „w budowie” |
| Wilanów 2028: Wilanów Park | potwierdzone | – |
| Wilanów 2029: przedłużenie tramwaju o ok. 500 m | częściowo | Projekt dewelopera (Morelia) do IV kw. 2028. Słów „przekaże Tramwajom Warszawskim” nie ma w źródle. 2029 to nasze założenie |
| Wilanów 2030: M4 w projektowaniu | częściowo, **1 błąd** | „Pociągi najwcześniej po 2035 r.” nie pochodzi ze źródła. Źródło mówi o 2044 r. („najwcześniej za ok. 20 lat”) |
| Saska Kępa 2026: koniec przebudowy Trasy Łazienkowskiej | **nieaktualne** | Drugi wiadukt otwarto 29.05.2026, zostały prace wykończeniowe. Status „w budowie” z dopiskiem „możliwe opóźnienie” jest w X 2026 przestarzały |
| Saska Kępa 2027: start budowy tramwaju na Gocław | potwierdzone | – |
| Saska Kępa 2028: M3 | częściowo | 8,1 km, 6 nowych stacji, start w 2028 r. i brak finansowania się zgadzają. **„Otwarcie ok. 2032” nie ma w żadnym źródle** |
| Saska Kępa 2030: tramwaj na Gocław | częściowo | III kw. 2030 i „ok. 20 min do Metra Centrum” potwierdzone. Trasa biegnie al. Waszyngtona, wzdłuż Kanału Wystawowego i **wiaduktem** nad al. Stanów Zjednoczonych. Żadne źródło nie mówi „przez Saską Kępę” ani o „węźle” |

Wszystkie `statDeltas` i `matchDelta` są **wymyślone**: żadne źródło nie podaje liczbowego wpływu inwestycji.

### 3.2 Ceny

| Pole | Mock | Co dziś pokazuje źródło | Werdykt |
|---|---|---|---|
| Powiśle, zakup | 23 800 | Domiporta X 2026: 23 809 (zakres 21 878–27 258, **2 050** ofert, a nie 1 709) | prawdziwe, zaktualizować liczbę ofert |
| Powiśle, „transakcyjnie 21 650 (SonarHome)” | 21 650 | SonarHome IX 2026: 21 610. Strona nie mówi, że to ceny transakcyjne | częściowo |
| Powiśle, link Adresowo (`zrodla-danych.md`) | – | Link `powisle-u` pokazuje dane **całej Warszawy** | błędny link |
| Powiśle, najem 105 zł/m², 2 pok. 4 900 zł | – | Żadne źródło nie podaje Śródmieścia | **szacunek**. Do tego niespójny: 105 × 45 m² = 4 725 zł |
| Wilanów, zakup | 19 900 | Domus Global: Miasteczko „od 20 000 zł/m²”; SonarHome Wilanów IX 2026: 17 998 | wybór redakcyjny. **Liczby 20 130 / 20 128 z notki nie występują w żadnym źródle** |
| Wilanów, najem | 84 | Domiporta X 2026: 82 zł/m² | prawdziwe, lekko nieaktualne |
| Saska Kępa, zakup | 19 500 | Adresowo IX 2026: 19 706 (mediana 19 402, **29 ofert**) | prawdziwe (mała próba, starszy odczyt) |
| Saska Kępa, „transakcyjnie 16 500” | 16 500 | SonarHome IX 2026: 16 980, bez etykiety „transakcyjne” | częściowo |
| Saska Kępa, najem 88 zł/m², 2 pok. 4 100 zł | – | znajdznajem.pl: Praga-Południe **średnia** 3 383 zł (w notce: „mediana 3 388”) | **szacunek**, błędna etykieta |
| `rent2PokAvg` (wszystkie) | – | – | szacunek (UI tego pola nie pokazuje, liczy „za 45 m²” z zł/m²) |

### 3.3 Miejsca, opisy i „Podsumowanie AI”

**Współrzędne:** wszystkie 18 miejsc sprawdzone w OSM (Nominatim, Overpass). **Żadne nie jest dalej niż 150 m od obiektu w OSM.** 15 z 18 leży 0–50 m od obiektu:
- Kampus UW: 122 m od Bramy Głównej,
- metro CNK: 27–34 m od wejścia,
- Francuska: 50 m od osi ulicy.

**Trasy OSRM:**
- Zaczynają się 1–2 m od `center` (Saska Kępa: 23 m) i kończą 0–35 m od miejsca.
- `distanceM` zgadza się z długością linii z dokładnością do 3 m.
- Komentarz w typie mówi „≈ 1,3 × linia prosta”, ale wartości pochodzą z OSRM (to lepiej, tylko komentarz jest nieaktualny).

| Twierdzenie | Werdykt | Uwagi |
|---|---|---|
| Elektrownia Powiśle „z XIX wieku” | **BŁĄD** | Zbudowana w 1904 r., czyli w XX wieku |
| Elektrownia Powiśle: „kino” | drobny błąd | Jest tylko sezonowe kino letnie |
| Miasteczko Wilanów „najmłodsza dzielnica Warszawy” (`aiSummary`) | **BŁĄD** | To osiedle w dzielnicy Wilanów (obszar MSI Błonia Wilanowskie), a nie dzielnica |
| „kilkunastoma przedszkolami i szkołami w promieniu kilometra” | zaniżone | OSM: 26–28 obiektów (18–19 przedszkoli i 7–10 szkół). Lepiej „ponad 20” |
| Metro CNK: „Świętokrzyska 2 min, Rondo Daszyńskiego 6 min” | drobny błąd | Świętokrzyska jest 2 stacje dalej (ok. 3–4 min), do Ronda Daszyńskiego 7 min z rozkładu |
| Szpital Medicover „z SOR-em” | drobny błąd | Pediatria 24/7 jest prawdziwa. Jest prywatna izba przyjęć 24 h, ale to nie SOR w systemie PRM |
| Park Skaryszewski: 820 m / 11 min | drobny błąd | 820 m to trasa do wejścia przy rondzie Waszyngtona. Punkt na mapie (środek parku) jest ok. 1 km w linii prostej |
| Trasa „Bulwary”: cel „Bulwar Grzymały-Siedleckiego” | drobny błąd | Barka Wynurzenie stoi według OSM przy Bulwarze Pattona |
| Podpis zdjęcia Wilanów 06: pałac „kilkanaście minut spacerem” | niespójne | W „Miejscach” podano 26 min / 2,1 km |
| BUW (ogród dachowy), CNK, SP 400, Przedszkole nr 424 (oddział przy Sarmackiej 4), Świątynia Opatrzności, tramwaj do Wilanowa od 29.10.2024 (6,5 km), Park Skaryszewski 58 ha, Wypożyczalnia nr 94 przy Meksykańskiej 3, przychodnia przy Saskiej 61, CM „Saska Kępa” przy Międzynarodowej 56, Plaża Saska, wille z lat 30. | **OK** | Szczegóły (leżaki, klub książki, rehabilitacja, „obok apteka”) są niezweryfikowane |
| Saska Kępa: „przychodnia, apteka… wszystko załatwisz pieszo” | do przemyślenia | W danych OSM Saska Kępa ma 5 przychodni w 1 km wobec 14–15 na pozostałych osiedlach. Teza „zdrowie 90” nie wynika z danych |

### 3.5 Zdjęcia, filmy i licencje

- **Wszystkie 18 plików z Commons się zgadzają:** autor, licencja i jej URL w `credits.json` są takie same jak w metadanych Commons. Licencje:
  - CC BY-SA 4.0 ×9,
  - CC BY-SA 3.0 pl ×5,
  - CC BY-SA 3.0 ×1,
  - CC BY 3.0 pl ×2,
  - CC BY 3.0 ×1.
- **Braki względem licencji CC:**
  - `Credits.tsx` nie podaje tytułu ani informacji, że zdjęcia zmieniono (kadrowanie, skalowanie, rekompresja).
  - `thumb.jpg` na kartach mapy nie ma podpisu w pobliżu.
  - Kadry w `public/survey/*.jpg` mają autora i licencję, ale bez linku do źródła i licencji.
  - Wystarczy dopisać „zdjęcie przycięte i zmniejszone” i linki.
- **Filmy przelotu i `poster.jpg`:**
  - To nasze nagrania mapy (styl OpenFreeMap Positron, dane OSM), z wyłączoną atrybucją na kadrze.
  - `poster.jpg` to pierwsza klatka filmu, a nie kadr z 01.jpg.
  - Podpis w `Hero.tsx`: tylko „© OpenStreetMap”.
  - Podpis w `cinematic/Interlude.tsx`: „Siatka · ujęcie 3D z otwartych danych” **bez żadnej atrybucji OSM, a ODbL jej wymaga**.
  - Do dopisania w obu miejscach: „© OpenStreetMap, OpenFreeMap, © OpenMapTiles”.

### 3.4 Dojazd w szczycie (porównanie z prawdziwymi danymi)

**GTFS:** średni czas komunikacją miejską z gałęzi `origin/mikolaj`, plik `data/grid/czasy_przejazdu.geojson`. Liczony z rozkładu ZTM (GTFS mkuran.pl), dzień 19.10.2026, przyjazd 7:30–9:00, wartość dla komórki 200 m z `center`. Nie uwzględnia czekania na pierwszy pojazd.

**OSRM:** czas bez korków z routing.openstreetmap.de.

| Trasa | Mock: komunikacja / rower / auto | GTFS (komunikacja) | OSRM: rower / auto bez korków |
|---|---|---|---|
| Powiśle → Centrum (Rondo ONZ) | 12 / 10 / 15 | 16,6 (Rondo Dmowskiego), 15,8 (Rondo Daszyńskiego) | 11 / 5 |
| Powiśle → Politechnika | 18 / 12 / 16 | – | 16 / 7 |
| Powiśle → Banacha | 28 / 22 / 24 | – | 24 / 10 |
| Wilanów → Centrum (Rondo ONZ) | 45 / 40 / 42 | 35,3 (Dmowskiego), 42,3 (Daszyńskiego) | 40 / 17 |
| Wilanów → Domaniewska | 32 / 24 / 25 | 37,8 (Służewiec) | 23 / 11 |
| Wilanów → Lotnisko | 50 / 40 / 25 | – | 34 / 16 |
| Saska Kępa → Centrum (Rondo ONZ) | 25 / 18 / 24 | 17,2 (Dmowskiego), 26,5 (Daszyńskiego) | 21 / 8 |
| Saska Kępa → Łazienki | 25 / 14 / 15 | – | 15 / 6 |
| Saska Kępa → Szpital Grochowski | 20 / 12 / 12 | – | 12 / 5 |

Wnioski:
- Czasy rowerem są realistyczne.
- Czasy autem w szczycie to 2–3 × czas OSRM bez korków, co jest wiarygodne, ale niezmierzone.
- Komunikacja miejska jest w rzędzie wielkości GTFS, ale **Powiśle → centrum (12 min) jest zaniżone** w porównaniu z GTFS (16–17 min).

## 4. Jak to naprawić prawdziwymi danymi

| Co | Czym zastąpić | Gdzie / jak |
|---|---|---|
| Dojazd komunikacją | **GTFS ZTM, już policzony** | `origin/mikolaj`: `data/scripts/etl_czasy_przejazdu.py`, `transit_router.py`, wynik `data/grid/czasy_przejazdu.geojson`. Cele: Rondo Dmowskiego, Rondo Daszyńskiego, Służewiec. Dla `commute.komunikacja` wystarczy odczytać komórkę z `center` (wartości z sekcji 3.4) albo dodać cele (Politechnika, Banacha, Lotnisko, Łazienki) opcją `--cel` |
| Dojazd rowerem / pieszo | OSRM FOSSGIS (`routed-bike`, `routed-foot`) | Ten sam serwer co dla `routes`. Liczby z sekcji 3.4 można wpisać od razu |
| Dojazd autem w szczycie i krzywa korków | (a) **pozycje GPS pojazdów ZTM** z portalu miasta (zbiór „pojazdy GPS”, w raporcie Mikołaja `docs/warsaw-data/raport.md`): prędkość autobusów na Sobieskiego, Wisłostradzie i Trasie Łazienkowskiej w podziale na godziny to otwarty wskaźnik zatłoczenia; (b) API z ruchem: Google Routes API (`departureTime`, `TRAFFIC_AWARE`), TomTom Routing / Traffic Stats, HERE Routing (płatne, z darmowym limitem) | Żeby wykres korków był uczciwy, dane GPS trzeba zbierać co najmniej 1 dzień roboczy co 1–5 min. Do tego czasu opisać wykres w UI jako „szacunek” |
| Cisza | Kontury hałasu z **API GIOŚ HAŁAS** `/v1/zasiegi-halasu` (Lden i Lnight 2021, 4. runda, EPSG:2180, CC BY 4.0) | `origin/feat/noise-dataset`: pakiet `noise/` (siatka, kontury, wyszukiwanie po adresie) i `noise/sources.md`. Danych jeszcze nie commitowano, trzeba uruchomić. Zastąpi zastępczą formułę `cisza` (gastronomia, przystanki) |
| Ceny transakcyjne | **Rejestr Cen Nieruchomości z GUGiK**, bezpłatny od 13.02.2026 (Dz.U. 2025 poz. 1542, [opis](https://blog.ongeo.pl/rejestr-cen-nieruchomosci-geoportal-na-mapie), [extradom](https://www.extradom.pl/porady/artykul-rejestr-cen-nieruchomosci-ceny-transakcyjne-dostepne-za-darmo-co-to-oznacza-dla-kupujacych-i-sprzedajacych)) | Geoportal → „Dane do pobrania” → „Dane powiatowe” → „Transakcje” (WFS, GeoPackage, GeoParquet), powiat 1465. **Trzeba sprawdzić, czy Warszawa jest już w zasięgu** (na starcie ok. 320 powiatów). To omija błąd 500 w `bgk_rcn` na portalu miasta i pozwala liczyć medianę zł/m² w poligonie MSI |
| Ceny najmu | Brak otwartego zbioru | Pozostaje szacunek ofertowy (znajdznajem.pl, Domiporta), w UI z etykietą „szacunek ofertowy, X 2026”. Poprawić copy z „RCN” |
| Paski kategorii 3 osiedli | Usunąć `stats` z `mock/osiedla.ts` i pokazać `cats` ze skryptu albo `metrics_norm` z `siatka` | Jeśli Saska Kępa ma mieć „zieleń”, trzeba liczyć parki w buforze 1 km (`park_dist_m` z `siatka` liczy odległość do krawędzi), a nie tylko wewnątrz poligonu MSI |
| % dopasowania | Usunąć `OVERRIDES`, `SHOWCASE_FLOORS`, `DISTRICT_PRIOR`, gaussowskie podbicie i limit „−5” w `map/data.ts`. Pokazywać `scores` person z `cell_metrics.json` (kontrakt `grid-schema.md`) | Wtedy wyróżnione osiedla to po prostu 1. miejsca z danych (Muranów, Słodowiec, …) albo trzeba uczciwie powiedzieć „przykładowe osiedla”, a nie „najlepsze dla Ciebie” |
| Zieleń, edukacja, zdrowie: liczby do copy („19 przedszkoli w 1 km”) | `data/poi/*.geojson` (OSM) | Policzyć w skrypcie i wstawiać do `tagline` / `aiSummary` z datą danych |
| „Podsumowanie AI” | Wygenerować z liczb (`cats`, liczby POI, ceny) przez LLM z promptem „tylko podane fakty” albo zmienić etykietę na „W skrócie” | Teraz tekst jest ręczny |
| PM2.5 | Średnie 24 h / 7 dni | `origin/mikolaj`: `etl_powietrze.py` zbiera historię co godzinę |
| Szkoły i przedszkola (dokładniejsze niż OSM) | RSPO (eksport CSV z wyszukiwarki), miejski WMS `EDUKACJA_*`, WFS `OBWODY_SZKOL_PODSTAWOWYCH` | `zrodla-danych.md` §2–3 |
| Przychodnie POZ | NFZ API umów (`app-umw-api`), 166 POZ w Warszawie + geokoder adresów z `siatka` | `zrodla-danych.md` §3 |
| Oś czasu | Poprawić 6 opisów z sekcji 3.1. Dla `statDeltas` przyjąć jawną regułę (np. nowa stacja w 800 m → przelicz `metro_dist_m` w `siatka` z punktem planowanej stacji) | Planowane linie są już w `data/poi/future.geojson` (`planned_metro`, `planned_tram`, OSM) |

`origin/feat/grid-tile-lab` zawiera tylko próbki OSM (budynki, zieleń, drogi, woda) do wizualizacji. Nie ma tam danych, które zastąpiłyby szacunki.

## 5. Lista poprawek przed pitchem (najmniejszy koszt)

1. Park Kazimierzowski: zmienić na „konkurs unieważniony w I 2026, przyszłość niepewna” albo usunąć z osi czasu.
2. SP 300: zmienić status na „planowana” i opis na „dostosowanie szkoły do potrzeb osób ze szczególnymi potrzebami”.
3. M4: „najwcześniej po 2035” zamienić na „miasto mówi o ok. 2044 r.”. M3: usunąć „otwarcie ok. 2032”.
4. Trasa Łazienkowska: zaktualizować status (wiadukty otwarte w V 2026, prace wykończeniowe).
5. Ceny: poprawić notkę (RCN nie jest użyte, „mediana” zamienić na „średnią”, usunąć „20 130”, zaktualizować liczbę ofert). Powiśle: 4 900 zł nie zgadza się z 105 × 45 m².
6. Opisy: Elektrownia „z XX wieku (1904)”, „kino letnie”. Miasteczko Wilanów to osiedle, nie „najmłodsza dzielnica”. „Ponad 20 przedszkoli i szkół w promieniu 1 km”. Medicover: „izba przyjęć 24 h” zamiast SOR. Metro: „Świętokrzyska ok. 3 min, Rondo Daszyńskiego ok. 7 min”.
7. Atrybucja: dopisać „© OpenStreetMap, OpenFreeMap, © OpenMapTiles” pod filmem w `Interlude.tsx` i `Hero.tsx`, a w `Credits.tsx` dodać „zdjęcia przycięte i zmniejszone”.
8. Dojazd: wpisać czasy z GTFS (gałąź `mikolaj`) i OSRM, a przy aucie i korkach dodać w UI „szacunek”.
9. Na pitchu mówić wprost: „trzy osiedla to przykłady pokazowe, ich wyniki są ustawione ręcznie”. Albo usunąć nadpisania i pokazać prawdziwe 1. miejsca.

## Iteracja 2 — 3 osiedla

Stan z **17.10.2026**. Nowe wyróżnione osiedla to 1. miejsca uczciwego rankingu (`docs/core/mock-iteracja-2.md`): **Muranów** (student, #1, 92%), **Natolin** (rodzina, #3, 78%) i **Stare Bielany** (senior, #1, 79%). Powiśle, Miasteczko Wilanów i Saska Kępa zostały usunięte razem z ich treścią i zdjęciami.

`application/src/mock/osiedla.ts` jest teraz **generowany** przez `data/scripts/build_featured_content.py`. Skrypt łączy:
- liczby z `osiedla-metrics.json` i `osiedla-scores.json`,
- trasy OSRM,
- GTFS,
- ręcznie zebrane i opisane źródłami pliki `data/featured/<slug>.json` (miejsca, cele tras, oś czasu, ceny, linki, zdjęcia).

Nic nie jest strojone ręcznie. Ponowne uruchomienie (`--offline` korzysta z cache OSRM i Nominatim w `data/raw/featured_*`) daje ten sam plik.

| Pole | Status | Źródło / metoda | Uwagi |
|---|---|---|---|
| `stats` (10 kategorii), `match`, `rank` | **POCHODNE** | Kopia `osiedla-scores.json` / `osiedla-metrics.json` (`build_osiedle_metrics.py`), bez nadpisań | Muranów #1 / #4 / #5 (student / rodzina / senior), Natolin #32 / #3 / #4, Stare Bielany #7 / #1 / #1 |
| `metrics` (20 liczb, np. przedszkola w 1 km, odjazdy, metro, hałas ≥ 60 dB) | **PRAWDZIWE / POCHODNE** | `osiedla-metrics.json`: wartość, jednostka, nazwa źródła | Liczone od punktu odniesienia osiedla (punkt adresowy w środku zabudowy), który jest też `center` |
| `highlights` (9 na osiedle, kolejność: edukacja, zieleń, kultura, zdrowie, komunikacja, zakupy) | **PRAWDZIWE** | Obiekty OSM (id w polu `source`), metro z GTFS ZTM; nazwy i adresy z OSM / Nominatim | Opisy zawierają tylko typ, adres i powierzchnię. Część miejsc leży tuż za granicą MSI (Las Bielański, AWF, Las Kabacki). Znacznik parku lub lasu stoi w najbliższym punkcie krawędzi i opisy nie twierdzą, że są w osiedlu |
| `highlights.distanceM`, `walkMin` | **POCHODNE** | OSRM FOSSGIS, profil `foot`, od punktu odniesienia | Dla parków i lasów liczone do najbliższego punktu krawędzi wieloboku OSM (`distanceTo: 'skraj'`). Powierzchnia „ok. X ha” policzona z wieloboku OSM |
| `routes` (13–14 / 9 tras, w grupach `group`: uczelnia, szkoła, przedszkole, przychodnia, kultura, park) | **PRAWDZIWE** | OSRM FOSSGIS (`routed-foot`, `routed-bike`), geometria trasy pieszej uproszczona o 2 m | Po 2–4 cele w grupie, nie tylko najbliższy. Minuty pieszo i rowerem to czas OSRM, zaokrąglony |
| `commute.komunikacja` | **POCHODNE** | `data/grid/czasy_przejazdu.geojson` (GTFS ZTM, dzień 19.10.2026, przyjazd 7:30–9:00): mediana średnich czasów z 43–83 komórek 200 m w poligonie MSI | Cele: Rondo Dmowskiego, Rondo Daszyńskiego, Służewiec. Bez czekania na pierwszy pojazd. Muranów → centrum 16 min (zgodne z `travel_centrum_wszystkie_min`, co skrypt sprawdza) |
| `commute.rower`, `commute.pieszo` | **POCHODNE** | OSRM `bike` / `foot` z punktu odniesienia do celu | Pieszo tylko do 60 min. **Auta brak**, bo nie ma prawdziwego źródła czasów w korkach |
| `traffic` (24 wartości), `trafficSource` | **POCHODNE** | Mediana obszaru z `public/data/3d/<slug>/traffic.json` (`build_traffic.py`) × 100 = o ile % autobusy i tramwaje jadą wolniej niż w najszybszej godzinie, według rozkładu ZTM | To nie są korki samochodowe. Szczyt: Muranów 12%, Natolin 17%, Stare Bielany 12%. Stare krzywe (WYMYŚLONE) usunięte |
| `prices.buyPerM2`, `rentPerM2` | **PRAWDZIWE** (średnia ofertowa) | Otodom, wszystkie strony wyników dla lokalizacji osiedla, odczyt 17.10.2026, bez duplikatów. Próba: Muranów 140 sprzedaż / 152 najem, Natolin 91 / 67, Stare Bielany 50 / 32 | Muranów 21 200 zł/m² i 85 zł/m², Natolin 17 382 i 66, Stare Bielany 17 134 i 74. Granice lokalizacji Otodom nie są publikowane i mogą odbiegać od MSI. Stare Bielany ma małą próbę |
| `prices.rent2PokAvg` | **PRAWDZIWE** (mediana) | Ta sama próba, ogłoszenia 2-pokojowe | 3 700 / 3 000 / 3 000 zł miesięcznie (bez czynszu administracyjnego) |
| `prices.rcnNote` | **PRAWDZIWE** (transakcje) | RCN GUGiK WFS `ms:lokale`, lokale mieszkalne w poligonie MSI, od I 2025 | Mediany: Muranów 18 844 zł/m² (n=273), Natolin 15 632 (n=171), Stare Bielany 16 978 (n=127). Rejestr ma ok. 8 miesięcy opóźnienia |
| `prices.cityBuyPerM2`, `cityRentPerM2` | **PRAWDZIWE** | Adresowo IX 2026 (17 975 zł/m², 1 870 ofert), Znajdź Najem X 2026 (84 zł/m², 46 410 ofert) | `estimate: false` dla wszystkich 3 osiedli |
| `portals` | **PRAWDZIWE** | Otodom `srodmiescie/muranow`, `ursynow/natolin`, `bielany/stare-bielany`; Morizon `/warszawa/<slug>/` | Liczba wyników sprawdzona 17.10.2026 (`rentCount`, `buyCount`), każdy link coś zwraca |
| `timeline` (6 / 5 / 6 wydarzeń) | **PRAWDZIWE** | Każde wydarzenie ma `sourceUrl`, `checkedAt` i status sprawdzony w X 2026 | `year` tylko z oficjalnej zapowiedzi. Bez niej: `yearUncertain: true` + `yearPlacement`, czyli BO z roku edycji, M4 „do 2044”, a w pozostałych przypadkach koszyk 2040 „bez terminu”. Odrzucone jako nieaktualne: pętla tramwajowa Muranowska (ostatnie źródło z 2022), przedszkola zakończone w 2019 i 2022 |
| `timeline.statDeltas`, `matchDelta(s)` | **POCHODNE** | Pole `effect` w `data/featured/*.json` zmienia metryki osiedla (odległość do nowej stacji, +1 obiekt w 1 km, udział zieleni dla parku jako koło o podanej powierzchni). Potem kategorie są liczone od nowa dla 143 osiedli tą samą metodą co w `build_osiedle_metrics.py`. Różnice sumują się po kolei | Tylko 2 z 17 wydarzeń zmieniają liczby: stacja M1 Muranów (bez terminu, metro 611 → 329 m, komunikacja +1) i park linearny nad POW w Natolinie (12,5 ha, zieleń +7, dopasowanie rodziny i seniora +1, przybliżenie kołem). Opis wyliczenia jest w polu `derivation` |
| `tagline`, `summary` (`aiSummary` = to samo) | **POCHODNE (szablon)**, `summaryKind: 'z-danych'` | Stały szablon. Mocne strony to 2 kategorie o największym wkładzie (waga profilu × wynik), słabość to najsłabsza kategoria (jeśli < 50 przy wadze ≥ 0,1 albo < 30 ogółem) | Etykieta w UI zmieniona z „Podsumowanie AI” na „W skrócie” |
| `heroImages` (6 na osiedle), `thumb.jpg` | **PRAWDZIWE** | Wikimedia Commons; autor i licencja z metadanych Commons w `public/osiedla/credits.json` (pole `modification`: „kadrowanie/zmiana rozmiaru do 1600 px, rekompresja JPEG”) | Licencje: CC0, CC BY 3.0/4.0, CC BY-SA 2.0/3.0/3.0 pl/4.0. Filmów przelotu (`flyover.*`) dla nowych osiedli jeszcze nie ma, więc Hero pokazuje zdjęcia |
| `cameraBearing`, `cameraZoom` | **Kadrowanie** | Ręcznie, w `data/featured/*.json` | Nie jest daną |

Otwarte sprawy:
- Oś czasu w UI kończy się na 2030 r. Wydarzenia z 2031, 2040 i 2044 są w danych, ale suwak ich jeszcze nie pokazuje (zadanie I2-7). Etykieta „w toku” dla wydarzeń z 2026 r. wynika z logiki osi czasu, a nie ze statusu w danych.
- Wykres „Korki w ciągu doby” ma progi 35 i 65 oraz podpowiedź „Wyjedź o…”, zaprojektowane pod dawny indeks. Na prawdziwym spowolnieniu z rozkładu (maksymalnie 12–17%) wykres zawsze pokazuje „płynnie” i podpowiedź „Tu rzadko stoi się w korkach”. To prawda dla rozkładu autobusów i tramwajów, ale nie dla ruchu aut. Do przeprojektowania razem z warstwą korków (I2-6).

## Kwartały — status danych

Trzeci poziom mapy, czyli kwartał: kilka budynków między ulicami, `application/public/data/fine/<msi_id>.geojson`. Fakty dla każdego kwartału są w `application/public/data/fine-metrics/<msi_id>.json` (`{<id kwartału>: {...}}`). Schemat, źródła i podsumowanie dla każdego obszaru MSI są w `fine-metrics/index.json`. Skrypt: `data/scripts/siatka/.venv/bin/python -I data/scripts/build_kwartal_metrics.py [--only muranow,natolin]` (ok. 20 s dla całego miasta).

Zakres: wszystkie 14 576 kwartałów w 143 obszarach MSI. Pliki mają 1–430 KB, razem 13 MB. Trzy największe (Zacisze, Zerzeń, Radość, po 410–430 KB) to obszary z setkami małych kwartałów domów jednorodzinnych. **Nic nie jest wymyślone ani uzupełniane.** Gdy brakuje danych, pole jest puste albo go nie ma.

| Pole | Status | Źródło | Metoda |
|---|---|---|---|
| `price.med`, `p25`, `p75`, `n` | **PRAWDZIWE** (mediana z rekordów) | RCN, paczki m.st. Warszawy 2023–2026 (`rcn/fetch_rcn.py`, §3a w `zrodla-danych.md`) | Cena brutto lokalu / pow. użytkowa. Tylko całe mieszkania (udział 1/1), sprzedaż wolnorynkowa, ≥ 15 m², 3–60 tys. zł/m². Okres główny: akty od 1.01.2024 do ostatniego (gęsto do IV 2026). Lokal przypisany do kwartału przez środek budynku z rejestru miasta (`idLokalu` → `ID_BUDYNKU`, 67%), w pozostałych przypadkach przez punkt RCN (zawsze leży w obrysie budynku). Kwartyle tylko dla n ≥ 4 |
| `price.scope` | **POCHODNE** | j.w. | `kwartal`, gdy w kwartale jest ≥ 5 transakcji w okresie głównym. W innym razie `radius300`: transakcje w 300 m od punktu kwartału plus te w kwartale. `low_n: true`, gdy próba nadal ma < 5 transakcji. `n_kw` to zawsze liczba transakcji w samym kwartale |
| `price.years` | **PRAWDZIWE** | j.w. | `{rok: [n, mediana]}` dla 2023–2026, tylko w kwartale. Mediana dopiero od n ≥ 3, poniżej samo `[n]` |
| `price.primary` / `secondary` | **PRAWDZIWE** | j.w. (`rodzajRynku` 1/2) | `[n, mediana]` w użytej próbie, mediana od n ≥ 3 |
| `price.area_med`, `rooms_med` | **PRAWDZIWE** | j.w. | Mediana pow. użytkowej i liczby izb (izby > 0) w użytej próbie |
| `bld.res`, `other`, `fl_max`, `fl_med`, `res_share` | **PRAWDZIWE / POCHODNE** | Rejestr budynków m.st. Warszawy (`wfs:budynki`, EGiB) | Budynki, których środek leży w kwartale. Kondygnacje (`KONDYGNACJE_NADZIEMNE`) tylko mieszkalnych. `res_share` = powierzchnia zabudowy mieszkalnej / całej zabudowy. **Roku budowy nie ma w rejestrze**, więc go nie podajemy |
| `near.<typ>` | **PRAWDZIWE** (obiekt) + **POCHODNE** (odległość) | OSM (`data/poi/*`: przedszkole, szkoła podstawowa, średnia, uczelnia, przychodnia, apteka, supermarket; parki i lasy ≥ 1 ha), ZTM (`data/poi_mikolaj/transit.geojson`: słupek, słupek z tramwajem, metro, SKM) | Najbliższy obiekt od punktu kwartału, czyli środka ciężkości (albo punktu na powierzchni, gdy środek wypada poza kwartał). Odległość w linii prostej w EPSG:2180, zaokrąglona do 10 m. Dla parku i lasu liczymy do krawędzi poligonu (0 w środku). Powyżej 3 km zapisujemy samą odległość bez nazwy. **Czasu pieszo nie liczymy.** Reguła dla UI: odległość × 1,3 / 78 m/min (jak w `czasy_przejazdu`) |
| `n500.<typ>` | **POCHODNE** | j.w. | Liczba obiektów w promieniu 500 m (brak klucza = 0) |
| `dep400` | **POCHODNE** | ZTM GTFS, rozkład na pon. 19.10.2026 (`odjazdy_dzien`) | Suma odjazdów w ciągu doby ze wszystkich słupków, stacji metra i SKM w promieniu 400 m |
| `noise` | **POCHODNE** | GIOŚ HAŁAS API, SMH 2022 (dane 2021), CC BY 4.0 (`data/scripts/noise/`) | Udział powierzchni kwartału z Lden ≥ 55, ≥ 60, ≥ 65 dB od dróg albo kolei i tramwajów. Mapy strategiczne nie mają konturów poniżej 55 dB |
| `travel.centrum`, `daszynskiego`, `sluzewiec` | **POCHODNE** | `data/grid/czasy_przejazdu.geojson` (GTFS, router z gałęzi `mikolaj`) | Komórka 200 m, w której leży punkt kwartału. `[średnia, min]` minut przy przyjeździe 07:30–09:00 (10 terminów). Trzecia wartość pojawia się, gdy nie wszystkie terminy są osiągalne |

**Pokrycie cenami (cała Warszawa, akty 2024–IV 2026):**
- 2336 z 14 576 kwartałów (16%) ma ≥ 5 własnych transakcji.
- 7688 ma ≥ 5 transakcji w promieniu 300 m.
- 4552 (głównie domy jednorodzinne na obrzeżach) ma `low_n`.

**Trzy wyróżnione obszary:**

| Obszar MSI | Kwartały | ≥ 5 transakcji w kwartale | Mediana MSI (n) | Mediany kwartałów z n ≥ 5 |
|---|---|---|---|---|
| Muranów | 38 | 30 | 18 719 zł/m² (521) | 15 036 – 27 028 |
| Stare Bielany | 99 | 19 | 16 683 zł/m² (281) | 12 678 – 18 228 |
| Natolin | 140 | 26 | 16 088 zł/m² (394) | 12 276 – 19 640 (7 kwartałów z `low_n`) |

Zastrzeżenia:
- Mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję deweloperską. Pola `primary` i `secondary` pokazują ten podział.
- RCN ma ok. 6 miesięcy opóźnienia (ostatnie gęste dane z IV 2026).
- POI z OSM mogą być niekompletne. Szkoły i przedszkola nie są sprawdzone w RSPO.
- Hałas to stan z 2021 r. Nie obejmuje lotniska ani przemysłu.
