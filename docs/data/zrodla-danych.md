# Źródła danych: co działa, jak wywołać, pułapki

Zweryfikowane **2026-10-17** (Mati + agent). Najpierw sprawdź tutaj, zanim zaczniesz szukać danych od zera. Gdy znajdziesz coś nowego albo coś przestanie działać, dopisz wiersz.

Legenda: ✅ działa i jest użyte w `data/scripts/siatka` · ✔️ działa, jeszcze nieużyte · ⚠️ działa z zastrzeżeniami · ❌ nie działa / brak dostępu

## 1. Portal dane.um.warszawa.pl (wymagany przez regulamin)

- **Wywołanie:** `POST https://dane.um.warszawa.pl/api/action/get_<akcja>`, nagłówek `Authorization: <klucz>` (**bez** `Bearer`), body JSON.
- **Klucz:** zmienna `UM_WARSZAWA_API_KEY` w `data/.env` (git ją ignoruje; ta sama nazwa co w skryptach Mikołaja). Klucz zakłada się na portalu w zakładce „Klucz API”.
- **Bez klucza** API zwraca `{"message":"Service unavailable"}`, często z kodem 200. **Nie cache'uj takiej odpowiedzi** (w `siatka` robi to walidator w `sources/um_api.py`).
- **Dokumentacja każdego zbioru:** `https://dane.um.warszawa.pl/files/<prefix>_pa.json` (parametry) i `_pw.json` (przykład wywołania).
- **Lista zbiorów:** `GET https://dane.um.warszawa.pl/api/datasets?page=1..3` (23 zbiory).

| Zbiór (slug) | Akcja `get_…` | Status | Pułapki |
|---|---|---|---|
| lokalizacja-przystankow-komunikacji-miejskiej | `ztm_przystanki_komunikacji_miejskiej` | ✅ | **Nazwa akcji różni się od sluga** (`…_lokalizacja_…` daje 404). Każdy rekord to `{"values":[{"key":…,"value":…}]}`, współrzędne w `szer_geo`/`dlug_geo` jako stringi. 6789 słupków, część poza Warszawą |
| toalety | `m_toalety` | ✅ | Lista GeoJSON Feature. Pola `przewijak`, `dostepnosc` (1 = bez barier), `platnosc` (0 = darmowa), `godziny`. 695 toalet |
| otwarte-boiska | `be_otwarte_boiska` | ✅ | **Brak współrzędnych**, tylko `Adres obiektu`. Geokodujemy miejskimi punktami adresowymi (sekcja 2): 97% trafień dokładnych. Adresy mają dopiski typu `ul. Cieplarniana (Wesoła) 23`. Jeden wiersz na typ obiektu w szkole (1227 wierszy) |
| zajecia-sportowe | `bmm_zajecia_sportowe` | ⚠️ | Tylko dzielnica (`localization`), bez punktu |
| monitoring-jakosci-powietrza | `bopipk_monitoring_jakosci_powietrza` | ✅ | 141 stacji (107 miejskich czujników + GIOŚ + gminy ościenne), `lat`/`lon`. **Kod pyłu: `PM2.5` u czujników, `PM25` u stacji GIOŚ**, obsługuj oba. Stan bieżący (ostatnia godzina), bez historii |
| kalendarz-wydarzen | `bmm_kalendarz_wydarzen` | ✅ | Punkt w `map.features[].geometry`, daty w `occurrence[].from/to` w formacie `2027-01-29T19:00:00+01` (strefa bez minut, trzeba ją dopełnić do `+01:00`) |
| utrudnienia-w-ruchu-drogowym | `bin_utrudnienia_drogowe` | ✅ | `geo` = `[[{"geomType":1,"latlngs":[{lat,lng},…]}]]`, czyli linie. Liczymy unikalne utrudnienia, nie wierzchołki |
| lokalizacja-defibryzatorow-aed (sic, literówka w slugu) | `scb_lokalizacja_defibrylatorow` | ✅ | Współrzędne zagnieżdżone `[[lon, lat]]`. `device_availability`: „Całodobowa” / „Ograniczona” |
| budzet-obywatelski | `cks_budzet_obywatelski` | ⚠️ | **Wymaga `{"rok": RRRR, "status": "w_realizacji"\|"zrealizowane"}`**, bez parametrów zwraca HTTP 500. Tylko projekty zrealizowane i w realizacji (brak odrzuconych i głosowanych). `pins` = `[{lat,lng}]`. **Zawiera imiona i nazwiska autorów, nie publikuj (RODO)** |
| konsultacje-spoleczne | `cks_konsultacje_spoleczne` | ⚠️ | Tylko bieżące (6 sztuk w dniu testu), nie wszystkie mają `latitude`/`longitude` |
| rejestr-cen-nieruchomosci | `bgk_rcn` | ❌ | **HTTP 500 `Service unavailable`** (X 2026, 5 wariantów, klucz działa dla innych akcji). Parametry z `bgk_rcn_pa.json`: `dzielnica` (bez polskich znaków, jednym słowem, np. `pragapolnoc`), `rodzajNieruchomosci` (`nieruchomoscLokalowa`), `rodzajRynku` (`rynekPierwotny`/`rynekWtorny`), `rok`. Nie czekamy: te same dane BGiK są w GUGiK WFS i w paczkach GML miasta (sekcja 3a) |
| pozostałe (parkingi, pogoda ZOM, pojazdy GPS, tabor, odjazdy, segregacja, ekopunkty, trasy) | | ✔️ | Raport Mikołaja: `docs/warsaw-data/raport.md` na gałęzi `mikolaj`. Pogoda ZOM ma **temperaturę nawierzchni**, a tabor ma **rok produkcji i trakcję** |

