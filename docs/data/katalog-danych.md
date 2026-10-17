# Katalog danych

Generowane z [`data/catalog.json`](../../data/catalog.json) poleceniem `python3 data/scripts/data_catalog.py --render`. **Nie edytuj ręcznie**: zmieniaj katalog, a `python3 data/scripts/validate_data.py` sprawdzi, czy dane i ten plik się z nim zgadzają.

## Zasady

- Dozwolone rodzaje źródeł: city, public, open.
- Dozwolone statusy metryk: REAL, DERIVED (REAL = wprost ze zbioru, DERIVED = jawny wzór na zbiorach).
- Zakazane pola: scrapedAt, rentCount, buyCount; zakazane źródła: otodom, adresowo, domiporta, sonarhome, znajdznajem, znajdź najem, morizon, domus global, domusglobal.
- Brak danych to `null` z powodem, nigdy wartość zastępcza.

## Źródła

| id | Nazwa | Rodzaj | Licencja | Adres |
|---|---|---|---|---|
| um_portal | Portal otwartych danych m.st. Warszawy (API) | city | CC BY — Urząd m.st. Warszawy | https://dane.um.warszawa.pl |
| um_wfs | Usługi mapowe m.st. Warszawy (WFS) | city | Ponowne wykorzystanie bezpłatne; podać źródło: Urząd m.st. Warszawy | https://wfs.um.warszawa.pl/serwis |
| um_rcn | Rejestr Cen Nieruchomości m.st. Warszawy (paczki GML) | city | Bezpłatny od 13.02.2026 (art. 40a ust. 2 pkt 1 lit. k PGiK); podać źródło | https://architektura.um.warszawa.pl/udostepniane-dane-rcn1 |
| gios | GIOŚ HAŁAS API (strategiczne mapy hałasu) | public | CC BY 4.0 — GIOŚ | https://dane.gios.gov.pl/api/halas/v1/zasiegi-halasu |
| ztm_gtfs | Rozkład jazdy ZTM Warszawa w formacie GTFS (mirror M. Kuranowskiego) | public | Dane ZTM Warszawa; podać ZTM i autora konwersji | https://mkuran.pl/gtfs/warsaw.zip |
| osm | OpenStreetMap (Overpass API) | open | ODbL 1.0 — © współtwórcy OpenStreetMap | https://www.openstreetmap.org/copyright |
| osm_geofabrik | OpenStreetMap, wyciąg Geofabrik mazowieckie-latest.osm.pbf | open | ODbL 1.0 — © współtwórcy OpenStreetMap | https://download.geofabrik.de/europe/poland/mazowieckie-latest.osm.pbf |
| osrm | OSRM FOSSGIS (routing.openstreetmap.de, profile foot i bike) | open | ODbL 1.0 — © współtwórcy OpenStreetMap (dane drogowe) | https://routing.openstreetmap.de |
| nominatim | Nominatim (geokoder OpenStreetMap) | open | ODbL 1.0 — © współtwórcy OpenStreetMap | https://nominatim.openstreetmap.org |
| wikimedia | Wikimedia Commons (zdjęcia osiedli) | open | Licencje CC wg pliku; autor i licencja w application/public/osiedla/credits.json | https://commons.wikimedia.org |

## Zbiory danych

| id | Zbiór | Źródło | Skrypt | Stan danych | Uwagi |
|---|---|---|---|---|---|
| um_stops | Lokalizacja przystanków komunikacji miejskiej | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_przystanki.py | pobrano 2026-10-17 | – |
| um_toilets | Toalety publiczne | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_toalety.py | pobrano 2026-10-17 | – |
| um_aed | Lokalizacja defibrylatorów AED | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_aed.py | pobrano 2026-10-17 | – |
| um_pitches | Otwarte boiska szkolne | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_boiska.py | pobrano 2026-10-17 | Brak współrzędnych w źródle; geokodowane miejskimi punktami adresowymi (wfs_address_points). |
| um_sport_classes | Zajęcia sportowe | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_zajecia_sportowe.py | pobrano 2026-10-17 | Geokodowane adresem w dzielnicy zajęć (wfs_address_points); zajęcia z samą dzielnicą są pomijane. |
| um_air_quality | Monitoring jakości powietrza | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_powietrze.py | pomiar 2026-10-17T16:30:00 | Stan bieżący (ostatnia godzina), bez historii. |
| um_events | Kalendarz wydarzeń | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_wydarzenia.py | okno 2026-10-17 – 2026-11-16 | – |
| um_road_works | Utrudnienia w ruchu drogowym | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_utrudnienia.py | stan 2026-10-17 | Roboty i zdarzenia drogowe, nie natężenie ruchu. |
| um_bo | Budżet obywatelski 2019–2027 | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_budzet_obywatelski.py | edycje 2019–2027 | Tylko projekty w realizacji i zrealizowane. Surowe dane zawierają nazwiska autorów (RODO): w repo tylko oczyszczony wynik. |
| um_tourist_routes | Trasy turystyczne | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_trasy_turystyczne.py | pobrano 2026-10-17 | – |
| um_ecopoints | Eko-punkty | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_ekopunkty.py | pobrano 2026-10-17 | – |
| um_parking | Wolne miejsca parkingowe | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_parkingi.py | pobrano 2026-10-17 | – |
| um_weather | Pogoda (stacje ZOM) | Portal otwartych danych m.st. Warszawy (API) | data/scripts/etl_pogoda.py | pobrano 2026-10-17 | – |
| wfs_districts | Granice dzielnic | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/fetch_district_boundaries.py | pobrano 2026-10-17 | – |
| wfs_msi | Obszary Miejskiego Systemu Informacji (osiedla) | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/fetch_osiedla_boundaries.py | aktualność maj 2026 | – |
| wfs_libraries | Biblioteki | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| wfs_utw | Uniwersytety trzeciego wieku | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| wfs_metro_entrances | Wejścia do metra | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| wfs_address_points | Punkty adresowe | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/geocode_address.py | pobrano 2026-10-17 | Geokodowanie adresów i punkt odniesienia osiedla. |
| wfs_buildings | Rejestr budynków (EGiB) | Usługi mapowe m.st. Warszawy (WFS) | data/scripts/build_kwartal_metrics.py | pobrano 2026-10-17 | Brak roku budowy w rejestrze. |
| rcn_city | Transakcje lokali mieszkalnych (RCN) | Rejestr Cen Nieruchomości m.st. Warszawy (paczki GML) | data/scripts/rcn/fetch_rcn.py (filtrowanie), build_kwartal_metrics.py i build_featured_content.py (mediany) | akty 2023 – IV 2026 (ok. 6 miesięcy opóźnienia) | Filtry: lokal mieszkalny, nieruchomość lokalowa, udział 1/1, sprzedaż wolnorynkowa, pow. >= 15 m2, 3-60 tys. zł/m2. Te same rekordy co GUGiK WFS ms:lokale, ale świeższe i dla całego miasta w jednym pliku. |
| gios_noise_lden | Zasięgi hałasu Lden (SMH 2022, 4. runda), drogi i kolej z tramwajem | GIOŚ HAŁAS API (strategiczne mapy hałasu) | data/scripts/noise/fetch_gios_noise.py | dane 2021 (runda 2022) | Model, nie pomiar; wysokość 4 m; poniżej 55 dB brak konturów; 2021 to rok pandemii; brak warstw lotniska i przemysłu w użyciu. |
| gtfs_warsaw | Rozkład jazdy ZTM (GTFS) | Rozkład jazdy ZTM Warszawa w formacie GTFS (mirror M. Kuranowskiego) | data/scripts/gtfs_feed.py | feed z 2026-10-17, dzień roboczy 2026-10-19 | – |
| osm_kindergarten | Przedszkola | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_school_primary | Szkoły podstawowe | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_school_secondary | Szkoły średnie | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_university | Uczelnie | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_clinic | Przychodnie i gabinety lekarskie | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | Miejska warstwa jest z 2017 r. |
| osm_pharmacy | Apteki | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | Miejska warstwa jest z 2017 r. |
| osm_supermarket | Supermarkety | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_playground | Place zabaw | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_parks | Parki i lasy | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_gastronomy | Gastronomia | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_tram_stops | Przystanki tramwajowe | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_planned_rail | Planowane linie metra i tramwaju | OpenStreetMap (Overpass API) | data/scripts/siatka (uv run siatka run) | pobrano 2026-10-17 | – |
| osm_streets | Sieć ulic, kolej i rzeki (do wyznaczenia kwartałów) | OpenStreetMap (Overpass API) | data/scripts/fetch_osiedla_fine.py | pobrano 2026-10-17 | – |
| osm_3d | Budynki, drogi, zieleń i woda dla 3 osiedli (widok 3D) | OpenStreetMap, wyciąg Geofabrik mazowieckie-latest.osm.pbf | data/scripts/osm3d/extract_osm.py | wyciąg z 2026-10-17 | – |
| osrm_routes | Trasy piesze i rowerowe dla wyróżnionych osiedli | OSRM FOSSGIS (routing.openstreetmap.de, profile foot i bike) | data/scripts/build_featured_content.py | zapytania 2026-10-17 | – |
| nominatim_places | Nazwy i adresy miejsc wyróżnionych osiedli | Nominatim (geokoder OpenStreetMap) | data/scripts/build_featured_content.py | zapytania 2026-10-17 | – |
| commons_photos | Zdjęcia wyróżnionych osiedli | Wikimedia Commons (zdjęcia osiedli) | ręcznie, metadane w application/public/osiedla/credits.json | pobrano 2026-10-17 | – |

