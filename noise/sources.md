# Źródła danych – geodataset hałasu m.st. Warszawy (krok 0)

Data weryfikacji wszystkich źródeł: **2026-10-17**. Weryfikację wykonano bezpośrednio na usługach i plikach źródłowych: rekordy metadanych, GetCapabilities, DescribeFeatureType, ESRI REST JSON, OpenAPI, zapytania o liczbę obiektów i małe próbki.

Oznaczenia w tekście:
- **[Z]** – zweryfikowane: pobrałem lub odpytałem samodzielnie,
- **[W]** – wnioskowane albo niezweryfikowane.

---

## Podsumowanie

**Go/no-go dla EEA END 2022 (kontury wektorowe): GO.** Plik `PL.gpkg` zawiera kontury aglomeracji Warszawa dla dróg, kolei, lotnictwa i przemysłu, dla Lden i Lnight **[Z]**.

Dwa zastrzeżenia:
1. Plik ma 9,3 GB, więc nie należy go pobierać w całości.
2. Licencja dopuszcza tylko cele badawcze i non-profit.

Te same geometrie są dostępne w **API GIOŚ HAŁAS**: natywnie w EPSG:2180 i na licencji CC BY 4.0. Na sprawdzonym obiekcie IoU = 1,0 względem EEA **[Z]**.

| Źródło | Dostępne? | Format / endpoint | CRS | Licencja | Rok danych / runda | Rekomendowane użycie |
|---|---|---|---|---|---|---|
| EEA – Noise contours END 2022 (vector) | **TAK**, Warszawa obecna | GPKG per kraj (`PL.gpkg`, 9,3 GB). Odczyt Warszawy przez HTTP range (`/vsicurl/` + filtr przestrzenny). Brak GDB w folderze | EPSG:3035 | „available for research and non-profit purposes”, ograniczenie INSPIRE art. 13(1)(e) | 2021 / runda 2022 (4.) | Kontrola krzyżowa konturów albo fallback |
| EEA – rastry `NoiseContours_*` (ImageServer) | TAK | ESRI ImageServer, 10 m, wartości 1–5 | EPSG:3035 | © EEA; warunki jak wyżej **[W]** | 2021 / 2022 | Szybka kontrola wizualna lub rastrowa |
| EEA – Reported data on noise exposure 2022 (Nov 2024) | **TAK** | xlsx, 407 kB | – | CC BY 4.0 | 2021 / 2022 | Walidacja `pop_est` (DoD) |
| **API GIOŚ HAŁAS** – `/v1/zasiegi-halasu` | **TAK** | GeoJSON (MultiPolygon), stronicowany | EPSG:2180 (brak deklaracji w GeoJSON, zweryfikowane) | CC BY 4.0 | 2021 / „4 Runda Mapowania” | **Główne źródło konturów** |
| API GIOŚ HAŁAS – `/v1/informacja-o-powierzchni-terenu` | TAK | JSON | – | CC BY 4.0 | 2021 / 4. runda | Walidacja: pow. km² i ludność per pasmo dla powiatu Warszawa |
| Fallback A – serwis m.st. Warszawy | Tylko obraz | WMS `wms.um.warszawa.pl/serwis`, warstwy `HALAS_*_2022`; brak WFS | EPSG:2178 | „AccessConstraints: None whatsoever” (WMS) | 2021 / 2022 (+2017, 2012) | Wyłącznie kontrola wizualna; jedyne miejsce z osobnym **tramwajem** |
| Fallback B – INSPIRE 2017 (ekoportal) | TAK, 8/8 endpointów | WFS 2.0 (GML 3.2; GeoJSON działa, choć nie jest ogłoszony) | EPSG:2180 (alt. 2178, 3857) | Brak ograniczeń, brak warunków | 2016 / runda 2017 (3.) | Porównanie z poprzednią rundą (`data_year=2016`) |
| PRG – jednostki ewidencyjne (dzielnice) | TAK | WFS GUGiK `ms:A05_Granice_jednostek_ewidencyjnych` | EPSG:2180 | Bezpłatnie, do dowolnego wykorzystania | stan bieżący | **Granice 18 dzielnic** |
| GUS – siatka 1 km NSP 2021 (rezydenci) | TAK | SHP, 23,5 MB (ATOM) | EPSG:2180 (komórki z siatki LAEA) | Brak warunków dostępu i użytkowania | NSP 2021 | **Baza ludności** |
| GUS BDL – ludność dzielnic | TAK | REST API, zmienna `72305` | – | CC BY 4.0 | 31.12.2021 | Kontrola ludności dzielnic |
| BDOT10k – BUBD (pow. 1465) | TAK | GPKG zip, 88 MB | EPSG:2180 | Bezpłatnie, do dowolnego wykorzystania | wersje 2023-12-31 … 2025-06-01 | Rozkład dasymetryczny |
| GIOŚ API – inne moduły HAŁAS | TAK | JSON | – | CC BY 4.0 | per województwo | Tło (POŚ); bez rozbicia na dzielnice |

Najważniejsze ustalenia, które zmieniają założenia speca:

1. **Tramwaj nie jest osobną kategorią** ani w EEA, ani w GIOŚ. W danych dla Warszawy siedzi w „rail” (`railwaysInAgglomeration` / „Hałas kolejowy wewnątrz aglomeracji”) **[Z]**, patrz sekcja 1.5. Osobną warstwę tramwajową ma tylko miejski WMS, a ten jest wyłącznie obrazem.
2. Serwis ESRI REST podlinkowany w metadanych EEA (`Noise_exposure_2025/MapServer`) **nie zawiera konturów**. Ma punkty i poligony narażenia do storymapy **[Z]**.
3. Najwyższe pasmo w EEA jest scalone: `LdenGreaterThan75` i `LnightGreaterThan70`. GIOŚ rozdziela je na 75–79 i ≥80 (Lden) oraz 70–74 i ≥75 (Lnight) **[Z]**.
4. Ludność przyjęta w SMH (1 663 588) jest o ok. 11% niższa niż NSP 2021 (siatka: 1 861 159) i BDL (1 863 056) **[Z]**. To wpłynie na kontrolę DoD „< 20% vs EEA xlsx”.

---

## 1. EEA – Noise contours data reported under END 2022 (vector)

Sprawdzono 2026-10-17.

### 1.1 Identyfikacja i dostęp [Z]

- **Strona zbioru nadrzędnego** (datahub): https://www.eea.europa.eu/en/datahub/datahubitem-view/c952f520-8d71-42c9-b74c-b7eb002f939b
  - Nadrzędny rekord `c952f520…` („Noise data reported under END”) to tylko opis serii, bez dystrybucji.
  - Właściwy zbiór to **„Noise contours data reported under Environmental Noise Directive (END) 2022 (vector), Mar. 2026”**, UUID `853e72e4-4642-47d1-8556-2cc231bd43e0`.
  - Opublikowany 19.03.2026, temporal coverage 2021. Zgłoszenia krajów do 18.11.2024.
- **Metadane ISO**: https://sdi.eea.europa.eu/catalogue/srv/api/records/853e72e4-4642-47d1-8556-2cc231bd43e0/formatters/xml (DOI 10.2909/853e72e4-4642-47d1-8556-2cc231bd43e0).
  - Lista krajów w metadanych zawiera **Poland**.
  - Formaty deklarowane w metadanych: „Geopackage | GDB”.
