# Moje Miejsce — skrypt wystąpienia (≤ 5 min)

Prezentacja: [`deck/index.html`](deck/index.html), otwierana w przeglądarce. Sterowanie: strzałki albo klik, **N** pokazuje notatki i stoper, **F** włącza pełny ekran, a **Spacja** na slajdzie wideo pauzuje film.

| # | Slajd | Czas | Łącznie |
|---|-------|------|---------|
| 1 | Tytuł | 0:15 | 0:15 |
| 2 | Problem | 0:25 | 0:40 |
| 3 | Rozwiązanie | 0:15 | 0:55 |
| 4 | **Prezentacja systemu** (film z muzyką, bez lektora) | 2:25 | 3:20 |
| 5 | Dane | 0:25 | 3:45 |
| 6 | Warszawa: Twój ruch! | 0:20 | 4:05 |
| 7 | Co dalej | 0:20 | 4:25 |
| 8 | Zamknięcie | 0:10 | **4:35** |

Zostaje ok. 25 s zapasu na przejścia. Jeśli czasu brakuje, skróć slajd 5 — film kończy się planszą z tymi samymi liczbami.

---

**1 · Tytuł (0:15)**
Cześć, jesteśmy AI All In. Pokażemy wam Moje Miejsce — aplikację, która pomaga wybrać, gdzie zamieszkać w Warszawie, jeszcze zanim zacznie się przeglądać ogłoszenia. Przyda się studentowi, rodzinie i seniorowi.

**2 · Problem (0:25)**
Szukając mieszkania, przeglądamy setki ogłoszeń. Każde mówi o metrażu i cenie, ale żadne nie mówi, jak się tam żyje. A to decyzja na lata: przedszkole, szkoła, codzienny dojazd. Potrzebne dane istnieją — portal otwartych danych, rejestr cen, mapy hałasu, rozkłady ZTM — ale są rozproszone i nikt nie łączy ich w jeden obraz zrozumiały dla zwykłego mieszkańca.

**3 · Rozwiązanie (0:15)**
Dlatego odwracamy kolejność: najpierw okolica, potem mieszkanie. Są trzy kroki. Krótki profil, bez logowania. Mapa, która ocenia 143 warszawskie osiedla według twoich priorytetów. I widok osiedla z bliska, z konkretnymi liczbami. Zobaczcie, jak to działa.

**4 · Prezentacja systemu (2:25)**
Film ma tylko muzykę, bez lektora, a podpisy na ekranie mówią, co widać. Można milczeć albo dorzucać krótkie zdania w tych miejscach:
- profil (0:06): „Trzy kroki, bez logowania — wybieramy seniora.”
- mapa (0:25): „143 osiedla ocenione pod ten profil. Na mapie od razu przychodnie, apteki, biblioteki.”
- ranking (0:44): „Wyłączamy ciszę i zieleń, dokładamy gastronomię — top 3 to nagle Śródmieście. Przywracamy profil i wraca Groszówka.”
- Groszówka (1:06): „Konkrety: miejsca w zasięgu spaceru, trasa do przychodni, dojazd w szczycie, korki, ceny transakcyjne.”
- oś czasu (1:42): „Co się zmieni do 2045 — inwestycje miasta prosto na mapie.”
- warstwy (1:58): „Funkcje budynków i korki w ciągu doby.” Po planszy z danymi przechodzimy dalej strzałką.

**5 · Dane (0:25)**
Pod spodem jest 41 zbiorów danych z dziesięciu otwartych źródeł: portal i usługi mapowe miasta, Rejestr Cen Nieruchomości, mapy hałasu GIOŚ, rozkłady ZTM, OpenStreetMap. Mamy własny ETL w Pythonie i katalog danych, w którym każda liczba ma źródło, licencję i definicję, a walidator pilnuje reguł. Najważniejsza zasada: żadnego scrapowania ani ręcznego podkręcania wyników. W trakcie hackathonu sami znaleźliśmy w rankingu ręczne korekty i je usunęliśmy. Dziś aplikacja pokazuje rzeczywistą pozycję osiedla, nawet jeśli nie jest to pierwsze miejsce.

**6 · Warszawa: Twój ruch! (0:20)**
Wyzwanie W3 nosi nazwę „Twój ruch” — a ruch jest w samym centrum naszej aplikacji. Dojazd do pracy w szczycie liczymy z prawdziwych rozkładów ZTM, trasy do szkoły i przedszkola wyznaczamy w OSRM, a na mapie 3D widać, jak komunikacja zwalnia w ciągu doby. Nie pytamy, czy osiedle jest ładne, tylko czy twoje codzienne trasy mają sens.

**7 · Co dalej (0:20)**
Technicznie to lekka aplikacja: React i MapLibre na froncie, ETL w Pythonie, statyczne pliki na CDN — tanio i szybko. Kolejne kroki to widok 3D dla wszystkich osiedli, własny pin pracy zamiast trzech stałych celów, porównanie osiedli i oferty zawężone do okolicy. A miastu te same dane pokażą, gdzie brakuje przedszkoli, przychodni czy zieleni.

**8 · Zamknięcie (0:10)**
Moje Miejsce: świadomie wybierz, gdzie mieszkać — na podstawie otwartych danych Warszawy. Dziękujemy — chętnie odpowiemy na pytania.

---

## Liczby na slajdach — skąd są

| Liczba | Źródło |
|--------|--------|
| 41 zbiorów danych, 10 źródeł, 127 metryk | `data/catalog.json` (`datasets`, `sources`, `metrics`) |
| 143 osiedla | warstwa MSI z WFS m.st. Warszawy (`public/data/osiedla.geojson`) |
| Groszówka: 84% dopasowania, 12 983 zł/m², 4 inwestycje do 2045 | panel osiedla w aplikacji (nagranie `tools/record-system.mjs`, 18.10.2026) |
| Dojazd w szczycie | metryki `komorka.travel.*` — routing GTFS ZTM, przyjazd 7:30–9:00 |