## Metody

| id | Definicja |
|---|---|
| count_in | liczba obiektów wewnątrz granicy osiedla (MSI) |
| count_1km | liczba obiektów w promieniu 1 km od punktu odniesienia osiedla (punkt adresowy najbliższy średniej wszystkich punktów adresowych osiedla) |
| sum_1km | suma wartości obiektów w promieniu 1 km od punktu odniesienia |
| sum_in | suma wartości obiektów wewnątrz granicy osiedla |
| unique_1km | liczba unikalnych wartości w promieniu 1 km od punktu odniesienia |
| nearest_m | odległość w linii prostej od punktu odniesienia do najbliższego obiektu (m) |
| area_share | udział powierzchni osiedla (%) |
| area_share_1km | udział powierzchni koła o promieniu 1 km wokół punktu odniesienia (%) |
| nearest_value | wartość z najbliższego czujnika |
| median_cells | mediana z komórek 200 m, których środek leży w osiedlu |
| percentile_rank | ranga percentylowa (0–100) wartości wśród 143 osiedli (albo punktów heatmapy), kierunek wg higher_is_better |
| weighted_mean | średnia ważona składowych z wagami podanymi w definicji |
| template | stały szablon zdań wypełniany liczbami z metryk (bez ręcznie pisanych treści) |
| kwartal_field | wartość liczona dla kwartału od jego punktu odniesienia (środek ciężkości albo punkt na powierzchni) |
| gtfs_routing | router na rozkładzie GTFS: najpóźniejszy wyjazd z komórki pozwalający dojechać na termin; czas = termin − wyjazd |
| schedule_slowdown | spowolnienie rozkładowe: 1 − prędkość w danej godzinie / najwyższa godzinowa prędkość odcinka, z rozkładu ZTM |
| median_transactions | mediana ceny za m² z rekordów transakcji po filtrach RCN, w podanym okresie i obszarze |

## Metryki

### Cała Warszawa

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| miasto.cena_rcn_mediana | Mediana ceny transakcyjnej w Warszawie | Mediana ceny brutto lokalu / powierzchnia użytkowa dla wszystkich transakcji lokali mieszkalnych w Warszawie z aktami 2024-01-01 – 2026-08-04, po filtrach RCN (assumptions: rcn_filters). Pokazywana jako porównanie przy cenie osiedla. | zł/m² | median_transactions | rcn_city | DERIVED | RCN ma ok. 6 miesięcy opóźnienia. Wartość w application/src/mock/osiedla.ts (prices.cityBuyPerM2). |