- **Pobieranie**: https://sdi.eea.europa.eu/data/853e72e4-4642-47d1-8556-2cc231bd43e0
  - Strona przekierowuje do udziału Nextcloud `https://sdi.eea.europa.eu/datastore/public?path=/eea_v_3035_1_k_noise-contours-end2022_p_2026_v01_r00/`.
  - Listing pobrałem przez WebDAV (PROPFIND) z `https://sdi.eea.europa.eu/datashare/public.php/dav/files/sptXqwkQr5g7Bp5/eea_v_3035_1_k_noise-contours-end2022_p_2026_v01_r00/`. Token udziału `sptXqwkQr5g7Bp5` może się zmienić, stabilny jest link `sdi.eea.europa.eu/data/<uuid>`.
  - **`PL.gpkg` = 9 299 005 440 B (9,3 GB)**, last-modified 2026-04-23. Folder łącznie: 64 GB.
  - Pozostałe pliki: pliki `.gpkg` dla innych krajów, `DE-gpkg.7z`, `README.md`, XML metadanych.
  - **W folderze nie ma GDB**, mimo deklaracji w metadanych.
  - Serwer obsługuje HTTP Range (odpowiedź 206).
- **„ESRI:REST” z metadanych**: https://noise.discomap.eea.europa.eu/arcgis/rest/services/noiseStoryMap/Noise_exposure_2025/MapServer?f=pjson
  - Opis serwisu: „Noise exposure used in the Noise storymap. data update: 2025”.
  - Ma 77 warstw: punkty liczby narażonych (np. „Number of people exposed to noise from roads (55 dB)”) i poligony „City Area”.
  - **To nie są kontury.**
  - „OGC:WMS” z metadanych wskazuje ten sam serwis (`…/Noise_exposure_2025/MapServer/WMSServer`).
- **Rastry konturów 2022** w katalogu https://noise.discomap.eea.europa.eu/arcgis/rest/services/noiseStoryMap?f=pjson:
  - serwisy ImageServer `NoiseContours_{road|rail|air|ind}_{lden|lnight}`,
  - opis np. „Noise contours from Road Lden. Update April 2026”,
  - piksel 10 m, `pixelType U4`, wartości 1–5, EPSG:3035,
  - capabilities `Catalog,Mensuration,Image,Metadata`, max obraz 15000×4100 px,
  - w katalogu mozaiki jest pozycja `PL_DF4_8_roadNoise_Lden_PL`.

### 1.2 Czy jest Warszawa? – TAK [Z]

`PL.gpkg` odczytałem zdalnie przez HTTP range (SQLite VFS), bez pobierania całego pliku: indeks R-tree dla bbox Warszawy plus atrybuty najmniejszych obiektów.

Liczba obiektów przecinających bbox Warszawy w EPSG:3035 (x 5 055 000–5 090 000, y 3 272 000–3 313 000):

| warstwa | obiekty w bbox | `sourceIdentifier` (nazwa pliku) |
|---|---|---|
| `NoiseContours_roadsInAgglomeration_Lden` / `_Lnight` | 108 / 107 | `…/Agglomerations-StrategicNoiseMaps-multip WARSZ.gpkg` |
| `NoiseContours_railwaysInAgglomeration_Lden` / `_Lnight` | 79 / 67 | jw. (`WARSZ`) |
| `NoiseContours_airportsInAgglomeration_Lden` / `_Lnight` | 14 / 15 | jw. (`WARSZ`) |
| `NoiseContours_industryInAgglomeration_Lden` / `_Lnight` | 42 / 30 | jw. (`WARSZ`) |
| `NoiseContours_majorRoadsIncludingAgglomeration_Lden` / `_Lnight` | 75 / 109 | `MajorRoads-StrategicNoiseMaps-multipoly MZ.gpkg` |
| `NoiseContours_majorRailwaysIncludingAgglomeration_Lden` / `_Lnight` | 39 / 37 | `MajorRailways-StrategicNoiseMaps-multipoly (1).gpkg` |
| `NoiseContours_majorAirportsIncludingAgglomeration_Lden` / `_Lnight` | 5 / 5 | `MajorAirports-StrategicNoiseMaps-multipoly (1).gpkg` |

**Jak identyfikować Warszawę:** w schemacie **nie ma pola z kodem ani nazwą aglomeracji**.
- Warszawę rozpoznaje się po `sourceIdentifier LIKE '%WARSZ.gpkg'` oraz `reportNetEnvelopeFileId = 1906`.
- Można też przyciąć kontury przestrzennie do granicy miasta, co i tak jest zalecane.
- Wszystkie odczytane obiekty warstw „…InAgglomeration” w bbox pochodziły z pliku `WARSZ`.

Nazwy Warszawy w innych zbiorach:
- xlsx EEA: „Warsaw” (sekcja 2),
- INSPIRE: `agglomerat='Warszawa'`, `unaggid='PL_a_ag1465'` (sekcja 4).

Kontrola punktowa (point-in-polygon na geometrii z GPKG):
- **Al. Jerozolimskie × Marszałkowska**: road Lden = `LdenGreaterThan75`, road Lnight = `Lnight6569`, rail Lden = `Lden7074`.
- **Puławska (Mokotów)**: road Lden = `Lden6569`.
- Każdy punkt leżał w dokładnie jednym poligonie pasma. Pasma są rozłącznymi pierścieniami, nie poligonami skumulowanymi.

Obiekty Warszawy to fragmenty kafli o boku ok. 3–5 km (bbox np. 3,6 × 5,2 km), po kilka na pasmo **[Z]**. Przed liczeniem trzeba je rozpuścić (dissolve) per pasmo.

Rozmiar geometrii Warszawy (suma blobów WKB):

| warstwa | Lden | Lnight |
|---|---|---|
| road | 37 MB | 28 MB |
| rail | 5,6 MB | 3,9 MB |
| air | 0,1 MB | 0,2 MB |
| industry | 0,1 MB | 0,1 MB |

Ekstrakcja samej Warszawy jest więc tania, np. `ogr2ogr -spat … /vsicurl/https://…/PL.gpkg <warstwa>`.

### 1.3 CRS, warstwy, pola [Z]

- CRS: **EPSG:3035** (`gpkg_spatial_ref_sys`), geometria `geom` typu MULTIPOLYGON, bez Z/M.
- 14 warstw: `NoiseContours_{roadsInAgglomeration|railwaysInAgglomeration|airportsInAgglomeration|industryInAgglomeration|majorRoadsIncludingAgglomeration|majorRailwaysIncludingAgglomeration|majorAirportsIncludingAgglomeration}_{Lden|Lnight}`.
- Pola, identyczne we wszystkich warstwach:
  - `id_0`, `geom`, `pk`, `id`,
  - `measureTime_beginPosition`, `measureTime_endPosition` (w próbce zawsze NULL),
  - `category`, `source`, `sourceIdentifier`, `reportNetEnvelopeFileId`, `countryCode`,
  - `geom_correction`, `geometry_error_description` (`'Valid'` albo opis błędu, np. „Not valid because polygon ring … intersects itself”; dlatego trzeba użyć `make_valid`).
