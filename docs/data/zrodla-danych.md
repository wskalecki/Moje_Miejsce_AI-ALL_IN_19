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
| rejestr-cen-nieruchomosci | `bgk_rcn` | ❌ | **HTTP 500** (u Mikołaja i u nas, także `bemowo` małą literą). Szukamy źródła zapasowego |
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
| RSPO | rejestr szkół | ⚠️ | API wymaga wniosku (do 14 dni). Eksport CSV z wyszukiwarki działa |

## 4. Decyzje o danych (dlaczego to źródło)

| Metryka | Źródło | Dlaczego |
|---|---|---|
| Szkoły, przedszkola | OSM | Miejski WFS ma tylko obwody szkół podstawowych, a WMS daje obraz bez listy. RSPO wymaga wniosku |
| Apteki, przychodnie | OSM | Warstwa miejska jest z 2017 r. |
| Parki | OSM, odległość do **krawędzi** wielokąta (≥1 ha) | Odległość od środka parku zaniżałaby oceny obok dużych lasów |
| Boiska | portal + geokoder z punktów adresowych | Portal nie podaje współrzędnych |
| Jakość powietrza | portal, PM2.5, interpolacja IDW (do 5 km) | 141 stacji daje ciągłą mapę. To pomiar z jednej godziny, w UI oznaczony jako „pomiar z dziś” |
| Utrudnienia | portal, liczba unikalnych w promieniu 1 km | Linie mają wiele wierzchołków |
| Hałas | zbiór Wojtka (EEA 2022) | Nie dublujemy pracy. WMS 2017 jest starszy |
| Ceny | RCN (portal), obecnie błąd 500 | Kontrakt przewiduje `rcn_m2_median_district` |