### Osiedla (obszary MSI)

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| osiedle.cena_rcn_mediana | Mediana ceny transakcyjnej w osiedlu | Mediana ceny brutto lokalu / powierzchnia użytkowa dla transakcji lokali mieszkalnych z aktami 2024-01-01 – 2026-08-04, których budynek (albo punkt RCN) leży w obszarze MSI; po filtrach RCN. | zł/m² | median_transactions | rcn_city, wfs_buildings, wfs_msi | DERIVED | Wartości w fine-metrics/index.json (areas.*.msi_price) i w osiedla.ts (prices.buyPerM2) dla wyróżnionych osiedli. |
| osiedle.kindergartens_in | Przedszkola | Liczba przedszkoli (OSM amenity=kindergarten) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_kindergarten, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.kindergartens_1km | Przedszkola | Liczba przedszkoli (OSM amenity=kindergarten) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_kindergarten, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.schools_in | Szkoły podstawowe | Liczba szkół podstawowych (OSM amenity=school; nazwa „podstawow”/„SP <nr>” albo isced:level 1) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_school_primary, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.schools_1km | Szkoły podstawowe | Liczba szkół podstawowych (OSM amenity=school; nazwa „podstawow”/„SP <nr>” albo isced:level 1) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_school_primary, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.high_schools_in | Szkoły średnie | Liczba szkół średnich (OSM amenity=school; nazwa „liceum”, „technikum” albo „LO”) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_school_secondary, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.high_schools_1km | Szkoły średnie | Liczba szkół średnich (OSM amenity=school; nazwa „liceum”, „technikum” albo „LO”) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_school_secondary, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.universities_in | Uczelnie | Liczba uczelni (OSM amenity=university) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_university, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.universities_1km | Uczelnie | Liczba uczelni (OSM amenity=university) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_university, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.clinics_in | Przychodnie i gabinety lekarskie | Liczba przychodni i gabinetów lekarskich (OSM amenity=clinic lub doctors) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_clinic, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.clinics_1km | Przychodnie i gabinety lekarskie | Liczba przychodni i gabinetów lekarskich (OSM amenity=clinic lub doctors) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_clinic, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.pharmacies_in | Apteki | Liczba aptek (OSM amenity=pharmacy) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_pharmacy, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.pharmacies_1km | Apteki | Liczba aptek (OSM amenity=pharmacy) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_pharmacy, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.supermarkets_in | Supermarkety | Liczba supermarketów (OSM shop=supermarket) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_supermarket, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.supermarkets_1km | Supermarkety | Liczba supermarketów (OSM shop=supermarket) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_supermarket, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.gastronomy_in | Gastronomia (restauracje, kawiarnie, bary, puby) | Liczba lokali gastronomicznych (OSM amenity=restaurant, cafe, bar lub pub) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_gastronomy, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.gastronomy_1km | Gastronomia (restauracje, kawiarnie, bary, puby) | Liczba lokali gastronomicznych (OSM amenity=restaurant, cafe, bar lub pub) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_gastronomy, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.bars_pubs_in | Bary i puby | Liczba barów i pubów (OSM amenity=bar lub pub) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_gastronomy, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.bars_pubs_1km | Bary i puby | Liczba barów i pubów (OSM amenity=bar lub pub) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_gastronomy, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.playgrounds_in | Place zabaw | Liczba placów zabaw (OSM leisure=playground) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | osm_playground, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.playgrounds_1km | Place zabaw | Liczba placów zabaw (OSM leisure=playground) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | osm_playground, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.libraries_in | Biblioteki | Liczba bibliotek (WFS miasta, BIBLIOTEKI) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | wfs_libraries, wfs_msi | DERIVED | – |
| osiedle.libraries_1km | Biblioteki | Liczba bibliotek (WFS miasta, BIBLIOTEKI) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | wfs_address_points, wfs_libraries, wfs_msi | DERIVED | – |
| osiedle.utw_in | Uniwersytety trzeciego wieku | Liczba uniwersytetów trzeciego wieku (WFS miasta, UNIWERSYTETY_TRZECIEGO_WIEKU) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | wfs_msi, wfs_utw | DERIVED | – |
| osiedle.utw_1km | Uniwersytety trzeciego wieku | Liczba uniwersytetów trzeciego wieku (WFS miasta, UNIWERSYTETY_TRZECIEGO_WIEKU) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | wfs_address_points, wfs_msi, wfs_utw | DERIVED | – |
| osiedle.events_30d_in | Punkty wydarzeń w ciągu 30 dni | Liczba punktów wydarzeń z kalendarza miasta w oknie 2026-10-17 – 2026-11-16 wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | um_events, wfs_msi | DERIVED | – |
| osiedle.events_30d_1km | Punkty wydarzeń w ciągu 30 dni | Liczba punktów wydarzeń z kalendarza miasta w oknie 2026-10-17 – 2026-11-16 w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | um_events, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.aed_in | Defibrylatory AED | Liczba defibrylatorów AED (portal miasta) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | um_aed, wfs_msi | DERIVED | – |
| osiedle.aed_1km | Defibrylatory AED | Liczba defibrylatorów AED (portal miasta) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | um_aed, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.stops_in | Przystanki (słupki) autobus/tramwaj | Liczba słupków przystankowych autobusów i tramwajów (portal miasta) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | gtfs_warsaw, um_stops, wfs_msi | DERIVED | – |
| osiedle.stops_1km | Przystanki (słupki) autobus/tramwaj | Liczba słupków przystankowych autobusów i tramwajów (portal miasta) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | gtfs_warsaw, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.pitches_in | Szkoły z otwartymi boiskami | Liczba szkół z otwartymi boiskami (portal miasta, geokodowane punktami adresowymi) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | um_pitches, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.pitches_1km | Szkoły z otwartymi boiskami | Liczba szkół z otwartymi boiskami (portal miasta, geokodowane punktami adresowymi) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | um_pitches, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.sports_classes_in | Zajęcia sportowe (oferty) | Liczba ofert zajęć sportowych z adresem (portal miasta, geokodowane punktami adresowymi) wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | um_sport_classes, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.sports_classes_1km | Zajęcia sportowe (oferty) | Liczba ofert zajęć sportowych z adresem (portal miasta, geokodowane punktami adresowymi) w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | um_sport_classes, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.bo_projects_in | Projekty budżetu obywatelskiego 2019–2027 (lokalizacje) | Liczba lokalizacji projektów budżetu obywatelskiego 2019–2027 w realizacji lub zrealizowanych wewnątrz granicy osiedla (obszar MSI). | szt. | count_in | um_bo, wfs_msi | DERIVED | – |
| osiedle.bo_projects_1km | Projekty budżetu obywatelskiego 2019–2027 (lokalizacje) | Liczba lokalizacji projektów budżetu obywatelskiego 2019–2027 w realizacji lub zrealizowanych w promieniu 1 km (linia prosta) od punktu odniesienia osiedla. | szt. | count_1km | um_bo, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.metro_dist_m | Najbliższa stacja metra | Odległość w linii prostej od punktu odniesienia osiedla do najbliższej stacji metra (ZTM GTFS). | m | nearest_m | gtfs_warsaw, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.rail_dist_m | Najbliższa stacja kolei (SKM/KM) | Odległość w linii prostej od punktu odniesienia osiedla do najbliższej stacji SKM lub KM (ZTM GTFS). | m | nearest_m | gtfs_warsaw, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.kindergarten_dist_m | Najbliższe przedszkole | Odległość w linii prostej od punktu odniesienia do najbliższego przedszkola (OSM). | m | nearest_m | osm_kindergarten, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.school_dist_m | Najbliższa szkoła podstawowa | Odległość w linii prostej od punktu odniesienia do najbliższej szkoły podstawowej (OSM). | m | nearest_m | osm_school_primary, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.clinic_dist_m | Najbliższa przychodnia | Odległość w linii prostej od punktu odniesienia do najbliższej przychodni lub gabinetu (OSM). | m | nearest_m | osm_clinic, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.pharmacy_dist_m | Najbliższa apteka | Odległość w linii prostej od punktu odniesienia do najbliższej apteki (OSM). | m | nearest_m | osm_pharmacy, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.supermarket_dist_m | Najbliższy supermarket | Odległość w linii prostej od punktu odniesienia do najbliższego supermarketu (OSM). | m | nearest_m | osm_supermarket, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.departures_1km | Odjazdy w dzień roboczy z przystanków w 1 km | Suma odjazdów w dniu roboczym 2026-10-19 ze wszystkich słupków w promieniu 1 km od punktu odniesienia (rozkład ZTM). | odjazdy/dzień | sum_1km | gtfs_warsaw, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.departures_in | Odjazdy w dzień roboczy z przystanków w osiedlu | Suma odjazdów w dniu roboczym 2026-10-19 ze słupków wewnątrz granicy osiedla (rozkład ZTM). | odjazdy/dzień | sum_in | gtfs_warsaw, um_stops, wfs_msi | DERIVED | – |
| osiedle.lines_1km | Linie autobusowe i tramwajowe w 1 km | Liczba różnych linii autobusowych i tramwajowych zatrzymujących się na słupkach w promieniu 1 km. | linie | unique_1km | gtfs_warsaw, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.sport_venues_1km | Miejsca zajęć sportowych | Liczba różnych adresów zajęć sportowych w promieniu 1 km od punktu odniesienia. | szt. | unique_1km | um_sport_classes, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.pitch_objects_1km | Boiska w szkołach (obiekty) | Suma obiektów sportowych (boisk) w szkołach z otwartymi boiskami w promieniu 1 km. | szt. | sum_1km | um_pitches, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.bo_cost_in_zl | Koszt projektów BO w osiedlu | Suma kosztów projektów budżetu obywatelskiego 2019–2027 (w realizacji i zrealizowanych) zlokalizowanych w osiedlu. | zł | sum_in | um_bo, wfs_msi | DERIVED | – |
| osiedle.bo_cost_1km_zl | Koszt projektów BO w 1 km | Suma kosztów projektów budżetu obywatelskiego 2019–2027 w promieniu 1 km od punktu odniesienia. | zł | sum_1km | um_bo, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.green_share | Parki i lasy (≥ 1 ha) | Udział powierzchni osiedla pokrytej parkami i lasami OSM o powierzchni ≥ 1 ha. | % | area_share | osm_parks, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.green_share_1km | Parki i lasy (≥ 1 ha) w 1 km | Udział powierzchni koła o promieniu 1 km wokół punktu odniesienia pokrytej parkami i lasami ≥ 1 ha. | % | area_share_1km | osm_parks, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.green_dist_m | Najbliższy park lub las (krawędź, ≥ 1 ha) | Odległość w linii prostej od punktu odniesienia do krawędzi najbliższego parku lub lasu ≥ 1 ha (0 w środku). | m | nearest_m | osm_parks, wfs_address_points, wfs_msi | DERIVED | OSM może być niekompletny; szkoły nie sprawdzone w RSPO. |
| osiedle.pm25_ugm3 | PM2.5 | Stężenie PM2.5 z najbliższego czujnika, pomiar godzinowy 2026-10-17T16:30:00. | µg/m³ | nearest_value | um_air_quality, wfs_address_points, wfs_msi | DERIVED | Jeden pomiar godzinowy, bez uśrednienia. |
| osiedle.pm25_sensor_dist_m | Odległość do czujnika PM2.5 | Odległość w linii prostej od punktu odniesienia do najbliższego czujnika PM2.5. | m | nearest_m | um_air_quality, wfs_address_points, wfs_msi | DERIVED | Jeden pomiar godzinowy, bez uśrednienia. |
| osiedle.noise_lden55_share | Hałas drogowy lub kolejowy (z tramwajem) Lden ≥ 55 dB | Udział powierzchni osiedla z hałasem Lden ≥ 55 dB od dróg lub kolei (z tramwajem), suma zasięgów obu źródeł. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.noise_lden60_share | Hałas drogowy lub kolejowy (z tramwajem) Lden ≥ 60 dB | Udział powierzchni osiedla z hałasem Lden ≥ 60 dB od dróg lub kolei (z tramwajem), suma zasięgów obu źródeł. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.noise_lden65_share | Hałas drogowy lub kolejowy (z tramwajem) Lden ≥ 65 dB | Udział powierzchni osiedla z hałasem Lden ≥ 65 dB od dróg lub kolei (z tramwajem), suma zasięgów obu źródeł. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.noise_lden70_share | Hałas drogowy lub kolejowy (z tramwajem) Lden ≥ 70 dB | Udział powierzchni osiedla z hałasem Lden ≥ 70 dB od dróg lub kolei (z tramwajem), suma zasięgów obu źródeł. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.noise_road_lden60_share | Hałas drogowy Lden ≥ 60 dB | Udział powierzchni osiedla z hałasem drogowym Lden ≥ 60 dB. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.noise_rail_lden60_share | Hałas kolejowy i tramwajowy Lden ≥ 60 dB | Udział powierzchni osiedla z hałasem kolejowym i tramwajowym Lden ≥ 60 dB. | % | area_share | gios_noise_lden, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| osiedle.travel_centrum_wszystkie_min | Dojazd do centrum (Rondo Dmowskiego), wszystkie | Mediana średniego czasu dojazdu komunikacją miejską (dowolnym środkiem) do Ronda Dmowskiego przy przyjeździe 07:30–09:00 w dniu roboczym, z komórek siatki, których środek leży w osiedlu. | min | median_cells | gtfs_warsaw, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD (Wesoła, Wawer, Ursus zawyżone). |
| osiedle.travel_centrum_autobus_min | Dojazd do centrum (Rondo Dmowskiego), autobus | Mediana średniego czasu dojazdu komunikacją miejską (tylko autobusem) do Ronda Dmowskiego przy przyjeździe 07:30–09:00 w dniu roboczym, z komórek siatki, których środek leży w osiedlu. | min | median_cells | gtfs_warsaw, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD (Wesoła, Wawer, Ursus zawyżone). |
| osiedle.travel_centrum_tramwaj_min | Dojazd do centrum (Rondo Dmowskiego), tramwaj | Mediana średniego czasu dojazdu komunikacją miejską (tylko tramwajem) do Ronda Dmowskiego przy przyjeździe 07:30–09:00 w dniu roboczym, z komórek siatki, których środek leży w osiedlu. | min | median_cells | gtfs_warsaw, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD (Wesoła, Wawer, Ursus zawyżone). |
| osiedle.travel_centrum_metro_min | Dojazd do centrum (Rondo Dmowskiego), metro | Mediana średniego czasu dojazdu komunikacją miejską (z użyciem metra) do Ronda Dmowskiego przy przyjeździe 07:30–09:00 w dniu roboczym, z komórek siatki, których środek leży w osiedlu. | min | median_cells | gtfs_warsaw, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD (Wesoła, Wawer, Ursus zawyżone). |
| osiedle.travel_centrum_kolej_min | Dojazd do centrum (Rondo Dmowskiego), kolej | Mediana średniego czasu dojazdu komunikacją miejską (z użyciem kolei) do Ronda Dmowskiego przy przyjeździe 07:30–09:00 w dniu roboczym, z komórek siatki, których środek leży w osiedlu. | min | median_cells | gtfs_warsaw, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD (Wesoła, Wawer, Ursus zawyżone). |
| osiedle.roadworks_in | Utrudnienia w ruchu (aktualne) | Liczba aktualnych utrudnień w ruchu drogowym wewnątrz granicy osiedla, liczonych raz na utrudnienie. | szt. | count_in | um_road_works, wfs_msi | DERIVED | – |
| osiedle.roadworks_1km | Utrudnienia w ruchu (aktualne) w 1 km | Liczba aktualnych utrudnień w ruchu drogowym w promieniu 1 km, liczonych raz na utrudnienie. | szt. | count_1km | um_road_works, wfs_address_points, wfs_msi | DERIVED | – |
| osiedle.blurb | Zdanie w dymku osiedla | Dwie kategorie o największym wkładzie (waga profilu × wynik) i najsłabsza kategoria, wstawione w stały szablon zdań z liczbami z metryk. | tekst | template | wfs_msi | DERIVED | Sformułowania pochodzą z szablonu, liczby z metryk osiedla. |