- Atrybut **wskaźnika** jest zakodowany w nazwie warstwy (`_Lden` / `_Lnight`) i w prefiksie `category`.
- Atrybut **źródła**: pole `source` ma wartość równą rdzeniowi nazwy warstwy, np. `roadsInAgglomeration`.
- Unikalne wartości **pasma** (`category`), zaobserwowane w Warszawie:
  - Lden: `Lden5559`, `Lden6064`, `Lden6569`, `Lden7074`, `LdenGreaterThan75`,
  - Lnight: `Lnight5054`, `Lnight5559`, `Lnight6064`, `Lnight6569`, `LnightGreaterThan70`,
  - brak pasm poniżej 55 / 50 dB.
- `countryCode = 'PL'`.
- Rastry ImageServer: wartość 1–5 = kolejne pasma (1 = 55–59 Lden / 50–54 Lnight; 5 = ≥75 / ≥70). Sprawdziłem to porównaniem `identify` z wektorem w 2 punktach × 3 warstwy, np. road Lden: 5 ↔ `LdenGreaterThan75`, 3 ↔ `Lden6569` **[Z]**.

### 1.4 Licencja [Z]

Z metadanych `853e72e4` (oraz z JSON-a strony datahub):
- *„public access limited according to Article 13(1)(e) of the INSPIRE Directive”*,
- *„The noise contour maps reported under the Environmental Noise Directive are available for research and non-profit purposes. This dataset excludes those noise contours that have been marked by the country as restricted from public view.”*

To nie jest CC BY. Redystrybucja i użycie komercyjne są problematyczne.

### 1.5 Tramwaje – w kategorii „rail” [Z, częściowo W]

- W `PL.gpkg` nie ma kategorii tramwajowej.
- **Test wektorowy [Z]:** punkt na Puławskiej (Mokotów, okolice Woronicza) – w pobliżu tylko tramwaj, bez linii kolejowej – leży w `railwaysInAgglomeration_Lden`, pasmo `Lden6064`, plik `WARSZ`.
- **Test wizualny [Z]:** raster EEA `NoiseContours_rail_lden` i miejskie WMS dla tego samego obszaru:
  - raster EEA odwzorowuje korytarze tramwajowe Puławska / Woronicza / Wołoska oraz Grójecka / Banacha,
  - pokrywają się one z miejską warstwą `HALAS_TRAMWAJOWY_LDWN_2022`,
  - miejska `HALAS_KOLEJOWY_LDWN_2022` jest w tych kadrach pusta.
- **Uwaga [Z]:** `majorRailwaysIncludingAgglomeration` (plik `MajorRailways…(1).gpkg`, envelope 1826) ma dla Warszawy duże multipoligony o zasięgu całego miasta. W punkcie na Puławskiej dają te same odległości do granic pasm co warstwa aglomeracyjna. **Nie sumować i nie łączyć** warstwy major rail z warstwą aglomeracyjną dla Warszawy.
- Analogicznie `majorRoadsIncludingAgglomeration` (`MZ.gpkg`) dubluje drogi aglomeracyjne **[W]**.
- **[W]** Dane POH (NHA tramwajowy 12 107 vs kolejowy 1 182) są zgodne z tym, że „rail” w EEA to głównie tramwaj.
- Konsekwencja dla schematu 5.1: dla `eea_end_2022` i GIOŚ wartość `source='rail'` oznacza **kolej + tramwaj**. Kategorii `tram` nie da się wypełnić z danych wektorowych.

---

## 2. EEA – Reported data on noise exposure 2022 (wersja Nov 2024)

Sprawdzono 2026-10-17.

- **Rekord**: „Reported data on noise exposure covered by Directive 2002/49/EC, 2022, November 2024”, UUID `1c483f43-1227-4068-a365-ecae6c293f87`, opublikowany 5.08.2025, temporal coverage 2021, dane do 16.11.2024.
  - Metadane: https://sdi.eea.europa.eu/catalogue/srv/api/records/1c483f43-1227-4068-a365-ecae6c293f87/formatters/xml **[Z]**
  - Wersja „Superseded” to `6390fc31-0c20-45bf-b866-417a1755098b` (July 2024). Nie używać.
- **Bezpośrednie pobranie [Z]**: `https://sdi.eea.europa.eu/datashare/public.php/dav/files/sptXqwkQr5g7Bp5/eea_t_noise-exposure-2022_p_2021_v02_r00/Summary_END_2022_cutoff241118_v4.xlsx`
  - 406 874 B, SHA-256 `77331665ea8e550833346dd2dde0e14fa0bcd68a1dc06ecab420d46963b83505`.
  - Stabilny link do folderu: https://sdi.eea.europa.eu/data/1c483f43-1227-4068-a365-ecae6c293f87
- **Licencja [Z]**: *„License CC-BY 4.0 … Copyright holder: European Environment Agency (EEA)”*, „No limitations to public access”.
- **Arkusze [Z]**:
  - `Intro`, `Description`, `Aggl_list`,
  - `Aggl_{Road|Air|Rail|Ind}_Data` + `_Coverage`,
  - `MAir_list`, `MAir_Data`, `MAir_Coverage`,
  - `MRail_Length`, `MRail_Data`, `MRoad_Length`, `MRoad_Data`.
- **Kolumny `Aggl_Road_Data`** (nagłówek w wierszu 6):
  - `Country, EU, Agglomeration Name, Nr Inhabitants, Area (km2)`,
  - Lden: `45-49, 50-54, 55-59, 60-64, 65-69, 70-74, >75`,
  - LdenM („major noise bands”): te same pasma,
  - Lnight: `40-44, 45-49, 50-54, 55-59, 60-64, 65-69, >70`,
  - LnightM: te same pasma,
  - `DF4_8 Date Released, Data Source, URL`.
  - `Aggl_Ind_Data` nie ma kolumn „M”.
- Brak kategorii tramwajowej (por. 1.5).

**Wiersze dla Warszawy [Z]**
- Wiersz w arkuszach: `Poland | EU27 | Warsaw | 1 663 587 | 517.2`.
- DF4_8 released 2024-10-30, „Reportnet 3 submission harvested on 18 November 2024”, https://reportnet.europa.eu/public/dataflow/873.
- Kolumny 45–49 i 50–54 (Lden) oraz 40–44 i 45–49 (Lnight): „No data”.

| źródło | Lden 55–59 | 60–64 | 65–69 | 70–74 | ≥75 | Lnight 50–54 | 55–59 | 60–64 | 65–69 | ≥70 |
|---|---|---|---|---|---|---|---|---|---|---|
| Road | 271 800 | 172 600 | 89 000 | 27 300 | 1 600 | 192 200 | 108 800 | 38 200 | 3 900 | 0 |
| Road „M” | 170 700 | 128 400 | 67 200 | 24 000 | 1 500 | 127 900 | 80 200 | 32 300 | 3 600 | 0 |
| Rail (= kolej + tramwaj, por. 1.5) | 38 500 | 24 100 | 7 200 | 0 | 0 | 27 900 | 9 800 | 0 | 0 | 0 |
| Rail „M” | 37 300 | 23 700 | 7 200 | 0 | 0 | 27 200 | 9 700 | 0 | 0 | 0 |
| Air | 20 400 | 1 300 | 0 | 0 | 0 | 4 700 | 300 | 0 | 0 | 0 |
| Industry | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Dodatkowo:
- `MAir_Data` dla EPWA (Lotnisko Chopina, 95 909 operacji/rok): Lden 55–59 = 23 000, 60–64 = 1 300, 65–69 = 100; Lnight 50–54 = 6 200, 55–59 = 100.
- Pokrycie Polski: 36/36 aglomeracji raportowanych (100%).

