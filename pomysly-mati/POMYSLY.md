# Warsaw Open Data Hackathon 2026: pomysły dla W3 „Warszawa: Twój ruch!”

> Nasz zespół startuje w **wyzwaniu 3 „Warszawa: Twój ruch!”** (kategoria otwarta: dowolny problem i forma, min. 1 zbiór otwartych danych m.st. Warszawy). Ten plik zawiera **63 pomysłów**: 50 z główną kategorią W3 i 13 pomysłów z W1/W2, które pasują też do W3 (oznaczone „→ pasuje do W3”). Pozostałe pomysły są w [`POMYSLY_W1_W2.md`](POMYSLY_W1_W2.md).  
> Hackathon: sob. 17.10 – niedz. 18.10.2026, kampus 42 Warsaw, al. Solidarności 171B.  
> Pliki źródłowe: `pomysly_dane.py` (baza pomysłów i ocen) oraz `generuj.py` (formuła i generator). Zmień oceny lub wagi i uruchom `python3 generuj.py`, a oba pliki przeliczą się same.

## Spis treści

1. [TL;DR – co robić](#tldr)
2. [Co wiemy o hackathonie (fakty z regulaminu)](#fakty)
3. [Dostępne dane miejskie (23 zbiory)](#dane)
4. [Wnioski strategiczne dla W3](#strategia)
5. [Metodologia oceny](#metodologia)
6. [Ranking 63 pomysłów dla W3](#ranking)
7. [Koncepcja finałowa: Widzialny Budżet](#final)
8. [Alternatywy, gdyby Widzialny Budżet nie wypalił](#alternatywy)
9. [Checklista na start](#checklista)
10. [Karty 63 pomysłów](#karty)
11. [Źródła](#zrodla)

<a id="tldr"></a>
## 1. TL;DR – co robić

**Rekomendacja: robimy „Widzialny Budżet”**, czyli połączenie #1 *BO w obrazach* + #2 *Asystent wniosku BO* + mapa luk z #8 *15-minutowa Warszawa*. Szczegóły w [sekcji 7](#final).

**W jednym zdaniu:** mieszkaniec widzi, jak będzie wyglądał projekt z budżetu obywatelskiego, ile kosztował i czy podobne projekty naprawdę powstały, a do tego dostaje gotowy szkic własnego wniosku tam, gdzie w jego okolicy czegoś brakuje.

**Top 10 dla W3:**

| # | Pomysł | Kategoria | Wynik |
|---|---|---|---|
| 1 | [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) | W3 | **78.8** ★★★★★ |
| 2 | [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) | W3 | **77.7** ★★★★★ |
| 3 | [Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)](#p003) | W3 | **77.3** ★★★★★ |
| 4 | [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) | W1 → pasuje do W3 | **77.0** ★★★★★ |
| 5 | [Konsultacje, które widać](#p005) | W3 | **76.4** ★★★★★ |
| 6 | [Sprawiedliwość taborowa / Złap elektryka](#p006) | W3 | **75.4** ★★★★★ |
| 7 | [Bezpieczne wydarzenie – automatyczna karta dla organizatorów](#p007) | W3 | **75.2** ★★★★★ |
| 8 | [15-minutowa Warszawa – indeks dostępności usług](#p008) | W3 | **75.1** ★★★★★ |
| 9 | [Każda sekunda – AED a wydarzenia masowe](#p009) | W3 | **74.3** ★★★★☆ |
| 10 | [Elektryfikacja 2076 – które linie elektryfikować najpierw](#p010) | W1 → pasuje do W3 | **74.0** ★★★★☆ |

**Dlaczego Widzialny Budżet?** W tym konkursie 55% oceny (dane 20% + wdrożenie 20% + związek z Warszawą 15%) nagradza projekty osadzone w procesach miasta, a 45% (innowacyjność 25% + prezentacja 20%) nagradza efekt wow. Widzialny Budżet łączy jedno i drugie: **AI generuje coś widowiskowego (wizualizację, wniosek), ale tylko z prawdziwych danych miasta**. Ma też oczywiste miejsce wdrożenia: proces budżetu obywatelskiego. Czyste projekty 3D/AI mają najwyższe noty za wow, ale tracą na wykonalności w 24 h i na wdrożeniu, dlatego 3D i generowanie obrazów służą tu jako **warstwa prezentacji**, a nie jako sam pomysł.

<a id="fakty"></a>
## 2. Co wiemy o hackathonie (fakty z regulaminu i stron organizatora)

| Element | Szczegóły |
|---|---|
| Termin i miejsce | 17–18.10.2026, kampus 42 Warsaw, al. Solidarności 171B (Wola). Rejestracja od 9:00, otwarcie 10:00, **start prac 11:00 (sob.)**, **koniec prac 11:00 (niedz.)**, prezentacje 11:30–13:30, obrady 13:30–14:30, wyniki 14:30. |
| Organizator i finansowanie | Fundacja „Wolność Wyboru” (operator 42 Warsaw). Finansowanie: m.st. Warszawa. Partner: Play. |
| Uczestnicy | Maks. 120 osób, zespoły 3–5 osób. To ok. 25–35 zespołów, czyli **ok. 8–12 zespołów w W3**. |
| **Nasze wyzwanie: W3 „Warszawa: Twój ruch!”** | Dowolny problem i forma (aplikacja, gra, wizualizacja, model predykcyjny, bot), z użyciem min. 1 zbioru otwartych danych m.st. Warszawy. |
| Warunek konieczny | Rozwiązanie **musi używać min. 1 zbioru z dane.um.warszawa.pl lub miejskiego API**. Inaczej nie podlega ocenie (§4 ust. 9). Dodatkowe dane zewnętrzne (OSM, GUGiK LoD2, Mapillary) są dozwolone jako uzupełnienie. |
| **Kod przed hackathonem** | **Zakazany.** „Całość Rozwiązania musi zostać wytworzona w trakcie trwania Wydarzenia… Niedozwolone jest wykorzystywanie fragmentów kodu ani innych elementów przygotowanych przed Wydarzeniem” (§4 ust. 3). Wolno używać darmowych bibliotek open source z licencją dopuszczającą użycie komercyjne. |
| **AI** | **Dozwolone** (kod, treści, grafiki), ale trzeba **opisać zakres użycia AI w dokumentacji** (§4 ust. 4). |
| Co oddać (do końca Etapu II, czyli niedz. 11:00!) | a) prezentacja/pitch deck, b) link do repozytorium, c) dokumentacja: użyte dane miejskie, założenia, frameworki i narzędzia (§4 ust. 5–6). **Po 11:00 nie wolno nic zmieniać** (§5A ust. 6). |
| Pitch | **Do 5 minut + do 2 minut odpowiedzi na pytania jury** (§5A ust. 7). Po polsku lub angielsku. Projektor jest zapewniony. |
| Kryteria i wagi (§5A ust. 12) | **Wykorzystanie i związek z otwartymi danymi m.st. Warszawy 20%. Innowacyjność i pomysłowość 25%. Praktyczne zastosowanie i potencjał wdrożeniowy 20%. Związek z wyzwaniami i realiami Warszawy 15%. Jakość prezentacji 20%.** Każdy juror ocenia 1–5 w każdym kryterium. |
| Nagrody w W3 | I miejsce 4 000 zł, II miejsce 1 000 zł, III miejsce nagroda rzeczowa (brutto). Możliwe wyróżnienia i promocja przez miasto. |
| IP | Kod zostaje nasz. Laureaci udzielają miastu i organizatorowi niewyłącznej licencji (§7). |

**Jury i czego prawdopodobnie szuka każdy juror:**

| Juror | Rola | Na co będzie wrażliwy |
|---|---|---|
| dr Paulina Nowicka-Karpińska | Pełnomocniczka Prezydenta ds. strategii rozwoju miasta, Biuro Strategii i Analiz | Spójność ze strategią #Warszawa2030, partycypacja, decyzje oparte na danych |
| Monika Rogowska | Naczelniczka Wydziału Zarządzania Danymi, Biuro Informatyki UM | **Głębokie i poprawne użycie ich zbiorów**, łączenie zbiorów, promocja portalu, feedback o jakości danych |
| Karol Wilczyński | Wydział Innowacyjnych Polityk Publicznych, Ministerstwo Cyfryzacji | Innowacje w polityce publicznej, GovTech, AI w administracji, skalowalność na inne miasta |
| Sonia Staniek | COO Bielik.AI | **Użycie polskiego LLM Bielik**, suwerenność AI, sensowne (nie dekoracyjne) AI |
| Michał Ziółkowski | CTO i członek zarządu Play | Wykonalność techniczna, mobile, kanały telekomunikacyjne (SMS/RCS/głos), skala |
| Artur Kurasiński | Przedsiębiorca, inwestor | Problem → produkt → model biznesowy/utrzymania, storytelling, alergia na „AI dla AI” |
| Aleksandra Czetwertyńska, Magda Gołębiewska | 42 Warsaw | Kreatywność, praca zespołowa, edukacja, jakość wykonania |

**Lekcja z poprzedniego miejskiego hackathonu (Warsaw Hacks, 2021):** wygrały *SeGregiusz* (ML rozpoznaje odpad na zdjęciu, czyli rozszerzenie istniejącej aplikacji miasta SegregujNa5) i *SIUP* (weryfikacja tożsamości urzędników, realna obawa mieszkańców). Dyrektor cyfryzacji: *„Nie chodziło nam o pomysły na kolejne apki”*. Jury miejskie nagradza **realny problem + wpięcie w istniejący proces lub usługę miasta**, a nie kolejną aplikację z mapą.

<a id="dane"></a>
## 3. Dostępne dane miejskie (23 zbiory na dane.um.warszawa.pl)

Wszystkie zbiory są dostępne przez API `POST https://dane.um.warszawa.pl/api/action/get_<zbiór>` z nagłówkiem `Authorization: <token>` (token z zakładki „Klucz API”). Dokumentacja każdego zbioru: `https://dane.um.warszawa.pl/files/<prefix>_pa.json` (parametry) i `_pw.json` (przykład wywołania).

| Kod | Zbiór | Odświeżanie | Najciekawsze pola / uwagi |
|---|---|---|---|
| GPS | Lokalizacja pojazdów komunikacji miejskiej | 10 s | Lat/Lon, linia, numer pojazdu, typ (1 autobus, 2 tramwaj). **Tylko stan bieżący, więc historię trzeba zbierać samemu w trakcie hackathonu.** |
| TABOR | Pojazdy transportu publicznego | codziennie | **Rok produkcji, trakcja**, marka, operator, zajezdnia, malowanie, kolor tapicerki (sic!). Rzadko używany zbiór i kopalnia nieoczywistych pomysłów. |
| PRZYST | Lokalizacja przystanków | codziennie | Słupki przystankowe z lokalizacją. |
| LINIE | Linie dostępne na przystanku | codziennie | Powiązanie przystanek → linie. |
| ODJ | Odjazdy linii z przystanku | codziennie | Rozkład dla (przystanek, słupek, linia), czyli wiele zapytań. |
| PARK | Wolne miejsca parkingowe | 1 min | Parkingi ZTP, ZDM, PKiN (w tym P+R). |
| UTR | Utrudnienia w ruchu drogowym | 1 min | Z infoulice: daty, treść, geometria. |
| AQ | Monitoring jakości powietrza | 10 min | Indeks PIJP, rekomendacje, stacje w Warszawie i gminach ościennych. |
| POG | Pogoda (stacje ZOM) | 10 min | Temp. powietrza, **temperatura nawierzchni**, wilgotność, wiatr, **intensywność opadu**. |
| RCN | Rejestr Cen Nieruchomości | codziennie | Transakcje z aktów notarialnych: cena, data, rodzaj, lokalizacja, parametry. Filtr: dzielnica, rodzaj nieruchomości i rynku, rok. Sprawdź warunki wykorzystania (mapa.um.warszawa.pl/warunki.html). |
| AED | Lokalizacja defibrylatorów | codziennie | Aktywne AED: współrzędne, **dostępność 24/7**, publiczny dostęp, opis lokalizacji. **Zbiór promowany w ogłoszeniach, więc dużo zespołów po niego sięgnie.** |
| WC | Toalety | tydzień | Zarządca, typ, **dostępność bez barier, płatność, przewijak, godziny**. |
| EKO | Eko punkty | tydzień | Punkty zbiórki leków i elektrośmieci: współrzędne, godziny dla każdego dnia. |
| SEG | Segregacja odpadów + Typy odpadów | codziennie | Dane z SegregujNa5 (2 zbiory). |
| SPORT | Zajęcia sportowe | 2 h | Kategoria, adresaci (np. seniorzy), dzielnica, data, godzina, obiekt. |
| BOISKA | Otwarte boiska | tydzień | Szkolne obiekty sportowe z **godzinami dostępności dla każdego dnia**, typ, nawierzchnia. Pośrednio lista szkół. |
| TRASY | Trasy turystyczne | brak | Nazwa, długość, opis, ślad GPS, punkty turystyczne. |
| WYD | Kalendarz wydarzeń | 2 h | Tytuły, opisy, terminy, adresy, lokalizacja. |
| KONS | Konsultacje społeczne (+ słowniki kategorii i dzielnic) | 2 h | Tytuł, opis, daty, kategoria, dzielnica, **lat/lon**, zdjęcia, grupa odbiorców, tagi (3 zbiory). |
| BO | Budżet obywatelski | tydzień | **Tylko projekty zrealizowane i w realizacji.** Pola: tytuł, opis, uzasadnienie, **współrzędne (`pins`)**, **koszt i kosztorys (`costSummary`)**, status, historia, kategorie, odbiorcy, głosy, weryfikacja, projektowanie uniwersalne. Zawiera też **imiona i nazwiska autorów, których nie wolno pokazywać (RODO)**. Najbogatszy semantycznie zbiór, idealny dla AI. |

**Dane uzupełniające (dozwolone jako dodatek, nie zamiast zbioru miejskiego):** modele 3D budynków LoD1/LoD2 (GUGiK, CityGML, bezpłatne), budynki 3D z OpenStreetMap (najprostsze do `fill-extrusion` w MapLibre), ortofotomapy m.st. Warszawy 1945–2025 (WMS w serwisie mapowym miasta), zdjęcia uliczne Mapillary (CC-BY-SA, darmowe API), GTFS ZTM (nieoficjalne mirrory), GBFS Veturilo, czujniki hałasu z platformy iot.warszawa.pl (sezonowo tylko bulwary).

**Pułapki danych:** (1) większość zbiorów transportowych i środowiskowych to **stan bieżący bez historii**, więc modele predykcyjne trzeba trenować na danych zebranych w trakcie 24 h albo ograniczyć się do zbiorów historycznych (BO, RCN, konsultacje); (2) w ogłoszeniach wymieniano hałas, ale **na portalu nie ma zbioru hałasu**; (3) każde wywołanie wymaga tokenu, a limitów zapytań nie znamy, więc **cache'ujcie odpowiedzi lokalnie od pierwszej godziny**.

<a id="strategia"></a>
## 4. Wnioski strategiczne dla W3

1. **Rywalizujemy tylko w W3 (~8–12 zespołów).** Kategoria jest otwarta, więc spodziewajmy się najszerszego przekroju pomysłów. Wyróżnienie się na tle typowych projektów jest ważniejsze niż „najlepszy pomysł w ogóle”.
2. **Przewiduj tłok.** Najbardziej oczywiste pomysły, które zrobi kilka zespołów: mapa opóźnień ZTM, „czatbot o Warszawie”, mapa smogu, wyszukiwarka AED, rekomendator mieszkań lub dzielnic. Jeśli robicie coś z tej listy, potrzebny jest mocny twist (optymalizacja zamiast wyszukiwarki, kanał głosowy zamiast czatu, rzadki zbiór typu TABOR lub temp. nawierzchni).
3. **Rzadko używane, bogate zbiory to łatwe punkty za „wykorzystanie danych”:** BO (opisy, koszty, kosztorysy, głosy), konsultacje (lat/lon i opisy), TABOR (rok i trakcja), POG (temp. nawierzchni), WC (przewijak, dostępność, godziny), BOISKA (godziny dla każdego dnia).
4. **AI ma być „silnikiem”, nie „lakierem”.** W jury jest COO Bielik.AI i inwestor wyczulony na hype. AI powinna przekształcać dane miejskie w coś, czego wcześniej nie było (wizualizację projektu, wniosek, ocenę), a jej wyniki muszą być **ugruntowane w danych** (pokazujcie „paragon danych” lub źródła). Użycie **Bielika** w krytycznej ścieżce to tani bonus u jednej jurorki i w MC (suwerenne AI).
5. **Wdrożenie = wskaż konkretną komórkę urzędu i istniejący kanał.** „Rozszerzenie procesu BO”, „moduł do konsultacje.um.warszawa.pl”, „narzędzie dla ZOM lub ZTM” brzmi wiarygodnie. „Nowa aplikacja, którą pobiorą mieszkańcy” brzmi słabo.
6. **Prezentacja to 20% i 5 minut.** Live demo przygotowane na 3–5 zapisanych w cache scenariuszach, jedno „wow” (obraz, głos, telefon jurora), slajd z listą użytych zbiorów i slajd „kto, kiedy, za ile wdraża”. Mówcie wprost językiem kryteriów, bo juror wypełnia tabelkę.
7. **3D i generatywne AI** dają największy efekt na scenie, ale kosztują najwięcej czasu. Najlepsza strategia to **lekkie 3D** (budynki OSM `fill-extrusion` w MapLibre/deck.gl: 1–2 h zamiast dnia z CityGML) i **image-to-image na zdjęciach Mapillary** (zamiast text-to-3D i AR).

<a id="metodologia"></a>
## 5. Metodologia oceny

Każdy pomysł oceniłem w 7 kategoriach w skali 1–10. Pięć pierwszych **odwzorowuje oficjalne kryteria jury z dokładnie tymi samymi wagami** (regulamin §5A ust. 12), a dwie ostatnie modelują szansę dowiezienia projektu i dopasowanie do składu jury.

| Kod | Kategoria | Waga | Co oznacza 10/10 |
|---|---|---|---|
| D | Wykorzystanie danych m.st. Warszawy | 20% | Kilka zbiorów miejskich, połączonych nietrywialnie. Bez danych produkt nie istnieje. Używa rzadkich pól. |
| I | Innowacyjność (na tle konkurencji) | 25% | Nikt inny na sali tego nie zrobi, a jury nie widziało tego wcześniej. **Pomysły z listy „tłoku” dostają obniżkę.** |
| W | Potencjał wdrożeniowy | 20% | Jest konkretny właściciel w urzędzie lub spółce miejskiej, istniejący kanał, niski koszt utrzymania, brak barier prawnych. |
| R | Związek z Warszawą i wyzwaniem | 15% | Problem czysto warszawski, literalnie trafia w opis wyzwania. |
| P | Potencjał prezentacji (wow w 5 min) | 20% | Jury zapamięta demo: obraz, dźwięk, interakcja z jurorem. |
| F | Wykonalność w 24 h, zespół 3–5 os. | mnożnik | 10 = spokojnie zdążymy z dopracowaniem, 4 = duże ryzyko, że demo nie zadziała. |
| J | Dopasowanie do konkretnego jury | bonus | Bielik, MC (polityki publiczne), strategia miasta, dane miejskie, telco, inwestor. |

**Formuła:**

```
Ocena_jury = 0.20·D + 0.25·I + 0.20·W + 0.15·R + 0.20·P            (skala 1–10, jak u jury)
Wynik      = Ocena_jury × (0.55 + 0.045·F) × 10  +  (J − 5) × 0.6     (skala ~0–100)
```
Mnożnik wykonalności (F=10 → ×1.00, F=7 → ×0.865, F=4 → ×0.73) odzwierciedla, że genialny pomysł, którego nie da się pokazać, przegrywa z dobrym pomysłem dowiezionym w całości. Bonus jury mieści się w zakresie od −2.4 do +3 pkt.

Skala gwiazdek: ★★★★★ ≥ 75 · ★★★★☆ 70–74.9 · ★★★☆☆ 65–69.9 · ★★☆☆☆ 58–64.9 · ★☆☆☆☆ < 58.

*Zastrzeżenie: to subiektywne, ale spójne i jawne szacunki. Wagi i oceny są w `pomysly_dane.py`, więc można je łatwo zmienić.*

<a id="ranking"></a>
## 6. Ranking 63 pomysłów dla W3

Pozycje liczone są tylko w obrębie W3. „→ pasuje do W3” oznacza pomysł pierwotnie przypisany do W1/W2, który można zgłosić w W3 po zmianie narracji (W3 jest kategorią otwartą).

| # | Pomysł | Kategoria | D | I | W | R | P | F | J | Ocena jury | **Wynik** | |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) | W3 | 9 | 8 | 9 | 10 | 9 | 7 | 8 | 8.90 | **78.8** | ★★★★★ |
| 2 | [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) | W3 | 9 | 8 | 9 | 10 | 8 | 7 | 9 | 8.70 | **77.7** | ★★★★★ |
| 3 | [Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)](#p003) | W3 | 10 | 7 | 9 | 9 | 7 | 8 | 8 | 8.30 | **77.3** | ★★★★★ |
| 4 | [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) | W1 → pasuje do W3 | 7 | 9 | 8 | 9 | 8 | 8 | 9 | 8.20 | **77.0** | ★★★★★ |
| 5 | [Konsultacje, które widać](#p005) | W3 | 8 | 8 | 9 | 9 | 9 | 7 | 9 | 8.55 | **76.4** | ★★★★★ |
| 6 | [Sprawiedliwość taborowa / Złap elektryka](#p006) | W3 | 9 | 8 | 7 | 9 | 8 | 8 | 7 | 8.15 | **75.4** | ★★★★★ |
| 7 | [Bezpieczne wydarzenie – automatyczna karta dla organizatorów](#p007) | W3 | 9 | 7 | 8 | 8 | 7 | 9 | 7 | 7.75 | **75.2** | ★★★★★ |
| 8 | [15-minutowa Warszawa – indeks dostępności usług](#p008) | W3 | 10 | 6 | 8 | 9 | 8 | 8 | 8 | 8.05 | **75.1** | ★★★★★ |
| 9 | [Każda sekunda – AED a wydarzenia masowe](#p009) | W3 | 8 | 6 | 9 | 9 | 7 | 9 | 7 | 7.65 | **74.3** | ★★★★☆ |
| 10 | [Elektryfikacja 2076 – które linie elektryfikować najpierw](#p010) | W1 → pasuje do W3 | 9 | 8 | 8 | 9 | 8 | 7 | 8 | 8.35 | **74.0** | ★★★★☆ |
| 11 | [Warszawa MCP – otwarte dane dla każdego asystenta AI (z Bielikiem)](#p011) | W3 | 9 | 7 | 9 | 7 | 7 | 8 | 10 | 7.80 | **74.0** | ★★★★☆ |
| 12 | [Konsultacje bez barier – ETR, ukraiński, angielski, audio](#p012) | W3 | 6 | 7 | 9 | 9 | 7 | 9 | 8 | 7.50 | **73.4** | ★★★★☆ |
| 13 | [Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów](#p013) | W2 → pasuje do W3 | 8 | 8 | 8 | 8 | 9 | 7 | 9 | 8.20 | **73.3** | ★★★★☆ |
| 14 | [BO pod lupą – co się udało, co utknęło](#p014) | W3 | 9 | 6 | 7 | 9 | 7 | 9 | 7 | 7.45 | **72.3** | ★★★★☆ |
| 15 | [Gołoledź Alert – ostrzeżenia z temperatury nawierzchni](#p015) | W3 | 7 | 8 | 8 | 9 | 7 | 8 | 7 | 7.75 | **71.7** | ★★★★☆ |
| 16 | [Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo](#p016) | W2 → pasuje do W3 | 8 | 7 | 7 | 8 | 7 | 9 | 7 | 7.35 | **71.4** | ★★★★☆ |
| 17 | [Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu](#p017) | W3 | 8 | 7 | 8 | 9 | 7 | 8 | 7 | 7.70 | **71.3** | ★★★★☆ |
| 18 | [Uczciwa cena – sprawdź, czy mieszkanie nie jest przepłacone](#p018) | W3 | 9 | 6 | 7 | 9 | 8 | 8 | 7 | 7.65 | **70.8** | ★★★★☆ |
| 19 | [Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca](#p019) | W1 → pasuje do W3 | 7 | 9 | 7 | 9 | 10 | 6 | 8 | 8.40 | **70.7** | ★★★★☆ |
| 20 | [Warszawa Data Stories – automatyczne dziennikarstwo danych](#p020) | W3 | 9 | 7 | 7 | 8 | 7 | 8 | 8 | 7.55 | **70.5** | ★★★★☆ |
| 21 | [Zapytaj Dane – analityk AI dla urzędników (Bielik on-prem)](#p021) | W3 | 9 | 7 | 8 | 7 | 8 | 7 | 9 | 7.80 | **69.9** | ★★★☆☆ |
| 22 | [Ile kosztuje metro? – premia cenowa transportu](#p022) | W3 | 9 | 7 | 7 | 9 | 8 | 7 | 7 | 7.90 | **69.5** | ★★★☆☆ |
| 23 | [Dane w szkole – lekcje z Warszawą na żywo](#p023) | W3 | 8 | 7 | 7 | 8 | 7 | 8 | 8 | 7.35 | **68.7** | ★★★☆☆ |
| 24 | [Gdzie zamieszkać – dopasowanie dzielnicy do stylu życia](#p024) | W3 | 10 | 5 | 6 | 9 | 8 | 8 | 7 | 7.40 | **68.5** | ★★★☆☆ |
| 25 | [Warszawa Wrapped – miasto w stylu Spotify Wrapped](#p025) | W2 → pasuje do W3 | 7 | 6 | 5 | 9 | 9 | 9 | 7 | 7.05 | **68.5** | ★★★☆☆ |
| 26 | [Czy mój projekt BO wygra? – trener wniosków](#p026) | W3 | 8 | 8 | 6 | 9 | 8 | 7 | 7 | 7.75 | **68.2** | ★★★☆☆ |
| 27 | [Agent uwag do konsultacji – pomoc w napisaniu rzeczowej opinii](#p027) | W3 | 7 | 7 | 7 | 9 | 7 | 8 | 8 | 7.30 | **68.2** | ★★★☆☆ |
| 28 | [Data Quality Watchdog – audyt jakości miejskich zbiorów](#p028) | W3 | 9 | 6 | 8 | 7 | 5 | 9 | 8 | 6.95 | **68.2** | ★★★☆☆ |
| 29 | [Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D](#p029) | W1 → pasuje do W3 | 7 | 8 | 8 | 9 | 9 | 6 | 7 | 8.15 | **68.0** | ★★★☆☆ |
| 30 | [Gdzie miasto stoi – wąskie gardła i priorytet tramwajowy](#p030) | W3 | 9 | 7 | 8 | 9 | 8 | 6 | 7 | 8.10 | **67.6** | ★★★☆☆ |
| 31 | [Toalety dla kurierów i pracowników mobilnych](#p031) | W2 → pasuje do W3 | 7 | 7 | 7 | 8 | 6 | 9 | 6 | 6.95 | **67.0** | ★★★☆☆ |
| 32 | [Witaj w Warszawie – onboarding nowych mieszkańców](#p032) | W3 | 9 | 5 | 8 | 9 | 6 | 8 | 7 | 7.20 | **66.7** | ★★★☆☆ |
| 33 | [Radar Gentryfikacji](#p033) | W1 → pasuje do W3 | 8 | 8 | 7 | 9 | 8 | 6 | 7 | 7.95 | **66.4** | ★★★☆☆ |
| 34 | [Pokédex ZTM – kolekcjonerska gra taboru](#p034) | W3 | 8 | 8 | 5 | 8 | 9 | 7 | 6 | 7.60 | **66.3** | ★★★☆☆ |
| 35 | [Cyfrowy bliźniak transportu na żywo w 3D](#p035) | W1 → pasuje do W3 | 8 | 6 | 6 | 8 | 10 | 7 | 7 | 7.50 | **66.1** | ★★★☆☆ |
| 36 | [Słyszę przystanek – asystent dla osób niewidomych](#p036) | W3 | 7 | 6 | 8 | 8 | 7 | 8 | 7 | 7.10 | **65.8** | ★★★☆☆ |
| 37 | [Boiska otwarte naprawdę – analiza godzin dostępności](#p037) | W3 | 6 | 6 | 8 | 8 | 6 | 9 | 6 | 6.70 | **64.6** | ★★☆☆☆ |
| 38 | [Koszt utrudnienia – ile minut pasażerów zabiera remont](#p038) | W3 | 8 | 8 | 8 | 9 | 8 | 5 | 7 | 8.15 | **64.4** | ★★☆☆☆ |
| 39 | [P+R Predict – prognoza wolnych miejsc i zachęta do przesiadki](#p039) | W3 | 8 | 6 | 8 | 8 | 7 | 7 | 6 | 7.30 | **63.7** | ★★☆☆☆ |
| 40 | [Senior 2076 – audyt miasta dla starzejącego się społeczeństwa](#p040) | W1 → pasuje do W3 | 7 | 6 | 7 | 9 | 6 | 8 | 7 | 6.85 | **63.5** | ★★☆☆☆ |
| 41 | [Wyjdź wcześniej – utrudnienia w Twoim kalendarzu](#p041) | W3 | 7 | 6 | 7 | 8 | 7 | 8 | 6 | 6.90 | **63.4** | ★★☆☆☆ |
| 42 | [Infoulice AI – utrudnienia po ludzku](#p042) | W3 | 7 | 6 | 7 | 8 | 6 | 8 | 6 | 6.70 | **61.6** | ★★☆☆☆ |
| 43 | [Warszawa w RCS / SMS – info bez aplikacji](#p043) | W2 → pasuje do W3 | 7 | 6 | 7 | 7 | 6 | 8 | 8 | 6.55 | **61.4** | ★★☆☆☆ |
| 44 | [Puls Miasta – dashboard dla prezydenta](#p044) | W3 | 9 | 4 | 6 | 8 | 7 | 8 | 7 | 6.60 | **61.3** | ★★☆☆☆ |
| 45 | [AR: zobacz projekt na swojej ulicy (text-to-3D + WebXR)](#p045) | W1 → pasuje do W3 | 7 | 9 | 7 | 9 | 9 | 4 | 7 | 8.20 | **61.1** | ★★☆☆☆ |
| 46 | [Dostępny przejazd – planer dla osób z niepełnosprawnościami](#p046) | W3 | 7 | 5 | 8 | 8 | 6 | 8 | 6 | 6.65 | **61.1** | ★★☆☆☆ |
| 47 | [Ceny a smog – ile warte jest czyste powietrze](#p047) | W3 | 8 | 7 | 5 | 8 | 7 | 7 | 6 | 6.95 | **60.7** | ★★☆☆☆ |
| 48 | [Eko-przypominacz po drodze](#p048) | W3 | 6 | 7 | 7 | 7 | 6 | 8 | 6 | 6.60 | **60.7** | ★★☆☆☆ |
| 49 | [Ratownik w okolicy – społecznościowi ratownicy i AED](#p049) | W3 | 6 | 7 | 6 | 7 | 8 | 7 | 6 | 6.80 | **59.4** | ★★☆☆☆ |
| 50 | [SegregujAI – zdjęcie śmiecia i właściwy pojemnik](#p050) | W3 | 6 | 3 | 8 | 8 | 7 | 9 | 6 | 6.15 | **59.3** | ★★☆☆☆ |
| 51 | [Czy boisko jest wolne? – crowdsourcing zajętości](#p051) | W3 | 6 | 6 | 7 | 8 | 6 | 8 | 5 | 6.50 | **59.1** | ★★☆☆☆ |
| 52 | [Izochrony na żywo – jak daleko zajadę teraz](#p052) | W3 | 8 | 6 | 6 | 8 | 8 | 6 | 6 | 7.10 | **58.8** | ★★☆☆☆ |
| 53 | [Voxel Warszawa – instalacja artystyczna danych](#p053) | W3 | 6 | 7 | 4 | 8 | 9 | 7 | 5 | 6.75 | **58.4** | ★★☆☆☆ |
| 54 | [Martwe przystanki – obszary niedoobsłużone przez komunikację](#p054) | W3 | 8 | 5 | 7 | 8 | 6 | 7 | 6 | 6.65 | **58.1** | ★★☆☆☆ |
| 55 | [Sprawdzam! – fact-checking wypowiedzi na danych miasta](#p055) | W3 | 7 | 7 | 5 | 7 | 7 | 7 | 6 | 6.60 | **57.7** | ★☆☆☆☆ |
| 56 | [Tablica sąsiedzka – e-ink z odjazdami i wydarzeniami do klatki schodowej](#p056) | W3 | 6 | 6 | 6 | 7 | 8 | 7 | 6 | 6.55 | **57.3** | ★☆☆☆☆ |
| 57 | [Bezpieczna droga do szkoły](#p057) | W3 | 6 | 6 | 7 | 8 | 6 | 7 | 6 | 6.50 | **56.8** | ★☆☆☆☆ |
| 58 | [Wojna śmieciowa – quiz segregacji dzielnic](#p058) | W3 | 6 | 4 | 6 | 7 | 7 | 9 | 5 | 5.85 | **55.9** | ★☆☆☆☆ |
| 59 | [Czasoprzestrzenna kostka wydarzeń 3D](#p059) | W3 | 7 | 6 | 4 | 7 | 8 | 7 | 5 | 6.35 | **54.9** | ★☆☆☆☆ |
| 60 | [AED Trening – gra edukacyjna 3D](#p060) | W3 | 5 | 7 | 6 | 6 | 8 | 6 | 6 | 6.45 | **53.5** | ★☆☆☆☆ |
| 61 | [GeoGuessr Warszawa z danymi](#p061) | W3 | 5 | 5 | 4 | 8 | 8 | 8 | 5 | 5.85 | **53.2** | ★☆☆☆☆ |
| 62 | [Dyspozytor ZTM – gra symulacyjna](#p062) | W3 | 7 | 7 | 4 | 8 | 8 | 5 | 6 | 6.75 | **52.9** | ★☆☆☆☆ |
| 63 | [Rower czy autobus? – porównywarka na żywo](#p063) | W3 | 6 | 5 | 5 | 8 | 6 | 7 | 5 | 5.85 | **50.6** | ★☆☆☆☆ |

<a id="final"></a>
## 7. Koncepcja finałowa: „Widzialny Budżet”

**Połączenie:** #1 *BO w obrazach* + #2 *Asystent wniosku BO* + mapa luk z #8 *15-minutowa Warszawa*.

### 7.1 Co to daje mieszkańcowi

1. **Widzi, a nie czyta.** Zamiast dwóch stron tekstu ma zdjęcie swojej ulicy dziś i obok wizualizację po realizacji projektu. Łatwiej zrozumieć, co powstanie.
2. **Wie, czy to realne.** Przy każdym projekcie widzi, ile kosztowały podobne projekty w poprzednich latach, czy powstały i ile to trwało.
3. **Dowiaduje się, czego brakuje w jego okolicy.** Wpisuje adres i widzi konkrety, np. „najbliższy defibrylator czynny całą dobę jest 650 m stąd”, „najbliższa toaleta bez barier jest 1,2 km stąd”, „nie ma tu boiska otwartego wieczorem”.
4. **Może zgłosić własny projekt bez wiedzy urzędniczej.** Jednym kliknięciem dostaje szkic wniosku: uzasadnienie z liczbami z danych i realistyczny koszt na podstawie podobnych zrealizowanych projektów. Poprawia go i składa.
5. **Sprawdza, co się stało z pieniędzmi.** Widzi, co z wygranych projektów w jego dzielnicy już powstało, a co nadal czeka.

**Dla kogo szczególnie:** dla osób, które nigdy nie złożyły wniosku, bo nie wiedziały, od czego zacząć ani ile to kosztuje, dla seniorów i dla osób, którym trudno czytać długie opisy.

### 7.2 Z jakich danych korzysta i do czego

| Dane miejskie | Do czego służą w projekcie |
|---|---|
| **Budżet obywatelski** (opisy, `pins`, koszty i kosztorysy, statusy, historia, głosy, kategorie) | Rdzeń projektu. Z opisu powstaje wizualizacja, z lokalizacji pinezka na mapie. Koszty i statusy dają porównanie z podobnymi projektami. Na tych danych opiera się szacunkowy koszt we wniosku mieszkańca. |
| **Defibrylatory (AED)** (lokalizacja, dostępność 24/7) | Pokazują miejsca, gdzie defibrylator jest za daleko, i podsuwają pomysł na wniosek. |
| **Toalety** (lokalizacja, dostępność bez barier, przewijak, godziny) | Pokazują braki toalet, w tym dostępnych dla osób z niepełnosprawnościami i rodziców z małymi dziećmi. |
| **Eko punkty** (lokalizacja, godziny) | Pokazują, gdzie daleko jest do punktu zbiórki leków i elektrośmieci. |
| **Otwarte boiska** (lokalizacja, godziny otwarcia w każdy dzień) | Pokazują, gdzie brakuje miejsca do sportu po pracy. |
| **Zajęcia sportowe** (dzielnica, grupy odbiorców) | Pokazują braki oferty dla konkretnych grup, np. seniorów. |
| **Przystanki** (lokalizacja) | Wskazują miejsca, gdzie jest dużo ludzi, czyli gdzie nowy obiekt przyda się najbardziej. |
| **Konsultacje społeczne** (lokalizacja, opis) | Pokazują, co miasto już planuje w okolicy, żeby wniosek tego nie dublował. |

**Spoza danych miejskich:** zdjęcia ulic z Mapillary (podstawa wizualizacji, CC-BY-SA) i budynki z OpenStreetMap (mapa 3D).

### 7.3 Ekrany produktu

1. **Mapa 3D Warszawy** (MapLibre + budynki OSM w `fill-extrusion`) z projektami BO jako pinezkami (zrealizowane, w realizacji) i warstwą luk w okolicy (AED, WC, ekopunkty, boiska, zajęcia sportowe, przystanki).
2. **Karta projektu:** zdjęcie miejsca dziś (Mapillary) → **wizualizacja AI po realizacji** (image-to-image na podstawie opisu projektu, z etykietą „wizualizacja poglądowa”) + „paragon danych”: koszt, kosztorys, głosy, status, 3 podobne projekty z poprzednich edycji z ich kosztem i czasem realizacji, luki w okolicy, które projekt wypełnia.
3. **„Napisz wniosek”:** klik na lukę → Bielik generuje szkic wniosku BO (tytuł, uzasadnienie z liczbami z danych, kosztorys z mediany podobnych projektów) → PDF lub kopiowanie do formularza BO.

### 7.4 Jak to działa pod spodem

- **Pobranie danych (pierwsze 1–2 h):** wszystkie edycje BO i zbiory pomocnicze do DuckDB/SQLite i GeoJSON. **Imiona i nazwiska autorów (`firstName`, `lastName`, `cocreators`) usuwamy przed zapisem.** Na demo nic nie zależy od API na żywo.
- **Mapa luk:** siatka H3 (rozdzielczość 9, ok. 170 m), dla każdej komórki odległość do najbliższego obiektu z każdej kategorii (linia prosta × 1,3 jako przybliżenie drogi pieszej) i progi, np. AED 24/7 do 300 m, toaleta do 500 m, przystanek do 400 m, boisko do 800 m, ekopunkt do 1 km. Większą wagę dostają miejsca z dużą gęstością przystanków.
- **Wizualizacja:** współrzędne z `pins` → najbliższe zdjęcie Mapillary w promieniu ~50 m → LLM skraca opis do instrukcji wizualnej („dodaj 4 ławki, 6 młodych drzew…; reszty nie zmieniaj”) → model edycji obrazu (np. Gemini Flash Image / FLUX Kontext) → znak „poglądowe” → cache. Na demo 10–15 projektów przygotowanych wcześniej.
- **Podobne projekty:** embeddingi tytułu i opisu (np. wielojęzyczny e5), top 3 w tej samej kategorii, mediana kosztu i czas od `submitted` do statusu „zrealizowany” (z `history`).
- **Wniosek:** **koszt liczy kod, nie LLM** (mediana i rozstęp z podobnych projektów, rozbicie z `costSummary`). Bielik pisze tekst wyłącznie z podanych faktów, a walidator sprawdza, czy każda liczba w tekście występuje w faktach.

```
Pobieranie danych (Python) ─► DuckDB + GeoJSON ─► FastAPI:
                                                   /projekty  /braki  /podobne
                                                   /wizualizacja ─► Mapillary + model obrazu
                                                   /wniosek      ─► Bielik + walidator
Frontend: MapLibre (budynki 3D z OSM) + deck.gl (warstwa luk) + karty projektów + PDF
```

### 7.5 Uczciwe granice (powiedzieć w pitchu, zanim jury zapyta)

- **Miejski zbiór BO zawiera tylko projekty zrealizowane i w realizacji.** Na demo hasło brzmi „zobacz, co tu powstanie”. Funkcja „zobacz, zanim zagłosujesz” to cel wdrożenia: miasto podłącza projekty z etapu głosowania z tego samego systemu, w tym samym formacie.
- **W zbiorze nie ma projektów odrzuconych**, więc asystent opiera się na projektach, które wygrały i powstały. Na miejscu sprawdźcie, co faktycznie jest w polu `verification`.
- **Wizualizacje są poglądowe, a mapa luk to proste progi odległości.**

### 7.6 Gdzie by to działało

Jako dodatek do strony budżetu obywatelskiego Warszawy: przy głosowaniu (wizualizacje i porównania) i przy naborze wniosków (mapa luk i szkic wniosku). Właściciel po stronie miasta: zespół budżetu obywatelskiego w urzędzie (Centrum Komunikacji Społecznej).

### 7.7 Podział ról i plan 24 h

**Role (4 osoby):** (1) dane i ETL + mapa luk, (2) backend + AI (obraz, Bielik, embeddingi), (3) frontend 3D i UX, (4) produkt, pitch, kuracja 10 przykładów demo, dokumentacja i README z ujawnieniem użycia AI.

| Godz. | Co |
|---|---|
| 11:00–12:30 | Tokeny API działają, pobranie wszystkich zbiorów do cache, szkic UI na kartce, umowa o kontrakcie API między backendem a frontendem |
| 12:30–17:00 | ETL + mapa z pinezkami BO, pipeline Mapillary → edycja obrazu dla 1 projektu end-to-end |
| 17:00 | **Rozmowa z mentorem (dane i projektowanie usług):** walidacja historii i ścieżki wdrożenia |
| 17:00–23:00 | Mapa luk, podobne projekty, generator wniosku (Bielik), karta projektu |
| 23:00–03:00 | Polerowanie UI, **wygenerowanie i zcache'owanie 10–15 przykładów demo**, nagranie wideo-backupu demo |
| 03:00–07:00 | Sen na zmiany (minimum 2 osoby śpią naraz) |
| 07:00–10:00 | Pitch deck, README (zbiory, założenia, narzędzia, **zakres użycia AI**), 5 próbnych pitchy na czas |
| 10:30 | **Wysłanie dokumentacji i linku do repo** (twardy termin to 11:00, potem zamrożenie zmian) |

### 7.8 Szkic pitchu (5:00)

- 0:00–0:30: „W tym roku Warszawa wyda X mln zł w BO. Kto z Państwa przeczytał opis choć jednego projektu, na który głosował?” (liczbę sprawdźcie w danych BO).
- 0:30–1:00: problem w 2 liczbach z danych (np. ile projektów, ile kosztują, jak nierównomiernie rozkładają się dzielnice).
- 1:00–3:15: **demo:** mapa 3D → projekt → *przed i po* (wow) → paragon danych → klik na lukę → wniosek w 20 s.
- 3:15–3:45: slajd „Dane”: 8 zbiorów miejskich, jak są połączone.
- 3:45–4:30: slajd „Wdrożenie”: kto (zespół BO w urzędzie), gdzie (strona głosowania, nabór), koszt (~X zł/mies. za API obrazów, Bielik może działać on-prem), co dalej (pilotaż w 1 dzielnicy w następnej edycji).
- 4:30–5:00: wizja: „Żeby każdy warszawiak widział, na co głosuje, i umiał zaproponować coś swojego”.

**Q&A:** *Czy wizualizacje nie wprowadzają w błąd?* (etykieta „poglądowe”, generowane z opisu autora, autor może zatwierdzić). *Halucynacje we wniosku?* (liczby tylko z danych, LLM pisze wyłącznie tekst, walidator liczb). *Koszt?* (obraz ~kilka groszy, Bielik on-prem). *Czy autorzy się zgodzą?* (opt-in, a autorzy chcą wygrać, więc wizualizacja im pomaga). *Dlaczego tylko zrealizowane projekty?* (tak wygląda dziś zbiór, a wdrożenie podłącza projekty z etapu głosowania).

<a id="alternatywy"></a>
## 8. Alternatywy, gdyby Widzialny Budżet nie wypalił

Kolejne mocne opcje w W3, uporządkowane według rankingu:

- **#3 Gdzie postawić? – optymalizator lokalizacji infrastruktury.** Najmocniejsze wykorzystanie danych i jasna decyzja dla urzędu. Trzeba odróżnić się od zespołów robiących zwykłą mapę AED.
- **#4 Rzecznik Przyszłych Pokoleń** (pierwotnie W1). W W3 opowiadamy go jako „AI ocena wpływu konsultacji”, bez nacisku na 2076. Dopasowany do trzech jurorów: strategia, MC, Bielik.
- **#5 Konsultacje, które widać.** Ten sam silnik co Widzialny Budżet, tylko zamiast BO są konsultacje. Dobry „plan B” bez zmiany architektury.
- **#6 Sprawiedliwość taborowa / Złap elektryka.** Rzadki zbiór TABOR, nieoczywiste pytanie badawcze, łatwe do zrobienia.
- **#13 Zadzwoń do Warszawy** (pierwotnie W2). Najmocniejsze demo na żywo (juror dzwoni) i dopasowanie do CTO Play i Bielik.AI.

**Jeśli koniecznie chcemy 3D/AI jako rdzeń:** najlepsze opcje „3D-first” w W3 to **#10 Elektryfikacja** (mapa linii, wysoka ocena dzięki danym), **#19 Okno 2076**, **#35 Cyfrowy bliźniak transportu w 3D**, **#29 Dachy 2076**, **#45 AR: projekt na ulicy**. Przy Oknie 2076 warto dodać kartę danych i link do konsultacji/BO: podniesienie oceny wdrożenia z 7 do 9 daje wynik ok. 74 pkt zamiast 70.7. Unikajcie CityGML LoD2 dla całego miasta (budynki OSM wystarczą na demo) oraz WebXR/AR na żywo na scenie.

<a id="checklista"></a>
## 9. Checklista na start (zgodnie z §4 ust. 3: kod piszemy dopiero od 11:00 w sobotę)

- [ ] Każda osoba ma **klucz API** z dane.um.warszawa.pl (zakładka „Klucz API”) i sprawdziła ręcznie (curl/Postman) zbiór BO.
- [ ] Przeczytana dokumentacja `_pa.json`/`_pw.json` zbiorów: BO, AED, WC, EKO, BOISKA, SPORT, PRZYST, KONS.
- [ ] Konta i klucze: Mapillary (token), dostawca modelu obrazowego, hosting (Vercel/Render/Fly). **Rozwiązanie budujemy w osobnym folderze lub repo, z commitami od 11:00 w sobotę.**
- [ ] **Bielik:** wagi (np. `Bielik-11B-v3` GGUF przez Ollama/llama.cpp, licencja Apache 2.0) pobrane i przetestowane pod kątem szybkości. Wagi modelu open source to dozwolona zależność, a nie nasz kod.
- [ ] Ustalony stack, który wszyscy znają (np. Python FastAPI + Vite/React + MapLibre/deck.gl), i podział ról z sekcji 7.7.
- [ ] Sprzęt: laptopy, ładowarki, przedłużacz, słuchawki, adapter HDMI/USB-C, hotspot jako zapas łącza, **dowód osobisty** (weryfikacja przy wejściu).
- [ ] Zasady regulaminu: **ujawnienie użycia AI w dokumentacji**, **oddanie wszystkiego do niedz. 11:00**, **5 min + 2 min Q&A**.

<a id="karty"></a>
## 10. Karty 63 pomysłów (w kolejności rankingu W3)

Legenda kodów danych: patrz [sekcja 3](#dane).

<a id="p001"></a>
### #1. BO w obrazach – zobacz projekt, zanim zagłosujesz
**Kategoria:** W3 · **Typ:** AI obraz, analityka, partycypacja · **Wynik: 78.8** ★★★★★ (ocena jury 8.90/10)

- **Opis:** Dla każdego projektu Budżetu Obywatelskiego AI generuje fotorealistyczną wizualizację w prawdziwym miejscu: zdjęcie ulicy z Mapillary i edycja image-to-image według opisu projektu. Obok analityka z historii BO: koszt na mieszkańca, podobne projekty zrealizowane wcześniej i ich rzeczywisty koszt, opóźnienia. Wszystko na mapie 3D. Wyższa i bardziej świadoma frekwencja w głosowaniu.
- **Dane:** BO (opisy, lokalizacje, kosztorysy, statusy, wyniki głosowań), KONS; + Mapillary/ortofoto
- **Moment „wow” w demo:** Projekt „zielone podwórko” z prawdziwym zdjęciem przed i AI po, a obok „3 podobne projekty kosztowały średnio X zł i trwały 14 mies.”
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 10 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Najlepszy balans wszystkich kryteriów: AI i wizualność, głębokie użycie bogatego zbioru, jasny właściciel (Centrum Komunikacji Społecznej, BO), czysto warszawski temat.
- **Ryzyka:** Miejski zbiór BO zawiera tylko projekty zrealizowane i w realizacji, więc na demo pokazujemy „co tu powstanie”, a „zanim zagłosujesz” to cel wdrożenia. Wizualizacja może wprowadzać w błąd, potrzebna etykieta „poglądowe”. Jakość zdjęć Mapillary bywa różna. Zbiór zawiera imiona i nazwiska autorów, których nie wolno pokazywać (RODO).

<a id="p002"></a>
### #2. Asystent wniosku BO – od luki w danych do gotowego projektu
**Kategoria:** W3 · **Typ:** AI LLM, analityka przestrzenna · **Wynik: 77.7** ★★★★★ (ocena jury 8.70/10)

- **Opis:** Mapa „czego brakuje w moim sąsiedztwie” (indeks 15-minutowy z miejskich zbiorów). Mieszkaniec klika lukę, a AI (Bielik) przygotowuje szkic wniosku do BO: uzasadnienie oparte na danych, realistyczny kosztorys z podobnych zrealizowanych projektów i wskazówki z projektów, które wygrały i powstały. Nabór do BO zwykle rusza na początku roku.
- **Dane:** BO (historia projektów i koszty), AED, WC, BOISKA, EKO, PRZYST, SPORT, AQ
- **Moment „wow” w demo:** Od kliknięcia luki na mapie do gotowego, pobieralnego wniosku w 30 s.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 10 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Pełna ścieżka: dane → problem → działanie obywatela. Wysoka innowacyjność i wdrożenie w procesie BO.
- **Ryzyka:** Weryfikacja wiarygodności kosztorysów. Nie zastępuje pracy urzędu. Zbiór BO nie zawiera projektów odrzuconych, więc asystent uczy się tylko na projektach, które przeszły.

<a id="p003"></a>
### #3. Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)
**Kategoria:** W3 · **Typ:** Optymalizacja, analityka · **Wynik: 77.3** ★★★★★ (ocena jury 8.30/10)

- **Opis:** Narzędzie dla urzędników: wybierasz typ infrastruktury i budżet (np. 20 nowych AED). Algorytm max-coverage wskazuje optymalne lokalizacje, ważąc węzły przesiadkowe, miejsca wydarzeń, trasy turystyczne i szkoły. Pokazuje wzrost pokrycia z 61% do 78%.
- **Dane:** AED, WC, EKO, PRZYST, LINIE, WYD, TRASY, BOISKA
- **Moment „wow” w demo:** Suwak „liczba nowych urządzeń” i rosnące pokrycie na mapie w czasie rzeczywistym.
- **Oceny:** Dane 10 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Najmocniejsze wykorzystanie danych (łączenie wielu zbiorów), konkretna decyzja i oszczędność pieniędzy.
- **Ryzyka:** AED jest promowane w ogłoszeniach, więc inne zespoły też zrobią „mapę AED”. Trzeba się wyróżnić optymalizacją.

<a id="p004"></a>
### #4. Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076
**Kategoria:** W1 → pasuje do W3 · **Typ:** AI LLM (Bielik), polityka publiczna · **Wynik: 77.0** ★★★★★ (ocena jury 8.20/10)

- **Opis:** Inspiracja walijskim Well-being of Future Generations Act. Dla każdej trwającej konsultacji społecznej panel agentów AI (na Bieliku) odgrywa przyszłych mieszkańców 2076: dziecko urodzone dziś, seniorkę, osobę z niepełnosprawnością, przyrodę. Agenci analizują projekt na tle danych o okolicy. Wynikiem jest „Ocena Wpływu Międzypokoleniowego”: karta 1 strony z ryzykami, szansami i pytaniami, które warto zadać w konsultacji. Narzędzie nie składa uwag w imieniu ludzi, tylko pomaga mieszkańcom i urzędnikom myśleć długoterminowo.
- **Dane:** KONS (+kategorie, dzielnice), BO, AQ, POG, PRZYST, RCN
- **Moment „wow” w demo:** Na żywo debata agentów o realnej konsultacji z portalu, a na końcu wygenerowana karta oceny z mapą i danymi.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 9
- **Uzasadnienie:** Bardzo wysoka innowacyjność w sensie polityki publicznej. W jury zasiada przedstawiciel Wydziału Innowacyjnych Polityk Publicznych MC, pełnomocniczka ds. strategii i COO Bielik.AI. Wdrożenie: moduł na konsultacje.um.warszawa.pl.
- **Ryzyka:** Trzeba uniknąć wrażenia, że AI zastępuje głos mieszkańców. Jakość analiz zależy od jakości opisów konsultacji.

<a id="p005"></a>
### #5. Konsultacje, które widać
**Kategoria:** W3 · **Typ:** AI tekst + obraz, dostępność · **Wynik: 76.4** ★★★★★ (ocena jury 8.55/10)

- **Opis:** Każda konsultacja społeczna dostaje: streszczenie w tekście łatwym do czytania (ETR), tłumaczenie UA/EN, wizualizację AI „przed i po”, kontekst danych o okolicy (komunikacja, powietrze, ceny, infrastruktura) oraz 60-sekundowe audio. Cel: więcej i lepszych głosów w konsultacjach.
- **Dane:** KONS (+kategorie, dzielnice), BO, PRZYST, AQ, AED, WC, RCN
- **Moment „wow” w demo:** Prawdziwa trwająca konsultacja w wersji urzędowej i w wersji z naszego narzędzia, obok siebie.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Moduł do istniejącego portalu konsultacji, więc wdrożenie jest oczywiste. Dostępność (ETR) to temat bliski miastu (regulamin sam o nim mówi).
- **Ryzyka:** Pokrywa się z „BO w obrazach”, warto je połączyć.

<a id="p006"></a>
### #6. Sprawiedliwość taborowa / Złap elektryka
**Kategoria:** W3 · **Typ:** Analityka + aplikacja · **Wynik: 75.4** ★★★★★ (ocena jury 8.15/10)

- **Opis:** Pytanie: czy niektóre dzielnice systematycznie dostają starsze, spalinowe autobusy? Łączymy rejestr taboru z GPS i mierzymy średni wiek i trakcję floty obsługującej każdą dzielnicę, zestawiając to z jakością powietrza. Funkcja dla pasażera: „za 4 min przyjedzie elektryk z 2024 r., za 6 min diesel z 2008 r.”.
- **Dane:** TABOR (rok, trakcja), GPS, AQ, PRZYST, LINIE
- **Moment „wow” w demo:** Mapa dzielnic według wieku taboru na żywo.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Nieoczywiste pytanie badawcze, rzadko używany zbiór i temat sprawiedliwości.
- **Ryzyka:** Może się okazać, że różnic nie ma. To też wynik, ale słabszy na pitch.

<a id="p007"></a>
### #7. Bezpieczne wydarzenie – automatyczna karta dla organizatorów
**Kategoria:** W3 · **Typ:** Automatyzacja, raporty · **Wynik: 75.2** ★★★★★ (ocena jury 7.75/10)

- **Opis:** Dla każdego wydarzenia automatycznie generujemy kartę bezpieczeństwa i dostępności: najbliższe AED, toalety (w tym bez barier), dojazd komunikacją i utrudnienia w tym dniu, parkingi, prognoza pogody i powietrza. Może trafić do urzędu przy zgłaszaniu imprez.
- **Dane:** WYD, AED, WC, PRZYST, ODJ, UTR, POG, AQ, PARK
- **Moment „wow” w demo:** Generacja karty PDF dla prawdziwego wydarzenia z kalendarza.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Łączy aż 9 zbiorów w jeden użyteczny produkt.
- **Ryzyka:** Mało spektakularne wizualnie.

<a id="p008"></a>
### #8. 15-minutowa Warszawa – indeks dostępności usług
**Kategoria:** W3 · **Typ:** Analityka przestrzenna · **Wynik: 75.1** ★★★★★ (ocena jury 8.05/10)

- **Opis:** Siatka heksagonów z indeksem dostępności pieszej do miejskich usług z otwartych danych, zestawiona z historycznymi wydatkami BO. Pytanie: czy BO trafia tam, gdzie brakuje najwięcej?
- **Dane:** PRZYST, AED, WC, EKO, BOISKA, SPORT, WYD, BO
- **Moment „wow” w demo:** Mapa luk i wykres „wydatki BO a deficyt usług”.
- **Oceny:** Dane 10 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Analiza strategiczna, bardzo dobra dla Biura Strategii.
- **Ryzyka:** Analizy 15-min są popularne. Pomaga połączenie z BO.

<a id="p009"></a>
### #9. Każda sekunda – AED a wydarzenia masowe
**Kategoria:** W3 · **Typ:** Analityka, bezpieczeństwo · **Wynik: 74.3** ★★★★☆ (ocena jury 7.65/10)

- **Opis:** Dla każdego nadchodzącego wydarzenia z kalendarza miasta liczymy pieszy czas dotarcia do najbliższego AED i ostrzegamy organizatora („koncert X: najbliższy AED 7 min, rekomendujemy mobilny AED”). Do tego mapa „pustyń AED”.
- **Dane:** AED, WYD, PRZYST, GPS, WC
- **Moment „wow” w demo:** Lista weekendowych wydarzeń z czerwonymi flagami.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo konkretne i ratujące życie.
- **Ryzyka:** AED to oczywisty temat, więc tłok na konkursie.

<a id="p010"></a>
### #10. Elektryfikacja 2076 – które linie elektryfikować najpierw
**Kategoria:** W1 → pasuje do W3 · **Typ:** Analityka, optymalizacja · **Wynik: 74.0** ★★★★☆ (ocena jury 8.35/10)

- **Opis:** Łączymy rejestr taboru (rok, trakcja) z pozycjami na żywo, żeby wiedzieć, które linie dziś obsługują stare diesle. Nakładamy to na jakość powietrza i lokalizację szkół. Algorytm układa kolejność elektryfikacji linii tak, by jak najszybciej zmniejszyć ekspozycję dzieci na spaliny. Do tego ścieżka do 100% zeroemisyjnej floty.
- **Dane:** TABOR (rok produkcji, trakcja), GPS (numer pojazdu na linii), AQ, BOISKA (szkoły), PRZYST
- **Moment „wow” w demo:** Mapa linii pokolorowanych według wieku i trakcji pojazdów na żywo oraz ranking priorytetów.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Bardzo dobre, nieoczywiste łączenie 3–5 zbiorów. Realny decydent (ZTM/MZA). Mało kto zajrzy do zbioru o taborze.
- **Ryzyka:** Dopasowanie pojazdów z GPS do taboru wymaga ostrożnego łączenia numerów taborowych.

<a id="p011"></a>
### #11. Warszawa MCP – otwarte dane dla każdego asystenta AI (z Bielikiem)
**Kategoria:** W3 · **Typ:** AI agent, infrastruktura · **Wynik: 74.0** ★★★★☆ (ocena jury 7.80/10)

- **Opis:** Serwer Model Context Protocol, który udostępnia wszystkie zbiory miasta jako narzędzia dla AI. Dzięki temu dowolny asystent (Bielik, Claude, ChatGPT, Copilot) odpowiada na pytania o Warszawę na prawdziwych danych. Do tego referencyjny czat na Bieliku z mapą wyników. Miasto zmienia się z dostawcy plików w dostawcę danych dla ery AI.
- **Dane:** Wszystkie 23 zbiory przez API
- **Moment „wow” w demo:** Ten sam prompt w 3 różnych asystentach i za każdym razem poprawna odpowiedź z danymi miasta na żywo.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 10
- **Uzasadnienie:** Dla Wydziału Zarządzania Danymi i Bielik.AI to strzał w dziesiątkę. Proste i wdrażalne.
- **Ryzyka:** Czaty będą też u innych zespołów. Trzeba podkreślić aspekt infrastrukturalny.

<a id="p012"></a>
### #12. Konsultacje bez barier – ETR, ukraiński, angielski, audio
**Kategoria:** W3 · **Typ:** AI LLM, dostępność · **Wynik: 73.4** ★★★★☆ (ocena jury 7.50/10)

- **Opis:** Automatyczne wersje każdej konsultacji: tekst łatwy do czytania, ukraiński i angielski (duża społeczność ukraińska w Warszawie) oraz audio. Narzędzie może działać jako wtyczka do portalu konsultacji.
- **Dane:** KONS, KONS-kategorie, KONS-dzielnice
- **Moment „wow” w demo:** Konsultacja w 4 wersjach i porównanie czytelności (indeks FOG).
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 8
- **Uzasadnienie:** Bardzo wdrażalne, inkluzywne, tanie.
- **Ryzyka:** Technicznie proste, mniej wow.

<a id="p013"></a>
### #13. Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów
**Kategoria:** W2 → pasuje do W3 · **Typ:** AI głos, telefonia · **Wynik: 73.3** ★★★★☆ (ocena jury 8.20/10)

- **Opis:** Zwykły numer telefonu, bez aplikacji i internetu. Senior dzwoni i pyta po polsku: „Co ciekawego jest jutro na Bielanach?”, „Kiedy przyjedzie 180?”. Agent głosowy (STT, Bielik z narzędziami do API miasta, TTS) odpowiada z prawdziwych danych. Kanał operatora telekomunikacyjnego to naturalne wdrożenie.
- **Dane:** WYD, SPORT (60+), ODJ, GPS, WC, AED, AQ, KONS, EKO
- **Moment „wow” w demo:** Juror dzwoni ze swojego telefonu na scenie i dostaje odpowiedź z danych na żywo.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Najmocniejsze demo „na żywo” i walka z wykluczeniem cyfrowym. CTO Play i Bielik.AI w jury.
- **Ryzyka:** Opóźnienia głosu i hałas na sali. Trzeba mieć nagrany backup.

<a id="p014"></a>
### #14. BO pod lupą – co się udało, co utknęło
**Kategoria:** W3 · **Typ:** Transparentność, dataviz · **Wynik: 72.3** ★★★★☆ (ocena jury 7.45/10)

- **Opis:** Panel przejrzystości Budżetu Obywatelskiego: realizacja w czasie, opóźnienia, kategorie wygrywające w dzielnicach, rozkład pieniędzy na mieszkańca.
- **Dane:** BO (statusy, kosztorysy, edycje)
- **Moment „wow” w demo:** Interaktywne wykresy według dzielnic i edycji.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Solidne i wdrażalne.
- **Ryzyka:** Dashboard to przeciętna innowacyjność.

<a id="p015"></a>
### #15. Gołoledź Alert – ostrzeżenia z temperatury nawierzchni
**Kategoria:** W3 · **Typ:** Analityka, alerty · **Wynik: 71.7** ★★★★☆ (ocena jury 7.75/10)

- **Opis:** Stacje ZOM mierzą temperaturę nawierzchni, a mało kto o tym wie. Gdy nawierzchnia jest poniżej 0°C przy wilgoci, wysyłamy alert dla seniorów i rowerzystów i pokazujemy mapę ryzyka dla służb zimowego utrzymania (ZOM to właściciel danych). Do tego przewidywanie oblodzenia 2–3 h naprzód.
- **Dane:** POG (temp. nawierzchni, wilgotność, opad), PRZYST, TRASY, AED
- **Moment „wow” w demo:** Symulacja zimowej nocy i alerty pojawiające się na mapie.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo nieoczywiste użycie danych, realny właściciel wdrożenia. Upadki seniorów kosztują system zdrowia.
- **Ryzyka:** W październiku nie będzie realnego oblodzenia, więc demo musi być symulacją.

<a id="p016"></a>
### #16. Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo
**Kategoria:** W2 → pasuje do W3 · **Typ:** AI tekst, druk · **Wynik: 71.4** ★★★★☆ (ocena jury 7.35/10)

- **Opis:** Co tydzień generowana jednostronicowa gazetka dla osiedla (PDF do druku w domach kultury, bibliotekach i spółdzielniach): wydarzenia, konsultacje, utrudnienia, zajęcia dla seniorów, ekopunkty. Tekst łatwy do czytania. Docieramy do ludzi, do których aplikacje nie dotrą.
- **Dane:** WYD, KONS, BO, UTR, SPORT, WC, AED, EKO
- **Moment „wow” w demo:** Rozdajemy jury wydrukowane gazetki dla ich dzielnic.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo wdrażalne i tanie. Fizyczny artefakt na pitchu zapada w pamięć.
- **Ryzyka:** Mniej techniczne, część jury może uznać to za mało ambitne.

<a id="p017"></a>
### #17. Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu
**Kategoria:** W3 · **Typ:** Analityka klimatyczna · **Wynik: 71.3** ★★★★☆ (ocena jury 7.70/10)

- **Opis:** Metryka „ekspozycja cieplna oczekiwania” = średni czas czekania (z częstotliwości odjazdów) × temperatura nawierzchni × brak cienia. Ranking przystanków, na których wiata, drzewo albo kurtyna wodna dadzą najwięcej, wraz z gotowym uzasadnieniem do BO lub ZTM.
- **Dane:** PRZYST, LINIE, ODJ (częstotliwość = czas czekania), POG (temp. nawierzchni), AQ; + LoD2/OSM (zacienienie)
- **Moment „wow” w demo:** Top 10 „najgorętszych” przystanków ze zdjęciami i AI-wizualizacją po adaptacji.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Nieoczywiste połączenie danych transportowych i pogodowych, konkretny i tani wynik.
- **Ryzyka:** Zacienienie trzeba oszacować z danych zewnętrznych. Mała rozdzielczość stacji ZOM.

<a id="p018"></a>
### #18. Uczciwa cena – sprawdź, czy mieszkanie nie jest przepłacone
**Kategoria:** W3 · **Typ:** Aplikacja konsumencka, ML · **Wynik: 70.8** ★★★★☆ (ocena jury 7.65/10)

- **Opis:** Wklejasz ogłoszenie. Model oparty na prawdziwych transakcjach z RCN szacuje cenę rynkową i pokazuje 10 porównywalnych transakcji oraz „jakość okolicy” z otwartych danych.
- **Dane:** RCN, PRZYST, AQ, AED, BOISKA, WC
- **Moment „wow” w demo:** Wklejenie ogłoszenia z portalu i werdykt.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo zrozumiały problem.
- **Ryzyka:** Istnieją serwisy komercyjne. Warunki wykorzystania RCN mogą ograniczać zastosowania.

<a id="p019"></a>
### #19. Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca
**Kategoria:** W1 → pasuje do W3 · **Typ:** AI obraz, 3D, mapa · **Wynik: 70.7** ★★★★☆ (ocena jury 8.40/10)

- **Opis:** Mapa 3D Warszawy (budynki LoD2/OSM w deck.gl lub MapLibre). Klikasz dowolny punkt: widzisz zdjęcie ulicy dziś (Mapillary) i wersję „2076” wygenerowaną modelem image-to-image. Prompt nie jest wymyślony – składa się z danych: zaplanowane projekty BO i konsultacje w promieniu 300 m, temperatura nawierzchni ze stacji ZOM, jakość powietrza, dostępność komunikacji. Każdy render ma „paragon danych”, czyli wyjaśnienie, z czego wynika każda zmiana, oraz przycisk „wpłyń na to dziś”, który prowadzi do trwającej konsultacji albo głosowania BO.
- **Dane:** BO, KONS, POG (temp. nawierzchni), AQ, PRZYST/LINIE; + LoD2 GUGiK, Mapillary
- **Moment „wow” w demo:** Jurorka podaje adres swojego biura, a po 15 s widzi jego wersję z 2076 r. z listą danych, które ją ukształtowały.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 10 · Wykonalność 6 · Dopasowanie do jury 8
- **Uzasadnienie:** Maksymalny efekt wow i mocny związek z W1. Paragon danych podnosi ocenę za wykorzystanie danych, a link do konsultacji daje ścieżkę wdrożenia dla Biura Strategii.
- **Ryzyka:** Obrazy AI mogą być odebrane jako gadżet. Trzeba mocno pokazać logikę danych. Ryzyko integracji 3D i Mapillary w 24 h.

<a id="p020"></a>
### #20. Warszawa Data Stories – automatyczne dziennikarstwo danych
**Kategoria:** W3 · **Typ:** AI LLM, dataviz · **Wynik: 70.5** ★★★★☆ (ocena jury 7.55/10)

- **Opis:** Agent co tydzień przegląda dane miasta, znajduje anomalie i ciekawostki („najgorsze powietrze tygodnia na Targówku”, „rekordowa liczba wydarzeń”) i pisze krótkie artykuły z wykresami dla mediów lokalnych i social media.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** 3 wygenerowane historie z dzisiejszych danych.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Promuje portal otwartych danych, co odpowiada interesowi Wydziału Zarządzania Danymi.
- **Ryzyka:** Wymaga historii danych, której w API często nie ma.

<a id="p021"></a>
### #21. Zapytaj Dane – analityk AI dla urzędników (Bielik on-prem)
**Kategoria:** W3 · **Typ:** AI agent, BI · **Wynik: 69.9** ★★★☆☆ (ocena jury 7.80/10)

- **Opis:** Urzędnik pyta w języku naturalnym („ile projektów BO o zieleni zrealizowano na Pradze i gdzie brakuje AED?”). Agent pisze zapytania, łączy zbiory i oddaje mapę lub wykres. Działa lokalnie na Bieliku, bez wysyłania danych do USA (suwerenność danych).
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Pytanie zadane przez jurora z urzędu i mapa w 20 s.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Suwerenne AI w administracji to temat MC i Bielik.AI.
- **Ryzyka:** Łatwo o błędne odpowiedzi agenta. Potrzebne jest pokazanie zapytań.

<a id="p022"></a>
### #22. Ile kosztuje metro? – premia cenowa transportu
**Kategoria:** W3 · **Typ:** Ekonometria, mapa · **Wynik: 69.5** ★★★☆☆ (ocena jury 7.90/10)

- **Opis:** Model hedoniczny na transakcjach RCN: ile procent do ceny m² dodaje bliskość metra, tramwaju i częstych linii. Wynik dla polityki: ile wartości tworzą inwestycje transportowe i jak miasto może ją przechwycić. Z prognozą dla planowanych odcinków M3.
- **Dane:** RCN, PRZYST, LINIE, ODJ
- **Moment „wow” w demo:** Mapa „premii za metro” i wykres przed i po otwarciu stacji M2.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Ciekawe dla strategii i inwestora. Mocne użycie RCN.
- **Ryzyka:** Ekonometria w 24 h może być słaba statystycznie.

<a id="p023"></a>
### #23. Dane w szkole – lekcje z Warszawą na żywo
**Kategoria:** W3 · **Typ:** Edukacja, AI · **Wynik: 68.7** ★★★☆☆ (ocena jury 7.35/10)

- **Opis:** Generator zadań z matematyki, geografii i WOS opartych na danych miasta z dzisiaj („oblicz średnią prędkość tramwaju 17”, „porównaj ceny m² na Woli i Bemowie”). Dla nauczycieli, z kartami pracy w PDF.
- **Dane:** GPS, AQ, POG, RCN, BO
- **Moment „wow” w demo:** Karta pracy wygenerowana na żywo z dzisiejszych danych.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Edukacja to obszar 42 Warsaw. Wdrożenie przez Biuro Edukacji.
- **Ryzyka:** Mało wow.

<a id="p024"></a>
### #24. Gdzie zamieszkać – dopasowanie dzielnicy do stylu życia
**Kategoria:** W3 · **Typ:** Rekomendacje · **Wynik: 68.5** ★★★☆☆ (ocena jury 7.40/10)

- **Opis:** Quiz o stylu życia, z którego wychodzi ranking osiedli z ceną z RCN i dopasowaniem do preferencji.
- **Dane:** RCN, AQ, PRZYST, SPORT, WYD, BOISKA, WC, AED
- **Moment „wow” w demo:** Quiz z jurorami.
- **Oceny:** Dane 10 · Innowacyjność 5 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Łączy wiele zbiorów.
- **Ryzyka:** Bardzo częsty pomysł na hackathonach.

<a id="p025"></a>
### #25. Warszawa Wrapped – miasto w stylu Spotify Wrapped
**Kategoria:** W2 → pasuje do W3 · **Typ:** Dataviz, social · **Wynik: 68.5** ★★★☆☆ (ocena jury 7.05/10)

- **Opis:** Interaktywne, udostępnialne „podsumowanie roku” Warszawy (lub Twojej dzielnicy) z danych: ile projektów BO zrealizowano, ile wydarzeń się odbyło, mediana ceny m², ile pojazdów jeździ teraz. Narzędzie promocji otwartych danych.
- **Dane:** BO, KONS, RCN, WYD, GPS, AQ, AED, WC
- **Moment „wow” w demo:** Pionowa karuzela kart jak w Instagram Stories.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 5 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo łatwe, ładne, promuje portal danych.
- **Ryzyka:** Część zbiorów to tylko stan bieżący (brak historii). Słaby „problem do rozwiązania”.

<a id="p026"></a>
### #26. Czy mój projekt BO wygra? – trener wniosków
**Kategoria:** W3 · **Typ:** ML, AI LLM · **Wynik: 68.2** ★★★☆☆ (ocena jury 7.75/10)

- **Opis:** Model uczony na historycznych projektach BO przewiduje szansę wygranej i doradza (np. „projekty zieleni poniżej 200 tys. zł wygrywają w tej dzielnicy w 64%”). Bielik poprawia czytelność opisu.
- **Dane:** BO (wyniki głosowań, opisy, koszty, lokalizacje)
- **Moment „wow” w demo:** Wklejenie opisu i prawdopodobieństwo z rekomendacjami.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Ciekawy ML na rzadko analizowanych danych.
- **Ryzyka:** Etyka „optymalizacji pod głosowanie”. Niewielki zbiór treningowy.

<a id="p027"></a>
### #27. Agent uwag do konsultacji – pomoc w napisaniu rzeczowej opinii
**Kategoria:** W3 · **Typ:** AI LLM · **Wynik: 68.2** ★★★☆☆ (ocena jury 7.30/10)

- **Opis:** Mieszkaniec mówi, co mu się nie podoba. AI pomaga sformułować konkretną, rzeczową uwagę z danymi („przystanek ma tylko 2 linie, a w promieniu 500 m...”) i wskazuje termin i formę złożenia.
- **Dane:** KONS, AQ, PRZYST, RCN, AED, WC
- **Moment „wow” w demo:** Przekształcenie emocjonalnej wypowiedzi w merytoryczną uwagę.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Podnosi jakość partycypacji, co wprost pomaga urzędowi.
- **Ryzyka:** Ryzyko „AI-spamu” w konsultacjach. Trzeba pokazać zabezpieczenia.

<a id="p028"></a>
### #28. Data Quality Watchdog – audyt jakości miejskich zbiorów
**Kategoria:** W3 · **Typ:** Narzędzie dla urzędu · **Wynik: 68.2** ★★★☆☆ (ocena jury 6.95/10)

- **Opis:** Automatyczny monitoring kompletności, aktualności i spójności zbiorów (np. toalety bez godzin, AED z nieaktualną datą) z raportem dla urzędu i publicznym wskaźnikiem jakości.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Raport „zdrowia” 23 zbiorów.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 7 · Prezentacja 5 · Wykonalność 9 · Dopasowanie do jury 8
- **Uzasadnienie:** Wdrażalne od jutra, cenne dla urzędu.
- **Ryzyka:** Nudne na scenie. Może zostać odebrane jako wytykanie błędów.

<a id="p029"></a>
### #29. Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D
**Kategoria:** W1 → pasuje do W3 · **Typ:** 3D, analityka przestrzenna, AI wizja · **Wynik: 68.0** ★★★☆☆ (ocena jury 8.15/10)

- **Opis:** Z modelu LoD2 liczymy płaskie i lekko nachylone dachy, ich powierzchnię i orientację. Dla każdego budynku szacujemy potencjał zielonego dachu, fotowoltaiki i retencji deszczówki. Priorytet rośnie tam, gdzie stacje ZOM pokazują najgorętszą nawierzchnię i największe opady, oraz przy szkołach (z bazy otwartych boisk). Efektem jest mapa 3D z dachami pokolorowanymi według potencjału i symulacja „Warszawa 2076, jeśli zazielenimy 20% dachów”.
- **Dane:** POG (temp. nawierzchni, opady), BOISKA (szkoły), BO, AQ; + LoD2 GUGiK (geometria dachów), ortofoto
- **Moment „wow” w demo:** Lot kamerą nad 3D Warszawą, dachy zmieniają kolor na zielony, a licznik pokazuje m² zieleni, MWh i m³ zatrzymanej wody.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Spektakularne 3D z twardą analityką i realnym programem miejskim (dotacje na zielone dachy, adaptacja do zmian klimatu).
- **Ryzyka:** Parsowanie CityGML LoD2 dla całego miasta jest ciężkie. Trzeba ograniczyć się do 1–2 dzielnic. Sama stacja ZOM to mała rozdzielczość przestrzenna.

<a id="p030"></a>
### #30. Gdzie miasto stoi – wąskie gardła i priorytet tramwajowy
**Kategoria:** W3 · **Typ:** Analityka transportowa · **Wynik: 67.6** ★★★☆☆ (ocena jury 8.10/10)

- **Opis:** Z pozycji pojazdów zbieranych co 10 s wykrywamy segmenty, na których tramwaje i autobusy tracą najwięcej czasu, i ważymy je liczbą linii. Wynikiem jest lista 10 skrzyżowań, gdzie priorytet w sygnalizacji lub buspas oszczędziłby najwięcej czasu pasażerów.
- **Dane:** GPS (zebrane w trakcie), PRZYST, ODJ, LINIE
- **Moment „wow” w demo:** Heatmapa prędkości tramwajów po 20 h zbierania.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Twarde dane i konkretne rekomendacje.
- **Ryzyka:** Analizy punktualności ZTM robi się często, więc może być kilka podobnych projektów.

<a id="p031"></a>
### #31. Toalety dla kurierów i pracowników mobilnych
**Kategoria:** W2 → pasuje do W3 · **Typ:** Mapa · **Wynik: 67.0** ★★★☆☆ (ocena jury 6.95/10)

- **Opis:** Kurierzy, kierowcy i dostawcy spędzają cały dzień w mieście bez dostępu do toalet. Mapa bezpłatnych toalet czynnych teraz plus analiza luk dla miasta i propozycje lokalizacji.
- **Dane:** WC (godziny, płatność), AED, PARK
- **Moment „wow” w demo:** Mapa „gdzie skorzystać teraz” i heatmapa luk.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Zaniedbana grupa, bardzo konkretne.
- **Ryzyka:** Wąski temat, może wydać się błahy.

<a id="p032"></a>
### #32. Witaj w Warszawie – onboarding nowych mieszkańców
**Kategoria:** W3 · **Typ:** Asystent wielojęzyczny · **Wynik: 66.7** ★★★☆☆ (ocena jury 7.20/10)

- **Opis:** Przewodnik dla nowych mieszkańców (studenci, migranci): jak segregować śmieci, gdzie oddać elektrośmieci, jak działa komunikacja, co się dzieje w okolicy, jak zabrać głos w konsultacjach. Dostępny w wielu językach.
- **Dane:** SEG, EKO, WC, ODJ, PRZYST, WYD, SPORT, KONS
- **Moment „wow” w demo:** Rozmowa po ukraińsku i odpowiedzi z danych miasta.
- **Oceny:** Dane 9 · Innowacyjność 5 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Duża grupa docelowa i realny problem.
- **Ryzyka:** Czatowe asystenty to częsty pomysł.

<a id="p033"></a>
### #33. Radar Gentryfikacji
**Kategoria:** W1 → pasuje do W3 · **Typ:** Analityka, ML · **Wynik: 66.4** ★★★☆☆ (ocena jury 7.95/10)

- **Opis:** Wykrywamy mikroobszary, w których ceny transakcyjne rosną najszybciej względem średniej dzielnicy, i zestawiamy je z inwestycjami (BO, konsultacje, nowe linie). Wynikiem jest wczesne ostrzeganie dla polityki mieszkaniowej: gdzie grozi wypieranie mieszkańców i gdzie miasto może przechwycić wzrost wartości (opłata adiacencka).
- **Dane:** RCN (szereg czasowy), BO, KONS, PRZYST
- **Moment „wow” w demo:** Animowana mapa zmian cen 2015–2026 z hotspotami i prognozą na 2030.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Mocna wartość dla Biura Strategii i ciekawy wątek dla inwestora w jury.
- **Ryzyka:** Interpretacja przyczynowa jest ryzykowna. RCN wymaga uważnego czyszczenia.

<a id="p034"></a>
### #34. Pokédex ZTM – kolekcjonerska gra taboru
**Kategoria:** W3 · **Typ:** Gra mobilna · **Wynik: 66.3** ★★★☆☆ (ocena jury 7.60/10)

- **Opis:** Kolekcjonujesz pojazdy, którymi jedziesz: rzadkie modele, historyczne malowania, najstarsze tramwaje. Na żywo widzisz, gdzie teraz jeździ „legendarny” egzemplarz. Gra zachęca do komunikacji miejskiej i trafia do dużej społeczności miłośników komunikacji.
- **Dane:** TABOR (marki, modele, rocznik, malowanie), GPS
- **Moment „wow” w demo:** Na mapie pojawia się rzadki Konstal 13N, a juror „łapie” go w aplikacji.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Bardzo zabawne, unikalne użycie zbioru o taborze.
- **Ryzyka:** Wdrożenie niepewne, może być odebrane jako żart.

<a id="p035"></a>
### #35. Cyfrowy bliźniak transportu na żywo w 3D
**Kategoria:** W1 → pasuje do W3 · **Typ:** 3D, real-time · **Wynik: 66.1** ★★★☆☆ (ocena jury 7.50/10)

- **Opis:** Wszystkie autobusy i tramwaje na żywo w trójwymiarowej Warszawie (deck.gl TripsLayer): smugi ruchu, opóźnienia, utrudnienia, chmury jakości powietrza. Tryb 2076 pokazuje tę samą sieć po planowanych rozbudowach.
- **Dane:** GPS (co 10 s), PRZYST, LINIE, TABOR, UTR, AQ; + LoD2
- **Moment „wow” w demo:** Pełnoekranowy, „filmowy” widok miasta pulsującego ruchem.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 10 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Wow na scenie i świetne wykorzystanie danych live.
- **Ryzyka:** Kolejna „mapa autobusów”, więc jury może uznać, że to nic nowego.

<a id="p036"></a>
### #36. Słyszę przystanek – asystent dla osób niewidomych
**Kategoria:** W3 · **Typ:** Dostępność, głos · **Wynik: 65.8** ★★★☆☆ (ocena jury 7.10/10)

- **Opis:** Aplikacja głosowa: „Twój autobus 160 jest dwa przystanki stąd, będzie za 3 minuty, podjedzie na stanowisko 02”. Ostrzega o utrudnieniach i prowadzi do toalet bez barier.
- **Dane:** GPS, ODJ, PRZYST, LINIE, UTR, WC
- **Moment „wow” w demo:** Demo z zasłoniętymi oczami.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Inkluzywne, wdrażalne.
- **Ryzyka:** Istnieją podobne rozwiązania.

<a id="p037"></a>
### #37. Boiska otwarte naprawdę – analiza godzin dostępności
**Kategoria:** W3 · **Typ:** Analityka · **Wynik: 64.6** ★★☆☆☆ (ocena jury 6.70/10)

- **Opis:** Analiza, ile godzin tygodniowo szkolne boiska są dostępne dla mieszkańców w każdej dzielnicy, i rekomendacja wydłużenia godzin tam, gdzie brakuje infrastruktury.
- **Dane:** BOISKA, SPORT
- **Moment „wow” w demo:** Mapa „godzin dostępnych na mieszkańca”.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Tanie do wdrożenia (decyzja administracyjna).
- **Ryzyka:** Wąski zakres.

<a id="p038"></a>
### #38. Koszt utrudnienia – ile minut pasażerów zabiera remont
**Kategoria:** W3 · **Typ:** Analityka transportowa · **Wynik: 64.4** ★★☆☆☆ (ocena jury 8.15/10)

- **Opis:** Łączymy utrudnienia z infoulice z pozycjami pojazdów zbieranymi przez 20 h. Mierzymy, ile minut opóźnienia generuje każde utrudnienie dla linii przez nie przechodzących, i układamy ranking „najdroższych” remontów. To narzędzie dla ZDM do planowania objazdów.
- **Dane:** UTR, GPS (zebrane w trakcie hackathonu), ODJ, LINIE
- **Moment „wow” w demo:** Mapa utrudnień z „licznikiem straconych minut” na żywo.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo innowacyjna metryka, realna wartość dla ZDM i ZTM.
- **Ryzyka:** Dopasowanie pozycji do rozkładu jest trudne (brak GTFS w portalu). 20 h danych to mało.

<a id="p039"></a>
### #39. P+R Predict – prognoza wolnych miejsc i zachęta do przesiadki
**Kategoria:** W3 · **Typ:** ML, aplikacja · **Wynik: 63.7** ★★☆☆☆ (ocena jury 7.30/10)

- **Opis:** Model przewiduje obłożenie P+R za 30–60 min i mówi kierowcy: „zostaw auto na P+R Młociny, wolne miejsca będą do 8:20, metro za 3 min, oszczędzasz 14 min”.
- **Dane:** PARK (co minutę, zbierane w trakcie), ODJ, GPS, WYD, POG
- **Moment „wow” w demo:** Prognoza na wykresie i powiadomienie dla kierowcy.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Realny problem i dane live.
- **Ryzyka:** Zaledwie 24 h historii do treningu.

<a id="p040"></a>
### #40. Senior 2076 – audyt miasta dla starzejącego się społeczeństwa
**Kategoria:** W1 → pasuje do W3 · **Typ:** Analityka dostępności · **Wynik: 63.5** ★★☆☆☆ (ocena jury 6.85/10)

- **Opis:** W 2076 r. co trzeci warszawiak będzie seniorem. Liczymy indeks „przyjazności dla seniora” w siatce heksagonów: toalety bez barier, AED, przystanki, zajęcia dla 60+. Wskazujemy luki i priorytety inwestycyjne.
- **Dane:** WC (dostępność, godziny), AED, PRZYST, SPORT (oferta dla seniorów), WYD
- **Moment „wow” w demo:** Mapa heksagonów z lukami i wygenerowana lista 10 rekomendacji.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Solidne, wdrażalne, mocny związek ze strategią.
- **Ryzyka:** Dość klasyczna analityka, mniej wow.

<a id="p041"></a>
### #41. Wyjdź wcześniej – utrudnienia w Twoim kalendarzu
**Kategoria:** W3 · **Typ:** Integracja kalendarza · **Wynik: 63.4** ★★☆☆☆ (ocena jury 6.90/10)

- **Opis:** Proaktywny alert: „Twoje spotkanie o 9:00, na trasie remont, wyjdź 12 min wcześniej, linia 523 ma opóźnienia”.
- **Dane:** UTR, GPS, ODJ
- **Moment „wow” w demo:** Powiadomienie na podstawie kalendarza jurora.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Codzienna wartość.
- **Ryzyka:** Konkurencja z Google Maps.

<a id="p042"></a>
### #42. Infoulice AI – utrudnienia po ludzku
**Kategoria:** W3 · **Typ:** AI LLM · **Wynik: 61.6** ★★☆☆☆ (ocena jury 6.70/10)

- **Opis:** LLM zamienia komunikaty o utrudnieniach w strukturalne dane i proste streszczenia: które linie są dotknięte, jak długo, jaki jest objazd.
- **Dane:** UTR, LINIE, PRZYST
- **Moment „wow” w demo:** Komunikat przed i po.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Proste i przydatne.
- **Ryzyka:** Mało spektakularne.

<a id="p043"></a>
### #43. Warszawa w RCS / SMS – info bez aplikacji
**Kategoria:** W2 → pasuje do W3 · **Typ:** Kanał telco · **Wynik: 61.4** ★★☆☆☆ (ocena jury 6.55/10)

- **Opis:** Usługa wiadomości RCS i SMS: piszesz „Wola wieczór” i dostajesz karuzelę wydarzeń z dojazdem. Kanał natywny dla operatora.
- **Dane:** WYD, ODJ, AQ, UTR, KONS
- **Moment „wow” w demo:** Demo w aplikacji Wiadomości na telefonie jurora.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Bezpośrednio dopasowane do CTO Play.
- **Ryzyka:** Dostęp do RCS Business Messaging w 24 h może być niemożliwy (fallback SMS).

<a id="p044"></a>
### #44. Puls Miasta – dashboard dla prezydenta
**Kategoria:** W3 · **Typ:** Dashboard · **Wynik: 61.3** ★★☆☆☆ (ocena jury 6.60/10)

- **Opis:** Jedno okno z bieżącym stanem miasta.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Ekran z kafelkami.
- **Oceny:** Dane 9 · Innowacyjność 4 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Dużo danych.
- **Ryzyka:** Klasyczny dashboard o niskiej innowacyjności.

<a id="p045"></a>
### #45. AR: zobacz projekt na swojej ulicy (text-to-3D + WebXR)
**Kategoria:** W1 → pasuje do W3 · **Typ:** AI 3D, AR · **Wynik: 61.1** ★★☆☆☆ (ocena jury 8.20/10)

- **Opis:** Z opisu projektu BO lub konsultacji model text-to-3D (np. TRELLIS / Hunyuan3D / Meshy) generuje obiekt: ławkę, plac zabaw, wiatę. Telefon w WebXR stawia go w prawdziwym miejscu w skali 1:1. Mieszkańcy widzą, na co głosują.
- **Dane:** BO (opisy i lokalizacje), KONS
- **Moment „wow” w demo:** Wideo z AR nagrane w nocy na ulicy przy kampusie 42 i na żywo model na scenie.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 4 · Dopasowanie do jury 7
- **Uzasadnienie:** Najwyższa innowacyjność i świetne dopasowanie do Twojego zainteresowania 3D/AI.
- **Ryzyka:** Najwyższe ryzyko techniczne (WebXR, jakość modeli 3D). Demo w sali jest trudne.

<a id="p046"></a>
### #46. Dostępny przejazd – planer dla osób z niepełnosprawnościami
**Kategoria:** W3 · **Typ:** Planer · **Wynik: 61.1** ★★☆☆☆ (ocena jury 6.65/10)

- **Opis:** Trasa z gwarancją toalet bez barier po drodze i ostrzeżeniami o utrudnieniach.
- **Dane:** WC (Dostępność), PRZYST, ODJ, GPS, UTR
- **Moment „wow” w demo:** Planer z filtrem dostępności.
- **Oceny:** Dane 7 · Innowacyjność 5 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Inkluzywny.
- **Ryzyka:** Mało danych o dostępności (brak danych o windach i peronach).

<a id="p047"></a>
### #47. Ceny a smog – ile warte jest czyste powietrze
**Kategoria:** W3 · **Typ:** Ekonometria · **Wynik: 60.7** ★★☆☆☆ (ocena jury 6.95/10)

- **Opis:** Badanie, czy jakość powietrza wpływa na ceny transakcyjne w Warszawie.
- **Dane:** RCN, AQ, POG
- **Moment „wow” w demo:** Wykres korelacji.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ciekawa teza.
- **Ryzyka:** Mało stacji AQ, wynik może być nieistotny.

<a id="p048"></a>
### #48. Eko-przypominacz po drodze
**Kategoria:** W3 · **Typ:** Geofencing · **Wynik: 60.7** ★★☆☆☆ (ocena jury 6.60/10)

- **Opis:** Przypomnienie „mijasz ekopunkt, masz w plecaku baterie?” na podstawie trasy i listy rzeczy do oddania.
- **Dane:** EKO, SEG, PRZYST
- **Moment „wow” w demo:** Powiadomienie na trasie.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Prosty nudge.
- **Ryzyka:** Niski wow.

<a id="p049"></a>
### #49. Ratownik w okolicy – społecznościowi ratownicy i AED
**Kategoria:** W3 · **Typ:** Aplikacja ratunkowa · **Wynik: 59.4** ★★☆☆☆ (ocena jury 6.80/10)

- **Opis:** Model szwedzkiego Heartrunnera: przeszkoleni wolontariusze dostają alert o zatrzymaniu krążenia w pobliżu. Jedna osoba biegnie po AED, druga do poszkodowanego.
- **Dane:** AED, PRZYST, WYD
- **Moment „wow” w demo:** Symulacja alertu na 2 telefonach.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ratuje życie, dobre demo.
- **Ryzyka:** Wdrożenie wymaga integracji z dyspozytorami PRM (nie z miastem). Istnieją podobne inicjatywy.

<a id="p050"></a>
### #50. SegregujAI – zdjęcie śmiecia i właściwy pojemnik
**Kategoria:** W3 · **Typ:** AI wizja · **Wynik: 59.3** ★★☆☆☆ (ocena jury 6.15/10)

- **Opis:** Model wizji rozpoznaje odpad na zdjęciu i mówi, do którego pojemnika go wrzucić i gdzie jest najbliższy ekopunkt.
- **Dane:** SEG, Typy odpadów, EKO
- **Moment „wow” w demo:** Zdjęcie kubka po kawie.
- **Oceny:** Dane 6 · Innowacyjność 3 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Wdrażalne w SegregujNa5.
- **Ryzyka:** Prawie identyczny projekt (SeGregiusz) wygrał miejski hackathon w 2021 r., więc brak nowości.

<a id="p051"></a>
### #51. Czy boisko jest wolne? – crowdsourcing zajętości
**Kategoria:** W3 · **Typ:** Aplikacja · **Wynik: 59.1** ★★☆☆☆ (ocena jury 6.50/10)

- **Opis:** Szybki check-in „jest wolne” lub „zajęte” na otwartych boiskach.
- **Dane:** BOISKA
- **Moment „wow” w demo:** Check-in.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Prosty.
- **Ryzyka:** Zimny start bez użytkowników.

<a id="p052"></a>
### #52. Izochrony na żywo – jak daleko zajadę teraz
**Kategoria:** W3 · **Typ:** Analityka, mapa · **Wynik: 58.8** ★★☆☆☆ (ocena jury 7.10/10)

- **Opis:** Mapa zasięgu 15, 30 i 45 minut komunikacją z dowolnego punktu, liczona z bieżących opóźnień.
- **Dane:** GPS, ODJ, PRZYST
- **Moment „wow” w demo:** Pulsujące izochrony.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Ładne i zrozumiałe.
- **Ryzyka:** Routing w 24 h bez GTFS jest trudny.

<a id="p053"></a>
### #53. Voxel Warszawa – instalacja artystyczna danych
**Kategoria:** W3 · **Typ:** Sztuka danych, 3D · **Wynik: 58.4** ★★☆☆☆ (ocena jury 6.75/10)

- **Opis:** Wokselowa Warszawa, w której smog to mgła, tramwaje to światła, a deszcz to cząsteczki. Instalacja na żywo.
- **Dane:** AQ, GPS, POG; + LoD2
- **Moment „wow” w demo:** Fullscreen art.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 5
- **Uzasadnienie:** Duży wow.
- **Ryzyka:** Brak użyteczności.

<a id="p054"></a>
### #54. Martwe przystanki – obszary niedoobsłużone przez komunikację
**Kategoria:** W3 · **Typ:** Analityka transportowa · **Wynik: 58.1** ★★☆☆☆ (ocena jury 6.65/10)

- **Opis:** Liczymy częstotliwość odjazdów dla każdego przystanku i wskazujemy obszary z najsłabszą obsługą.
- **Dane:** PRZYST, LINIE, ODJ
- **Moment „wow” w demo:** Mapa częstotliwości.
- **Oceny:** Dane 8 · Innowacyjność 5 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Solidne.
- **Ryzyka:** Ciężkie pobieranie odjazdów przystanek po przystanku przez API.

<a id="p055"></a>
### #55. Sprawdzam! – fact-checking wypowiedzi na danych miasta
**Kategoria:** W3 · **Typ:** AI LLM · **Wynik: 57.7** ★☆☆☆☆ (ocena jury 6.60/10)

- **Opis:** Bot weryfikujący twierdzenia o Warszawie (np. „powietrze jest coraz gorsze”) na otwartych danych.
- **Dane:** BO, AQ, RCN, KONS
- **Moment „wow” w demo:** Weryfikacja przykładowej wypowiedzi.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ciekawa idea.
- **Ryzyka:** Polityczne ryzyko przed jury z urzędu. Wąskie dane.

<a id="p056"></a>
### #56. Tablica sąsiedzka – e-ink z odjazdami i wydarzeniami do klatki schodowej
**Kategoria:** W3 · **Typ:** Hardware + dane · **Wynik: 57.3** ★☆☆☆☆ (ocena jury 6.55/10)

- **Opis:** Tani wyświetlacz e-ink (ESP32 lub Raspberry Pi) do klatek schodowych i domów kultury: najbliższe odjazdy, jakość powietrza, wydarzenia i konsultacje na osiedlu. Dla wspólnot i spółdzielni.
- **Dane:** ODJ, GPS, WYD, AQ, UTR, KONS
- **Moment „wow” w demo:** Fizyczne urządzenie na scenie z danymi na żywo.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Fizyczny artefakt zapada w pamięć.
- **Ryzyka:** Potrzebny sprzęt, który trzeba mieć ze sobą (sam sprzęt to nie kod, więc wolno).

<a id="p057"></a>
### #57. Bezpieczna droga do szkoły
**Kategoria:** W3 · **Typ:** Analityka · **Wynik: 56.8** ★☆☆☆☆ (ocena jury 6.50/10)

- **Opis:** Analiza dojść do szkół: utrudnienia, przystanki, AED w pobliżu szkół.
- **Dane:** BOISKA (lista szkół), UTR, PRZYST, AED
- **Moment „wow” w demo:** Mapa szkół z oceną.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ważny temat.
- **Ryzyka:** Brak danych o wypadkach i przejściach.

<a id="p058"></a>
### #58. Wojna śmieciowa – quiz segregacji dzielnic
**Kategoria:** W3 · **Typ:** Gra · **Wynik: 55.9** ★☆☆☆☆ (ocena jury 5.85/10)

- **Opis:** Quiz z rankingiem dzielnic.
- **Dane:** SEG, Typy odpadów
- **Moment „wow” w demo:** Quiz z jury.
- **Oceny:** Dane 6 · Innowacyjność 4 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 5
- **Uzasadnienie:** Proste.
- **Ryzyka:** Mało innowacyjne.

<a id="p059"></a>
### #59. Czasoprzestrzenna kostka wydarzeń 3D
**Kategoria:** W3 · **Typ:** Dataviz 3D · **Wynik: 54.9** ★☆☆☆☆ (ocena jury 6.35/10)

- **Opis:** Wydarzenia jako punkty w przestrzeni 3D (x, y = mapa, z = czas).
- **Dane:** WYD, SPORT
- **Moment „wow” w demo:** Obrót kostki.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 4 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 5
- **Uzasadnienie:** Efektowna wizualizacja.
- **Ryzyka:** Mała użyteczność.

<a id="p060"></a>
### #60. AED Trening – gra edukacyjna 3D
**Kategoria:** W3 · **Typ:** Gra 3D, edukacja · **Wynik: 53.5** ★☆☆☆☆ (ocena jury 6.45/10)

- **Opis:** Krótka gra 3D: ktoś upada na ulicy w prawdziwej Warszawie, a Ty musisz znaleźć najbliższy AED i wykonać RKO.
- **Dane:** AED; + LoD2
- **Moment „wow” w demo:** Rozgrywka na scenie.
- **Oceny:** Dane 5 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 6 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Edukacyjne, z elementem 3D.
- **Ryzyka:** Słabe użycie danych.

<a id="p061"></a>
### #61. GeoGuessr Warszawa z danymi
**Kategoria:** W3 · **Typ:** Gra · **Wynik: 53.2** ★☆☆☆☆ (ocena jury 5.85/10)

- **Opis:** Zgadujesz lokalizację na podstawie zdjęcia, a po odpowiedzi dostajesz ciekawostki z danych o tym miejscu.
- **Dane:** TRASY, WYD, RCN; + Mapillary
- **Moment „wow” w demo:** Runda z jury.
- **Oceny:** Dane 5 · Innowacyjność 5 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Zabawne.
- **Ryzyka:** Dane są tylko dodatkiem.

<a id="p062"></a>
### #62. Dyspozytor ZTM – gra symulacyjna
**Kategoria:** W3 · **Typ:** Gra · **Wynik: 52.9** ★☆☆☆☆ (ocena jury 6.75/10)

- **Opis:** Gra, w której zarządzasz siecią w czasie rzeczywistym: reagujesz na prawdziwe utrudnienia i przesuwasz pojazdy.
- **Dane:** GPS, LINIE, PRZYST, UTR
- **Moment „wow” w demo:** Rozgrywka na żywo.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 5 · Dopasowanie do jury 6
- **Uzasadnienie:** Angażujące.
- **Ryzyka:** Brak wdrożenia, trudne w 24 h.

<a id="p063"></a>
### #63. Rower czy autobus? – porównywarka na żywo
**Kategoria:** W3 · **Typ:** Porównywarka · **Wynik: 50.6** ★☆☆☆☆ (ocena jury 5.85/10)

- **Opis:** Porównanie czasu przejazdu rowerem miejskim i komunikacją teraz.
- **Dane:** GPS, ODJ; + GBFS Veturilo
- **Moment „wow” w demo:** Wyścig na mapie.
- **Oceny:** Dane 6 · Innowacyjność 5 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 5
- **Uzasadnienie:** Zrozumiałe.
- **Ryzyka:** Veturilo spoza portalu. Niska nowość.

<a id="zrodla"></a>
## 11. Źródła

- Regulamin Warsaw Open Data Hackathon 2026 (PDF): https://42warsaw.pl/wp-content/uploads/2026/09/Regulamin-Warsaw-Open-Data-Hackathon_2026.pdf
- Strona wydarzenia (42 Warsaw): https://42warsaw.pl/pl/hackathon-otwarte-dane-warszawa/
- Strona m.st. Warszawy: https://um.warszawa.pl/-/warsaw-open-data-hackathon-2026
- Raport Warszawski: https://www.raportwarszawski.pl/artykul/5292,24-godziny-na-pomysl-dla-warszawy-trwaja-zapisy-na-warsaw-open-data-hackathon-2026
- Miejski Reporter: https://miejskireporter.pl/hackathon-w-warszawie-z-pula-18-tys-zl-zostaly-ostatnie-dni-na-zgloszenie/
- Portal danych i API (lista zbiorów: `https://dane.um.warszawa.pl/api/datasets?page=1..3`): https://dane.um.warszawa.pl/pl
- Platforma IoT Warszawy (m.in. czujniki hałasu): https://iot.warszawa.pl/
- Dane architektoniczno-przestrzenne m.st. Warszawy (ortofoto, model 3D, MPZP): https://architektura.um.warszawa.pl/udostepniane-dane
- Modele 3D budynków GUGiK (LoD1/LoD2, CityGML): https://www.geoportal.gov.pl/en/data/other-data/3d-models-of-building/
- Poprzedni miejski hackathon (Warsaw Hacks, zwycięzcy SeGregiusz i SIUP): https://um.warszawa.pl/-/hackathon-odmieni-cyfrowa-warszawe
- Bielik (polski LLM, licencja Apache 2.0): https://pl.wikipedia.org/wiki/Bielik_(model_j%C4%99zykowy)