### Kategorie osiedli (0–100)

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| kategoria.cisza | Cisza | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: noise_lden60_share × 0.45 (mniej = lepiej); noise_lden65_share × 0.25 (mniej = lepiej); gastronomy_1km × 0.15 (mniej = lepiej); departures_1km × 0.15 (mniej = lepiej). | 0–100 | percentile_rank | gios_noise_lden, gtfs_warsaw, osm_gastronomy, um_stops, wfs_address_points, wfs_msi | DERIVED | Do zmiany (krok 4 planu): 30% wagi to zastępniki (gastronomia, odjazdy), nie pomiar hałasu; brak Lnight. |
| kategoria.zielen | Zieleń | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: green_share × 0.4 (więcej = lepiej); green_share_1km × 0.3 (więcej = lepiej); green_dist_m × 0.3 (mniej = lepiej). | 0–100 | percentile_rank | osm_parks, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.komunikacja | Komunikacja | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: departures_1km × 0.3 (więcej = lepiej); lines_1km × 0.1 (więcej = lepiej); metro_dist_m × 0.2 (mniej = lepiej); rail_dist_m × 0.1 (mniej = lepiej); travel_centrum_wszystkie_min × 0.3 (mniej = lepiej). | 0–100 | percentile_rank | gtfs_warsaw, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.gastronomia | Gastronomia | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: gastronomy_1km × 1.0 (więcej = lepiej). | 0–100 | percentile_rank | osm_gastronomy, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.sport | Sport | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: pitches_1km × 0.45 (więcej = lepiej); sport_venues_1km × 0.35 (więcej = lepiej); playgrounds_1km × 0.2 (więcej = lepiej). | 0–100 | percentile_rank | osm_playground, um_pitches, um_sport_classes, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.kultura | Kultura | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: libraries_1km × 0.4 (więcej = lepiej); events_30d_1km × 0.45 (więcej = lepiej); utw_1km × 0.15 (więcej = lepiej). | 0–100 | percentile_rank | um_events, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | – |
| kategoria.edukacja | Edukacja | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: kindergartens_1km × 0.35 (więcej = lepiej); schools_1km × 0.35 (więcej = lepiej); high_schools_1km × 0.15 (więcej = lepiej); kindergarten_dist_m × 0.075 (mniej = lepiej); school_dist_m × 0.075 (mniej = lepiej). | 0–100 | percentile_rank | osm_kindergarten, osm_school_primary, osm_school_secondary, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.zdrowie | Zdrowie | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: clinics_1km × 0.4 (więcej = lepiej); pharmacies_1km × 0.35 (więcej = lepiej); clinic_dist_m × 0.1 (mniej = lepiej); aed_1km × 0.15 (więcej = lepiej). | 0–100 | percentile_rank | osm_clinic, osm_pharmacy, um_aed, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.zakupy | Zakupy | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: supermarkets_1km × 0.7 (więcej = lepiej); supermarket_dist_m × 0.3 (mniej = lepiej). | 0–100 | percentile_rank | osm_supermarket, wfs_address_points, wfs_msi | DERIVED | – |
| kategoria.zycieNocne | Życie nocne | Ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych metryk: bars_pubs_1km × 0.5 (więcej = lepiej); gastronomy_1km × 0.2 (więcej = lepiej); universities_1km × 0.15 (więcej = lepiej); events_30d_1km × 0.15 (więcej = lepiej). | 0–100 | percentile_rank | osm_gastronomy, osm_university, um_events, wfs_address_points, wfs_msi | DERIVED | – |