---

## 3. Fallback A – serwis mapowy m.st. Warszawy (SMH 2022)

Sprawdzono 2026-10-17.

**WMS** – https://wms.um.warszawa.pl/serwis?service=WMS&request=GetCapabilities **[Z]**
- „WMS m.st. Warszawy”, silnik Oracle MapViewer, `Fees: None`, `AccessConstraints: None whatsoever`.
- Warstwy hałasu:

  | rodzaj | LDWN 2022 | LN 2022 | LDWN 2017 | LN 2017 |
  |---|---|---|---|---|
  | drogowy | `HALAS_DROGOWY_LDWN_2022` | `HALAS_DROGOWY_LN_2022` | `HALAS_DROGOWY_LDWN_2017` | `HALAS_DROGOWY_LN_2017` |
  | kolejowy | `HALAS_KOLEJOWY_LDWN_2022` | `HALAS_KOLEJOWY_LN_2022` | `HALAS_KOLEJOWY_LDWN_2017` | `HALAS_KOLEJOWY_LN_2017` |
  | tramwajowy | `HALAS_TRAMWAJOWY_LDWN_2022` | `HALAS_TRAMWAJOWY_LN_2022` | `HALAS_TRAMWAJOWY_LDWN_2017` | `HALAS_TRAMWAJOWY_LN_2017` |
  | lotniczy | `HALAS_LOTNICZY_LDWN_2022` | `HALAS_LOTNICZY_LN_2022` | `HALAS_LOTNICZY_LDWN_2017` | `HALAS_LOTNICZY_LN_2017` |
  | przemysłowy | `HALAS_PRZEMYSLOWY_LDWN_2022` | `HALAS_PRZEMYSLOWY_LN_2022` | `HALAS_PRZEMYSLOWY_LDWN_2017` | `HALAS_PRZEMYSLOWY_LN_2017` |

- Jest też `GEODEZJA_DZIELNICE` („Granice dzielnic”).
- Warstwy `HALAS_*` mają CRS tylko **EPSG:2178**. WMS 1.3.0 wymaga kolejności osi N,E w BBOX (sprawdzone).
- GetMap działa (PNG, JPEG, GIF). `image/svg+xml` jest ogłoszony, ale zwraca błąd „invalid FORMAT”.
- `queryable="true"`, ale **GetFeatureInfo zwraca pusty `<GetFeatureInfo_Result>`** w punktach, gdzie mapa jest wyraźnie pokolorowana.
- Brak legendy (GetLegendGraphic zwraca wyjątek).
- Obraz drogowy 2022 pokazuje także barwy, które mogą oznaczać zakresy poniżej 55 dB **[W]**, ale bez legendy nie da się tego potwierdzić.

**WFS** – https://wms2.um.warszawa.pl/geoserver/wfs/wfs?service=WFS&request=GetCapabilities&version=2.0.0 **[Z]**
- Jedyne typy obiektów: `wfs:budynki`, `wfs:dzialki`, `wfs:miejscowosci`, `wfs:Osnowa_pozioma`, `wfs:Osnowa_wysokosciowa`, `wfs:place`, `wfs:punkty_adresowe`, `wfs:ulice`.
- **Brak hałasu.**

**Portal mapa.um.warszawa.pl** **[Z]**
- Konfiguracja aplikacji: https://mapa.um.warszawa.pl/assets/environment/environment.json
- API: `https://mapa.um.warszawa.pl/api/modul-mapowy`, wyszukiwanie: `/open/wyszukiwarka/warstwy/komputerowe?fraza=hałas`.
- Mapa „Mapa hałasu” (`/open/mapy/3b60e43a-47e9-401c-affe-958705c1b992`) ma 32 warstwy: rundy 2022, 2017 i 2012, w tym „Tramwajowy LDWN/LN”, „Rozkład hałasu na elewacjach”, „Mapa hałasu – Budynki”.
- Każda warstwa 2022 ma `typ: "TILE_LAYER"` i **`pobieranieDanych: false`**. Przykład: `nazwaMVC: "DLDWN_2022"`, źródło `akuwawa`.
- Wniosek: **wektor nie jest udostępniany**.
- Nie próbowałem obchodzić tego przez wewnętrzne endpointy MapViewera.
- **[W]** Jest podgląd hałasu per budynek (`https://mapa.um.warszawa.pl/budynek/widok.html?id=…`). Nie badałem go.

**Portal otwartych danych** https://dane.um.warszawa.pl (API `https://dane.um.warszawa.pl/api/datasets`) **[Z]**
- 23 zbiory, wszystkie w JSON: transport, powietrze, odpady itd.
- **Brak hałasu i brak granic dzielnic.**

**Wniosek:** wektora SMH 2022 od miasta nie da się pozyskać usługą. Obraz WMS nadaje się do kontroli wizualnej i jest jedynym źródłem z **osobnym tramwajem**.

Jeśli `tram` jest potrzebny jako osobna kategoria, zostaje rekomendacja z speca: wniosek o udostępnienie informacji o środowisku do Biura Ochrony Środowiska UM. Wniosku nie składano.

---

## 4. Fallback B – INSPIRE, runda 2017, WFS iip.ekoportal.gov.pl

Sprawdzono 2026-10-17.

Wzór `DF4_8_Agg{Road|Rail|Air|Ind}2017{Lden|Lnight}` potwierdzony: **8/8 endpointów zwraca GetCapabilities** (HTTP 200) **[Z]**.

Wzór URL: `https://iip.ekoportal.gov.pl/geoserver/<workspace>/wfs?service=wfs&version=2.0.0&request=GetCapabilities`.

Parametry usług:
- Dostawca: Ministerstwo Klimatu i Środowiska.
- `Fees: Brak opłat`, `AccessConstraints: Brak ograniczeń w publicznym dostępie`.
- Metadane zbioru (np. road Lden): https://csw.ekoportal.gov.pl/geonetwork/srv/pol/csw?service=CSW&request=GetRecordById&version=2.0.2&outputSchema=http://www.isotc211.org/2005/gmd&elementSetName=full&id=7c6c4f3b-19d0-4a8b-affe-c333c0fc7166 – „Brak warunków dostępu i użytkowania”.
- DefaultCRS **EPSG:2180**, OtherCRS 2178 i 3857.
- Ogłoszony format: tylko `application/gml+xml; version=3.2`. `outputFormat=application/json` też działa (GeoJSON, współrzędne E,N,Z=0).
- `CountDefault=1000000`, stronicowanie dostępne.