## 2. Miejskie usługi mapowe (bez klucza, ponowne wykorzystanie bezpłatne, podać źródło „Urząd m.st. Warszawy”)

Warunki: https://architektura.um.warszawa.pl/warunki-ponownego-wykorzystania. Często mają **stare dane**, więc sprawdzaj pole `AKTU_DAN`.

**WFS `https://wfs.um.warszawa.pl/serwis`** (MapGuide, WFS 1.1.0, **tylko GML**, `outputFormat=application/json` daje błąd):

- **Dwa układy współrzędnych w jednej usłudze:**
  - warstwy `ns92528565:*` w **EPSG:2178**, w GML najpierw easting (~7,5 mln), potem northing (~5,8 mln),
  - warstwy `wfs:*` w **EPSG:4326**, w kolejności lon, lat.
- **Używane:**
  - `GRANICE_DZIELNIC` → `data/boundaries/`,
  - `MSI` (obszary MSI, czyli osiedla) → `data/boundaries/warszawa_osiedla.geojson`, opis niżej,
  - `wfs:METRO_WEJSCIA` (233 wejścia, bez nazw stacji),
  - `BIBLIOTEKI` (VI 2026),
  - `UNIWERSYTETY_TRZECIEGO_WIEKU` (2023).
- **Do rozważenia:**
  - `OBWODY_SZKOL_PODSTAWOWYCH` (poligony z nazwą i adresem szkoły),
  - `PLANY_ZAKRESY_OBOWIAZUJACE` / `_SPORZADZANE` (plany miejscowe),
  - `ZIELEN_DRZEWA` (bardzo duża warstwa, pobieraj z BBOX),
  - `KLUBY_SENIORA` (dane z 2015),
  - `DOMY_POMOCY_SPOLECZNEJ`,
  - `PLYWALNIE`, `PILKA_NOZNA`, `AKADEMIKI`.
- **Nieaktualne:** `wfs:APTEKI` (2017), `POLICJA` (2009), `STACJE_ROWEROWE` (2022). W ich miejsce bierzemy OSM.

**WFS „Tarcza 4.0” `https://wms2.um.warszawa.pl/geoserver/wfs/wfs`** (GeoServer, **obsługuje `outputFormat=application/json`**, `srsName=EPSG:4326`):
- `wfs:punkty_adresowe`: ok. 127 tys. adresów (`NAZWA_ULICY` w formie „ulica X”, `NUMER_PORZADKOWY`). ✅ **Geokoder** w `siatka/sources/address.py`. Z `propertyName=` pobranie trwa kilka sekund.
- `wfs:budynki`: 184 tys. budynków z liczbą kondygnacji ✔️. `wfs:dzialki` ✔️ (np. do łączenia z pozwoleniami GUNB).

**WMS `https://wms.um.warszawa.pl/serwis`** (tylko obraz i GetFeatureInfo dla pojedynczych punktów, ok. 200 warstw):
- edukacja: `EDUKACJA_PRZEDSZKOLA`, `EDUKACJA_SZKOLY_PODSTAWOWE`, `EDUKACJA_LICEA`, …,
- hałas: `HALAS_*_{LDWN,LN}_{2017,2022}`. GetFeatureInfo zwraca decybele tylko dla 2017,
- plany: `MPZP_PRZEZNACZENIE_TERENU` (GetFeatureInfo podaje funkcję terenu i maksymalną wysokość),
- `UZBROJENIE_SLUPY_LATARNIE`, `DECYZJE_O_POZWOLENIU_NA_BUDOWE`.

### Granice osiedli: obszary MSI (`ns92528565:MSI`) ✅