### Dopasowanie profili

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| profil.student | Dopasowanie profilu „student” | Średnia ważona 10 kategorii z wagami PROFILE_WEIGHTS: cisza 0.02, zielen 0.04, komunikacja 0.22, gastronomia 0.16, sport 0.1, kultura 0.12, edukacja 0.12, zdrowie 0.02, zakupy 0.06, zycieNocne 0.14. | 0–100 | weighted_mean | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_events, um_pitches, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Wagi to założenie produktowe (assumptions: profile_weights). |
| profil.rodzina | Dopasowanie profilu „rodzina” | Średnia ważona 10 kategorii z wagami PROFILE_WEIGHTS: cisza 0.14, zielen 0.18, komunikacja 0.1, gastronomia 0.02, sport 0.1, kultura 0.04, edukacja 0.22, zdrowie 0.1, zakupy 0.1. | 0–100 | weighted_mean | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_events, um_pitches, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Wagi to założenie produktowe (assumptions: profile_weights). |
| profil.senior | Dopasowanie profilu „senior” | Średnia ważona 10 kategorii z wagami PROFILE_WEIGHTS: cisza 0.16, zielen 0.14, komunikacja 0.12, gastronomia 0.04, sport 0.02, kultura 0.12, zdrowie 0.22, zakupy 0.16, zycieNocne 0.02. | 0–100 | weighted_mean | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_events, um_pitches, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Wagi to założenie produktowe (assumptions: profile_weights). |