| workspace | typ obiektu (poligony) | wszystkie | `agglomerat='Warszawa'` | Warszawa per `db_low` |
|---|---|---|---|---|
| DF4_8_AggRoad2017Lden | `PL_a_AggRoad2017_Lden_polygon` (+ `_line`) | 143 516 | 18 205 | 55: 6047, 60: 3268, 65: 2063, 70: 4252, 75: 2575 |
| DF4_8_AggRoad2017Lnight | `PL_a_AggRoad2017_Lnight_Polygon` (+ `_Line`) | 92 223 | 15 432 | 50: 3557, 55: 2023, 60: 5625, 65: 2874, 70: 1353 |
| DF4_8_AggRail2017Lden | `PL_a_AggRail2017_Lden_Polygon` (+ `_Line`) | 29 765 | 1 124 | 55: 341, 60: 145, 65: 93, 70: 194, 75: 351 |
| DF4_8_AggRail2017Lnight | `PL_a_AggRail2017_Lnight_Polygon` (+ `_Line`) | 18 627 | 1 073 | 50: 196, 55: 143, 60: 158, 65: 414, 70: 162 |
| DF4_8_AggAir2017Lden | `PL_a_Aggair2017_Lden` | 101 | 21 | 55: 3, 60: 4, 65: 3, 70: 3, 75: 8 |
| DF4_8_AggAir2017Lnight | `PL_a_Aggair2017_Lnight` | 226 | 130 | 50: 17, 55: 9, 60: 11, 65: 54, 70: 39 |
| DF4_8_AggInd2017Lden | `PL_a_AggInd2017_Lden_Polygon` (+ `_Line`) | 20 497 | 871 | 55: 345, 60: 304, 65: 183, 70: 32, 75: 7 |
| DF4_8_AggInd2017Lnight | `PL_a_AggInd2017_Lnight_Polygon` (+ `_Line`) | 11 684 | 423 | 50: 200, 55: 143, 60: 54, 65: 22, 70: 4 |

- **Pola** (DescribeFeatureType, kolejność różni się między warstwami): `geom` (MultiSurface), `objectid` (int), `ctryid` ('PL'), `agglomerat` ('Warszawa'), `db_low` (int), `db_high` (int), `unaggid` ('PL_a_ag1465').
- Filtr przestrzenny bbox Warszawy daje praktycznie tę samą liczbę obiektów (road Lden: 18 203).
- Najwyższe pasmo ma `db_high = 79` (Lden ≥75) i `db_high = 74` (Lnight ≥70) **[Z]**. Semantycznie to pasmo otwarte, więc `band_max_db = NULL` **[W]**.
- Warstwy `_line` / `_Line` nie mają obiektów w bbox Warszawy.
- Geometria jest silnie rozdrobniona (tysiące małych poligonów), więc potrzebny jest dissolve.
- **[W]** Nie zweryfikowano, czy „Rail 2017” zawiera tramwaj. Miejski portal ma osobną warstwę „Tramwajowy LDWN 2017”.
- Dodatkowo w tym samym GeoServerze jest `DF1_5_AggAreas2020:PL_a_Agg_Areas_2020`, czyli granice aglomeracji z rundy 2022 **[Z]**. Dla Warszawy: `unaggid='PL_a_ag1465'`, `teryt='1465'`, `size=517.24`, `inhabitant=1777972`.
- **Brak usług dla rundy 2022 na ekoportalu**: `DF4_8_AggRoad2022Lden` i warianty zwracają 404, a globalne GetCapabilities ma tylko 2017 **[Z]**.

---

## 5. API GIOŚ – moduł HAŁAS

Sprawdzono 2026-10-17.

- Portal https://dane.gios.gov.pl/ (SPA). Konfiguracja `https://dane.gios.gov.pl/config.js` wskazuje `OPENAPI_SERVER_URL: https://dane.gios.gov.pl/api`.
- **Specyfikacja OpenAPI**: https://dane.gios.gov.pl/apispec/openapi-halas.yaml **[Z]**
  - „HALAS API – … dane ze strategicznych map hałasu, programów ochrony środowiska przed hałasem i pomiarów hałasu”.
  - **license: CC BY 4.0**.
  - Serwer: `https://dane.gios.gov.pl/api/halas`.
  - Stronicowanie: `numerStrony` (od 0), `liczbaElementowNaStronie` (max 50).
- Strona HTML portalu ma skrypt anty-bot. **Wywołania `/api/halas/...` zwracają JSON bezpośrednio**, bez niego.

### 5.1 Endpointy

| endpoint | wymagane parametry | co daje | przydatność dla Warszawy |
|---|---|---|---|
| `/v1/zasiegi-halasu` | `wojewodztwo`, `rundaMapowania`, `zrodloHalasu`; opcjonalnie `wskaznik` (`LDWN`/`LN`), `id` | **GeoJSON FeatureCollection z konturami** | **TAK** – kontury SMH 2022 (patrz niżej) |
| `/v1/informacja-o-powierzchni-terenu` | `wojewodztwo`, `rundaMapowania`, `zrodloHalasu` | per **powiat**: `wskaznik`, `przedzial`, `narazonyObszar` [km²], `narazoneBudynkiMieszkalne`, `narazonaLudnosc`, `narazoneBudynkiSzpitalne`, `narazoneBudynkiEdukacyjne` | **TAK** – `powiat='Warszawa'` = całe miasto (bez dzielnic) |
| `/v1/liczba-ludnosci-eksponowanej-na-halas` | `wojewodztwo`, `rundaMapowania` | POŚ: liczba narażonych Ldwn>55 / Ln>50, HA/HSD | Tylko województwo |
| `/v1/dzialania-w-zakresie-ochrony-srodowiska-przed-halasem`, `/v1/srodki-ochrony-przed-halasem`, `/v1/koszty-dzialan-w-programach-ochrony-srodowiska` | `wojewodztwo`, `rundaMapowania` | Opisy działań i kosztów | Tylko kontekst |
| `/v1/pomiar-halasu-w-srodowisku` | `kategoria` (Droga/Lotnisko/Przemysł/Kolej), `wojewodztwo`, `dataOd`, `dataDo`; opcjonalnie `powiat`, `gmina` | Pomiary punktowe (`wynikPomiaru`, `pora`, `coordWgs84X/Y`) | Punktowe, poza zakresem speca |
| `/v1/jednostka-odpowiedzialna`, `/v1/dopuszczalne-poziomy-halasu` | – | Słowniki | – |

Wartości `zrodloHalasu` dla zasięgów: „Hałas drogowy wewnątrz aglomeracji”, „Hałas kolejowy wewnątrz aglomeracji”, „Hałas lotniczy wewnątrz aglomeracji”, „Hałas przemysłowy wewnątrz aglomeracji”, „Główne drogi z uwzględnieniem aglomeracji”, „Główne linie kolejowe z uwzględnieniem aglomeracji”, „Główne porty lotnicze z uwzględnieniem aglomeracji”. **Brak tramwaju.**

### 5.2 `/v1/zasiegi-halasu` – kontury 2022 [Z]

Przykład wywołania:
`GET https://dane.gios.gov.pl/api/halas/v1/zasiegi-halasu?wojewodztwo=MAZOWIECKIE&rundaMapowania=4 Runda Mapowania&zrodloHalasu=Hałas drogowy wewnątrz aglomeracji&wskaznik=LDWN&liczbaElementowNaStronie=1&numerStrony=0`

Przykładowa odpowiedź (skrót):
```json
{"liczbaRekordow":1,"type":"FeatureCollection",
 "features":[{"type":"Feature","geometry":{"type":"MultiPolygon","coordinates":[[[[645698.92,488210.32],…]]]},
   "properties":{"id":68795,"rundaMapowania":"4 Runda Mapowania","wojewodztwo":"MAZOWIECKIE",
                 "zrodloHalasu":"Hałas drogowy wewnątrz aglomeracji","przedzial":"Lden7074","wskaznik":"LDWN"}}],
 "wynik":{"status":"SUKCES",…}}
```