- **Co:** 143 obszary Miejskiego Systemu Informacji (np. „Powiśle”, „Saska Kępa”, „Błonia Wilanowskie”), pełne pokrycie miasta bez nakładania się (99,99% powierzchni dzielnic). Pola `NAZWA`, `DZIELNICA`, `AKTUALNOSC` (maj 2026), `PODSTAWA_PRAWNA` (uchwała rady dzielnicy).
- **Wywołanie:** `https://wfs.um.warszawa.pl/serwis?service=WFS&version=1.1.0&request=GetFeature&typeName=ns92528565:MSI` (ok. 1,4 MB GML, kilka sekund).
- **Pułapki:** EPSG:2178, easting pierwszy (jak `GRANICE_DZIELNIC`). Każdy obszar to jeden `gml:Surface/PolygonPatch` bez dziur. Nazwy są unikalne. **Nie ma osobnego „Miasteczka Wilanów”**: leży w obszarze „Błonia Wilanowskie” (Wilanów).
- **Upraszczanie:** `shapely.coverage_simplify` (4 m), żeby wspólne granice sąsiadów nie rozjeżdżały się (zwykłe `simplify` per poligon robi szczeliny).
- **Skrypt:** `uv run data/scripts/fetch_osiedla_boundaries.py` → `data/boundaries/warszawa_osiedla.geojson` i `application/public/data/osiedla.geojson` (326 KB, właściwości `id`, `name`, `district`, `area_km2`).
- OSM (`admin_level=10/11`, `place=neighbourhood`) jako zapas: niepełne pokrycie i nakładające się poligony, więc MSI jest lepsze.

## 3. Inne źródła

| Źródło | Co | Status | Uwagi |
|---|---|---|---|
| OpenStreetMap (Overpass) | przedszkola, szkoły, uczelnie, apteki, przychodnie, supermarkety, place zabaw, parki i lasy, gastronomia, przystanki tramwajowe, planowane linie metra i tramwaju (`railway=construction\|proposed`, w tym M3, M4, tramwaj na Gocław) | ✅ | Licencja ODbL. **Wymaga nagłówka User-Agent** (bez niego błąd 406). Serwery bywają przeciążone (błąd 500), dlatego mamy zapasowy `overpass.kumi.systems` i cache |
| Policja KSP: „Pełny katalog przestępstw (garnizon stołeczny)” | przestępstwa według kategorii, styczeń–wrzesień 2026, XLS | ✔️ | Dokładność tylko do komend rejonowych (KRP I–VII, każda obejmuje kilka dzielnic). **Przypisanie KRP do dzielnic trzeba potwierdzić.** https://ksp.bip.policja.gov.pl/ksp/statystyki/27830,Pelny-katalog-przestepstw-garnizon-stoleczny.html |
| KMZB (mapa zagrożeń) | | ❌ | Brak eksportu i API |
| NFZ: terminy leczenia (`api.nfz.gov.pl/app-itl-api`) | specjaliści, szpitale, ze współrzędnymi | ✔️ | Bez klucza. Nie obejmuje POZ |
| NFZ: umowy (`app-umw-api`) | POZ (166 w Warszawie) | ✔️ | Tylko adres siedziby, trzeba geokodować |
| GUNB RWDZ (dane.gov.pl, zbiór 3467) | wnioski i decyzje o pozwoleniu na budowę, CC0 | ✔️ | Bez współrzędnych. Łączenie przez numer działki z `wfs:dzialki` |
| Obserwatorium BRD | wypadki | ⚠️ | Tylko użycie niekomercyjne, ręczny eksport |
| GUGiK BDOT10k (powiat 1465) | pokrycie terenu | ✔️ | https://opendata.geoportal.gov.pl/bdot10k/schemat2021/GPKG/14/1465_GPKG.zip (ok. 88 MB) |
| GUGiK LoD2 | modele 3D budynków (CityGML) | ✔️ | Do wizualizacji. W aplikacji 3D budynki biorą się z kafelków MapTiler |
| EEA END 2022 | kontury hałasu | 🔄 | Robi Wojtek na `feat/noise-dataset` (siatka 500 m + dzielnice) |
| **GIOŚ HAŁAS API** `https://dane.gios.gov.pl/api/halas/v1/zasiegi-halasu` | kontury Lden SMH 2022 (dane 2021), drogi i kolej (kolej **zawiera tramwaje**) | ✅ | CC BY 4.0, bez klucza. Parametry: `wojewodztwo=MAZOWIECKIE`, `rundaMapowania=4 Runda Mapowania`, `zrodloHalasu=Hałas drogowy wewnątrz aglomeracji` (lub `kolejowy`), `wskaznik=LDWN`, `liczbaElementowNaStronie=50`, `numerStrony` od 0. Zwraca MultiPolygon w **EPSG:2180, bez deklaracji CRS**. Mazowsze: drogi 120 obiektów (~200 MB, **ostatnia strona ma 115 MB**, pobieranie trwa kilka minut), kolej 92 (~28 MB). Brak pola aglomeracji, więc przycinamy do granicy Warszawy. Pasma są rozłączne (`Lden5559` … `LdenGreaterThan80`). Kontrola z `/v1/informacja-o-powierzchni-terenu`: drogi ≥ 60 dB 146,40 km² (GIOŚ 146,59), kolej ≥ 60 dB 20,10 km² (20,13). Skrypty: `data/scripts/noise/` (źródła opisuje `noise/sources.md` na `feat/noise-dataset`) |
| RSPO | rejestr szkół | ⚠️ | API wymaga wniosku (do 14 dni). Eksport CSV z wyszukiwarki działa |