### Kwartały

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| kwartal.price.scope | Zakres próby cen | „kwartal” przy ≥ 5 transakcjach w kwartale w okresie głównym, w innym razie „radius300” (transakcje w 300 m od punktu kwartału i w kwartale). | kategoria | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.n | Liczba transakcji | Liczba transakcji lokali mieszkalnych w użytej próbie (okres główny od 2024-01-01). | szt. | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.med | Mediana ceny transakcyjnej | Mediana ceny brutto lokalu podzielonej przez powierzchnię użytkową w użytej próbie. | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.p25 | Dolny kwartyl ceny | 25. percentyl ceny zł/m² w użytej próbie (tylko n ≥ 4). | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.p75 | Górny kwartyl ceny | 75. percentyl ceny zł/m² w użytej próbie (tylko n ≥ 4). | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.n_kw | Transakcje w samym kwartale | Liczba transakcji w granicy kwartału w okresie głównym. | szt. | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.low_n | Mała próba | true, gdy użyta próba ma mniej niż 5 transakcji. | tak/nie | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.years | Ceny w latach | {rok: [n, mediana]} dla 2023–2026, tylko transakcje w kwartale; mediana od n ≥ 3. | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.primary | Rynek pierwotny | [n, mediana zł/m²] transakcji z rynku pierwotnego w użytej próbie (mediana od n ≥ 3). | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.secondary | Rynek wtórny | [n, mediana zł/m²] transakcji z rynku wtórnego w użytej próbie (mediana od n ≥ 3). | zł/m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.area_med | Mediana powierzchni | Mediana powierzchni użytkowej lokali w użytej próbie. | m² | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.price.rooms_med | Mediana liczby izb | Mediana liczby izb (izby > 0) w użytej próbie. | izby | kwartal_field | rcn_city, wfs_buildings, osm_streets, wfs_msi | DERIVED | RCN ma ok. 6 miesięcy opóźnienia; mediana z kilkunastu transakcji może odzwierciedlać jedną inwestycję. |
| kwartal.bld.res | Budynki mieszkalne | Liczba budynków mieszkalnych z rejestru miasta, których środek leży w kwartale. | szt. | kwartal_field | wfs_buildings, osm_streets, wfs_msi | REAL | Brak roku budowy w rejestrze. |
| kwartal.bld.other | Pozostałe budynki | Liczba pozostałych budynków z rejestru miasta, których środek leży w kwartale. | szt. | kwartal_field | wfs_buildings, osm_streets, wfs_msi | REAL | Brak roku budowy w rejestrze. |
| kwartal.bld.fl_max | Najwyższa zabudowa | Największa liczba kondygnacji nadziemnych budynków mieszkalnych w kwartale. | kondygnacje | kwartal_field | wfs_buildings, osm_streets, wfs_msi | REAL | Brak roku budowy w rejestrze. |
| kwartal.bld.fl_med | Typowa wysokość | Mediana liczby kondygnacji nadziemnych budynków mieszkalnych w kwartale. | kondygnacje | kwartal_field | wfs_buildings, osm_streets, wfs_msi | REAL | Brak roku budowy w rejestrze. |
| kwartal.bld.res_share | Udział zabudowy mieszkalnej | Powierzchnia zabudowy budynków mieszkalnych / powierzchnia całej zabudowy kwartału. | 0–1 | kwartal_field | wfs_buildings, osm_streets, wfs_msi | DERIVED | Brak roku budowy w rejestrze. |
| kwartal.near.* | Najbliższy obiekt danego typu | [nazwa albo null, odległość w linii prostej w m zaokrąglona do 10] od punktu kwartału do najbliższego obiektu typu: kindergarten = przedszkole (OSM); school = szkoła podstawowa (OSM); high_school = szkoła średnia (OSM); university = uczelnia (OSM); clinic = przychodnia (OSM); pharmacy = apteka (OSM); supermarket = supermarket (OSM); park = park >= 1 ha, odległość do krawędzi (OSM, e39479af49a915ad.json); forest = las >= 1 ha, odległość do krawędzi (OSM); stop = słupek ZTM (dane.um.warszawa.pl); tram = słupek z tramwajem (ZTM GTFS); metro = stacja metra (ZTM GTFS); skm = stacja SKM (ZTM GTFS). Powyżej 3 km sama odległość. | m | kwartal_field | osm_kindergarten, osm_school_primary, osm_school_secondary, osm_university, osm_clinic, osm_pharmacy, osm_supermarket, osm_parks, um_stops, gtfs_warsaw, osm_streets, wfs_msi | DERIVED | Odległość w linii prostej; czas pieszo liczy UI regułą z assumptions (walk_rule). |
| kwartal.n500.* | Obiekty w 500 m | Liczba obiektów danego typu (kindergarten, school, high_school, clinic, pharmacy, supermarket, stop) w promieniu 500 m od punktu kwartału; brak klucza = 0. | szt. | kwartal_field | osm_kindergarten, osm_school_primary, osm_school_secondary, osm_university, osm_clinic, osm_pharmacy, osm_supermarket, osm_parks, um_stops, gtfs_warsaw, osm_streets, wfs_msi | DERIVED | – |
| kwartal.dep400 | Odjazdy w 400 m | Suma odjazdów w dniu roboczym 2026-10-19 ze wszystkich słupków, stacji metra i SKM w promieniu 400 m od punktu kwartału. | odjazdy/dzień | kwartal_field | um_stops, gtfs_warsaw, osm_streets, wfs_msi | DERIVED | – |
| kwartal.noise | Hałas w kwartale | [udział ≥ 55, ≥ 60, ≥ 65 dB] powierzchni kwartału z hałasem Lden od dróg lub kolei (z tramwajem). | 0–1 | kwartal_field | gios_noise_lden, osm_streets, wfs_msi | DERIVED | Model SMH 2022 (stan 2021, rok pandemii), wysokość 4 m; tylko drogi i kolej z tramwajem; poniżej 55 dB brak konturów. |
| kwartal.travel.* | Dojazd komunikacją | [średnia, min] minut dojazdu do celu (centrum, daszynskiego, sluzewiec) przy przyjeździe 07:30–09:00 (10 terminów co 10 min), z komórki siatki zawierającej punkt kwartału; trzecia wartość = liczba osiągalnych terminów, gdy < 10. | min | gtfs_routing | gtfs_warsaw, osm_streets, wfs_msi | DERIVED | Bez czekania na pierwszy pojazd. |