- **CRS:** GeoJSON nie deklaruje CRS. Współrzędne to EPSG:2180 w kolejności E,N. Sprawdzone przez reprojekcję: punkt (645 699, 488 210) → 21,135°E, 52,241°N, a obiekt leży w 100% w granicach Warszawy.
- **Identyczność z EEA:** obiekt GIOŚ `id=68795` (`Lden7074`) po transformacji 2180 → 3035 ma **IoU = 1,0** z obiektem EEA `PL.gpkg` `roadsInAgglomeration_Lden` (`id_0=298`). Pole: 0,5291 km² w obu.
- **Rozmiar:** road LDWN dla województwa mazowieckiego to **120 obiektów** (Warszawa, Radom, Płock). Pojedynczy obiekt waży 0,1–2,6 MB. W odpowiedziach nie ma pola z nazwą aglomeracji, więc trzeba przyciąć do granicy Warszawy.
- **Pasma** (`przedzial`):
  - Lden: `Lden5559`, `Lden6064`, `Lden6569`, `Lden7074`, `Lden7579`, `LdenGreaterThan80`,
  - Lnight: `Lnight5054`, `Lnight5559`, `Lnight6064`, `Lnight6569`, `Lnight7074`, `LnightGreaterThan75`,
  - czyli o jedno pasmo więcej na górze niż w EEA.
- Wszystkie 7 źródeł × 2 wskaźniki zwracają obiekty dla 4. rundy. Rundy 3 i 5 zwracają 0 obiektów.
- **[W]** „Hałas kolejowy wewnątrz aglomeracji” zawiera tramwaj, tak jak EEA. Geometria i liczby ludności są identyczne z EEA (np. 38 500).

### 5.3 `/v1/informacja-o-powierzchni-terenu` – Warszawa, 4. runda [Z]

| źródło | wskaźnik | 55–59 / 50–54 | 60–64 / 55–59 | 65–69 / 60–64 | 70–74 / 65–69 | 75–79 / 70–74 | ≥80 / ≥75 |
|---|---|---|---|---|---|---|---|
| drogowy | LDWN: ludność | 271 800 | 172 600 | 89 000 | 27 300 | 1 600 | 0 |
| drogowy | LDWN: pow. km² | 80,93 | 62,19 | 43,21 | 23,91 | 11,51 | 5,77 |
| drogowy | LN: ludność | 192 200 | 108 800 | 38 200 | 3 900 | 0 | 0 |
| drogowy | LN: pow. km² | 69,39 | 49,37 | 28,32 | 13,79 | 5,55 | 1,94 |
| kolejowy | LDWN: ludność / km² | 38 500 / 18,05 | 24 100 / 12,31 | 7 200 / 6,88 | 0 / 0,93 | 0 / 0,01 | 0 / 0,0006 |
| kolejowy | LN: ludność / km² | 27 900 / 14,60 | 9 800 / 8,16 | 0 / 2,25 | 0 / 0,20 | 0 / 0,001 | 0 / 0,0002 |
| lotniczy | LDWN: ludność / km² | 20 400 / 12,53 | 1 300 / 5,95 | 0 / 2,61 | 0 / 1,32 | 0 / 0,71 | 0 / 0,29 |
| lotniczy | LN: ludność / km² | 4 700 / 9,76 | 300 / 4,87 | 0 / 2,12 | 0 / 1,17 | 0 / 0,82 | 0 / 0,21 |
| przemysłowy | LDWN: km² (ludność 0) | 0,50 | 0,068 | 0,016 | 0,009 | 0,003 | – |

- Liczby ludności są **identyczne z xlsx EEA**.
- **Powierzchnie km² per pasmo** są gotowym testem walidacyjnym dla `area_km2` liczonej z konturów. Spec tego nie przewidywał.
- **Rozbicia na dzielnice nie ma** w żadnym endpoincie.

---

## 6. Granice dzielnic

Sprawdzono 2026-10-17.

**Rekomendowane: PRG (GUGiK), WFS** **[Z]**
- Endpoint: https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=2.0.0
- „Usługa pobierania Państwowego Rejestru Granic – jednostki administracyjne”, MapServer, `Fees: Brak opłat`.
- Warstwy `ms:A00…A06`. Dzielnice Warszawy to **`ms:A05_Granice_jednostek_ewidencyjnych`**.
- DefaultCRS `urn:ogc:def:crs:EPSG::2180`, kolejność osi **N,E** w `gml:posList`. Przy parsowaniu trzeba zamienić osie.
- Zapytanie:
  `…&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=ms:A05_Granice_jednostek_ewidencyjnych&BBOX=470900,626700,502900,655200,urn:ogc:def:crs:EPSG::2180`
  zwraca 46 obiektów, 1,65 MB GML. Po filtrze **`JPT_KOD_JE LIKE '1465%'`** zostaje **dokładnie 18 dzielnic**: `146502_8` (Bemowo) … `146519_8` (Żoliborz).
- Pola:
  - główne: `JPT_KOD_JE`, `JPT_NAZWA_` (np. „Bemowo - dzielnica”), `JPT_POWIER` (**hektary**), `JPT_SJR_KO` ('JEW'),
  - pozostałe: `WAZNY_OD`, `JPT_ID`, `IIP_IDENTY`, `WERSJA_OD` i inne.
- **Kontrola:**
  - suma `JPT_POWIER` = 51 720 ha = **517,20 km²**,
  - pole planarne w EPSG:2180 = **516,72 km²**,
  - wszystkie 18 geometrii poprawne (`is_valid`).
- Licencja (https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic-prg/): *„Dane PRG są dostępne bezpłatnie i do dowolnego wykorzystania.”*
- Paczki krajowe są za duże na ten etap: `https://opendata.geoportal.gov.pl/prg/granice/00_jednostki_administracyjne.zip` (SHP, 377 MB) oraz `…_gml.zip` (258 MB). Lepiej użyć WFS.
- Mapowanie na BDL: TERYT `1465xx8` ↔ id BDL `0714128650x8`, np. `146502_8` ↔ `071412865028`.

**Portal otwartych danych m.st. Warszawy** nie ma warstwy dzielnic (sekcja 3) **[Z]**. Miejski WMS ma `GEODEZJA_DZIELNICE`, ale tylko jako obraz.

---

## 7. Ludność

### 7.1 GUS – siatka 1 km, NSP 2021 (rezydenci)

Sprawdzono 2026-10-17.

- Strona INSPIRE GUS: https://portal.geo.stat.gov.pl/pl/inspire/
- ATOM: https://geo.stat.gov.pl/atom-web/atom/PD → zbiór `PD.GRID.2021`, „Rozmieszczenie ludności – demografia 2021r. (siatka, rezydenci)”, aktualizacja 2022-12-23 **[Z]**.
- Metadane: https://geo.stat.gov.pl/geonetwork/srv/pol/csw?SERVICE=CSW&REQUEST=GetRecordById&VERSION=2.0.2&OUTPUTSCHEMA=http://www.isotc211.org/2005/gmd&ELEMENTSETNAME=full&ID=1b926a1b-8449-44c9-beb6-f7e188e87279
- **Pobranie [Z]**: `https://geo.stat.gov.pl/atom-web/download/?fileId=2795b7ed9098f86ab761352519ba1d85&name=GRID_NSP2021_RES.zip`
  - SHP, 23,5 MB zip, cały kraj, 315 857 rekordów.
  - Wersja GML w EPSG:3035 jest pocięta na kafle `StatisticalDistribution_GRID_N..E..zip`.