## 3a. Ceny transakcyjne mieszkań (RCN) ✔️

Od 13 II 2026 RCN jest bezpłatny (art. 40a ust. 2 pkt 1 lit. k PGiK). Dla Warszawy oba źródła niżej mają **te same rekordy** z Biura Geodezji i Katastru (przestrzeń nazw `PL.PZGiK.5346.RCN`). Jeden rekord to jeden lokal: cena, powierzchnia użytkowa, izby, kondygnacja, data aktu, rynek pierwotny lub wtórny, ulica i numer budynku oraz punkt budynku. Wystarcza to do agregacji na kwartały (`warszawa_osiedla_fine`). Sprawdzone 2026-10-17, jeszcze nieużyte.

**GUGiK WFS `https://mapy.geoportal.gov.pl/wss/service/rcn`** (MapServer, WFS 2.0.0 i WMS 1.3.0, bez klucza, `Fees: none`):
- Warstwy: `ms:lokale`, `ms:budynki`, `ms:dzialki`. `ms:powiaty` to tylko zasięg, bez atrybutów.
- Przykład: `?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=ms:lokale&COUNT=20000&BBOX=52.235,21.02,52.245,21.04,urn:ogc:def:crs:EPSG::4326`. **BBOX w kolejności lat,lon.** Powiśle: 1981 rekordów w 2 s (5 MB).
- Filtry FES 2.0 w `FILTER=` działają: `TERYT=1465`, `DOK_DATA` (Between), `LOK_FUNKCJA=mieszkalna`. `RESULTTYPE=hits` zwraca liczbę. Stronicowanie przez `STARTINDEX`.
- **Tylko GML**, domyślnie EPSG:2180 (dozwolone 2176–2179). `SRSNAME=EPSG:4326` daje „Invalid SRS”, więc przeliczaj lokalnie. `gml:pos` w kolejności northing easting.
- Pola: `TRAN_RODZAJ_RYNKU` (`rynekPierwotny`/`rynekWtorny`), `TRAN_CENA_BRUTTO`, `DOK_DATA`, `NIER_UDZIAL`, `LOK_FUNKCJA` (`mieszkalna`/`garaz`/`inna`/…), `LOK_LICZBA_IZB`, `LOK_NR_KOND`, `LOK_POW_UZYT`, `LOK_CENA_BRUTTO`, `LOK_ADRES` (`MSC:Warszawa;UL:ulica Dobra;NR_PORZ:13`, bez numeru lokalu), `LOK_ID_LOKALU`.
- Pokrycie Warszawy: ok. 361 tys. lokali od 2006 r., ok. 31–42 tys. rocznie (2016–2025). Gęsto mniej więcej do II 2026, czyli **opóźnienie ok. 8 miesięcy**.
- Pułapki:
  - Licz cenę z `LOK_CENA_BRUTTO` (wypełnione w ok. 99%).
  - Bierz tylko `NIER_UDZIAL` równe `1/1` lub puste. Udziały typu 1/259 psują cenę za m².
  - Odrzuć garaże i bardzo małe lokale.
  - `DOK_TWORCA` to nazwisko notariusza, nie publikuj. Strony transakcji są podane tylko jako typ.
  - Na Powiślu brak rekordów z lat 2017–2019 (lokalna luka), więc sprawdź dane przed liczeniem szeregu czasowego.
  - WMS GetFeatureInfo zwracał pustą odpowiedź, używaj WFS.
- Kontrola: Powiśle, lokale mieszkalne od 2024 r.: n=210, mediana **22 973 zł/m²**.

**Paczki GML miasta: https://architektura.um.warszawa.pl/udostepniane-dane-rcn1** (najświeższe):
- Pliki `zbior_danych_rcn_<lata>.zip`: 2006–2015 (71 MB), 2016–2020 (228 MB), 2021–2025 (43–55 MB rocznie) oraz `zbior_danych_rciwn_2026_20261005.zip` (16 MB, po rozpakowaniu 90 MB, stan na 5 X 2026).
- Schemat GUGiK RCN 1.4, relacyjny przez `xlink:href`: `RCN_Transakcja` → `RCN_Nieruchomosc` → `RCN_Lokal` → `RCN_Adres`, a data jest w `RCN_Dokument`. **Identyfikatory `gml:id` mają prefiks `PL.PZGIK.1465_`, a odnośniki `PL.PZGiK.5346.RCN_`**, więc łącz po końcówce.
- EPSG:2178 w kolejności northing easting. Kody są liczbowe (`rodzajRynku` 1 = pierwotny, 2 = wtórny; `funkcjaLokalu` 1 = mieszkalna). Kody ustaliliśmy z proporcji, potwierdź je w załączniku do rozporządzenia z 27.07.2021.
- 2026: 11 971 lokali, w tym 9450 mieszkalnych z udziałem 1/1, mediana 16 611 zł/m² (NBP II kw. 2026: 16,7 tys.). Dane gęste do IV 2026.
- Licencja: warunki ponownego wykorzystania m.st. Warszawy, podać źródło „Urząd m.st. Warszawy”.