### Komórki siatki

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| komorka.travel.centrum.* | Dojazd do: Centrum (Rondo Dmowskiego) | [średnia, min, max, liczba osiągalnych terminów] minut dojazdu z komórki siatki do punktu Centrum (Rondo Dmowskiego) (52.2297, 21.0122) przy przyjeździe 07:30–09:00 co 10 min w dniu 20261019, osobno dla trybów: wszystkie, autobus, tramwaj, metro, kolej. | min | gtfs_routing | gtfs_warsaw | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD. |
| komorka.travel.rondo_daszynskiego.* | Dojazd do: Rondo Daszyńskiego (biurowce Woli) | [średnia, min, max, liczba osiągalnych terminów] minut dojazdu z komórki siatki do punktu Rondo Daszyńskiego (biurowce Woli) (52.23, 20.983) przy przyjeździe 07:30–09:00 co 10 min w dniu 20261019, osobno dla trybów: wszystkie, autobus, tramwaj, metro, kolej. | min | gtfs_routing | gtfs_warsaw | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD. |
| komorka.travel.sluzewiec.* | Dojazd do: Służewiec (biurowce, Domaniewska) | [średnia, min, max, liczba osiągalnych terminów] minut dojazdu z komórki siatki do punktu Służewiec (biurowce, Domaniewska) (52.18, 21.001) przy przyjeździe 07:30–09:00 co 10 min w dniu 20261019, osobno dla trybów: wszystkie, autobus, tramwaj, metro, kolej. | min | gtfs_routing | gtfs_warsaw | DERIVED | Bez czekania na pierwszy pojazd; bez KM i WKD. |

### Heatmapy

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| heat.student | Heatmapa profilu „student” | Ranga percentylowa dopasowania profilu wśród punktów sieci 250 m (te same metryki co dla osiedli, liczone od punktu, udziały z kwadratu 1 × 1 km), podniesiona do kwadratu; punkty < 0,05 pominięte. | 0–1 | percentile_rank | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Kwadrat rangi to przekształcenie wizualne (assumptions: heat_contrast). |
| heat.rodzina | Heatmapa profilu „rodzina” | Ranga percentylowa dopasowania profilu wśród punktów sieci 250 m (te same metryki co dla osiedli, liczone od punktu, udziały z kwadratu 1 × 1 km), podniesiona do kwadratu; punkty < 0,05 pominięte. | 0–1 | percentile_rank | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Kwadrat rangi to przekształcenie wizualne (assumptions: heat_contrast). |
| heat.senior | Heatmapa profilu „senior” | Ranga percentylowa dopasowania profilu wśród punktów sieci 250 m (te same metryki co dla osiedli, liczone od punktu, udziały z kwadratu 1 × 1 km), podniesiona do kwadratu; punkty < 0,05 pominięte. | 0–1 | percentile_rank | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | Kwadrat rangi to przekształcenie wizualne (assumptions: heat_contrast). |
| heat.kategoria.cisza | Heatmapa kategorii „Cisza” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | gios_noise_lden, gtfs_warsaw, osm_gastronomy, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.zielen | Heatmapa kategorii „Zieleń” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_parks, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.komunikacja | Heatmapa kategorii „Komunikacja” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | gtfs_warsaw, um_stops, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.gastronomia | Heatmapa kategorii „Gastronomia” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_gastronomy, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.sport | Heatmapa kategorii „Sport” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_playground, um_pitches, um_sport_classes, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.kultura | Heatmapa kategorii „Kultura” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | um_events, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw | DERIVED | – |
| heat.kategoria.edukacja | Heatmapa kategorii „Edukacja” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_kindergarten, osm_school_primary, osm_school_secondary, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.zdrowie | Heatmapa kategorii „Zdrowie” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_clinic, osm_pharmacy, um_aed, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.zakupy | Heatmapa kategorii „Zakupy” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_supermarket, wfs_address_points, wfs_msi | DERIVED | – |
| heat.kategoria.zycieNocne | Heatmapa kategorii „Życie nocne” | Ranga percentylowa kategorii wśród punktów sieci 250 m, te same metryki co dla osiedli, liczone od punktu. | 0–1 | percentile_rank | osm_gastronomy, osm_university, um_events, wfs_address_points, wfs_msi | DERIVED | – |

### Odcinki dróg (widok 3D)

| id | Nazwa | Definicja | Jednostka | Metoda | Zbiory | Status | Zastrzeżenia |
|---|---|---|---|---|---|---|---|
| odcinek.spowolnienie_rozkladowe | Spowolnienie komunikacji w ciągu doby | Dla każdej godziny: 1 − rozkładowa prędkość autobusów i tramwajów na odcinku / najwyższa godzinowa prędkość tego odcinka (rozkład ZTM, jeden dzień roboczy), przypisane do osi dróg OSM; null = brak kursów lub za mało kursów. | 0–1 | schedule_slowdown | gtfs_warsaw, osm_3d | DERIVED | Planowe spowolnienie z rozkładu, nie ruch samochodów na żywo. |

## Założenia modelowe

| id | Założenie | Uzasadnienie | Gdzie |
|---|---|---|---|
| anchor_point | Punkt odniesienia osiedla = punkt adresowy najbliższy średniej wszystkich punktów adresowych w osiedlu. | Środek zabudowy, zawsze wewnątrz poligonu; ta sama reguła dla 143 osiedli. | data/scripts/build_osiedle_metrics.py |
| radius_1km | Metryki *_1km liczą obiekty w promieniu 1 km w linii prostej. | Typowy zasięg codziennego dojścia; jednakowy dla wszystkich osiedli. | data/scripts/build_osiedle_metrics.py |
| straight_line | Odległości w linii prostej w EPSG:2180. | Bez routingu dla 143 osiedli i 14 576 kwartałów; trasy piesze tylko dla wyróżnionych osiedli (OSRM). | build_osiedle_metrics.py, build_kwartal_metrics.py |
| category_weights | Wagi metryk w kategoriach (category_metrics). | Deklaracja produktowa, jawna i jednakowa dla wszystkich osiedli; wynik to pozycja względna (percentyle). | data/scripts/build_osiedle_metrics.py (CATEGORY_METRICS) |
| profile_weights | Wagi kategorii dla profili student, rodzina, senior (PROFILE_WEIGHTS). | Preferencje profili z ankiety produktu; nie faworyzują konkretnych osiedli. | application/src/app/dictionary.ts |
| heat_contrast | Heatmapa profilu: ranga percentylowa podniesiona do kwadratu, punkty < 0,05 pominięte. | Przekształcenie wizualne stosowane jednakowo do całej mapy; nie zmienia kolejności punktów. | data/scripts/build_osiedle_metrics.py |
| blurb_template | Zdania w dymku i „W skrócie” powstają ze stałego szablonu. | Treść wynika wyłącznie z liczb metryk; bez ręcznie pisanych opisów. | build_osiedle_metrics.py, build_featured_content.py |
| kwartal_ref_point | Punkt kwartału = środek ciężkości albo punkt na powierzchni, gdy środek wypada poza kwartał. | Zawsze wewnątrz kwartału. | data/scripts/build_kwartal_metrics.py |
| rcn_filters | RCN: tylko lokale mieszkalne, udział 1/1, sprzedaż wolnorynkowa, ≥ 15 m², 3–60 tys. zł/m²; próba „radius300”, gdy w kwartale < 5 transakcji. | Odrzuca transakcje nierynkowe i błędne rekordy; mała próba jest oznaczana (low_n). | data/scripts/build_kwartal_metrics.py |
| walk_rule | Czas pieszo w UI = odległość × 1,3 / 78 m/min. | Ta sama reguła co w czasach przejazdu (objazd 1,3, chód 1,3 m/s). | application (UI), fine-metrics/index.json |
| travel_assumptions | Czasy przejazdu: chod_m_s = 1.3, objazd = 1.3, dojscie_max_m = 800, przesiadka_pieszo_max_m = 400, przesiadka_min_s = 60; przyjazd 07:30–09:00, dzień 20261019. | Parametry routera zapisane w metadanych pliku; jednakowe dla wszystkich komórek. | data/scripts/etl_czasy_przejazdu.py |
| noise_union | Hałas „drogi lub kolej” = suma zasięgów Lden obu źródeł (najgłośniejsze źródło w danym miejscu). | Pasma 5 dB nie pozwalają zsumować poziomów energetycznie; suma zasięgów to dolna granica hałasu łącznego. | data/scripts/noise/gios_noise.py |
| green_min_area | Zieleń liczona z parków i lasów OSM o powierzchni ≥ 1 ha, odległość do krawędzi. | Odległość od środka zaniżałaby oceny obok dużych lasów. | build_osiedle_metrics.py, siatka |
| price_example_area | Przykład ceny mieszkania w UI = mediana zł/m² × 55 m² (kupno). | Jawna arytmetyka na prawdziwej medianie, opisana w UI („za 55 m²”); nie jest osobną daną. | application/src/osiedle/Prices.tsx |