- **CRS [Z]:** plik `.prj` = „ETRS_1989_Poland_CS92”, czyli EPSG:2180, kodowanie UTF-8.
  - Komórki to **kwadraty siatki LAEA (EPSG:3035) 1 km, przeliczone do 2180**: `CODE='CRS3035RES1000mN…E…'`, pole ok. 1 001 019 m².
  - Siatka **nie jest wyrównana** do siatki 500 m w 2180. Komórki przy granicy kraju są przycięte.
- **Pola [Z]:** `CODE`, `PL_CODE`, **`RES`** (rezydenci ogółem), `RES_MALE`, `RES_FEM`, `RES_0_14`, `RES_15_64`, `RES_65_`, `SHAPE_Leng`, `SHAPE_Area`.
- Definicja (ATOM): „Rezydenci … to ogół osób mieszkających/przebywających na danym terenie przez okres co najmniej 12 miesięcy.”
- **Kontrola dla Warszawy [Z]:** 601 komórek przecina granicę miasta.
  - `RES` ważone powierzchnią = **1 861 159**,
  - metoda centroidów = 1 865 105.
- Licencja (ATOM `rights`): *„Brak warunków dostępu i użytkowania; Brak ograniczeń w publicznym dostępie”*.

### 7.2 GUS BDL – ludność dzielnic (kontrola)

Sprawdzono 2026-10-17.

- API: https://bdl.stat.gov.pl/api/v1. Licencja: *„Creative Commons by 4.0”* (https://api.stat.gov.pl/Home/BdlApi). Limity zapytań; anonimowo nagłówek `X-Rate-Limit-*`, klucz w `X-ClientId` **[Z]**.
- Zmienna **`72305`**: temat `P2137` „Ludność wg grup wieku i płci” (dział G7 „Stan ludności”), `n1='ogółem'`, `n2='ogółem'`, jednostka „osoba”, poziom 6, lata 1995–2025 **[Z]**.
  - **[W]** Stan na 31 XII wg faktycznego miejsca zamieszkania (standard BDL). Metadanych zmiennej nie sprawdzałem.
- Jednostki: powiat `071412865000`. Dzielnice (poziom 6, rodzaj 8) mają id od `071412865028` (Bemowo) do `071412865198` (Żoliborz). `071412865011` to „M.st.Warszawa od 2002”.
- Wywołanie:
  `GET https://bdl.stat.gov.pl/api/v1/data/by-variable/72305?unit-parent-id=071412865000&unit-level=6&year=2021&format=json&page-size=50`
- Wynik 2021 **[Z]**: suma 18 dzielnic = **1 863 056**.

  | dzielnica | ludność 2021 | dzielnica | ludność 2021 |
  |---|---|---|---|
  | Bemowo | 129 169 | Śródmieście | 101 979 |
  | Białołęka | 153 100 | Targówek | 124 240 |
  | Bielany | 133 478 | Ursus | 67 373 |
  | Mokotów | 225 916 | Ursynów | 151 432 |
  | Ochota | 80 988 | Wawer | 86 399 |
  | Praga-Południe | 186 834 | Wesoła | 26 380 |
  | Praga-Północ | 60 855 | Wilanów | 51 172 |
  | Rembertów | 24 670 | Włochy | 49 280 |
  |  |  | Wola | 151 158 |
  |  |  | Żoliborz | 58 633 |

  Dla porównania 2022 (powiat): 1 861 975.
- Temat `P3991` (rezydenci) jest dostępny tylko na poziomie 3, nie dla dzielnic.

**Porównanie baz ludności [Z]**

| baza | ludność |
|---|---|
| siatka NSP 2021 (`RES`) | 1 861 159 |
| BDL 2021 | 1 863 056 (różnica 0,1%) |
| SMH 2022 / xlsx EEA | 1 663 587–1 663 588 (−10,6%) |
| DF1_5 AggAreas2020 | 1 777 972 |

Rekomendacja: baza = siatka NSP 2021, kontrola = BDL. Różnicę względem SMH opisać w README.

---

## 8. BDOT10k – budynki (BUBD), powiat 1465

Sprawdzono 2026-10-17.

**Pobranie [Z]** – HEAD wszystkich wariantów, pobrany wariant GPKG:

| wariant | URL | rozmiar |
|---|---|---|
| **GPKG** (pobrany) | `https://opendata.geoportal.gov.pl/bdot10k/schemat2021/GPKG/14/1465_GPKG.zip` | **88,2 MB** |
| SHP | `https://opendata.geoportal.gov.pl/bdot10k/schemat2021/SHP/14/1465_SHP.zip` | 81,9 MB |
| GML | `https://opendata.geoportal.gov.pl/bdot10k/schemat2021/14/1465_GML.zip` | 89,0 MB |
| GML, stary model | `https://opendata.geoportal.gov.pl/bdot10k/14/1465_GML.zip` | 90,6 MB |

**Warstwa budynków [Z]**
- Plik w zipie: `PL.PZGiK.330.BDOT10k.1465__OT_BUBD_A.gpkg` (103,9 MB po rozpakowaniu, data pliku 2026-10-03).
- Tabela `OT_BUBD_A`, geometria `geometria` typu POLYGON, **EPSG:2180**, **167 099 budynków**.
- Pola: `id`, `TERYT` ('1465'), `LOKALNYID`, `PRZESTRZENNAZW`, `WERSJA`, `POCZATEKWERSJIOBIEKTU`, `OZNACZENIEZMIANY`, `ZRODLODANYCHGEOMETRYCZNYCH`, `KATEGORIAISTNIENIA`, `UWAGI`, `INFORMACJADODATKOWA`, `KODKARTO10K`, `SKROTKARTOGRAFICZNY`, `KODKST`, `FUNKCJAOGOLNABUDYNKU`, `PRZEWAZAJACAFUNKCJABUDYNKU`, `LICZBAKONDYGNACJI` (REAL), `NAZWA`, `FSBUD`, `IDEGIB`.

**Funkcja mieszkalna [Z]**
- Filtr: `KODKST = '110'` ⇔ `FUNKCJAOGOLNABUDYNKU = 'budynki mieszkalne'` (111 998 budynków).
- **Uwaga:** `LIKE '%mieszkal%'` łapie też „pozostałe budynki **nie**mieszkalne” (2 147).
- Pozostałe kody KST w danych:

  | kod | znaczenie |
  |---|---|
  | 101 | przemysłowe |
  | 102 | transportu i łączności |
  | 103 | handlowo-usługowe |
  | 104 | zbiorniki, silosy i magazynowe |
  | 105 | biurowe |
  | 106 | szpitali |
  | 107 | oświaty, nauki i kultury, sportowe |
  | 108 | produkcyjne, usługowe i gospodarcze dla rolnictwa |
  | 109 | pozostałe niemieszkalne |

- `PRZEWAZAJACAFUNKCJABUDYNKU` w grupie 110:
  - `budynek jednorodzinny` 87 638,
  - `budynek wielorodzinny` 23 458,
  - zamieszkanie zbiorowe, m.in. `dom opieki społecznej` 98, `dom studencki` 90, `internat lub bursa szkolna` 29, `dom dziecka` 20, `koszary` 121, `klasztor` 85, `zakład karny` 6,
  - inne, m.in. `dom parafialny` 183, `dom letniskowy` 153.