**Bez danych o cenach:** WMS `wms.um.warszawa.pl` (213 warstw), GeoServer `wms2.um.warszawa.pl`, `mapa.um.warszawa.pl/rcn-szukaj/` (tylko interfejs) i dane.gov.pl. NBP podaje tylko średnie dla miasta.

## 4. Decyzje o danych (dlaczego to źródło)

| Metryka | Źródło | Dlaczego |
|---|---|---|
| Szkoły, przedszkola | OSM | Miejski WFS ma tylko obwody szkół podstawowych, a WMS daje obraz bez listy. RSPO wymaga wniosku |
| Apteki, przychodnie | OSM | Warstwa miejska jest z 2017 r. |
| Parki | OSM, odległość do **krawędzi** wielokąta (≥1 ha) | Odległość od środka parku zaniżałaby oceny obok dużych lasów |
| Boiska | portal + geokoder z punktów adresowych | Portal nie podaje współrzędnych |
| Jakość powietrza | portal, PM2.5, interpolacja IDW (do 5 km) | 141 stacji daje ciągłą mapę. To pomiar z jednej godziny, w UI oznaczony jako „pomiar z dziś” |
| Utrudnienia | portal, liczba unikalnych w promieniu 1 km | Linie mają wiele wierzchołków |
| Hałas | GIOŚ HAŁAS API (SMH 2022), udział powierzchni osiedla z Lden ≥ 60 / 65 dB | Rekomendacja Wojtka z `noise/sources.md`: ta sama geometria co EEA, ale licencja CC BY 4.0 i natywny EPSG:2180. Pakiet `warsaw_noise` wymaga geopandas, więc liczymy samym shapely |
| Ceny | RCN: GUGiK WFS `ms:lokale` lub paczki GML miasta (sekcja 3a). Portal zwraca błąd 500 | Kontrakt przewiduje `rcn_m2_median_district` |

## 5. Mock: 3 osiedla

Treści 3 wyróżnionych osiedli w `application/src/mock/osiedla.ts` (Powiśle, Miasteczko Wilanów, Saska Kępa). Stan na październik 2026. To wartości poglądowe, nie dane na żywo.

**Ceny (zł/m², oferty z rynku wtórnego, chyba że zaznaczono inaczej).** Źródła podają bardzo różne liczby: transakcje są o 10–25% niższe niż oferty, a próby bywają małe. Wybraliśmy wartość ze środka zakresu.