## Pliki z danymi

| Plik | Rodzaj | Skrypt | Zbiory |
|---|---|---|---|
| application/public/data/osiedla-metrics.json | osiedla-metrics | data/scripts/build_osiedle_metrics.py | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw |
| application/public/data/osiedla-scores.json | osiedla-scores | data/scripts/build_osiedle_metrics.py | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw |
| application/public/data/heat.json | heat | data/scripts/build_osiedle_metrics.py | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw |
| application/public/data/heat-categories.json | heat-categories | data/scripts/build_osiedle_metrics.py | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_university, um_aed, um_air_quality, um_bo, um_events, um_pitches, um_road_works, um_sport_classes, um_stops, wfs_address_points, wfs_libraries, wfs_msi, wfs_utw |
| application/public/data/osiedla.geojson | geometry | data/scripts/fetch_osiedla_boundaries.py | wfs_msi |
| application/public/data/fine/*.geojson | geometry | data/scripts/fetch_osiedla_fine.py | osm_streets, wfs_msi, wfs_buildings |
| application/public/data/fine/index.json | schema | data/scripts/fetch_osiedla_fine.py | osm_streets, wfs_msi |
| application/public/data/fine-metrics/*.json | kwartal-metrics | data/scripts/build_kwartal_metrics.py | gios_noise_lden, gtfs_warsaw, osm_clinic, osm_kindergarten, osm_parks, osm_pharmacy, osm_school_primary, osm_school_secondary, osm_streets, osm_supermarket, osm_university, rcn_city, um_stops, wfs_buildings, wfs_msi |
| application/public/data/fine-metrics/index.json | schema | data/scripts/build_kwartal_metrics.py | rcn_city, wfs_buildings |
| application/public/data/poi/*.json | poi-layer | data/scripts/build_poi_layers.py | gtfs_warsaw, osm_clinic, osm_gastronomy, osm_kindergarten, osm_parks, osm_pharmacy, osm_playground, osm_school_primary, osm_school_secondary, osm_supermarket, osm_tram_stops, osm_university, um_events, um_pitches, um_sport_classes, um_stops, wfs_libraries, wfs_utw |
| application/public/data/3d/*/traffic.json | traffic | data/scripts/osm3d/build_traffic.py | gtfs_warsaw, osm_3d |
| application/public/data/3d/*/*.geojson | geometry | data/scripts/osm3d/build_osm3d.py | osm_3d |
| data/boundaries/warszawa_dzielnice.geojson | geometry | data/scripts/fetch_district_boundaries.py | wfs_districts |
| data/boundaries/warszawa_osiedla.geojson | geometry | data/scripts/fetch_osiedla_boundaries.py | wfs_msi |
| data/boundaries/warszawa_osiedla_fine.geojson | geometry | data/scripts/fetch_osiedla_fine.py | osm_streets, wfs_msi, wfs_buildings |
| data/featured/*.json | curated | ręcznie; każdy fakt z polem sourceUrl/checkedAt, wejście build_featured_content.py | osm_kindergarten, osm_school_primary, osm_parks, osrm_routes, nominatim_places, commons_photos, osm_planned_rail |
| data/grid/czasy_przejazdu.geojson | travel-grid | data/scripts/etl_czasy_przejazdu.py | gtfs_warsaw |
| data/lines/utrudnienia.geojson | geometry | data/scripts/etl_utrudnienia.py | um_road_works |
| data/lines/trasy_turystyczne.geojson | geometry | data/scripts/etl_trasy_turystyczne.py | um_tourist_routes |
| data/poi_mikolaj/transit.geojson | poi | data/scripts/etl_przystanki.py, data/scripts/etl_gtfs_przystanki.py | um_stops, gtfs_warsaw |
| data/poi_mikolaj/amenities.geojson | poi | data/scripts/etl_toalety.py, etl_aed.py, etl_ekopunkty.py, etl_parkingi.py | um_toilets, um_aed, um_ecopoints, um_parking |
| data/poi_mikolaj/culture.geojson | poi | data/scripts/etl_wydarzenia.py | um_events |
| data/poi_mikolaj/sport.geojson | poi | data/scripts/etl_boiska.py, etl_zajecia_sportowe.py | um_pitches, um_sport_classes, wfs_address_points |
| data/poi_mikolaj/environment.geojson | poi | data/scripts/etl_powietrze.py, etl_pogoda.py | um_air_quality, um_weather |
| data/poi_mikolaj/future.geojson | poi | data/scripts/etl_budzet_obywatelski.py | um_bo |
| data/samples/warsaw_grid_sample.geojson | geometry | data/scripts/generate_grid.py --bbox 20.98 52.18 21.06 52.24 | wfs_districts |
| data/manifest.json | index | data/scripts/siatka (uv run siatka run) | – |