- `FSBUD` to lista funkcji szczegółowych rozdzielona `|`, np. `budynek wielorodzinny|obiekt handlowo-usługowy` (1 444). Tylko 1 budynek spoza KST 110 ma w `FSBUD` funkcję mieszkalną.

**Kondygnacje [Z]**
- `LICZBAKONDYGNACJI`: zakres 1–54, średnio 2,35.
- 283 wartości NULL w całej warstwie, **0 NULL** wśród eksploatowanych budynków KST 110 (110 377).

**Status [Z]**
- `KATEGORIAISTNIENIA`: `eksploatowany` 164 826, `w budowie` 1 245, `nieczynny` 629, `zniszczony` 399.
- Do rozkładu brać tylko `eksploatowany`.

**Aktualność [Z]**
- `WERSJA` od 2023-12-31 do 2025-06-01.
- To nowszy stan niż rok danych hałasu (2021) i NSP 2021. Opisać w README.

**Licencja [Z]** (https://www.geoportal.gov.pl/pl/dane/baza-danych-obiektow-topograficznych-bdot10k/): *„Baza BDOT10k jest dostępna bezpłatnie i możliwa do dowolnego wykorzystania.”*

---

## Rekomendacja

### Kontury hałasu: API GIOŚ HAŁAS jako źródło główne, EEA `PL.gpkg` jako kontrola krzyżowa

Dlaczego GIOŚ:
1. To **te same dane SMH 2022** co EEA. Geometria jest identyczna (IoU = 1,0 na sprawdzonym obiekcie), a liczby ludności identyczne z xlsx EEA.
2. **Licencja CC BY 4.0** zamiast „research and non-profit” w EEA.
3. **Natywny EPSG:2180**, czyli zgodny z CRS obliczeń w specu, bez reprojekcji.
4. **Pełniejsze pasma na górze skali**: Lden 75–79 i ≥80, Lnight 70–74 i ≥75. Pozwala to zmapować je na `band_min_db` / `band_max_db` bez utraty informacji. Dla zgodności z EEA można je scalić do ≥75 / ≥70.
5. Mały, stronicowany transfer zamiast pliku 9,3 GB.

Pole `origin` w schemacie 5.1 nie ma wartości dla GIOŚ. Proponuję dodać `gios_halas_api_smh2022` albo świadomie oznaczyć `eea_end_2022` z adnotacją, że geometria jest identyczna.

EEA jako fallback i kontrola:
- odczyt warstw Warszawy przez GDAL `/vsicurl/` z filtrem przestrzennym (ok. 75 MB geometrii),
- filtr Warszawy: `sourceIdentifier LIKE '%WARSZ.gpkg'` plus przycięcie do granicy miasta.

### Mapowanie źródeł dla Warszawy

| `source` w schemacie | GIOŚ (`zrodloHalasu`) | EEA (warstwa) |
|---|---|---|
| `road` | „Hałas drogowy wewnątrz aglomeracji” | `roadsInAgglomeration` |
| `rail` | „Hałas kolejowy wewnątrz aglomeracji” | `railwaysInAgglomeration` |
| `air` | „Hałas lotniczy wewnątrz aglomeracji” | `airportsInAgglomeration` |
| `industry` | „Hałas przemysłowy wewnątrz aglomeracji” | `industryInAgglomeration` |

- `rail` = **kolej + tramwaj**.
- **Nie dodawać** warstw „Główne … z uwzględnieniem aglomeracji” ani `major*IncludingAgglomeration`. Dla Warszawy dublują warstwy aglomeracyjne, a major rail obejmuje też korytarze tramwajowe.

### Pozostałe wejścia

| wejście | źródło |
|---|---|
| Walidacja | xlsx EEA (Nov 2024, CC BY 4.0) – ludność per pasmo; GIOŚ `/v1/informacja-o-powierzchni-terenu` – dodatkowo **powierzchnie km² per pasmo** |
| Runda 2017 | WFS ekoportal (8 usług), `agglomerat='Warszawa'`, `data_year=2016` |
| Dzielnice | PRG WFS `ms:A05_Granice_jednostek_ewidencyjnych`, `JPT_KOD_JE LIKE '1465%'` |
| Ludność | siatka GUS `GRID_NSP2021_RES` (`RES`); kontrola BDL `72305` |
| Budynki | BDOT10k `OT_BUBD_A`: `KODKST='110'`, `KATEGORIAISTNIENIA='eksploatowany'`, waga = pow. × `LICZBAKONDYGNACJI` |

### Blokery i ryzyka

1. **Brak osobnego tramwaju w danych wektorowych.** Kategorii `tram` ze schematu 5.1 nie da się wypełnić. Tramwaj jest wliczony w `rail`. Osobna warstwa istnieje tylko jako obraz WMS miasta (`HALAS_TRAMWAJOWY_*_2022`). Jedyna droga do wektora to wniosek o udostępnienie informacji o środowisku do BOŚ UM. Do decyzji: usunąć `tram` ze schematu albo opisać `rail` jako „kolej + tramwaj”.
2. **Kontrola DoD vs xlsx EEA (cel < 20%).** EEA liczyło narażonych na bazie 1 663 587 mieszkańców, a siatka NSP 2021 daje ok. 1,86 mln (+12%). Sama różnica bazy zużywa ponad połowę tolerancji. Warto dodatkowo policzyć wariant przeskalowany do 1 663 588.
3. **Licencja EEA** (non-profit, INSPIRE 13(1)(e)) – istotna, jeśli wynik ma być redystrybuowany. GIOŚ (CC BY 4.0) usuwa ten problem.
4. **Rozdrobnienie geometrii.** EEA i GIOŚ dzielą kontury na kafle ok. 5 km, a INSPIRE 2017 na tysiące małych poligonów. Potrzebny dissolve per pasmo i `make_valid` (w EEA są obiekty z `geometry_error_description` ≠ 'Valid').
5. **Siatka GUS** jest wyrównana do LAEA, a nie do siatki 500 m w 2180. Rozkład przez budynki rozwiązuje to, ale komórek nie da się zagnieździć 1:1.
6. **Różne lata danych.** BDOT10k ma stan 2024–2025, hałas 2021, ludność 2021. Do README.
7. **Rozbieżności z metadanymi EEA.** Serwis ESRI REST z metadanych EEA nie zawiera konturów, a GDB deklarowany w metadanych nie istnieje w folderze. Nie opierać pipeline'u na tych linkach.

---

### Uwagi o metodzie weryfikacji

- Żadnego pliku powyżej 100 MB nie pobrano w całości. Największe pobrane pliki:
  - BDOT10k GPKG zip (88 MB),
  - siatka GUS (23,5 MB),
  - xlsx EEA (0,4 MB).
- `PL.gpkg` (9,3 GB) odczytano wyłącznie przez HTTP Range (SQLite VFS). Łącznie we wszystkich zapytaniach przesłano ok. 200–250 MB zakresów, głównie geometrie małych obiektów przy próbkowaniu wartości `category` / `sourceIdentifier`.
- Pliki robocze leżą poza repo, w katalogu scratchpad sesji (`…/scratchpad/research/`), i są tymczasowe.