| Osiedle | Zakup (wybrane) | Zakres w źródłach | Najem (wybrane) | Źródła |
|---|---|---|---|---|
| Powiśle | 23 800 | 21 650 (SonarHome, transakcje) – 23 813 (Domiporta, X 2026, 1709 ofert). Otodom podaje 29 674, to wygląda na błąd | 105 zł/m², 2 pok. 4 900 zł | [SonarHome](https://sonarhome.pl/ceny-mieszkan/warszawa/srodmiescie/powisle), [Domiporta](https://www.domiporta.pl/mieszkanie/sprzedam/mazowieckie/warszawa/powisle), [Adresowo](https://adresowo.pl/ceny-mieszkan/mazowieckie/warszawa/powisle-u/) |
| Miasteczko Wilanów | 19 900 | Wilanów 17 850–20 128. Samo Miasteczko „od 20 000” (Domus Global, VI 2026) | 84 zł/m², 2 pok. 4 200 zł | [Domus Global](https://www.domusglobal.pl/post/wilanow-dzielnica-warszawy), [Domiporta najem](http://www.domiporta.pl/ceny/mieszkanie/wynajem/wtorny/mazowieckie/warszawa/wilanow) (84 zł/m², IX 2026), [otodom](https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/wilanow) (86 zł/m²) |
| Saska Kępa | 19 500 | 15 354 (Domiporta, 44 oferty) – 16 506 (SonarHome, transakcje) – 19 550 (Adresowo, VIII 2026) – 22 693 (otodom) | 88 zł/m², 2 pok. 4 100 zł | [SonarHome](https://sonarhome.pl/ceny-mieszkan/warszawa/praga-poludnie/saska-kepa), [Adresowo](https://adresowo.pl/ceny-mieszkan/mazowieckie/warszawa/saska-kepa/), [znajdznajem.pl](https://znajdznajem.pl/warszawa/raport) (mediana Pragi-Południe 3 388 zł) |
| Warszawa (porównanie) | 17 975 | NBP II kw. 2026, transakcje: 16 723 (wtórny), 16 783 (pierwotny) | 84 zł/m², mediana 3 200 zł | [Adresowo](https://adresowo.pl/ceny-mieszkan/mazowieckie/warszawa/), [znajdznajem.pl](https://znajdznajem.pl/warszawa/raport) (X 2026) |

**Inwestycje na osi czasu 2026–2030.**

| Osiedle | Rok | Inwestycja | Status i źródło |
|---|---|---|---|
| Powiśle | 2026 | Plan miejscowy Powiśla Północnego | Ponowne wyłożenie. [architektura.um.warszawa.pl](https://architektura.um.warszawa.pl/-/jaki-plan-miejscowy-dla-powisla-polnocnego-wylozenie-ponowne) |
| Powiśle | 2027 | Modernizacja Parku Kazimierzowskiego (4,3 ha) i skweru „Agatona” (2,2 ha) | Konkurs ZZW, protesty mieszkańców. Rok realizacji to nasze założenie. [TVP Warszawa](https://warszawa.tvp.pl/86552696/warszawa-zielone-powisle-konkurs-na-projekt-parku-i-skweru) |
| Powiśle | 2029 | Arkady z zielenią pod mostem średnicowym, ostatni odcinek bulwarów | Koncepcja bez finansowania, rok umowny. [Raport Warszawski](https://www.raportwarszawski.pl/artykul/3025,bulwary-wislane-co-dalej-z-ostatnim-odcinkiem-nie-ma-finansowania-do-tego-zmienil-sie-pomysl) |
| Powiśle | 2030 | Przebudowa linii średnicowej: przystanki Nowy Świat i Solec, likwidacja Powiśla | PKP PLK, prace główne po 2030. [tvn24](https://tvn24.pl/tvnwarszawa/srodmiescie/warszawa-przebudowa-linii-srednicowej-powody-przesuniecia-harmonogramu-prac-co-zostanie-przebudowane-koszty-st8562055), [Super Express](https://www.se.pl/warszawa/pociagiem-na-bulwary-przy-wislostradzie-powstanie-nowa-stacja-pkp-aa-LNTR-oJgj-cYcD.html) |
| Wilanów | 2026 | Adaptacja SP nr 300 | Przetarg dzielnicy, oferty do 31.08.2026. [wilanow.um.warszawa.pl](https://wilanow.um.warszawa.pl/zamowienia-publiczne1) |
| Wilanów | 2028 | Wilanów Park: park ponad 2,2 ha i centrum handlowe | Otwarcie planowane na 2028. [westate.pl](https://westate.pl/blog/wilanow-park-w-warszawie-nowe-centrum-handlowe-i-park-juz-w-2028-roku) |
| Wilanów | 2029 | Przedłużenie tramwaju o ok. 500 m (Uprawna / al. Rzeczypospolitej) | Projekt dewelopera do IV kw. 2028, termin budowy nieznany. [muratorplus](https://muratorplus.pl/inwestycje/inwestycje-publiczne/czy-tramwaj-do-wilanowa-dotrze-az-za-poludniowa-obwodnice-warszawy-sa-plany-przedluzenia-trasy-aa-bxcr-pHKt-VBF3.html) |
| Wilanów | 2030 | Metro M4 Tarchomin–Wilanów w projektowaniu | Studium do XI 2027, projekt od 2028. [Architektura-Murator](https://architektura.muratorplus.pl/projekty/bedzie-metro-do-wilanowa-dowiezie-do-centrum-w-18-minut-kiedy-budowa-aa-S9B9-gqtY-rikr.html) |
| Saska Kępa | 2026 | Koniec przebudowy Trasy Łazienkowskiej (wiadukty nad Paryską) | Aneks z terminem na lipiec 2026, możliwe opóźnienie. [naszemiasto](https://warszawa.naszemiasto.pl/komunikacyjny-spokoj-na-saskiej-kepie-coraz-blizej-koncza-sie-prace-nad-inwestycja-warta-ponad-100-milionow-zlotych/ar/c1p2-28084393), [muratorplus](https://www.muratorplus.pl/inwestycje/inwestycje-publiczne/remont-trasy-lazienkowskiej-w-warszawie-opoznia-sie-kiedy-koniec-utrudnien-na-saskiej-kepie-aa-qU6p-RdAd-YAKt.html) |
| Saska Kępa | 2027 / 2030 | Tramwaj na Gocław (3,6 km) przez Saską Kępę | Budowa najwcześniej od IV kw. 2027, koniec w III kw. 2030. [muratorplus](https://www.muratorplus.pl/inwestycje/inwestycje-publiczne/tramwajem-na-goclaw-juz-w-2030-r-zlikwiduja-pod-niego-ogrodki-dzialkowe-aa-bbaj-XWii-5q8v.html), [um.warszawa.pl](https://um.warszawa.pl/-/tramwaj-coraz-blizej-goclawia) |
| Saska Kępa | 2028 | Metro M3 Stadion Narodowy–Gocław (8,1 km, 6 nowych stacji) | Start budowy planowany na 2028, otwarcie ok. 2032, brak zapewnionego finansowania. [um.warszawa.pl](https://um.warszawa.pl/-/kiedy-pojedziemy-trzecia-linia-metra-), [Architektura-Murator](https://architektura.muratorplus.pl/krytyka/budowa-3-linii-metra-zagrozona-pieniedzy-wciaz-brak-choc-start-juz-za-2-lata-aa-u6V3-z76Y-RU2P.html) |

Uwaga: tramwaj do Miasteczka Wilanów już działa (otwarty w 2024 r., 6,5 km), więc nie ma go na osi czasu.

**Pozostałe dane w mocku:**
- Trasy (`routes[].geometry`) pochodzą z OSRM FOSSGIS (`https://routing.openstreetmap.de/routed-foot/route/v1/driving/{lon,lat;lon,lat}?overview=full&geometries=geojson`, wariant `routed-bike` dla roweru), dane © OpenStreetMap (ODbL). Publiczne demo `router.project-osrm.org` ma tylko profil samochodowy i ignoruje `foot`.
- Szkoły, przedszkola i przychodnie wybraliśmy z OSM (Overpass, Nominatim). Overpass w X 2026 często zwraca błędy 502 i 500, wtedy Nominatim (`?q=…&format=json`) wystarcza do pojedynczych punktów.
- Korki (`traffic`) i czasy dojazdu (`commute`) to nasze szacunki typowego dnia roboczego, a nie pomiar.
- Zdjęcia pochodzą z Wikimedia Commons, autorów i licencje podajemy w `application/public/osiedla/credits.json`. Commons przy pobieraniu oryginałów szybko zwraca HTTP 429, dlatego pobieraj miniatury `iiurlwidth=1920` (`thumburl`) z przerwą kilku sekund między plikami.
- Wyszukiwanie w portalach: w otodom Saska Kępa ma ścieżkę `praga--poludnie/saska-kepa` (podwójny myślnik), a Miasteczko Wilanów to `wilanow/blonia-wilanowskie`. Morizon używa krótkich ścieżek: `/mieszkania/warszawa/powisle/`, `/saska-kepa/`, `/blonia-wilanowskie/`.

## 6. Budynki, drogi, zieleń 3D dla 3 osiedli (OSM) ✅

- **Co:** `application/public/data/3d/<msiId>/` dla `muranow`, `stare-bielany`, `natolin` (obszar MSI + bufor 600 m; inne obszary: `OSM3D_AREAS=powisle,saska-kepa`): `buildings.geojson` (`id`, `h`, `mh`, `kind`, `name` tylko dla budynków publicznych, `poi`), `roads.geojson` (bryły jezdni `part=curb|surface`, `highway`, `name`, `way_id`), `roads-lines.geojson` (osie dróg `way_id`, `name`, `highway`, `lanes`, `tn`=tunel), `green.geojson`, `water.geojson`. Ok. 2,2 / 1,8 / 2,5 MB (gzip ok. 4× mniej).
- **Źródło:** Geofabrik `mazowieckie-latest.osm.pbf` (ok. 300 MB, ODbL, © OpenStreetMap). **Overpass 17.10 wieczorem odrzucał połączenia** (`overpass-api.de` ECONNREFUSED, gdy w zespole chodziły duże zapytania; `kumi.systems` i `private.coffee` 500, `maps.mail.ru` 504), a jego baza miała znacznik `timestamp_osm_base` z lipca 2026. PBF jest świeższy i nie ma limitów; przejście całego pliku pyosmium trwa ok. 80 s.
- **Skrypty:** `uv run data/scripts/osm3d/extract_osm.py` (PBF → `data/raw/osm3d/<msiId>.osm.geojson`), potem `uv run data/scripts/osm3d/build_osm3d.py`.
- **Wysokość:** `height`, inaczej `building:levels` × 3,2 m (+ połowa `roof:levels`), inaczej domyślna wg typu (dom 7 m, blok 15 m, garaż 3 m, inne 9 m). `min_height` / `building:min_level` → `mh`; `building=roof` (wiaty) wisi 1 m nad ziemią. Pomijamy obrysy < 20 m² i budynki pomocnicze (garaże, szopy, altany) < 40 m².
- **`kind`** (`school`, `kindergarten`, `university`, `college`, `hospital`, `clinic`, `church`, `culture`, `public`, `office`, `retail`, `residential`, `other`): najpierw tag `building`, potem `amenity`/`shop`/`office` na budynku, potem teren usługi, w którym stoi (`amenity=school|university|hospital…` jako poligon, np. „Kampus Główny UW”, AWF, SGGW, Narodowy Instytut Onkologii), na końcu punkt POI z `data/poi` (przedszkola, szkoły, uczelnie, przychodnie) wewnątrz obrysu. **Pułapka:** w OSM szkoła to często tylko poligon terenu, a budynek ma `building=yes`; bez kroku „teren usługi” większość szkół i uczelni byłaby `other`. Nowy BUW ma `building=public` + `amenity=library`, więc biblioteka na terenie uczelni dostaje `university`. POI w bloku mieszkalnym albo w budynku wyższym niż 15 m (np. przedszkole na parterze) zapisujemy tylko w `poi`, `kind` zostaje `residential`/`other`.
- **Drogi:** szerokość wg klasy jak w `feat/grid-tile-lab` (motorway 14 … residential 5,5 m, `_link` 6 m); tag `width` (3–40 m) albo `lanes` × 3,2 m ma pierwszeństwo. Krawężnik = w/2 + 0,45 m, nawierzchnia = w/2 + 0,28 m. Tunele (np. tunel Wisłostrady na Powiślu) są tylko w `roads-lines` z `tn=1`, bez bryły.

## 7. Korki na drogach z rozkładu ZTM (GTFS) ⚠️ (rozkład, nie ruch na żywo)

- **Co:** `application/public/data/3d/<msiId>/traffic.json`: `{hours:[0..23], ways:{way_id:[24 × 0–1|null]}, area:{median, speedKmh, ways}, serviceDate, method, source, modes, waysTotal}`. `way_id` = `way_id` z `roads.geojson` / `roads-lines.geojson`. Helper: `application/src/lib/osm3d/traffic.ts` (`trafficForHour` → `roadStyle.withCongestion`).
- **Źródło:** `https://mkuran.pl/gtfs/warsaw.zip` (dane ZTM Warszawa, GTFS: Mikołaj Kuranowski, kształty tras autobusów © OSM), ok. 100 MB → `data/raw/gtfs/warsaw.zip` (gitignored). `stop_times.txt` i `shapes.txt` mają `shape_dist_traveled` w **km**, więc odcinek między przystankami wycinamy z kształtu po dystansie. Każdy dzień ma własny `service_id` (`2026-10-21:PcS`, PcS = Pn–Cz), `trip_id` zaczyna się od daty.
- **Skrypt:** `uv run data/scripts/osm3d/build_traffic.py [--date YYYYMMDD]` (ok. 20 s; po `build_osm3d.py`). Domyślnie pierwsza środa w feedzie (w X 2026: 2026-10-21), tylko autobusy i tramwaje.
- **Metoda:** para kolejnych przystanków kursu = odcinek. **Pułapka: czasy ZTM są zaokrąglone do pełnych minut**, więc pojedynczy przeskok (najczęściej „1 min”) prawie nigdy nie pokazuje spowolnienia (pierwsza wersja dała medianę 0 przez cały dzień). Dlatego prędkość pary liczymy w oknie ±2 przystanki (ok. 5 przeskoków, 5–8 min jazdy): Σ dystansu kształtu / Σ czasu rozkładowego wszystkich kursów z danej godziny odjazdu (min. 2 kursy). Korek = 1 − v_h / v_max, gdzie v_max to najszybsza godzina tego samego odcinka (zwykle noc). Dopasowanie do dróg: próbki co 10 m, najbliższa oś drogi ≤ 25 m z kierunkiem różniącym się < 35°, min. 15 m pokrycia; wartość drogi = średnia odcinków ważona pokryciem × liczbą kursów. `area.median` = mediana po drogach z danymi (zastępuje szacowane krzywe korków w mocku).
- **Wyniki (środa 2026-10-21):** drogi z danymi: Muranów 440 / 995, Stare Bielany 301 / 740, Natolin 288 / 1092. Mediana o 8:00 / 17:00: Muranów 0,10 / 0,12, Stare Bielany 0,10 / 0,13, Natolin 0,17 / 0,17. Rozkładowa prędkość (mediana) spada z ok. 25–28 km/h w nocy do 17–19 km/h w szczycie.
- **Ograniczenia:** to **planowane przez ZTM spowolnienie** (czasy przejazdu w rozkładzie zależne od pory dnia), nie pomiar ruchu: brak dróg bez komunikacji (`null`, w UI neutralne, ok. 60% dróg osiedlowych), brak wypadków i różnic między dniami. Tramwaje na wydzielonym torowisku (np. al. Jana Pawła II) prawie nie zwalniają, więc zaniżają wartość ulicy. Godzina = godzina odjazdu z pierwszego przystanku pary; kursy po 24:00 trafiają do godzin 0–3. Wartości są względne dla danej drogi (0 = jej najszybsza godzina), nie porównują ulic między sobą. Źródło na żywo (pozycje pojazdów ZTM z portalu, `ztm_pojazdy_gps`) pozwoliłoby to zweryfikować.
