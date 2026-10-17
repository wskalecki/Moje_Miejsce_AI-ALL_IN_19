# Warsaw Open Data Hackathon 2026: 100 pomysłów, oceny i rekomendacja

> Dokument przygotowany 15.10.2026, dwa dni przed hackathonem (sob. 17.10 – niedz. 18.10.2026, kampus 42 Warsaw, al. Solidarności 171B).  
> Pliki źródłowe: `pomysly_dane.py` (baza pomysłów i ocen) oraz `generuj.py` (formuła i generator). Zmień oceny lub wagi i uruchom `python3 generuj.py`, a ranking przeliczy się sam.

## Spis treści

1. [TL;DR – co robić](#tldr)
2. [Co wiemy o hackathonie (fakty z regulaminu)](#fakty)
3. [Dostępne dane miejskie (23 zbiory)](#dane)
4. [Wnioski strategiczne: co tu wygrywa](#strategia)
5. [Metodologia oceny](#metodologia)
6. [Ranking wszystkich 100 pomysłów](#ranking)
7. [Najlepsze pomysły w każdym wyzwaniu](#wyzwania)
8. [Trzy koncepcje finałowe: plan na 24 h, architektura, pitch](#finaly)
9. [Checklista przed sobotą](#checklista)
10. [Karty wszystkich 100 pomysłów](#karty)
11. [Źródła](#zrodla)

<a id="tldr"></a>
## 1. TL;DR – co robić

**Najważniejsze: zespół jest już przypisany do jednego wyzwania** (regulamin §3 ust. 6–13; zmiana była możliwa najpóźniej 5 dni przed wydarzeniem). Najpierw sprawdź w mailu od organizatora, które wyzwanie macie, i wybierz z sekcji 7 albo 8 koncepcję dla tej kategorii. Każde wyzwanie ma osobne nagrody (4 000 / 1 000 zł / rzeczowa), więc rywalizujecie tylko z zespołami z tej samej kategorii.

**Rekomendowana koncepcja finałowa zależnie od wyzwania:**

| Wyzwanie | Koncepcja finałowa | Z jakich pomysłów | Dlaczego |
|---|---|---|---|
| **W3 „Twój ruch!”** (lub W1) | **Widzialny Budżet**: AI-wizualizacje projektów BO + asystent pisania wniosku z luk w danych | #1 BO w obrazach + #2 Asystent wniosku BO (+ #8 15-minutowa Warszawa) | Najwyższe oceny w rankingu. AI i obrazy (Twój kierunek) służą rozwiązaniu realnego problemu, a nie same sobie. Najbogatszy zbiór danych (BO) i oczywisty właściciel w urzędzie. |
| **W1 „Warszawa 2076”** | **Rada 2076**: AI-ocena wpływu konsultacji na przyszłe pokolenia + wizualizacja „to miejsce w 2076” | #4 Rzecznik Przyszłych Pokoleń + #21 Okno 2076 | Spełnia literalnie treść W1 („rozwiązanie dziś, które kształtuje miasto za 50 lat”). Trafia w pełnomocniczkę ds. strategii, MC (Innowacyjne Polityki Publiczne) i Bielik.AI. Efekt wow z renderów 2076. |
| **W2 „Złap oddech!”** | **Radio Dzielnica**: codzienny audiobriefing o okolicy (podcast) + numer telefonu dla seniorów | #9 Radio Dzielnica + #14 Zadzwoń do Warszawy | Odpowiada na wszystkie elementy W2 (odpoczynek, wydarzenia, relacje lokalne). Demo, które jury słyszy, a nie tylko widzi. Bielik i CTO Play w jury. |

**Top 10 ogólnego rankingu:**

| # | Pomysł | Wyzwanie | Wynik |
|---|---|---|---|
| 1 | [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) | W3 (alt. W1) | **78.8** ★★★★★ |
| 2 | [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) | W3 (alt. W1) | **77.7** ★★★★★ |
| 3 | [Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)](#p003) | W3 | **77.3** ★★★★★ |
| 4 | [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) | W1 (alt. W3) | **77.0** ★★★★★ |
| 5 | [Konsultacje, które widać](#p005) | W3 (alt. W1) | **76.4** ★★★★★ |
| 6 | [Sprawiedliwość taborowa / Złap elektryka](#p006) | W3 | **75.4** ★★★★★ |
| 7 | [Bezpieczne wydarzenie – automatyczna karta dla organizatorów](#p007) | W3 | **75.2** ★★★★★ |
| 8 | [15-minutowa Warszawa – indeks dostępności usług](#p008) | W3 (alt. W1) | **75.1** ★★★★★ |
| 9 | [Radio Dzielnica – codzienny, personalizowany briefing audio](#p009) | W2 | **74.6** ★★★★☆ |
| 10 | [Każda sekunda – AED a wydarzenia masowe](#p010) | W3 | **74.3** ★★★★☆ |

**Dlaczego właśnie te?** W tym konkursie 55% oceny (dane 20% + wdrożenie 20% + związek z Warszawą 15%) nagradza projekty przyziemne i osadzone w procesach miasta, a 45% (innowacyjność 25% + prezentacja 20%) nagradza efekt wow. Zwycięzcy z czołówki rankingu łączą jedno i drugie: **AI generuje coś widowiskowego (obraz, głos, analizę), ale tylko na wejściu z prawdziwych danych miasta i z jasnym miejscem wdrożenia** (BO, konsultacje, ZTM, urzędnicy). Czyste projekty 3D/AI (Okno 2076, AR, Wehikuł czasu) mają najwyższe noty za wow, ale tracą na wykonalności w 24 h i na wdrożeniu. Dlatego rekomenduję użyć 3D i AI jako **warstwy prezentacji** zwycięskiego pomysłu, a nie jako samego pomysłu.

<a id="fakty"></a>
## 2. Co wiemy o hackathonie (fakty z regulaminu i stron organizatora)

| Element | Szczegóły |
|---|---|
| Termin i miejsce | 17–18.10.2026, kampus 42 Warsaw, al. Solidarności 171B (Wola). Rejestracja od 9:00, otwarcie 10:00, **start prac 11:00 (sob.)**, **koniec prac 11:00 (niedz.)**, prezentacje 11:30–13:30, obrady 13:30–14:30, wyniki 14:30. |
| Organizator i finansowanie | Fundacja „Wolność Wyboru” (operator 42 Warsaw). Finansowanie: m.st. Warszawa. Partner: Play. |
| Uczestnicy | Maks. 120 osób, zespoły 3–5 osób. To ok. 25–35 zespołów, czyli **ok. 8–12 zespołów na wyzwanie**. |
| Wyzwanie 1 „Warszawa 2076” | „Wyobraź sobie spacer po Warszawie za 50 lat.” Rozwiązanie obecnego problemu miasta, które kształtuje Warszawę na kolejne 50 lat. |
| Wyzwanie 2 „Warszawa – złap oddech!” | „Miasto nigdy nie zasypia, ale jego mieszkańcy potrzebują czasu na odpoczynek i regenerację.” Równowaga praca–życie, relacje z lokalną społecznością, odkrywanie miasta, bycie na bieżąco z wydarzeniami. |
| Wyzwanie 3 „Warszawa: Twój ruch!” | Dowolny problem i forma (aplikacja, gra, wizualizacja, model predykcyjny, bot), z użyciem min. 1 zbioru otwartych danych m.st. Warszawy. |
| Warunek konieczny | Rozwiązanie **musi używać min. 1 zbioru z dane.um.warszawa.pl lub miejskiego API**. Inaczej nie podlega ocenie (§4 ust. 9). Dodatkowe dane zewnętrzne (OSM, GUGiK LoD2, Mapillary) są dozwolone jako uzupełnienie. |
| **Kod przed hackathonem** | **Zakazany.** „Całość Rozwiązania musi zostać wytworzona w trakcie trwania Wydarzenia… Niedozwolone jest wykorzystywanie fragmentów kodu ani innych elementów przygotowanych przed Wydarzeniem” (§4 ust. 3). Wolno używać darmowych bibliotek open source z licencją dopuszczającą użycie komercyjne. Przed sobotą przygotowujesz więc tylko wiedzę, konta, klucze API i plan. |
| **AI** | **Dozwolone** (kod, treści, grafiki), ale trzeba **opisać zakres użycia AI w dokumentacji** (§4 ust. 4). |
| Co oddać (do końca Etapu II, czyli niedz. 11:00!) | a) prezentacja/pitch deck, b) link do repozytorium, c) dokumentacja: użyte dane miejskie, założenia, frameworki i narzędzia (§4 ust. 5–6). **Po 11:00 nie wolno nic zmieniać** (§5A ust. 6). |
| Pitch | **Do 5 minut + do 2 minut odpowiedzi na pytania jury** (§5A ust. 7). Po polsku lub angielsku. Projektor jest zapewniony. |
| Kryteria i wagi (§5A ust. 12) | **Wykorzystanie i związek z otwartymi danymi m.st. Warszawy 20%. Innowacyjność i pomysłowość 25%. Praktyczne zastosowanie i potencjał wdrożeniowy 20%. Związek z wyzwaniami i realiami Warszawy 15%. Jakość prezentacji 20%.** Każdy juror ocenia 1–5 w każdym kryterium. |
| Nagrody | Pula 18 000 zł brutto: w każdym wyzwaniu I miejsce 4 000 zł, II miejsce 1 000 zł, III miejsce nagroda rzeczowa. Możliwe wyróżnienia i promocja przez miasto. |
| IP | Kod zostaje Wasz. Laureaci udzielają miastu i organizatorowi niewyłącznej licencji (§7). |

**Jury i czego prawdopodobnie szuka każdy juror:**

| Juror | Rola | Na co będzie wrażliwy |
|---|---|---|
| dr Paulina Nowicka-Karpińska | Pełnomocniczka Prezydenta ds. strategii rozwoju miasta, Biuro Strategii i Analiz | Spójność ze strategią #Warszawa2030, długi horyzont (W1!), partycypacja, decyzje oparte na danych |
| Monika Rogowska | Naczelniczka Wydziału Zarządzania Danymi, Biuro Informatyki UM | **Głębokie i poprawne użycie ich zbiorów**, łączenie zbiorów, promocja portalu, feedback o jakości danych |
| Karol Wilczyński | Wydział Innowacyjnych Polityk Publicznych, Ministerstwo Cyfryzacji | Innowacje w polityce publicznej, GovTech, AI w administracji, skalowalność na inne miasta |
| Sonia Staniek | COO Bielik.AI | **Użycie polskiego LLM Bielik**, suwerenność AI, sensowne (nie dekoracyjne) AI |
| Michał Ziółkowski | CTO i członek zarządu Play | Wykonalność techniczna, mobile, kanały telekomunikacyjne (SMS/RCS/głos), skala |
| Artur Kurasiński | Przedsiębiorca, inwestor | Problem → produkt → model biznesowy/utrzymania, storytelling, alergia na „AI dla AI” |
| Aleksandra Czetwertyńska, Magda Gołębiewska | 42 Warsaw | Kreatywność, praca zespołowa, edukacja, jakość wykonania |

**Lekcja z poprzedniego miejskiego hackathonu (Warsaw Hacks, 2021):** wygrały *SeGregiusz* (ML rozpoznaje odpad na zdjęciu, czyli rozszerzenie istniejącej aplikacji miasta SegregujNa5) i *SIUP* (weryfikacja tożsamości urzędników, realna obawa mieszkańców). Dyrektor cyfryzacji: *„Nie chodziło nam o pomysły na kolejne apki”*. Jury miejskie nagradza **realny problem + wpięcie w istniejący proces lub usługę miasta**, a nie kolejną aplikację z mapą.

<a id="dane"></a>
## 3. Dostępne dane miejskie (23 zbiory na dane.um.warszawa.pl)

Wszystkie zbiory są dostępne przez API `POST https://dane.um.warszawa.pl/api/action/get_<zbiór>` z nagłówkiem `Authorization: <token>` (token z zakładki „Klucz API”, **załóż go przed sobotą**). Dokumentacja każdego zbioru: `https://dane.um.warszawa.pl/files/<prefix>_pa.json` (parametry) i `_pw.json` (przykład wywołania).

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
| AED | Lokalizacja defibrylatorów | codziennie | Aktywne AED. **Zbiór promowany w ogłoszeniach, więc dużo zespołów po niego sięgnie.** |
| WC | Toalety | tydzień | Zarządca, typ, **dostępność bez barier, płatność, przewijak, godziny**. |
| EKO | Eko punkty | tydzień | Punkty zbiórki leków i elektrośmieci. |
| SEG | Segregacja odpadów + Typy odpadów | codziennie | Dane z SegregujNa5 (2 zbiory). |
| SPORT | Zajęcia sportowe | 2 h | Kategoria, adresaci (np. seniorzy), dzielnica, data, godzina, obiekt. |
| BOISKA | Otwarte boiska | tydzień | Szkolne obiekty sportowe z **godzinami dostępności dla każdego dnia**, typ, nawierzchnia. Pośrednio lista szkół. |
| TRASY | Trasy turystyczne | brak | Nazwa, długość, opis, ślad GPS, punkty turystyczne. |
| WYD | Kalendarz wydarzeń | 2 h | Tytuły, opisy, terminy, adresy, lokalizacja. |
| KONS | Konsultacje społeczne (+ słowniki kategorii i dzielnic) | 2 h | Tytuł, opis, daty, kategoria, dzielnica, **lat/lon**, zdjęcia, grupa odbiorców, tagi (3 zbiory). |
| BO | Budżet obywatelski | tydzień | Projekty zrealizowane i w realizacji: **opisy, lokalizacja, kosztorysy, statusy, wyniki głosowania**, edycje. **Najbogatszy semantycznie zbiór, idealny dla AI.** |

**Dane uzupełniające (dozwolone jako dodatek, nie zamiast zbioru miejskiego):** modele 3D budynków LoD1/LoD2 (GUGiK, CityGML, bezpłatne), budynki 3D z OpenStreetMap (najprostsze do `fill-extrusion` w MapLibre), ortofotomapy m.st. Warszawy 1945–2025 (WMS w serwisie mapowym miasta), zdjęcia uliczne Mapillary (CC-BY-SA, darmowe API), GTFS ZTM (nieoficjalne mirrory), GBFS Veturilo, czujniki hałasu z platformy iot.warszawa.pl (sezonowo tylko bulwary).

**Pułapki danych:** (1) większość zbiorów transportowych i środowiskowych to **stan bieżący bez historii**, więc modele predykcyjne trzeba trenować na danych zebranych w trakcie 24 h albo ograniczyć się do zbiorów historycznych (BO, RCN, konsultacje); (2) w ogłoszeniach wymieniano hałas, ale **na portalu nie ma zbioru hałasu**; (3) każde wywołanie wymaga tokenu, a limitów zapytań nie znamy, więc **cache'ujcie odpowiedzi lokalnie od pierwszej godziny**.

<a id="strategia"></a>
## 4. Wnioski strategiczne: co tu wygrywa

1. **Rywalizujesz tylko w swojej kategorii (~10 zespołów).** Nie trzeba pobić całej sali, tylko 9–11 drużyn z tego samego wyzwania. Wyróżnienie się na tle typowych pomysłów w danej kategorii jest ważniejsze niż „najlepszy pomysł w ogóle”.
2. **Przewiduj tłok.** Najbardziej oczywiste pomysły, które zrobi kilka zespołów: mapa opóźnień ZTM, „czatbot o Warszawie”, rekomendator wydarzeń, mapa smogu, wyszukiwarka AED, planer dnia wolnego. Jeśli robisz coś z tej listy, potrzebujesz mocnego twistu (optymalizacja zamiast wyszukiwarki, kanał głosowy zamiast czatu, rzadki zbiór typu TABOR lub temp. nawierzchni).
3. **Rzadko używane, bogate zbiory to łatwe punkty za „wykorzystanie danych”:** BO (opisy, koszty, wyniki głosowań), konsultacje (lat/lon i opisy), TABOR (rok i trakcja), POG (temp. nawierzchni), WC (przewijak, dostępność, godziny), BOISKA (godziny dla każdego dnia).
4. **AI ma być „silnikiem”, nie „lakierem”.** W jury jest COO Bielik.AI i inwestor wyczulony na hype. AI powinna przekształcać dane miejskie w coś, czego wcześniej nie było (wizualizację projektu, ocenę wpływu, wniosek, audycję), a jej wyniki muszą być **ugruntowane w danych** (pokazujcie „paragon danych” lub źródła). Użycie **Bielika** w krytycznej ścieżce to tani bonus u jednej jurorki i w MC (suwerenne AI).
5. **Wdrożenie = wskaż konkretną komórkę urzędu i istniejący kanał.** „Moduł do konsultacje.um.warszawa.pl”, „rozszerzenie procesu BO”, „narzędzie dla ZOM lub ZTM” brzmi wiarygodnie. „Nowa aplikacja, którą pobiorą mieszkańcy” brzmi słabo.
6. **Prezentacja to 20% i 5 minut.** Live demo przygotowane na 3–5 zapisanych w cache scenariuszach, jedno „wow” (obraz, głos, telefon jurora), slajd z listą użytych zbiorów i slajd „kto, kiedy, za ile wdraża”. Mówcie wprost językiem kryteriów, bo juror wypełnia tabelkę.
7. **3D i generatywne AI (Twój kierunek)** dają największy efekt na scenie, ale kosztują najwięcej czasu. Najlepsza strategia to **lekkie 3D** (budynki OSM `fill-extrusion` w MapLibre/deck.gl: 1–2 h zamiast dnia z CityGML) i **image-to-image na zdjęciach Mapillary** (zamiast text-to-3D i AR).

<a id="metodologia"></a>
## 5. Metodologia oceny

Każdy pomysł oceniłem w 7 kategoriach w skali 1–10. Pięć pierwszych **odwzorowuje oficjalne kryteria jury z dokładnie tymi samymi wagami**, a dwie ostatnie modelują szansę dowiezienia projektu i dopasowanie do składu jury.

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
## 6. Ranking wszystkich 100 pomysłów

| # | Pomysł | Wyzwanie | D | I | W | R | P | F | J | Ocena jury | **Wynik** | |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) | W3 (alt. W1) | 9 | 8 | 9 | 10 | 9 | 7 | 8 | 8.90 | **78.8** | ★★★★★ |
| 2 | [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) | W3 (alt. W1) | 9 | 8 | 9 | 10 | 8 | 7 | 9 | 8.70 | **77.7** | ★★★★★ |
| 3 | [Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)](#p003) | W3 | 10 | 7 | 9 | 9 | 7 | 8 | 8 | 8.30 | **77.3** | ★★★★★ |
| 4 | [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) | W1 (alt. W3) | 7 | 9 | 8 | 9 | 8 | 8 | 9 | 8.20 | **77.0** | ★★★★★ |
| 5 | [Konsultacje, które widać](#p005) | W3 (alt. W1) | 8 | 8 | 9 | 9 | 9 | 7 | 9 | 8.55 | **76.4** | ★★★★★ |
| 6 | [Sprawiedliwość taborowa / Złap elektryka](#p006) | W3 | 9 | 8 | 7 | 9 | 8 | 8 | 7 | 8.15 | **75.4** | ★★★★★ |
| 7 | [Bezpieczne wydarzenie – automatyczna karta dla organizatorów](#p007) | W3 | 9 | 7 | 8 | 8 | 7 | 9 | 7 | 7.75 | **75.2** | ★★★★★ |
| 8 | [15-minutowa Warszawa – indeks dostępności usług](#p008) | W3 (alt. W1) | 10 | 6 | 8 | 9 | 8 | 8 | 8 | 8.05 | **75.1** | ★★★★★ |
| 9 | [Radio Dzielnica – codzienny, personalizowany briefing audio](#p009) | W2 | 8 | 8 | 7 | 8 | 9 | 8 | 8 | 8.00 | **74.6** | ★★★★☆ |
| 10 | [Każda sekunda – AED a wydarzenia masowe](#p010) | W3 | 8 | 6 | 9 | 9 | 7 | 9 | 7 | 7.65 | **74.3** | ★★★★☆ |
| 11 | [Elektryfikacja 2076 – które linie elektryfikować najpierw](#p011) | W1 (alt. W3) | 9 | 8 | 8 | 9 | 8 | 7 | 8 | 8.35 | **74.0** | ★★★★☆ |
| 12 | [Warszawa MCP – otwarte dane dla każdego asystenta AI (z Bielikiem)](#p012) | W3 | 9 | 7 | 9 | 7 | 7 | 8 | 10 | 7.80 | **74.0** | ★★★★☆ |
| 13 | [Konsultacje bez barier – ETR, ukraiński, angielski, audio](#p013) | W3 | 6 | 7 | 9 | 9 | 7 | 9 | 8 | 7.50 | **73.4** | ★★★★☆ |
| 14 | [Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów](#p014) | W2 (alt. W3) | 8 | 8 | 8 | 8 | 9 | 7 | 9 | 8.20 | **73.3** | ★★★★☆ |
| 15 | [BO pod lupą – co się udało, co utknęło](#p015) | W3 | 9 | 6 | 7 | 9 | 7 | 9 | 7 | 7.45 | **72.3** | ★★★★☆ |
| 16 | [Dźwięk Warszawy – miasto jako relaksująca muzyka na żywo](#p016) | W2 | 7 | 9 | 5 | 8 | 10 | 8 | 6 | 7.85 | **72.0** | ★★★★☆ |
| 17 | [Gołoledź Alert – ostrzeżenia z temperatury nawierzchni](#p017) | W3 | 7 | 8 | 8 | 9 | 7 | 8 | 7 | 7.75 | **71.7** | ★★★★☆ |
| 18 | [Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo](#p018) | W2 (alt. W3) | 8 | 7 | 7 | 8 | 7 | 9 | 7 | 7.35 | **71.4** | ★★★★☆ |
| 19 | [Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu](#p019) | W3 (alt. W1) | 8 | 7 | 8 | 9 | 7 | 8 | 7 | 7.70 | **71.3** | ★★★★☆ |
| 20 | [Uczciwa cena – sprawdź, czy mieszkanie nie jest przepłacone](#p020) | W3 | 9 | 6 | 7 | 9 | 8 | 8 | 7 | 7.65 | **70.8** | ★★★★☆ |
| 21 | [Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca](#p021) | W1 (alt. W3) | 7 | 9 | 7 | 9 | 10 | 6 | 8 | 8.40 | **70.7** | ★★★★☆ |
| 22 | [Warszawa Data Stories – automatyczne dziennikarstwo danych](#p022) | W3 | 9 | 7 | 7 | 8 | 7 | 8 | 8 | 7.55 | **70.5** | ★★★★☆ |
| 23 | [Zapytaj Dane – analityk AI dla urzędników (Bielik on-prem)](#p023) | W3 | 9 | 7 | 8 | 7 | 8 | 7 | 9 | 7.80 | **69.9** | ★★★☆☆ |
| 24 | [Ile kosztuje metro? – premia cenowa transportu](#p024) | W3 (alt. W1) | 9 | 7 | 7 | 9 | 8 | 7 | 7 | 7.90 | **69.5** | ★★★☆☆ |
| 25 | [Syrenka oprowadza – generatywny audioprzewodnik](#p025) | W2 | 7 | 8 | 6 | 9 | 9 | 7 | 8 | 7.75 | **68.8** | ★★★☆☆ |
| 26 | [Dane w szkole – lekcje z Warszawą na żywo](#p026) | W3 | 8 | 7 | 7 | 8 | 7 | 8 | 8 | 7.35 | **68.7** | ★★★☆☆ |
| 27 | [Gdzie zamieszkać – dopasowanie dzielnicy do stylu życia](#p027) | W3 | 10 | 5 | 6 | 9 | 8 | 8 | 7 | 7.40 | **68.5** | ★★★☆☆ |
| 28 | [Warszawa Wrapped – miasto w stylu Spotify Wrapped](#p028) | W2 (alt. W3) | 7 | 6 | 5 | 9 | 9 | 9 | 7 | 7.05 | **68.5** | ★★★☆☆ |
| 29 | [Czy mój projekt BO wygra? – trener wniosków](#p029) | W3 | 8 | 8 | 6 | 9 | 8 | 7 | 7 | 7.75 | **68.2** | ★★★☆☆ |
| 30 | [Agent uwag do konsultacji – pomoc w napisaniu rzeczowej opinii](#p030) | W3 (alt. W1) | 7 | 7 | 7 | 9 | 7 | 8 | 8 | 7.30 | **68.2** | ★★★☆☆ |
| 31 | [Data Quality Watchdog – audyt jakości miejskich zbiorów](#p031) | W3 | 9 | 6 | 8 | 7 | 5 | 9 | 8 | 6.95 | **68.2** | ★★★☆☆ |
| 32 | [Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D](#p032) | W1 (alt. W3) | 7 | 8 | 8 | 9 | 9 | 6 | 7 | 8.15 | **68.0** | ★★★☆☆ |
| 33 | [Gdzie miasto stoi – wąskie gardła i priorytet tramwajowy](#p033) | W3 | 9 | 7 | 8 | 9 | 8 | 6 | 7 | 8.10 | **67.6** | ★★★☆☆ |
| 34 | [Gramy dziś – sąsiedzkie mecze na otwartych boiskach szkolnych](#p034) | W2 | 7 | 7 | 8 | 8 | 7 | 8 | 6 | 7.35 | **67.5** | ★★★☆☆ |
| 35 | [Nocna Warszawa – dla tych, dla których miasto nigdy nie zasypia](#p035) | W2 | 8 | 7 | 6 | 9 | 7 | 8 | 6 | 7.30 | **67.0** | ★★★☆☆ |
| 36 | [Toalety dla kurierów i pracowników mobilnych](#p036) | W2 (alt. W3) | 7 | 7 | 7 | 8 | 6 | 9 | 6 | 6.95 | **67.0** | ★★★☆☆ |
| 37 | [Witaj w Warszawie – onboarding nowych mieszkańców](#p037) | W3 | 9 | 5 | 8 | 9 | 6 | 8 | 7 | 7.20 | **66.7** | ★★★☆☆ |
| 38 | [Radar Gentryfikacji](#p038) | W1 (alt. W3) | 8 | 8 | 7 | 9 | 8 | 6 | 7 | 7.95 | **66.4** | ★★★☆☆ |
| 39 | [Pokédex ZTM – kolekcjonerska gra taboru](#p039) | W3 | 8 | 8 | 5 | 8 | 9 | 7 | 6 | 7.60 | **66.3** | ★★★☆☆ |
| 40 | [Cyfrowy bliźniak transportu na żywo w 3D](#p040) | W1 (alt. W3) | 8 | 6 | 6 | 8 | 10 | 7 | 7 | 7.50 | **66.1** | ★★★☆☆ |
| 41 | [Słyszę przystanek – asystent dla osób niewidomych](#p041) | W3 | 7 | 6 | 8 | 8 | 7 | 8 | 7 | 7.10 | **65.8** | ★★★☆☆ |
| 42 | [Mikroprzygody – dzielnicowe questy i liga dzielnic](#p042) | W2 | 7 | 7 | 6 | 8 | 8 | 8 | 6 | 7.15 | **65.7** | ★★★☆☆ |
| 43 | [Parkingi → Parki 2076](#p043) | W1 | 7 | 8 | 5 | 8 | 9 | 7 | 7 | 7.40 | **65.2** | ★★★☆☆ |
| 44 | [Rodzinny Weekend – planer dla rodziców małych dzieci](#p044) | W2 | 8 | 6 | 7 | 8 | 7 | 8 | 6 | 7.10 | **65.2** | ★★★☆☆ |
| 45 | [Boiska otwarte naprawdę – analiza godzin dostępności](#p045) | W3 | 6 | 6 | 8 | 8 | 6 | 9 | 6 | 6.70 | **64.6** | ★★☆☆☆ |
| 46 | [Koszt utrudnienia – ile minut pasażerów zabiera remont](#p046) | W3 | 8 | 8 | 8 | 9 | 8 | 5 | 7 | 8.15 | **64.4** | ★★☆☆☆ |
| 47 | [P+R Predict – prognoza wolnych miejsc i zachęta do przesiadki](#p047) | W3 | 8 | 6 | 8 | 8 | 7 | 7 | 6 | 7.30 | **63.7** | ★★☆☆☆ |
| 48 | [Kalendarz, który dba – asystent work-life balance w Google/Outlook](#p048) | W2 | 7 | 7 | 7 | 7 | 8 | 7 | 7 | 7.20 | **63.5** | ★★☆☆☆ |
| 49 | [Senior 2076 – audyt miasta dla starzejącego się społeczeństwa](#p049) | W1 (alt. W3) | 7 | 6 | 7 | 9 | 6 | 8 | 7 | 6.85 | **63.5** | ★★☆☆☆ |
| 50 | [Wyjdź wcześniej – utrudnienia w Twoim kalendarzu](#p050) | W3 | 7 | 6 | 7 | 8 | 7 | 8 | 6 | 6.90 | **63.4** | ★★☆☆☆ |
| 51 | [Spacer 360° po Warszawie 2076 (VR)](#p051) | W1 | 6 | 8 | 5 | 9 | 10 | 6 | 7 | 7.55 | **63.1** | ★★☆☆☆ |
| 52 | [Strategia #Warszawa2030 → 2076 Tracker](#p052) | W1 | 8 | 6 | 7 | 9 | 6 | 7 | 8 | 7.05 | **62.8** | ★★☆☆☆ |
| 53 | [Klimat 2076 dla Twojej ulicy](#p053) | W1 | 6 | 7 | 6 | 9 | 8 | 7 | 7 | 7.10 | **62.6** | ★★☆☆☆ |
| 54 | [Wtedy i teraz – historia na trasach turystycznych (AI + archiwa)](#p054) | W2 | 7 | 7 | 6 | 9 | 9 | 6 | 6 | 7.50 | **62.1** | ★★☆☆☆ |
| 55 | [Spontan – swipe na wieczór ze znajomymi](#p055) | W2 | 7 | 6 | 6 | 7 | 8 | 8 | 6 | 6.75 | **62.0** | ★★☆☆☆ |
| 56 | [List z 2076](#p056) | W1 | 5 | 7 | 4 | 7 | 9 | 9 | 6 | 6.40 | **61.7** | ★★☆☆☆ |
| 57 | [Infoulice AI – utrudnienia po ludzku](#p057) | W3 | 7 | 6 | 7 | 8 | 6 | 8 | 6 | 6.70 | **61.6** | ★★☆☆☆ |
| 58 | [Warszawa w RCS / SMS – info bez aplikacji](#p058) | W2 (alt. W3) | 7 | 6 | 7 | 7 | 6 | 8 | 8 | 6.55 | **61.4** | ★★☆☆☆ |
| 59 | [Puls Miasta – dashboard dla prezydenta](#p059) | W3 | 9 | 4 | 6 | 8 | 7 | 8 | 7 | 6.60 | **61.3** | ★★☆☆☆ |
| 60 | [AR: zobacz projekt na swojej ulicy (text-to-3D + WebXR)](#p060) | W1 (alt. W3) | 7 | 9 | 7 | 9 | 9 | 4 | 7 | 8.20 | **61.1** | ★★☆☆☆ |
| 61 | [Spokojna Warszawa – miasto przyjazne sensorycznie](#p061) | W2 | 6 | 8 | 6 | 8 | 7 | 7 | 6 | 7.00 | **61.1** | ★★☆☆☆ |
| 62 | [Dostępny przejazd – planer dla osób z niepełnosprawnościami](#p062) | W3 | 7 | 5 | 8 | 8 | 6 | 8 | 6 | 6.65 | **61.1** | ★★☆☆☆ |
| 63 | [Wehikuł czasu 1945 → 2026 → 2076](#p063) | W1 | 6 | 8 | 5 | 10 | 10 | 5 | 7 | 7.70 | **60.9** | ★★☆☆☆ |
| 64 | [Ceny a smog – ile warte jest czyste powietrze](#p064) | W3 | 8 | 7 | 5 | 8 | 7 | 7 | 6 | 6.95 | **60.7** | ★★☆☆☆ |
| 65 | [Eko-przypominacz po drodze](#p065) | W3 | 6 | 7 | 7 | 7 | 6 | 8 | 6 | 6.60 | **60.7** | ★★☆☆☆ |
| 66 | [Gra o Warszawę 2076 – strategia na prawdziwych danych](#p066) | W1 | 6 | 8 | 5 | 8 | 9 | 6 | 7 | 7.20 | **60.2** | ★★☆☆☆ |
| 67 | [Mikroprzerwa 30 min](#p067) | W2 | 7 | 6 | 6 | 7 | 7 | 8 | 6 | 6.55 | **60.2** | ★★☆☆☆ |
| 68 | [Godzina dla osiedla – mikrowolontariat](#p068) | W2 | 7 | 6 | 6 | 8 | 6 | 8 | 6 | 6.50 | **59.8** | ★★☆☆☆ |
| 69 | [Miasto-gąbka 2076](#p069) | W1 | 6 | 8 | 7 | 9 | 8 | 5 | 7 | 7.55 | **59.7** | ★★☆☆☆ |
| 70 | [Metro 2076 – zaprojektuj sieć i zobacz skutki](#p070) | W1 | 7 | 7 | 5 | 9 | 8 | 6 | 7 | 7.10 | **59.4** | ★★☆☆☆ |
| 71 | [Ratownik w okolicy – społecznościowi ratownicy i AED](#p071) | W3 | 6 | 7 | 6 | 7 | 8 | 7 | 6 | 6.80 | **59.4** | ★★☆☆☆ |
| 72 | [Kapsuła Czasu Warszawy](#p072) | W1 | 4 | 7 | 5 | 8 | 7 | 9 | 6 | 6.15 | **59.3** | ★★☆☆☆ |
| 73 | [SegregujAI – zdjęcie śmiecia i właściwy pojemnik](#p073) | W3 | 6 | 3 | 8 | 8 | 7 | 9 | 6 | 6.15 | **59.3** | ★★☆☆☆ |
| 74 | [Za 0 zł – darmowa Warszawa dziś](#p074) | W2 | 7 | 4 | 7 | 8 | 6 | 9 | 5 | 6.20 | **59.2** | ★★☆☆☆ |
| 75 | [Czy boisko jest wolne? – crowdsourcing zajętości](#p075) | W3 | 6 | 6 | 7 | 8 | 6 | 8 | 5 | 6.50 | **59.1** | ★★☆☆☆ |
| 76 | [Izochrony na żywo – jak daleko zajadę teraz](#p076) | W3 | 8 | 6 | 6 | 8 | 8 | 6 | 6 | 7.10 | **58.8** | ★★☆☆☆ |
| 77 | [AI Urbanista – przekrój ulicy z opisu](#p077) | W1 | 6 | 8 | 6 | 8 | 9 | 5 | 7 | 7.40 | **58.6** | ★★☆☆☆ |
| 78 | [Gdzie zamieszkać na 50 lat – plan życia 2076](#p078) | W1 | 8 | 6 | 5 | 8 | 7 | 7 | 6 | 6.70 | **58.6** | ★★☆☆☆ |
| 79 | [Voxel Warszawa – instalacja artystyczna danych](#p079) | W3 | 6 | 7 | 4 | 8 | 9 | 7 | 5 | 6.75 | **58.4** | ★★☆☆☆ |
| 80 | [Martwe przystanki – obszary niedoobsłużone przez komunikację](#p080) | W3 | 8 | 5 | 7 | 8 | 6 | 7 | 6 | 6.65 | **58.1** | ★★☆☆☆ |
| 81 | [Okno pogodowe – planer aktywności](#p081) | W2 | 7 | 5 | 6 | 7 | 7 | 8 | 6 | 6.30 | **57.9** | ★☆☆☆☆ |
| 82 | [Razem na konsultacje – sąsiedzkie spotkania](#p082) | W2 | 6 | 6 | 6 | 8 | 6 | 8 | 6 | 6.30 | **57.9** | ★☆☆☆☆ |
| 83 | [Sprawdzam! – fact-checking wypowiedzi na danych miasta](#p083) | W3 | 7 | 7 | 5 | 7 | 7 | 7 | 6 | 6.60 | **57.7** | ★☆☆☆☆ |
| 84 | [Cień i słońce 2076 – gdzie postawić ławki i drzewa](#p084) | W1 | 6 | 7 | 7 | 8 | 9 | 5 | 6 | 7.35 | **57.6** | ★☆☆☆☆ |
| 85 | [Tablica sąsiedzka – e-ink z odjazdami i wydarzeniami do klatki schodowej](#p085) | W3 | 6 | 6 | 6 | 7 | 8 | 7 | 6 | 6.55 | **57.3** | ★☆☆☆☆ |
| 86 | [Warszawa w Minecrafcie 2076](#p086) | W1 | 6 | 8 | 5 | 8 | 9 | 5 | 7 | 7.20 | **57.0** | ★☆☆☆☆ |
| 87 | [Bezpieczna droga do szkoły](#p087) | W3 | 6 | 6 | 7 | 8 | 6 | 7 | 6 | 6.50 | **56.8** | ★☆☆☆☆ |
| 88 | [Wojna śmieciowa – quiz segregacji dzielnic](#p088) | W3 | 6 | 4 | 6 | 7 | 7 | 9 | 5 | 5.85 | **55.9** | ★☆☆☆☆ |
| 89 | [Czasoprzestrzenna kostka wydarzeń 3D](#p089) | W3 | 7 | 6 | 4 | 7 | 8 | 7 | 5 | 6.35 | **54.9** | ★☆☆☆☆ |
| 90 | [Autonomiczna komunikacja 2076 – symulacja](#p090) | W1 | 6 | 7 | 4 | 8 | 8 | 6 | 6 | 6.55 | **54.3** | ★☆☆☆☆ |
| 91 | [Wellbeing Map dla pracodawców (B2B)](#p091) | W2 | 6 | 6 | 6 | 7 | 6 | 7 | 6 | 6.15 | **53.8** | ★☆☆☆☆ |
| 92 | [Biegaj czysto – planer biegów wg smogu](#p092) | W2 | 6 | 5 | 6 | 7 | 6 | 8 | 5 | 5.90 | **53.7** | ★☆☆☆☆ |
| 93 | [AED Trening – gra edukacyjna 3D](#p093) | W3 | 5 | 7 | 6 | 6 | 8 | 6 | 6 | 6.45 | **53.5** | ★☆☆☆☆ |
| 94 | [GeoGuessr Warszawa z danymi](#p094) | W3 | 5 | 5 | 4 | 8 | 8 | 8 | 5 | 5.85 | **53.2** | ★☆☆☆☆ |
| 95 | [Dyspozytor ZTM – gra symulacyjna](#p095) | W3 | 7 | 7 | 4 | 8 | 8 | 5 | 6 | 6.75 | **52.9** | ★☆☆☆☆ |
| 96 | [Ruch w przerwie – firmowe wyzwania sportowe](#p096) | W2 | 6 | 5 | 6 | 6 | 6 | 8 | 5 | 5.75 | **52.3** | ★☆☆☆☆ |
| 97 | [Spokojny dojazd – trasy z mniejszym stresem](#p097) | W2 | 7 | 6 | 6 | 7 | 6 | 6 | 5 | 6.35 | **52.1** | ★☆☆☆☆ |
| 98 | [Pora na sport – rekomendator zajęć](#p098) | W2 | 6 | 4 | 6 | 7 | 5 | 9 | 5 | 5.45 | **52.0** | ★☆☆☆☆ |
| 99 | [Korytarze przewietrzania 2076](#p099) | W1 | 6 | 7 | 6 | 8 | 8 | 4 | 6 | 6.95 | **51.3** | ★☆☆☆☆ |
| 100 | [Rower czy autobus? – porównywarka na żywo](#p100) | W3 | 6 | 5 | 5 | 8 | 6 | 7 | 5 | 5.85 | **50.6** | ★☆☆☆☆ |

<a id="wyzwania"></a>
## 7. Najlepsze pomysły w każdym wyzwaniu

Pomysły oznaczone „alt.” pasują też do innej kategorii po zmianie narracji (np. BO w obrazach w W1 jako „jak decyzje budżetowe dziś kształtują 2076”).

### W1: Warszawa 2076

| # w rankingu | Pomysł (główna kategoria) | Wynik |
|---|---|---|
| 4 | [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) | 77.0 |
| 11 | [Elektryfikacja 2076 – które linie elektryfikować najpierw](#p011) | 74.0 |
| 21 | [Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca](#p021) | 70.7 |
| 32 | [Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D](#p032) | 68.0 |
| 38 | [Radar Gentryfikacji](#p038) | 66.4 |
| 40 | [Cyfrowy bliźniak transportu na żywo w 3D](#p040) | 66.1 |
| 43 | [Parkingi → Parki 2076](#p043) | 65.2 |

*Pomysły z innych kategorii, które można przenieść do W1:* [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) (78.8), [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) (77.7), [Konsultacje, które widać](#p005) (76.4), [15-minutowa Warszawa – indeks dostępności usług](#p008) (75.1), [Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu](#p019) (71.3)

### W2: Warszawa – złap oddech!

| # w rankingu | Pomysł (główna kategoria) | Wynik |
|---|---|---|
| 9 | [Radio Dzielnica – codzienny, personalizowany briefing audio](#p009) | 74.6 |
| 14 | [Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów](#p014) | 73.3 |
| 16 | [Dźwięk Warszawy – miasto jako relaksująca muzyka na żywo](#p016) | 72.0 |
| 18 | [Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo](#p018) | 71.4 |
| 25 | [Syrenka oprowadza – generatywny audioprzewodnik](#p025) | 68.8 |
| 28 | [Warszawa Wrapped – miasto w stylu Spotify Wrapped](#p028) | 68.5 |
| 34 | [Gramy dziś – sąsiedzkie mecze na otwartych boiskach szkolnych](#p034) | 67.5 |

### W3: Warszawa: Twój ruch!

| # w rankingu | Pomysł (główna kategoria) | Wynik |
|---|---|---|
| 1 | [BO w obrazach – zobacz projekt, zanim zagłosujesz](#p001) | 78.8 |
| 2 | [Asystent wniosku BO – od luki w danych do gotowego projektu](#p002) | 77.7 |
| 3 | [Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)](#p003) | 77.3 |
| 5 | [Konsultacje, które widać](#p005) | 76.4 |
| 6 | [Sprawiedliwość taborowa / Złap elektryka](#p006) | 75.4 |
| 7 | [Bezpieczne wydarzenie – automatyczna karta dla organizatorów](#p007) | 75.2 |
| 8 | [15-minutowa Warszawa – indeks dostępności usług](#p008) | 75.1 |

*Pomysły z innych kategorii, które można przenieść do W3:* [Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076](#p004) (77.0), [Elektryfikacja 2076 – które linie elektryfikować najpierw](#p011) (74.0), [Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów](#p014) (73.3), [Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo](#p018) (71.4), [Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca](#p021) (70.7)

<a id="finaly"></a>
## 8. Trzy koncepcje finałowe: plan na 24 h, architektura, pitch

### 8.1 „Widzialny Budżet”: zobacz projekt, zanim zagłosujesz, i napisz swój (W3, alternatywnie W1)

**Połączenie:** #1 *BO w obrazach* + #2 *Asystent wniosku BO* + mapa luk z #8 *15-minutowa Warszawa*.

**Problem (zdanie na otwarcie pitchu):** Budżet obywatelski w Warszawie to setki milionów złotych, ale mieszkańcy głosują na podstawie ściany tekstu. Większość z nich nigdy nie złożyła wniosku, bo nie wie, czego brakuje w ich okolicy ani ile to kosztuje.

**Rozwiązanie (3 ekrany):**
1. **Mapa 3D Warszawy** (MapLibre + budynki OSM w `fill-extrusion`) z projektami BO jako pinezkami (zrealizowane, w realizacji) i warstwą luk 15-minutowych (AED, WC, ekopunkty, boiska, zajęcia sportowe, przystanki).
2. **Karta projektu:** zdjęcie miejsca dziś (Mapillary, najbliższe ujęcie do lat/lon) → **wizualizacja AI po realizacji** (image-to-image na podstawie opisu projektu) + „paragon danych”: koszt na mieszkańca, 3 podobne projekty zrealizowane wcześniej (dopasowane embeddingami opisów) z ich kosztem i statusem, luki w okolicy, które projekt wypełnia.
3. **„Napisz wniosek”:** klik na lukę → Bielik generuje szkic wniosku BO (tytuł, uzasadnienie z liczbami z danych, kosztorys z mediany podobnych projektów, lista ryzyk odrzucenia) → PDF lub kopiowanie do formularza BO.

**Dane:** BO (rdzeń), AED, WC, EKO, BOISKA, SPORT, PRZYST, KONS. Uzupełnienie: Mapillary, OSM.
**Właściciel wdrożenia:** zespół BO w Centrum Komunikacji Społecznej UM. Wizualizacje to widget na stronie głosowania, asystent to pomoc przy naborze wniosków.

**Architektura (prosta, do zrobienia w 24 h):**
```
[Python ETL] -> pobiera BO + 7 zbiorów -> GeoJSON + SQLite/DuckDB (cache!)
            -> embeddingi opisów BO (np. multilingual-e5 / sentence-transformers)
[FastAPI]   -> /projekty /luki /podobne /wizualizacja /wniosek
            -> Mapillary API (zdjęcie) -> model edycji obrazu (np. Gemini 2.5 Flash Image / FLUX Kontext)
            -> Bielik 11B v3 (Ollama/llama.cpp lokalnie lub hostowany endpoint) -> wniosek
[Frontend]  -> Vite/Next + MapLibre GL + deck.gl, karty projektów, generator PDF
```

**Podział ról (4 osoby):** (1) dane i ETL + luki 15-min, (2) backend + AI (obraz, Bielik, embeddingi), (3) frontend 3D i UX, (4) produkt, pitch, kuracja 10 przykładów demo, dokumentacja i README z ujawnieniem użycia AI.

**Plan 24 h:**
| Godz. | Co |
|---|---|
| 11:00–12:30 | Tokeny API działają, pobranie wszystkich zbiorów do cache, szkic UI na kartce, umowa o kontrakcie API między backendem a frontendem |
| 12:30–17:00 | ETL + mapa z pinezkami BO, pipeline Mapillary → edycja obrazu dla 1 projektu end-to-end |
| 17:00 | **Rozmowa z mentorem (dane i projektowanie usług):** walidacja historii i ścieżki wdrożenia |
| 17:00–23:00 | Luki 15-min, podobne projekty, generator wniosku (Bielik), karta projektu |
| 23:00–03:00 | Polerowanie UI, **wygenerowanie i zcache'owanie 10–15 przykładów demo**, nagranie wideo-backupu demo |
| 03:00–07:00 | Sen na zmiany (minimum 2 osoby śpią naraz) |
| 07:00–10:00 | Pitch deck, README (zbiory, założenia, narzędzia, **zakres użycia AI**), 5 próbnych pitchy na czas |
| 10:30 | **Wysłanie dokumentacji i linku do repo** (twardy termin to 11:00, potem zamrożenie zmian) |

**Szkic pitchu (5:00):**
- 0:00–0:30: „W tym roku Warszawa wyda X mln zł w BO. Kto z Państwa przeczytał opis choć jednego projektu, na który głosował?” (liczbę sprawdźcie w danych BO).
- 0:30–1:00: problem w 2 liczbach z danych (np. ile projektów, ile kosztują, jak nierównomiernie rozkładają się dzielnice).
- 1:00–3:15: **demo:** mapa 3D → projekt → *przed i po* (wow) → paragon danych → klik na lukę → wniosek w 20 s.
- 3:15–3:45: slajd „Dane”: 8 zbiorów miejskich z logotypami, jak są połączone.
- 3:45–4:30: slajd „Wdrożenie”: kto (BO/CKS), gdzie (strona głosowania, nabór), koszt (~X zł/mies. API obrazów, Bielik może działać on-prem), co dalej (pilotaż w 1 dzielnicy w następnej edycji).
- 4:30–5:00: wizja: „Żeby każdy warszawiak widział, na co głosuje, i umiał zaproponować coś swojego”.

**Przygotuj odpowiedzi na Q&A:** *Czy wizualizacje nie wprowadzają w błąd?* (etykieta „poglądowe”, generowane z opisu autora, autor może zatwierdzić). *Halucynacje we wniosku?* (liczby tylko z danych, LLM pisze wyłącznie tekst, źródła przy każdej liczbie). *Koszt?* (obraz ~kilka groszy, Bielik on-prem). *Czy autorzy projektów się zgodzą?* (opt-in, a autorzy chcą wygrać, więc wizualizacja im pomaga).

### 8.2 „Rada 2076”: głos przyszłych pokoleń w dzisiejszych konsultacjach (W1)

**Połączenie:** #4 *Rzecznik Przyszłych Pokoleń* + #21 *Okno 2076* (wizualizacje) + elementy #30 *Agent uwag do konsultacji* (pomoc w napisaniu uwagi).

**Haczyk na otwarcie:** „W 2076 r. większość ludzi, których dotkną decyzje z dzisiejszych konsultacji, jeszcze się nie urodziła. Kto mówi w ich imieniu?” Walia ma ustawę o dobrostanie przyszłych pokoleń i Komisarza Przyszłych Pokoleń. Warszawa może mieć narzędzie, które robi to samo dla każdej konsultacji.

**Jak działa:**
1. Pobieramy trwające konsultacje (KONS: opis, lat/lon, kategoria, dzielnica).
2. Dla lokalizacji budujemy **profil danych okolicy**: komunikacja (PRZYST/LINIE), powietrze (AQ), upał (POG: temp. nawierzchni), ceny i ich trend (RCN), projekty BO w okolicy, AED/WC.
3. **Panel 4–5 agentów Bielika** z personami 2076 (np. *Zosia, ur. 2026, w 2076 ma 50 lat i dojeżdża do pracy*; *Pan Marek, 85 l., porusza się o kulach*; *rzeczniczka przyrody*; *rodzina, która przeprowadzi się tu w 2050*) analizuje projekt na podstawie tych danych. Agenci dyskutują przez 2 rundy.
4. Wynik: **Karta Wpływu Międzypokoleniowego** (1 strona: 3 szanse, 3 ryzyka, 3 pytania do zadania na spotkaniu konsultacyjnym, ocena zgodności z celami strategii #Warszawa2030) + **wizualizacja miejsca w 2076** (Mapillary → image-to-image z warunkami z danych).
5. Przycisk „Zabierz głos”: termin konsultacji, link i pomoc w sformułowaniu rzeczowej uwagi.

**Dlaczego wygrywa W1:** wyzwanie prosi o *rozwiązanie dzisiejszego problemu, które kształtuje miasto na 50 lat*, a to narzędzie robi dokładnie to. Trzech jurorów ma to w zakresie obowiązków (strategia, innowacyjne polityki publiczne MC, Bielik). Efekt wow daje debata agentów na żywo i render 2076.
**Wdrożenie:** moduł portalu konsultacji, a dla urzędników pole „ocena wpływu długoterminowego” w procesie przygotowania konsultacji. Skalowalne na inne miasta (argument dla MC).

**Architektura:** Python (FastAPI) + Bielik 11B v3 (Ollama/vLLM) z orkiestracją agentów (prosta pętla, bez ciężkich frameworków) + strukturalne wyjście JSON → karta HTML/PDF; frontend MapLibre z markerami konsultacji. Na wszelki wypadek fallback na drugi model, jeśli Bielik lokalnie będzie za wolny (ujawnić w dokumentacji).

**Ryzyko i jak je zneutralizować:** „AI zastępuje mieszkańców” → komunikujcie wprost: *AI nie składa uwag i nie głosuje. Pomaga ludziom zadać lepsze pytania.* Pokażcie, że każda teza w karcie ma źródło w danych.

**Pitch (5:00):** 0:00 haczyk o nienarodzonych → 0:40 jedna realna konsultacja z portalu → 1:00–3:15 demo (profil danych → debata agentów przyspieszona → karta → render 2076) → 3:15 dane (6–8 zbiorów) → 3:50 wdrożenie i skalowanie na inne miasta → 4:30 wizja „spaceru po Warszawie 2076, którą zaprojektowaliśmy razem”.

### 8.3 „Radio Dzielnica”: miasto, które do Ciebie mówi (W2)

**Połączenie:** #9 *Radio Dzielnica* + #14 *Zadzwoń do Warszawy* (ten sam silnik, drugi kanał).

**Pomysł:** codzienny, 3-minutowy, personalizowany odcinek audio o Twojej okolicy i Twoim dniu: pogoda i powietrze (czy warto iść pieszo), utrudnienia na trasie dojazdu, 2–3 propozycje odpoczynku na wieczór (wydarzenia, zajęcia, wolne boisko szkolne), jedna lokalna sprawa (trwająca konsultacja, projekt BO w okolicy). Słuchasz w tramwaju, bez scrollowania. **„Złap oddech” = mniej ekranu, więcej miasta.** Ten sam silnik obsługuje **numer telefonu dla seniorów**: dzwonisz i pytasz głosem.

**Dane:** WYD, SPORT, BOISKA, UTR, AQ, POG, KONS, BO, ODJ/GPS (dla trybu telefonicznego).
**AI:** Bielik pisze scenariusz wyłącznie z faktów podanych w JSON (żadnych liczb spoza danych), TTS czyta naturalnym polskim głosem (2 prowadzących, format rozmowy). Dla telefonu: STT → Bielik z narzędziami (function calling do API miasta) → TTS przez bramkę telefoniczną.
**Dystrybucja i wdrożenie:** prywatny kanał RSS podcastu (działa w każdej aplikacji podcastowej), WhatsApp, a docelowo kanał operatora (Play: SMS/RCS/infolinia) lub miejska aplikacja i 19115.

**Demo-moment:** pitch otwiera **30 sekund odcinka wygenerowanego na niedzielę 18.10 dla Woli** (jury słyszy prawdziwe wydarzenia z dzisiejszego kalendarza). Potem juror dzwoni na numer i pyta „co ciekawego dziś na Mokotowie?”.
**Ryzyka:** opóźnienia głosu na żywo, więc **nagrany backup obowiązkowo**; jakość TTS po polsku trzeba przetestować w pierwszych 2 h; LLM przekręcający fakty, więc szablon + walidacja liczb.

### 8.4 A jeśli koniecznie chcesz 3D/AI jako rdzeń?

Najlepsze opcje „3D-first” według rankingu: **#11 Elektryfikacja 2076** (mapa linii 3D, wysoka ocena dzięki danym), **#21 Okno 2076**, **#40 Cyfrowy bliźniak transportu w 3D**, **#32 Dachy 2076**, **#63 Wehikuł czasu**, **#60 AR: projekt na ulicy**. Rekomendacja: jeśli Wasz zespół ma bardzo mocnego frontendowca 3D, weźcie **Okno 2076** i **wzmocnijcie je o kartę danych i link do konsultacji/BO**. Podniesienie oceny wdrożenia z 7 do 9 daje wynik ok. 74 pkt (zamiast 70.7), czyli okolice top 12, a pomysł zachowuje najwyższy efekt wow. Unikajcie CityGML LoD2 dla całego miasta (budynki OSM wystarczą na demo) oraz WebXR/AR na żywo na scenie.

<a id="checklista"></a>
## 9. Checklista przed sobotą (bez pisania kodu, zgodnie z §4 ust. 3)

- [ ] **Sprawdź maila od organizatora: do którego wyzwania jest przypisany zespół** i jakie zasady podano w harmonogramie (miał być opublikowany do 10.10).
- [ ] Każda osoba zakłada **klucz API** na dane.um.warszawa.pl (zakładka „Klucz API”) i ręcznie (curl/Postman) sprawdza 2–3 zbiory. To nie jest pisanie kodu Rozwiązania, tylko poznawanie danych.
- [ ] Przeczytajcie dokumentację `_pa.json`/`_pw.json` zbiorów, których użyjecie (szczególnie BO, KONS, POG, TABOR).
- [ ] Konta i klucze: GitHub (puste repo można założyć na miejscu), Mapillary (token), dostawca modelu obrazowego, TTS, hosting (Vercel/Render/Fly).
- [ ] **Bielik:** pobierzcie wagi (np. `Bielik-11B-v3` GGUF przez Ollama/llama.cpp, licencja Apache 2.0) i sprawdźcie szybkość na swoim sprzęcie. Wagi modelu open source to dozwolona zależność, a nie Wasz kod.
- [ ] Ustalcie stack, który wszyscy znają (np. Python FastAPI + Vite/React + MapLibre/deck.gl) i podział ról.
- [ ] Przygotujcie **w głowie i notatkach** (nie w plikach projektu) historię, problem i szkic slajdów. Grafik ani slajdów nie przygotowujcie wcześniej.
- [ ] Sprzęt: laptopy, ładowarki, przedłużacz, słuchawki, ewentualnie telefon do demo głosowego, adapter HDMI/USB-C, hotspot jako zapas łącza.
- [ ] Zapamiętajcie zasady regulaminu: **ujawnienie użycia AI w dokumentacji**, **oddanie wszystkiego do niedz. 11:00**, **5 min + 2 min Q&A**.

<a id="karty"></a>
## 10. Karty wszystkich 100 pomysłów (w kolejności rankingu)

Legenda kodów danych: patrz [sekcja 3](#dane).

<a id="p001"></a>
### #1. BO w obrazach – zobacz projekt, zanim zagłosujesz
**Wyzwanie:** W3 (alt. W1) · **Typ:** AI obraz, analityka, partycypacja · **Wynik: 78.8** ★★★★★ (ocena jury 8.90/10)

- **Opis:** Dla każdego projektu Budżetu Obywatelskiego AI generuje fotorealistyczną wizualizację w prawdziwym miejscu: zdjęcie ulicy z Mapillary i edycja image-to-image według opisu projektu. Obok analityka z historii BO: koszt na mieszkańca, podobne projekty zrealizowane wcześniej i ich rzeczywisty koszt, opóźnienia. Wszystko na mapie 3D. Wyższa i bardziej świadoma frekwencja w głosowaniu.
- **Dane:** BO (opisy, lokalizacje, kosztorysy, statusy, wyniki głosowań), KONS; + Mapillary/ortofoto
- **Moment „wow” w demo:** Projekt „zielone podwórko” z prawdziwym zdjęciem przed i AI po, a obok „3 podobne projekty kosztowały średnio X zł i trwały 14 mies.”
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 10 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Najlepszy balans wszystkich kryteriów: AI i wizualność, głębokie użycie bogatego zbioru, jasny właściciel (Centrum Komunikacji Społecznej, BO), czysto warszawski temat.
- **Ryzyka:** Wizualizacja może wprowadzać w błąd, potrzebna etykieta „poglądowe”. Jakość zdjęć Mapillary bywa różna.

<a id="p002"></a>
### #2. Asystent wniosku BO – od luki w danych do gotowego projektu
**Wyzwanie:** W3 (alt. W1) · **Typ:** AI LLM, analityka przestrzenna · **Wynik: 77.7** ★★★★★ (ocena jury 8.70/10)

- **Opis:** Mapa „czego brakuje w moim sąsiedztwie” (indeks 15-minutowy z miejskich zbiorów). Mieszkaniec klika lukę, a AI (Bielik) przygotowuje szkic wniosku do BO: uzasadnienie oparte na danych, realistyczny kosztorys z podobnych zrealizowanych projektów, ostrzeżenia, dlaczego podobne wnioski odrzucano. Nabór do BO zwykle rusza na początku roku.
- **Dane:** BO (historia projektów i koszty), AED, WC, BOISKA, EKO, PRZYST, SPORT, AQ
- **Moment „wow” w demo:** Od kliknięcia luki na mapie do gotowego, pobieralnego wniosku w 30 s.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 10 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Pełna ścieżka: dane → problem → działanie obywatela. Wysoka innowacyjność i wdrożenie w procesie BO.
- **Ryzyka:** Weryfikacja wiarygodności kosztorysów. Nie zastępuje pracy urzędu.

<a id="p003"></a>
### #3. Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)
**Wyzwanie:** W3 · **Typ:** Optymalizacja, analityka · **Wynik: 77.3** ★★★★★ (ocena jury 8.30/10)

- **Opis:** Narzędzie dla urzędników: wybierasz typ infrastruktury i budżet (np. 20 nowych AED). Algorytm max-coverage wskazuje optymalne lokalizacje, ważąc węzły przesiadkowe, miejsca wydarzeń, trasy turystyczne i szkoły. Pokazuje wzrost pokrycia z 61% do 78%.
- **Dane:** AED, WC, EKO, PRZYST, LINIE, WYD, TRASY, BOISKA
- **Moment „wow” w demo:** Suwak „liczba nowych urządzeń” i rosnące pokrycie na mapie w czasie rzeczywistym.
- **Oceny:** Dane 10 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Najmocniejsze wykorzystanie danych (łączenie wielu zbiorów), konkretna decyzja i oszczędność pieniędzy.
- **Ryzyka:** AED jest promowane w ogłoszeniach, więc inne zespoły też zrobią „mapę AED”. Trzeba się wyróżnić optymalizacją.

<a id="p004"></a>
### #4. Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076
**Wyzwanie:** W1 (alt. W3) · **Typ:** AI LLM (Bielik), polityka publiczna · **Wynik: 77.0** ★★★★★ (ocena jury 8.20/10)

- **Opis:** Inspiracja walijskim Well-being of Future Generations Act. Dla każdej trwającej konsultacji społecznej panel agentów AI (na Bieliku) odgrywa przyszłych mieszkańców 2076: dziecko urodzone dziś, seniorkę, osobę z niepełnosprawnością, przyrodę. Agenci analizują projekt na tle danych o okolicy. Wynikiem jest „Ocena Wpływu Międzypokoleniowego”: karta 1 strony z ryzykami, szansami i pytaniami, które warto zadać w konsultacji. Narzędzie nie składa uwag w imieniu ludzi, tylko pomaga mieszkańcom i urzędnikom myśleć długoterminowo.
- **Dane:** KONS (+kategorie, dzielnice), BO, AQ, POG, PRZYST, RCN
- **Moment „wow” w demo:** Na żywo debata agentów o realnej konsultacji z portalu, a na końcu wygenerowana karta oceny z mapą i danymi.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 9
- **Uzasadnienie:** Bardzo wysoka innowacyjność w sensie polityki publicznej. W jury zasiada przedstawiciel Wydziału Innowacyjnych Polityk Publicznych MC, pełnomocniczka ds. strategii i COO Bielik.AI. Wdrożenie: moduł na konsultacje.um.warszawa.pl.
- **Ryzyka:** Trzeba uniknąć wrażenia, że AI zastępuje głos mieszkańców. Jakość analiz zależy od jakości opisów konsultacji.

<a id="p005"></a>
### #5. Konsultacje, które widać
**Wyzwanie:** W3 (alt. W1) · **Typ:** AI tekst + obraz, dostępność · **Wynik: 76.4** ★★★★★ (ocena jury 8.55/10)

- **Opis:** Każda konsultacja społeczna dostaje: streszczenie w tekście łatwym do czytania (ETR), tłumaczenie UA/EN, wizualizację AI „przed i po”, kontekst danych o okolicy (komunikacja, powietrze, ceny, infrastruktura) oraz 60-sekundowe audio. Cel: więcej i lepszych głosów w konsultacjach.
- **Dane:** KONS (+kategorie, dzielnice), BO, PRZYST, AQ, AED, WC, RCN
- **Moment „wow” w demo:** Prawdziwa trwająca konsultacja w wersji urzędowej i w wersji z naszego narzędzia, obok siebie.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Moduł do istniejącego portalu konsultacji, więc wdrożenie jest oczywiste. Dostępność (ETR) to temat bliski miastu (regulamin sam o nim mówi).
- **Ryzyka:** Pokrywa się z „BO w obrazach”, warto je połączyć.

<a id="p006"></a>
### #6. Sprawiedliwość taborowa / Złap elektryka
**Wyzwanie:** W3 · **Typ:** Analityka + aplikacja · **Wynik: 75.4** ★★★★★ (ocena jury 8.15/10)

- **Opis:** Pytanie: czy niektóre dzielnice systematycznie dostają starsze, spalinowe autobusy? Łączymy rejestr taboru z GPS i mierzymy średni wiek i trakcję floty obsługującej każdą dzielnicę, zestawiając to z jakością powietrza. Funkcja dla pasażera: „za 4 min przyjedzie elektryk z 2024 r., za 6 min diesel z 2008 r.”.
- **Dane:** TABOR (rok, trakcja), GPS, AQ, PRZYST, LINIE
- **Moment „wow” w demo:** Mapa dzielnic według wieku taboru na żywo.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Nieoczywiste pytanie badawcze, rzadko używany zbiór i temat sprawiedliwości.
- **Ryzyka:** Może się okazać, że różnic nie ma. To też wynik, ale słabszy na pitch.

<a id="p007"></a>
### #7. Bezpieczne wydarzenie – automatyczna karta dla organizatorów
**Wyzwanie:** W3 · **Typ:** Automatyzacja, raporty · **Wynik: 75.2** ★★★★★ (ocena jury 7.75/10)

- **Opis:** Dla każdego wydarzenia automatycznie generujemy kartę bezpieczeństwa i dostępności: najbliższe AED, toalety (w tym bez barier), dojazd komunikacją i utrudnienia w tym dniu, parkingi, prognoza pogody i powietrza. Może trafić do urzędu przy zgłaszaniu imprez.
- **Dane:** WYD, AED, WC, PRZYST, ODJ, UTR, POG, AQ, PARK
- **Moment „wow” w demo:** Generacja karty PDF dla prawdziwego wydarzenia z kalendarza.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Łączy aż 9 zbiorów w jeden użyteczny produkt.
- **Ryzyka:** Mało spektakularne wizualnie.

<a id="p008"></a>
### #8. 15-minutowa Warszawa – indeks dostępności usług
**Wyzwanie:** W3 (alt. W1) · **Typ:** Analityka przestrzenna · **Wynik: 75.1** ★★★★★ (ocena jury 8.05/10)

- **Opis:** Siatka heksagonów z indeksem dostępności pieszej do miejskich usług z otwartych danych, zestawiona z historycznymi wydatkami BO. Pytanie: czy BO trafia tam, gdzie brakuje najwięcej?
- **Dane:** PRZYST, AED, WC, EKO, BOISKA, SPORT, WYD, BO
- **Moment „wow” w demo:** Mapa luk i wykres „wydatki BO a deficyt usług”.
- **Oceny:** Dane 10 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Analiza strategiczna, bardzo dobra dla Biura Strategii.
- **Ryzyka:** Analizy 15-min są popularne. Pomaga połączenie z BO.

<a id="p009"></a>
### #9. Radio Dzielnica – codzienny, personalizowany briefing audio
**Wyzwanie:** W2 · **Typ:** AI tekst + TTS, audio · **Wynik: 74.6** ★★★★☆ (ocena jury 8.00/10)

- **Opis:** Codziennie rano 3-minutowy „podcast” generowany dla Twojej okolicy i trasy dojazdu: pogoda i powietrze, utrudnienia, 2–3 wydarzenia i zajęcia sportowe na wieczór, trwająca konsultacja do wypełnienia. Tekst pisze Bielik, a czyta naturalny polski głos. Dystrybucja przez podcast RSS, WhatsApp, Spotify lub kanał operatora.
- **Dane:** WYD, SPORT, UTR, AQ, POG, KONS, BO, BOISKA
- **Moment „wow” w demo:** Na scenie odtwarzamy odcinek wygenerowany na niedzielę 18.10 dla Woli. Jury słyszy produkt, zamiast oglądać slajdy.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Świetna prezentacja (audio). Łączy work-life balance, wydarzenia i relacje lokalne, czyli wszystkie elementy W2. Bielik i Play w jury.
- **Ryzyka:** Jakość polskiego TTS i ryzyko halucynacji. Trzeba ograniczyć LLM do faktów z danych.

<a id="p010"></a>
### #10. Każda sekunda – AED a wydarzenia masowe
**Wyzwanie:** W3 · **Typ:** Analityka, bezpieczeństwo · **Wynik: 74.3** ★★★★☆ (ocena jury 7.65/10)

- **Opis:** Dla każdego nadchodzącego wydarzenia z kalendarza miasta liczymy pieszy czas dotarcia do najbliższego AED i ostrzegamy organizatora („koncert X: najbliższy AED 7 min, rekomendujemy mobilny AED”). Do tego mapa „pustyń AED”.
- **Dane:** AED, WYD, PRZYST, GPS, WC
- **Moment „wow” w demo:** Lista weekendowych wydarzeń z czerwonymi flagami.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo konkretne i ratujące życie.
- **Ryzyka:** AED to oczywisty temat, więc tłok na konkursie.

<a id="p011"></a>
### #11. Elektryfikacja 2076 – które linie elektryfikować najpierw
**Wyzwanie:** W1 (alt. W3) · **Typ:** Analityka, optymalizacja · **Wynik: 74.0** ★★★★☆ (ocena jury 8.35/10)

- **Opis:** Łączymy rejestr taboru (rok, trakcja) z pozycjami na żywo, żeby wiedzieć, które linie dziś obsługują stare diesle. Nakładamy to na jakość powietrza i lokalizację szkół. Algorytm układa kolejność elektryfikacji linii tak, by jak najszybciej zmniejszyć ekspozycję dzieci na spaliny. Do tego ścieżka do 100% zeroemisyjnej floty.
- **Dane:** TABOR (rok produkcji, trakcja), GPS (numer pojazdu na linii), AQ, BOISKA (szkoły), PRZYST
- **Moment „wow” w demo:** Mapa linii pokolorowanych według wieku i trakcji pojazdów na żywo oraz ranking priorytetów.
- **Oceny:** Dane 9 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Bardzo dobre, nieoczywiste łączenie 3–5 zbiorów. Realny decydent (ZTM/MZA). Mało kto zajrzy do zbioru o taborze.
- **Ryzyka:** Dopasowanie pojazdów z GPS do taboru wymaga ostrożnego łączenia numerów taborowych.

<a id="p012"></a>
### #12. Warszawa MCP – otwarte dane dla każdego asystenta AI (z Bielikiem)
**Wyzwanie:** W3 · **Typ:** AI agent, infrastruktura · **Wynik: 74.0** ★★★★☆ (ocena jury 7.80/10)

- **Opis:** Serwer Model Context Protocol, który udostępnia wszystkie zbiory miasta jako narzędzia dla AI. Dzięki temu dowolny asystent (Bielik, Claude, ChatGPT, Copilot) odpowiada na pytania o Warszawę na prawdziwych danych. Do tego referencyjny czat na Bieliku z mapą wyników. Miasto zmienia się z dostawcy plików w dostawcę danych dla ery AI.
- **Dane:** Wszystkie 23 zbiory przez API
- **Moment „wow” w demo:** Ten sam prompt w 3 różnych asystentach i za każdym razem poprawna odpowiedź z danymi miasta na żywo.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 10
- **Uzasadnienie:** Dla Wydziału Zarządzania Danymi i Bielik.AI to strzał w dziesiątkę. Proste i wdrażalne.
- **Ryzyka:** Czaty będą też u innych zespołów. Trzeba podkreślić aspekt infrastrukturalny.

<a id="p013"></a>
### #13. Konsultacje bez barier – ETR, ukraiński, angielski, audio
**Wyzwanie:** W3 · **Typ:** AI LLM, dostępność · **Wynik: 73.4** ★★★★☆ (ocena jury 7.50/10)

- **Opis:** Automatyczne wersje każdej konsultacji: tekst łatwy do czytania, ukraiński i angielski (duża społeczność ukraińska w Warszawie) oraz audio. Narzędzie może działać jako wtyczka do portalu konsultacji.
- **Dane:** KONS, KONS-kategorie, KONS-dzielnice
- **Moment „wow” w demo:** Konsultacja w 4 wersjach i porównanie czytelności (indeks FOG).
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 9 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 8
- **Uzasadnienie:** Bardzo wdrażalne, inkluzywne, tanie.
- **Ryzyka:** Technicznie proste, mniej wow.

<a id="p014"></a>
### #14. Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów
**Wyzwanie:** W2 (alt. W3) · **Typ:** AI głos, telefonia · **Wynik: 73.3** ★★★★☆ (ocena jury 8.20/10)

- **Opis:** Zwykły numer telefonu, bez aplikacji i internetu. Senior dzwoni i pyta po polsku: „Co ciekawego jest jutro na Bielanach?”, „Kiedy przyjedzie 180?”. Agent głosowy (STT, Bielik z narzędziami do API miasta, TTS) odpowiada z prawdziwych danych. Kanał operatora telekomunikacyjnego to naturalne wdrożenie.
- **Dane:** WYD, SPORT (60+), ODJ, GPS, WC, AED, AQ, KONS, EKO
- **Moment „wow” w demo:** Juror dzwoni ze swojego telefonu na scenie i dostaje odpowiedź z danych na żywo.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Najmocniejsze demo „na żywo” i walka z wykluczeniem cyfrowym. CTO Play i Bielik.AI w jury.
- **Ryzyka:** Opóźnienia głosu i hałas na sali. Trzeba mieć nagrany backup.

<a id="p015"></a>
### #15. BO pod lupą – co się udało, co utknęło
**Wyzwanie:** W3 · **Typ:** Transparentność, dataviz · **Wynik: 72.3** ★★★★☆ (ocena jury 7.45/10)

- **Opis:** Panel przejrzystości Budżetu Obywatelskiego: realizacja w czasie, opóźnienia, kategorie wygrywające w dzielnicach, rozkład pieniędzy na mieszkańca.
- **Dane:** BO (statusy, kosztorysy, edycje)
- **Moment „wow” w demo:** Interaktywne wykresy według dzielnic i edycji.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Solidne i wdrażalne.
- **Ryzyka:** Dashboard to przeciętna innowacyjność.

<a id="p016"></a>
### #16. Dźwięk Warszawy – miasto jako relaksująca muzyka na żywo
**Wyzwanie:** W2 · **Typ:** Sonifikacja, generatywna muzyka · **Wynik: 72.0** ★★★★☆ (ocena jury 7.85/10)

- **Opis:** Generatywny ambient na żywo z danych miasta: tramwaje dają tony, wiatr i deszcz ze stacji ZOM tworzą tekstury, a jakość powietrza ustala tonację. Na skupienie, medytację i odpoczynek. Można go też odtwarzać jako instalację w przestrzeni publicznej, np. w metrze albo w parku.
- **Dane:** GPS (rytm ruchu), AQ, POG (wiatr, opad), WYD
- **Moment „wow” w demo:** Pitch zaczyna się od 20 s ciszy, a potem gra Warszawa „teraz”.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 10 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Najbardziej zapamiętywalne demo w całym konkursie i bardzo oryginalne.
- **Ryzyka:** Potencjał wdrożeniowy jest dyskusyjny, Q&A może to obnażyć.

<a id="p017"></a>
### #17. Gołoledź Alert – ostrzeżenia z temperatury nawierzchni
**Wyzwanie:** W3 · **Typ:** Analityka, alerty · **Wynik: 71.7** ★★★★☆ (ocena jury 7.75/10)

- **Opis:** Stacje ZOM mierzą temperaturę nawierzchni, a mało kto o tym wie. Gdy nawierzchnia jest poniżej 0°C przy wilgoci, wysyłamy alert dla seniorów i rowerzystów i pokazujemy mapę ryzyka dla służb zimowego utrzymania (ZOM to właściciel danych). Do tego przewidywanie oblodzenia 2–3 h naprzód.
- **Dane:** POG (temp. nawierzchni, wilgotność, opad), PRZYST, TRASY, AED
- **Moment „wow” w demo:** Symulacja zimowej nocy i alerty pojawiające się na mapie.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo nieoczywiste użycie danych, realny właściciel wdrożenia. Upadki seniorów kosztują system zdrowia.
- **Ryzyka:** W październiku nie będzie realnego oblodzenia, więc demo musi być symulacją.

<a id="p018"></a>
### #18. Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo
**Wyzwanie:** W2 (alt. W3) · **Typ:** AI tekst, druk · **Wynik: 71.4** ★★★★☆ (ocena jury 7.35/10)

- **Opis:** Co tydzień generowana jednostronicowa gazetka dla osiedla (PDF do druku w domach kultury, bibliotekach i spółdzielniach): wydarzenia, konsultacje, utrudnienia, zajęcia dla seniorów, ekopunkty. Tekst łatwy do czytania. Docieramy do ludzi, do których aplikacje nie dotrą.
- **Dane:** WYD, KONS, BO, UTR, SPORT, WC, AED, EKO
- **Moment „wow” w demo:** Rozdajemy jury wydrukowane gazetki dla ich dzielnic.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo wdrażalne i tanie. Fizyczny artefakt na pitchu zapada w pamięć.
- **Ryzyka:** Mniej techniczne, część jury może uznać to za mało ambitne.

<a id="p019"></a>
### #19. Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu
**Wyzwanie:** W3 (alt. W1) · **Typ:** Analityka klimatyczna · **Wynik: 71.3** ★★★★☆ (ocena jury 7.70/10)

- **Opis:** Metryka „ekspozycja cieplna oczekiwania” = średni czas czekania (z częstotliwości odjazdów) × temperatura nawierzchni × brak cienia. Ranking przystanków, na których wiata, drzewo albo kurtyna wodna dadzą najwięcej, wraz z gotowym uzasadnieniem do BO lub ZTM.
- **Dane:** PRZYST, LINIE, ODJ (częstotliwość = czas czekania), POG (temp. nawierzchni), AQ; + LoD2/OSM (zacienienie)
- **Moment „wow” w demo:** Top 10 „najgorętszych” przystanków ze zdjęciami i AI-wizualizacją po adaptacji.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Nieoczywiste połączenie danych transportowych i pogodowych, konkretny i tani wynik.
- **Ryzyka:** Zacienienie trzeba oszacować z danych zewnętrznych. Mała rozdzielczość stacji ZOM.

<a id="p020"></a>
### #20. Uczciwa cena – sprawdź, czy mieszkanie nie jest przepłacone
**Wyzwanie:** W3 · **Typ:** Aplikacja konsumencka, ML · **Wynik: 70.8** ★★★★☆ (ocena jury 7.65/10)

- **Opis:** Wklejasz ogłoszenie. Model oparty na prawdziwych transakcjach z RCN szacuje cenę rynkową i pokazuje 10 porównywalnych transakcji oraz „jakość okolicy” z otwartych danych.
- **Dane:** RCN, PRZYST, AQ, AED, BOISKA, WC
- **Moment „wow” w demo:** Wklejenie ogłoszenia z portalu i werdykt.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo zrozumiały problem.
- **Ryzyka:** Istnieją serwisy komercyjne. Warunki wykorzystania RCN mogą ograniczać zastosowania.

<a id="p021"></a>
### #21. Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca
**Wyzwanie:** W1 (alt. W3) · **Typ:** AI obraz, 3D, mapa · **Wynik: 70.7** ★★★★☆ (ocena jury 8.40/10)

- **Opis:** Mapa 3D Warszawy (budynki LoD2/OSM w deck.gl lub MapLibre). Klikasz dowolny punkt: widzisz zdjęcie ulicy dziś (Mapillary) i wersję „2076” wygenerowaną modelem image-to-image. Prompt nie jest wymyślony – składa się z danych: zaplanowane projekty BO i konsultacje w promieniu 300 m, temperatura nawierzchni ze stacji ZOM, jakość powietrza, dostępność komunikacji. Każdy render ma „paragon danych”, czyli wyjaśnienie, z czego wynika każda zmiana, oraz przycisk „wpłyń na to dziś”, który prowadzi do trwającej konsultacji albo głosowania BO.
- **Dane:** BO, KONS, POG (temp. nawierzchni), AQ, PRZYST/LINIE; + LoD2 GUGiK, Mapillary
- **Moment „wow” w demo:** Jurorka podaje adres swojego biura, a po 15 s widzi jego wersję z 2076 r. z listą danych, które ją ukształtowały.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 10 · Wykonalność 6 · Dopasowanie do jury 8
- **Uzasadnienie:** Maksymalny efekt wow i mocny związek z W1. Paragon danych podnosi ocenę za wykorzystanie danych, a link do konsultacji daje ścieżkę wdrożenia dla Biura Strategii.
- **Ryzyka:** Obrazy AI mogą być odebrane jako gadżet. Trzeba mocno pokazać logikę danych. Ryzyko integracji 3D i Mapillary w 24 h.

<a id="p022"></a>
### #22. Warszawa Data Stories – automatyczne dziennikarstwo danych
**Wyzwanie:** W3 · **Typ:** AI LLM, dataviz · **Wynik: 70.5** ★★★★☆ (ocena jury 7.55/10)

- **Opis:** Agent co tydzień przegląda dane miasta, znajduje anomalie i ciekawostki („najgorsze powietrze tygodnia na Targówku”, „rekordowa liczba wydarzeń”) i pisze krótkie artykuły z wykresami dla mediów lokalnych i social media.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** 3 wygenerowane historie z dzisiejszych danych.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Promuje portal otwartych danych, co odpowiada interesowi Wydziału Zarządzania Danymi.
- **Ryzyka:** Wymaga historii danych, której w API często nie ma.

<a id="p023"></a>
### #23. Zapytaj Dane – analityk AI dla urzędników (Bielik on-prem)
**Wyzwanie:** W3 · **Typ:** AI agent, BI · **Wynik: 69.9** ★★★☆☆ (ocena jury 7.80/10)

- **Opis:** Urzędnik pyta w języku naturalnym („ile projektów BO o zieleni zrealizowano na Pradze i gdzie brakuje AED?”). Agent pisze zapytania, łączy zbiory i oddaje mapę lub wykres. Działa lokalnie na Bieliku, bez wysyłania danych do USA (suwerenność danych).
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Pytanie zadane przez jurora z urzędu i mapa w 20 s.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 9
- **Uzasadnienie:** Suwerenne AI w administracji to temat MC i Bielik.AI.
- **Ryzyka:** Łatwo o błędne odpowiedzi agenta. Potrzebne jest pokazanie zapytań.

<a id="p024"></a>
### #24. Ile kosztuje metro? – premia cenowa transportu
**Wyzwanie:** W3 (alt. W1) · **Typ:** Ekonometria, mapa · **Wynik: 69.5** ★★★☆☆ (ocena jury 7.90/10)

- **Opis:** Model hedoniczny na transakcjach RCN: ile procent do ceny m² dodaje bliskość metra, tramwaju i częstych linii. Wynik dla polityki: ile wartości tworzą inwestycje transportowe i jak miasto może ją przechwycić. Z prognozą dla planowanych odcinków M3.
- **Dane:** RCN, PRZYST, LINIE, ODJ
- **Moment „wow” w demo:** Mapa „premii za metro” i wykres przed i po otwarciu stacji M2.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Ciekawe dla strategii i inwestora. Mocne użycie RCN.
- **Ryzyka:** Ekonometria w 24 h może być słaba statystycznie.

<a id="p025"></a>
### #25. Syrenka oprowadza – generatywny audioprzewodnik
**Wyzwanie:** W2 · **Typ:** AI tekst + głos, audio · **Wynik: 68.8** ★★★☆☆ (ocena jury 7.75/10)

- **Opis:** Trasy turystyczne miasta zamienione w dynamiczne audiospacery. Syrenka, czyli postać AI z głosem, opowiada o mijanych punktach, wtrąca dzisiejsze wydarzenia po drodze, mówi, gdzie jest toaleta, i dopasowuje długość spaceru do pogody. Pytanie zadane głosem dostaje odpowiedź na bieżąco.
- **Dane:** TRASY (punkty turystyczne), WYD, WC, AQ, POG, ODJ
- **Moment „wow” w demo:** Fragment audio i zadanie Syrence pytania na żywo.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Odkrywanie miasta (W2), świetne audio na scenie, dopasowanie do Bielika.
- **Ryzyka:** Treści o punktach trzeba wzbogacić (Wikipedia), co niesie ryzyko halucynacji.

<a id="p026"></a>
### #26. Dane w szkole – lekcje z Warszawą na żywo
**Wyzwanie:** W3 · **Typ:** Edukacja, AI · **Wynik: 68.7** ★★★☆☆ (ocena jury 7.35/10)

- **Opis:** Generator zadań z matematyki, geografii i WOS opartych na danych miasta z dzisiaj („oblicz średnią prędkość tramwaju 17”, „porównaj ceny m² na Woli i Bemowie”). Dla nauczycieli, z kartami pracy w PDF.
- **Dane:** GPS, AQ, POG, RCN, BO
- **Moment „wow” w demo:** Karta pracy wygenerowana na żywo z dzisiejszych danych.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Edukacja to obszar 42 Warsaw. Wdrożenie przez Biuro Edukacji.
- **Ryzyka:** Mało wow.

<a id="p027"></a>
### #27. Gdzie zamieszkać – dopasowanie dzielnicy do stylu życia
**Wyzwanie:** W3 · **Typ:** Rekomendacje · **Wynik: 68.5** ★★★☆☆ (ocena jury 7.40/10)

- **Opis:** Quiz o stylu życia, z którego wychodzi ranking osiedli z ceną z RCN i dopasowaniem do preferencji.
- **Dane:** RCN, AQ, PRZYST, SPORT, WYD, BOISKA, WC, AED
- **Moment „wow” w demo:** Quiz z jurorami.
- **Oceny:** Dane 10 · Innowacyjność 5 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Łączy wiele zbiorów.
- **Ryzyka:** Bardzo częsty pomysł na hackathonach.

<a id="p028"></a>
### #28. Warszawa Wrapped – miasto w stylu Spotify Wrapped
**Wyzwanie:** W2 (alt. W3) · **Typ:** Dataviz, social · **Wynik: 68.5** ★★★☆☆ (ocena jury 7.05/10)

- **Opis:** Interaktywne, udostępnialne „podsumowanie roku” Warszawy (lub Twojej dzielnicy) z danych: ile projektów BO zrealizowano, ile wydarzeń się odbyło, mediana ceny m², ile pojazdów jeździ teraz. Narzędzie promocji otwartych danych.
- **Dane:** BO, KONS, RCN, WYD, GPS, AQ, AED, WC
- **Moment „wow” w demo:** Pionowa karuzela kart jak w Instagram Stories.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 5 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 9 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo łatwe, ładne, promuje portal danych.
- **Ryzyka:** Część zbiorów to tylko stan bieżący (brak historii). Słaby „problem do rozwiązania”.

<a id="p029"></a>
### #29. Czy mój projekt BO wygra? – trener wniosków
**Wyzwanie:** W3 · **Typ:** ML, AI LLM · **Wynik: 68.2** ★★★☆☆ (ocena jury 7.75/10)

- **Opis:** Model uczony na historycznych projektach BO przewiduje szansę wygranej i doradza (np. „projekty zieleni poniżej 200 tys. zł wygrywają w tej dzielnicy w 64%”). Bielik poprawia czytelność opisu.
- **Dane:** BO (wyniki głosowań, opisy, koszty, lokalizacje)
- **Moment „wow” w demo:** Wklejenie opisu i prawdopodobieństwo z rekomendacjami.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Ciekawy ML na rzadko analizowanych danych.
- **Ryzyka:** Etyka „optymalizacji pod głosowanie”. Niewielki zbiór treningowy.

<a id="p030"></a>
### #30. Agent uwag do konsultacji – pomoc w napisaniu rzeczowej opinii
**Wyzwanie:** W3 (alt. W1) · **Typ:** AI LLM · **Wynik: 68.2** ★★★☆☆ (ocena jury 7.30/10)

- **Opis:** Mieszkaniec mówi, co mu się nie podoba. AI pomaga sformułować konkretną, rzeczową uwagę z danymi („przystanek ma tylko 2 linie, a w promieniu 500 m...”) i wskazuje termin i formę złożenia.
- **Dane:** KONS, AQ, PRZYST, RCN, AED, WC
- **Moment „wow” w demo:** Przekształcenie emocjonalnej wypowiedzi w merytoryczną uwagę.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Podnosi jakość partycypacji, co wprost pomaga urzędowi.
- **Ryzyka:** Ryzyko „AI-spamu” w konsultacjach. Trzeba pokazać zabezpieczenia.

<a id="p031"></a>
### #31. Data Quality Watchdog – audyt jakości miejskich zbiorów
**Wyzwanie:** W3 · **Typ:** Narzędzie dla urzędu · **Wynik: 68.2** ★★★☆☆ (ocena jury 6.95/10)

- **Opis:** Automatyczny monitoring kompletności, aktualności i spójności zbiorów (np. toalety bez godzin, AED z nieaktualną datą) z raportem dla urzędu i publicznym wskaźnikiem jakości.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Raport „zdrowia” 23 zbiorów.
- **Oceny:** Dane 9 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 7 · Prezentacja 5 · Wykonalność 9 · Dopasowanie do jury 8
- **Uzasadnienie:** Wdrażalne od jutra, cenne dla urzędu.
- **Ryzyka:** Nudne na scenie. Może zostać odebrane jako wytykanie błędów.

<a id="p032"></a>
### #32. Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D
**Wyzwanie:** W1 (alt. W3) · **Typ:** 3D, analityka przestrzenna, AI wizja · **Wynik: 68.0** ★★★☆☆ (ocena jury 8.15/10)

- **Opis:** Z modelu LoD2 liczymy płaskie i lekko nachylone dachy, ich powierzchnię i orientację. Dla każdego budynku szacujemy potencjał zielonego dachu, fotowoltaiki i retencji deszczówki. Priorytet rośnie tam, gdzie stacje ZOM pokazują najgorętszą nawierzchnię i największe opady, oraz przy szkołach (z bazy otwartych boisk). Efektem jest mapa 3D z dachami pokolorowanymi według potencjału i symulacja „Warszawa 2076, jeśli zazielenimy 20% dachów”.
- **Dane:** POG (temp. nawierzchni, opady), BOISKA (szkoły), BO, AQ; + LoD2 GUGiK (geometria dachów), ortofoto
- **Moment „wow” w demo:** Lot kamerą nad 3D Warszawą, dachy zmieniają kolor na zielony, a licznik pokazuje m² zieleni, MWh i m³ zatrzymanej wody.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Spektakularne 3D z twardą analityką i realnym programem miejskim (dotacje na zielone dachy, adaptacja do zmian klimatu).
- **Ryzyka:** Parsowanie CityGML LoD2 dla całego miasta jest ciężkie. Trzeba ograniczyć się do 1–2 dzielnic. Sama stacja ZOM to mała rozdzielczość przestrzenna.

<a id="p033"></a>
### #33. Gdzie miasto stoi – wąskie gardła i priorytet tramwajowy
**Wyzwanie:** W3 · **Typ:** Analityka transportowa · **Wynik: 67.6** ★★★☆☆ (ocena jury 8.10/10)

- **Opis:** Z pozycji pojazdów zbieranych co 10 s wykrywamy segmenty, na których tramwaje i autobusy tracą najwięcej czasu, i ważymy je liczbą linii. Wynikiem jest lista 10 skrzyżowań, gdzie priorytet w sygnalizacji lub buspas oszczędziłby najwięcej czasu pasażerów.
- **Dane:** GPS (zebrane w trakcie), PRZYST, ODJ, LINIE
- **Moment „wow” w demo:** Heatmapa prędkości tramwajów po 20 h zbierania.
- **Oceny:** Dane 9 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Twarde dane i konkretne rekomendacje.
- **Ryzyka:** Analizy punktualności ZTM robi się często, więc może być kilka podobnych projektów.

<a id="p034"></a>
### #34. Gramy dziś – sąsiedzkie mecze na otwartych boiskach szkolnych
**Wyzwanie:** W2 · **Typ:** Aplikacja społecznościowa · **Wynik: 67.5** ★★★☆☆ (ocena jury 7.35/10)

- **Opis:** Baza bezpłatnych boisk szkolnych z godzinami otwarcia i matchmaking: „brakuje 3 osób do piłki dziś o 19:00 na boisku przy SP 85”. Buduje relacje sąsiedzkie (wprost w opisie W2) i zwiększa wykorzystanie infrastruktury, za którą miasto płaci.
- **Dane:** BOISKA (godziny dostępności), SPORT, POG, AQ, PRZYST
- **Moment „wow” w demo:** Dwóch jurorów dołącza do meczu w aplikacji i dostaje powiadomienia.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Mocna wartość społeczna, realny właściciel wdrożenia (Biuro Sportu, Biuro Edukacji).
- **Ryzyka:** Efekt sieciowy: bez użytkowników aplikacja jest pusta (pytanie z Q&A).

<a id="p035"></a>
### #35. Nocna Warszawa – dla tych, dla których miasto nigdy nie zasypia
**Wyzwanie:** W2 · **Typ:** Aplikacja, analityka · **Wynik: 67.0** ★★★☆☆ (ocena jury 7.30/10)

- **Opis:** Opis W2 zaczyna się od zdania „Miasto nigdy nie zasypia”. Ten projekt jest dla pracowników zmianowych, medyków, kurierów i gastronomii. Pokazuje odpoczynek i aktywność w nietypowych godzinach: zajęcia rano, linie nocne na żywo, toalety czynne w nocy, wydarzenia poza godzinami szczytu. Do tego analiza dla miasta: gdzie nocą brakuje usług.
- **Dane:** GPS i ODJ (linie nocne), WC (godziny), AED, WYD, SPORT
- **Moment „wow” w demo:** Mapa „Warszawa o 3:00” i luki w usługach.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Odpowiada wprost na tekst wyzwania i na zaniedbaną grupę.
- **Ryzyka:** Mniej danych o nocnych usługach.

<a id="p036"></a>
### #36. Toalety dla kurierów i pracowników mobilnych
**Wyzwanie:** W2 (alt. W3) · **Typ:** Mapa · **Wynik: 67.0** ★★★☆☆ (ocena jury 6.95/10)

- **Opis:** Kurierzy, kierowcy i dostawcy spędzają cały dzień w mieście bez dostępu do toalet. Mapa bezpłatnych toalet czynnych teraz plus analiza luk dla miasta i propozycje lokalizacji.
- **Dane:** WC (godziny, płatność), AED, PARK
- **Moment „wow” w demo:** Mapa „gdzie skorzystać teraz” i heatmapa luk.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Zaniedbana grupa, bardzo konkretne.
- **Ryzyka:** Wąski temat, może wydać się błahy.

<a id="p037"></a>
### #37. Witaj w Warszawie – onboarding nowych mieszkańców
**Wyzwanie:** W3 · **Typ:** Asystent wielojęzyczny · **Wynik: 66.7** ★★★☆☆ (ocena jury 7.20/10)

- **Opis:** Przewodnik dla nowych mieszkańców (studenci, migranci): jak segregować śmieci, gdzie oddać elektrośmieci, jak działa komunikacja, co się dzieje w okolicy, jak zabrać głos w konsultacjach. Dostępny w wielu językach.
- **Dane:** SEG, EKO, WC, ODJ, PRZYST, WYD, SPORT, KONS
- **Moment „wow” w demo:** Rozmowa po ukraińsku i odpowiedzi z danych miasta.
- **Oceny:** Dane 9 · Innowacyjność 5 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Duża grupa docelowa i realny problem.
- **Ryzyka:** Czatowe asystenty to częsty pomysł.

<a id="p038"></a>
### #38. Radar Gentryfikacji
**Wyzwanie:** W1 (alt. W3) · **Typ:** Analityka, ML · **Wynik: 66.4** ★★★☆☆ (ocena jury 7.95/10)

- **Opis:** Wykrywamy mikroobszary, w których ceny transakcyjne rosną najszybciej względem średniej dzielnicy, i zestawiamy je z inwestycjami (BO, konsultacje, nowe linie). Wynikiem jest wczesne ostrzeganie dla polityki mieszkaniowej: gdzie grozi wypieranie mieszkańców i gdzie miasto może przechwycić wzrost wartości (opłata adiacencka).
- **Dane:** RCN (szereg czasowy), BO, KONS, PRZYST
- **Moment „wow” w demo:** Animowana mapa zmian cen 2015–2026 z hotspotami i prognozą na 2030.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Mocna wartość dla Biura Strategii i ciekawy wątek dla inwestora w jury.
- **Ryzyka:** Interpretacja przyczynowa jest ryzykowna. RCN wymaga uważnego czyszczenia.

<a id="p039"></a>
### #39. Pokédex ZTM – kolekcjonerska gra taboru
**Wyzwanie:** W3 · **Typ:** Gra mobilna · **Wynik: 66.3** ★★★☆☆ (ocena jury 7.60/10)

- **Opis:** Kolekcjonujesz pojazdy, którymi jedziesz: rzadkie modele, historyczne malowania, najstarsze tramwaje. Na żywo widzisz, gdzie teraz jeździ „legendarny” egzemplarz. Gra zachęca do komunikacji miejskiej i trafia do dużej społeczności miłośników komunikacji.
- **Dane:** TABOR (marki, modele, rocznik, malowanie), GPS
- **Moment „wow” w demo:** Na mapie pojawia się rzadki Konstal 13N, a juror „łapie” go w aplikacji.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Bardzo zabawne, unikalne użycie zbioru o taborze.
- **Ryzyka:** Wdrożenie niepewne, może być odebrane jako żart.

<a id="p040"></a>
### #40. Cyfrowy bliźniak transportu na żywo w 3D
**Wyzwanie:** W1 (alt. W3) · **Typ:** 3D, real-time · **Wynik: 66.1** ★★★☆☆ (ocena jury 7.50/10)

- **Opis:** Wszystkie autobusy i tramwaje na żywo w trójwymiarowej Warszawie (deck.gl TripsLayer): smugi ruchu, opóźnienia, utrudnienia, chmury jakości powietrza. Tryb 2076 pokazuje tę samą sieć po planowanych rozbudowach.
- **Dane:** GPS (co 10 s), PRZYST, LINIE, TABOR, UTR, AQ; + LoD2
- **Moment „wow” w demo:** Pełnoekranowy, „filmowy” widok miasta pulsującego ruchem.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 10 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Wow na scenie i świetne wykorzystanie danych live.
- **Ryzyka:** Kolejna „mapa autobusów”, więc jury może uznać, że to nic nowego.

<a id="p041"></a>
### #41. Słyszę przystanek – asystent dla osób niewidomych
**Wyzwanie:** W3 · **Typ:** Dostępność, głos · **Wynik: 65.8** ★★★☆☆ (ocena jury 7.10/10)

- **Opis:** Aplikacja głosowa: „Twój autobus 160 jest dwa przystanki stąd, będzie za 3 minuty, podjedzie na stanowisko 02”. Ostrzega o utrudnieniach i prowadzi do toalet bez barier.
- **Dane:** GPS, ODJ, PRZYST, LINIE, UTR, WC
- **Moment „wow” w demo:** Demo z zasłoniętymi oczami.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Inkluzywne, wdrażalne.
- **Ryzyka:** Istnieją podobne rozwiązania.

<a id="p042"></a>
### #42. Mikroprzygody – dzielnicowe questy i liga dzielnic
**Wyzwanie:** W2 · **Typ:** Gamifikacja · **Wynik: 65.7** ★★★☆☆ (ocena jury 7.15/10)

- **Opis:** Codzienne questy: „odwiedź punkt z trasy”, „zagraj na boisku”, „oddaj elektrośmieci w ekopunkcie”, „wypełnij konsultację”. Punkty zbierają dzielnice, a ranking dzielnic buduje lokalną tożsamość i relacje.
- **Dane:** TRASY, WYD, BOISKA, EKO, KONS, AED
- **Moment „wow” w demo:** Ranking dzielnic na żywo i quest wykonany przez jurora.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Łączy wiele zbiorów i aktywność obywatelską.
- **Ryzyka:** Gamifikacja jest częsta na hackathonach. Ryzyko pustej aplikacji.

<a id="p043"></a>
### #43. Parkingi → Parki 2076
**Wyzwanie:** W1 · **Typ:** AI obraz, symulacja · **Wynik: 65.2** ★★★☆☆ (ocena jury 7.40/10)

- **Opis:** Scenariusz: w 2076 r. autonomiczne, współdzielone pojazdy zmniejszają zapotrzebowanie na parkingi o X%. Na danych o miejskich parkingach (pojemność, obłożenie na żywo) i dostępności komunikacji liczymy, które parkingi „uwolnią się” najpierw. AI generuje wizualizację parkingu zamienionego w park, plac albo mieszkania.
- **Dane:** PARK (lokalizacje i pojemność), PRZYST/LINIE, GPS, POG; + ortofoto
- **Moment „wow” w demo:** Suwak „rok” od 2026 do 2076: parkingi na mapie znikają, a w ich miejscu pojawiają się wygenerowane parki.
- **Oceny:** Dane 7 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Silny storytelling i spójność z W1. Dane o parkingach to nietypowy wybór, mało zespołów po nie sięgnie.
- **Ryzyka:** Słaba ścieżka wdrożeniowa (spekulacja). Parkingów w zbiorze jest niewiele.

<a id="p044"></a>
### #44. Rodzinny Weekend – planer dla rodziców małych dzieci
**Wyzwanie:** W2 · **Typ:** Planer · **Wynik: 65.2** ★★★☆☆ (ocena jury 7.10/10)

- **Opis:** Planer weekendu dla rodzin, który wykorzystuje rzadko zauważane pole „przewijak” w danych o toaletach. Proponuje wydarzenia dla dzieci, trasę bez barier dla wózka, toalety z przewijakiem, boiska i place zabaw, z uwzględnieniem smogu.
- **Dane:** WYD, WC (przewijak!, dostępność), BOISKA, SPORT, AQ, POG
- **Moment „wow” w demo:** Plan soboty z dzieckiem z mapą toalet z przewijakami.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Konkretny problem, dobre wykorzystanie pól danych.
- **Ryzyka:** Konkurencja ze strony innych planerów wydarzeń.

<a id="p045"></a>
### #45. Boiska otwarte naprawdę – analiza godzin dostępności
**Wyzwanie:** W3 · **Typ:** Analityka · **Wynik: 64.6** ★★☆☆☆ (ocena jury 6.70/10)

- **Opis:** Analiza, ile godzin tygodniowo szkolne boiska są dostępne dla mieszkańców w każdej dzielnicy, i rekomendacja wydłużenia godzin tam, gdzie brakuje infrastruktury.
- **Dane:** BOISKA, SPORT
- **Moment „wow” w demo:** Mapa „godzin dostępnych na mieszkańca”.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Tanie do wdrożenia (decyzja administracyjna).
- **Ryzyka:** Wąski zakres.

<a id="p046"></a>
### #46. Koszt utrudnienia – ile minut pasażerów zabiera remont
**Wyzwanie:** W3 · **Typ:** Analityka transportowa · **Wynik: 64.4** ★★☆☆☆ (ocena jury 8.15/10)

- **Opis:** Łączymy utrudnienia z infoulice z pozycjami pojazdów zbieranymi przez 20 h. Mierzymy, ile minut opóźnienia generuje każde utrudnienie dla linii przez nie przechodzących, i układamy ranking „najdroższych” remontów. To narzędzie dla ZDM do planowania objazdów.
- **Dane:** UTR, GPS (zebrane w trakcie hackathonu), ODJ, LINIE
- **Moment „wow” w demo:** Mapa utrudnień z „licznikiem straconych minut” na żywo.
- **Oceny:** Dane 8 · Innowacyjność 8 · Wdrożenie 8 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Bardzo innowacyjna metryka, realna wartość dla ZDM i ZTM.
- **Ryzyka:** Dopasowanie pozycji do rozkładu jest trudne (brak GTFS w portalu). 20 h danych to mało.

<a id="p047"></a>
### #47. P+R Predict – prognoza wolnych miejsc i zachęta do przesiadki
**Wyzwanie:** W3 · **Typ:** ML, aplikacja · **Wynik: 63.7** ★★☆☆☆ (ocena jury 7.30/10)

- **Opis:** Model przewiduje obłożenie P+R za 30–60 min i mówi kierowcy: „zostaw auto na P+R Młociny, wolne miejsca będą do 8:20, metro za 3 min, oszczędzasz 14 min”.
- **Dane:** PARK (co minutę, zbierane w trakcie), ODJ, GPS, WYD, POG
- **Moment „wow” w demo:** Prognoza na wykresie i powiadomienie dla kierowcy.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Realny problem i dane live.
- **Ryzyka:** Zaledwie 24 h historii do treningu.

<a id="p048"></a>
### #48. Kalendarz, który dba – asystent work-life balance w Google/Outlook
**Wyzwanie:** W2 · **Typ:** Integracja kalendarza, AI · **Wynik: 63.5** ★★☆☆☆ (ocena jury 7.20/10)

- **Opis:** Wtyczka do kalendarza wykrywa przeciążenie (np. 4 wieczory z rzędu z pracą). W wolne okna proponuje konkretną aktywność z danych miasta z policzonym dojazdem i rezerwuje czas jednym kliknięciem. Model B2B: benefit wellbeingowy dla pracodawców.
- **Dane:** WYD, SPORT, BOISKA, TRASY, ODJ, AQ, POG
- **Moment „wow” w demo:** Pokaz prawdziwego kalendarza z zaproponowanymi blokami „złap oddech”.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Dosłownie odpowiada na W2. Inwestor w jury doceni model B2B.
- **Ryzyka:** Integracja OAuth i kalendarza w 24 h jest możliwa, ale żmudna.

<a id="p049"></a>
### #49. Senior 2076 – audyt miasta dla starzejącego się społeczeństwa
**Wyzwanie:** W1 (alt. W3) · **Typ:** Analityka dostępności · **Wynik: 63.5** ★★☆☆☆ (ocena jury 6.85/10)

- **Opis:** W 2076 r. co trzeci warszawiak będzie seniorem. Liczymy indeks „przyjazności dla seniora” w siatce heksagonów: toalety bez barier, AED, przystanki, zajęcia dla 60+. Wskazujemy luki i priorytety inwestycyjne.
- **Dane:** WC (dostępność, godziny), AED, PRZYST, SPORT (oferta dla seniorów), WYD
- **Moment „wow” w demo:** Mapa heksagonów z lukami i wygenerowana lista 10 rekomendacji.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Solidne, wdrażalne, mocny związek ze strategią.
- **Ryzyka:** Dość klasyczna analityka, mniej wow.

<a id="p050"></a>
### #50. Wyjdź wcześniej – utrudnienia w Twoim kalendarzu
**Wyzwanie:** W3 · **Typ:** Integracja kalendarza · **Wynik: 63.4** ★★☆☆☆ (ocena jury 6.90/10)

- **Opis:** Proaktywny alert: „Twoje spotkanie o 9:00, na trasie remont, wyjdź 12 min wcześniej, linia 523 ma opóźnienia”.
- **Dane:** UTR, GPS, ODJ
- **Moment „wow” w demo:** Powiadomienie na podstawie kalendarza jurora.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Codzienna wartość.
- **Ryzyka:** Konkurencja z Google Maps.

<a id="p051"></a>
### #51. Spacer 360° po Warszawie 2076 (VR)
**Wyzwanie:** W1 · **Typ:** AI obraz 360°, VR · **Wynik: 63.1** ★★☆☆☆ (ocena jury 7.55/10)

- **Opis:** Dla kluczowych miejsc objętych konsultacjami generujemy panoramy 360° „2076”. Można je oglądać w przeglądarce lub goglach VR i przechodzić między punktami.
- **Dane:** KONS (np. Plac Defilad, nadbrzeże), BO; + Mapillary 360
- **Moment „wow” w demo:** Juror w goglach VR „stoi” na Placu Defilad w 2076 r.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 9 · Prezentacja 10 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Ogromny efekt na scenie.
- **Ryzyka:** Generowanie spójnych panoram 360 jest trudne. Dane są głównie pretekstem.

<a id="p052"></a>
### #52. Strategia #Warszawa2030 → 2076 Tracker
**Wyzwanie:** W1 · **Typ:** Dashboard, monitoring polityk · **Wynik: 62.8** ★★☆☆☆ (ocena jury 7.05/10)

- **Opis:** Publiczny monitor celów strategii miasta (np. „miasto 15-minutowe”, „czyste powietrze”, „aktywni mieszkańcy”) z wskaźnikami liczonymi automatycznie z otwartych danych i ekstrapolacją do 2076.
- **Dane:** AQ, BO, KONS, PRZYST, AED, WC, SPORT
- **Moment „wow” w demo:** Dashboard z kafelkami celów i strzałkami trendu.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 8
- **Uzasadnienie:** Bezpośrednio adresuje pracę pełnomocniczki ds. strategii w jury.
- **Ryzyka:** Dashboardy są mało innowacyjne. Wiele wskaźników wymaga danych spoza portalu.

<a id="p053"></a>
### #53. Klimat 2076 dla Twojej ulicy
**Wyzwanie:** W1 · **Typ:** Analityka klimatyczna, AI obraz · **Wynik: 62.6** ★★☆☆☆ (ocena jury 7.10/10)

- **Opis:** Bierzemy pomiary ze stacji ZOM i nakładamy przesunięcie z projekcji klimatycznych (Warszawa 2076 ≈ dzisiejszy Belgrad lub Budapeszt). Pokazujemy liczbę dni upalnych, temperaturę asfaltu i ryzyka zdrowotne. Rekomendujemy adaptacje (zacienienie, woda pitna, toalety, AED), a AI wizualizuje ulicę po adaptacji.
- **Dane:** POG (temp. powietrza i nawierzchni, opady), AQ, WC, AED; + projekcje klimatyczne
- **Moment „wow” w demo:** Termometr 2076 dla ulicy jurora i jej wersja po adaptacji.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 7
- **Uzasadnienie:** Klimat to temat strategiczny dla miasta, a temperatura nawierzchni jest unikalnym polem w danych ZOM.
- **Ryzyka:** Mała liczba stacji. Projekcje to zewnętrzny model, więc trzeba być ostrożnym w twierdzeniach.

<a id="p054"></a>
### #54. Wtedy i teraz – historia na trasach turystycznych (AI + archiwa)
**Wyzwanie:** W2 · **Typ:** AI obraz, AR-lite · **Wynik: 62.1** ★★☆☆☆ (ocena jury 7.50/10)

- **Opis:** Na punktach tras turystycznych pokazujemy zestawienie „wtedy i teraz”: archiwalna ortofotomapa 1945, archiwalne zdjęcie koloryzowane przez AI i współczesny widok. Do tego wydarzenia kulturalne w okolicy dziś.
- **Dane:** TRASY, WYD; + ortofoto 1945, archiwa
- **Moment „wow” w demo:** Przesuwany suwak między 1945 a dziś na Starym Mieście.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Emocjonalne, warszawskie, idealne na odkrywanie miasta.
- **Ryzyka:** Prawa do archiwów i jakość koloryzacji.

<a id="p055"></a>
### #55. Spontan – swipe na wieczór ze znajomymi
**Wyzwanie:** W2 · **Typ:** Aplikacja społecznościowa · **Wynik: 62.0** ★★☆☆☆ (ocena jury 6.75/10)

- **Opis:** Grupa znajomych przesuwa propozycje wydarzeń na dziś (jak w Tinderze). Aplikacja wybiera tę z największą zgodą i optymalnym dojazdem dla wszystkich.
- **Dane:** WYD, SPORT, ODJ, GPS, POG
- **Moment „wow” w demo:** Jury głosuje na telefonach na żywo.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Zabawna, interaktywna prezentacja.
- **Ryzyka:** Mało odkrywcze, pomysł znany z innych miast.

<a id="p056"></a>
### #56. List z 2076
**Wyzwanie:** W1 · **Typ:** AI tekst + obraz · **Wynik: 61.7** ★★☆☆☆ (ocena jury 6.40/10)

- **Opis:** Wpisujesz swój adres i dostajesz list od wnuka z 2076 r., który opisuje Twoją okolicę. Treść wynika z trendów w danych: ceny, powietrze, upał, projekty BO, konsultacje. Do listu dołączona jest wygenerowana „pocztówka”.
- **Dane:** AQ, POG, BO, KONS, RCN (dla adresu)
- **Moment „wow” w demo:** Odczytanie listu dla adresu jurorki.
- **Oceny:** Dane 5 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 7 · Prezentacja 9 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Bardzo łatwe, wzruszające, dobre na pitch.
- **Ryzyka:** Gadżet bez problemu do rozwiązania, więc niska ocena wdrożeniowa i ryzyko „kolejnej apki”.

<a id="p057"></a>
### #57. Infoulice AI – utrudnienia po ludzku
**Wyzwanie:** W3 · **Typ:** AI LLM · **Wynik: 61.6** ★★☆☆☆ (ocena jury 6.70/10)

- **Opis:** LLM zamienia komunikaty o utrudnieniach w strukturalne dane i proste streszczenia: które linie są dotknięte, jak długo, jaki jest objazd.
- **Dane:** UTR, LINIE, PRZYST
- **Moment „wow” w demo:** Komunikat przed i po.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Proste i przydatne.
- **Ryzyka:** Mało spektakularne.

<a id="p058"></a>
### #58. Warszawa w RCS / SMS – info bez aplikacji
**Wyzwanie:** W2 (alt. W3) · **Typ:** Kanał telco · **Wynik: 61.4** ★★☆☆☆ (ocena jury 6.55/10)

- **Opis:** Usługa wiadomości RCS i SMS: piszesz „Wola wieczór” i dostajesz karuzelę wydarzeń z dojazdem. Kanał natywny dla operatora.
- **Dane:** WYD, ODJ, AQ, UTR, KONS
- **Moment „wow” w demo:** Demo w aplikacji Wiadomości na telefonie jurora.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 8
- **Uzasadnienie:** Bezpośrednio dopasowane do CTO Play.
- **Ryzyka:** Dostęp do RCS Business Messaging w 24 h może być niemożliwy (fallback SMS).

<a id="p059"></a>
### #59. Puls Miasta – dashboard dla prezydenta
**Wyzwanie:** W3 · **Typ:** Dashboard · **Wynik: 61.3** ★★☆☆☆ (ocena jury 6.60/10)

- **Opis:** Jedno okno z bieżącym stanem miasta.
- **Dane:** Wszystkie zbiory
- **Moment „wow” w demo:** Ekran z kafelkami.
- **Oceny:** Dane 9 · Innowacyjność 4 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 7
- **Uzasadnienie:** Dużo danych.
- **Ryzyka:** Klasyczny dashboard o niskiej innowacyjności.

<a id="p060"></a>
### #60. AR: zobacz projekt na swojej ulicy (text-to-3D + WebXR)
**Wyzwanie:** W1 (alt. W3) · **Typ:** AI 3D, AR · **Wynik: 61.1** ★★☆☆☆ (ocena jury 8.20/10)

- **Opis:** Z opisu projektu BO lub konsultacji model text-to-3D (np. TRELLIS / Hunyuan3D / Meshy) generuje obiekt: ławkę, plac zabaw, wiatę. Telefon w WebXR stawia go w prawdziwym miejscu w skali 1:1. Mieszkańcy widzą, na co głosują.
- **Dane:** BO (opisy i lokalizacje), KONS
- **Moment „wow” w demo:** Wideo z AR nagrane w nocy na ulicy przy kampusie 42 i na żywo model na scenie.
- **Oceny:** Dane 7 · Innowacyjność 9 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 9 · Wykonalność 4 · Dopasowanie do jury 7
- **Uzasadnienie:** Najwyższa innowacyjność i świetne dopasowanie do Twojego zainteresowania 3D/AI.
- **Ryzyka:** Najwyższe ryzyko techniczne (WebXR, jakość modeli 3D). Demo w sali jest trudne.

<a id="p061"></a>
### #61. Spokojna Warszawa – miasto przyjazne sensorycznie
**Wyzwanie:** W2 · **Typ:** Mapa, rekomendacje · **Wynik: 61.1** ★★☆☆☆ (ocena jury 7.00/10)

- **Opis:** Mapa i planer dla osób z wypaleniem, neuroatypowych i introwertyków: spokojne miejsca i pory, trasy z dala od dużych wydarzeń, toalety, ciche przystanki. Na żywo pokazuje „gdzie teraz jest tłoczno”.
- **Dane:** WYD (tłumy), WC, TRASY, PRZYST, GPS; + czujniki hałasu IoT (bulwary)
- **Moment „wow” w demo:** Planer omija koncert na Narodowym i wybiera spokojną trasę.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Nietypowa grupa docelowa, dobra innowacja społeczna.
- **Ryzyka:** Dane o hałasie są szczątkowe (sezonowo tylko bulwary).

<a id="p062"></a>
### #62. Dostępny przejazd – planer dla osób z niepełnosprawnościami
**Wyzwanie:** W3 · **Typ:** Planer · **Wynik: 61.1** ★★☆☆☆ (ocena jury 6.65/10)

- **Opis:** Trasa z gwarancją toalet bez barier po drodze i ostrzeżeniami o utrudnieniach.
- **Dane:** WC (Dostępność), PRZYST, ODJ, GPS, UTR
- **Moment „wow” w demo:** Planer z filtrem dostępności.
- **Oceny:** Dane 7 · Innowacyjność 5 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Inkluzywny.
- **Ryzyka:** Mało danych o dostępności (brak danych o windach i peronach).

<a id="p063"></a>
### #63. Wehikuł czasu 1945 → 2026 → 2076
**Wyzwanie:** W1 · **Typ:** 3D, AI obraz, historia · **Wynik: 60.9** ★★☆☆☆ (ocena jury 7.70/10)

- **Opis:** Suwak czasu na mapie: ortofotomapa zniszczonej Warszawy z 1945 r., dzisiejsza i AI-ekstrapolacja 2076 oparta na planowanych inwestycjach (BO, konsultacje). Budynki 3D „wyrastają” między epokami. Do tego narracja: jak Warszawa odbudowała się w 80 lat i co możemy zrobić w kolejne 50.
- **Dane:** ortofoto 1945/2025 (serwis mapowy m.st.), BO, KONS, TRASY; + LoD2
- **Moment „wow” w demo:** Płynne przejście od ruin 1945 do zielonej Warszawy 2076 w jednym ujęciu kamery.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 10 · Prezentacja 10 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Emocjonalnie najsilniejszy możliwy pitch o Warszawie, idealny dla W1.
- **Ryzyka:** Ortofoto nie jest na portalu dane.um, więc trzeba je dopiąć jako dodatek. Rdzeń danych z portalu jest słaby. Ciężkie rastry.

<a id="p064"></a>
### #64. Ceny a smog – ile warte jest czyste powietrze
**Wyzwanie:** W3 · **Typ:** Ekonometria · **Wynik: 60.7** ★★☆☆☆ (ocena jury 6.95/10)

- **Opis:** Badanie, czy jakość powietrza wpływa na ceny transakcyjne w Warszawie.
- **Dane:** RCN, AQ, POG
- **Moment „wow” w demo:** Wykres korelacji.
- **Oceny:** Dane 8 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ciekawa teza.
- **Ryzyka:** Mało stacji AQ, wynik może być nieistotny.

<a id="p065"></a>
### #65. Eko-przypominacz po drodze
**Wyzwanie:** W3 · **Typ:** Geofencing · **Wynik: 60.7** ★★☆☆☆ (ocena jury 6.60/10)

- **Opis:** Przypomnienie „mijasz ekopunkt, masz w plecaku baterie?” na podstawie trasy i listy rzeczy do oddania.
- **Dane:** EKO, SEG, PRZYST
- **Moment „wow” w demo:** Powiadomienie na trasie.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Prosty nudge.
- **Ryzyka:** Niski wow.

<a id="p066"></a>
### #66. Gra o Warszawę 2076 – strategia na prawdziwych danych
**Wyzwanie:** W1 · **Typ:** Gra, AI narrator (Bielik) · **Wynik: 60.2** ★★☆☆☆ (ocena jury 7.20/10)

- **Opis:** Przeglądarkowa gra turowa: jesteś prezydentem w latach 2026–2076. Co 5 lat dostajesz budżet i karty decyzji zbudowane z prawdziwych projektów BO z ich kosztami. Model pokazuje wpływ na powietrze, dostępność transportu i ceny mieszkań. Bielik jako narrator komentuje skutki i porównuje je z celami strategii #Warszawa2030.
- **Dane:** BO (koszty projektów), AQ, PRZYST, RCN, KONS
- **Moment „wow” w demo:** Juror rozgrywa 1 turę na scenie, a mapa reaguje na jego decyzję.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Wysoka angażowalność i edukacja obywatelska. Pasuje do 42 Warsaw.
- **Ryzyka:** Modele wpływu będą uproszczone i łatwo je podważyć w Q&A. Wdrożenie niejasne.

<a id="p067"></a>
### #67. Mikroprzerwa 30 min
**Wyzwanie:** W2 · **Typ:** Aplikacja mobilna · **Wynik: 60.2** ★★☆☆☆ (ocena jury 6.55/10)

- **Opis:** Podajesz, gdzie jesteś i ile masz czasu (np. 30 min w przerwie). Dostajesz jedną propozycję: siłownię plenerową 6 min od biura, krótki odcinek trasy turystycznej albo zajęcia, z uwzględnieniem pogody i powietrza.
- **Dane:** BOISKA, SPORT, TRASY, AQ, POG, WC
- **Moment „wow” w demo:** Jeden przycisk „mam 30 minut” i natychmiastowa propozycja.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Prosta, czytelna wartość.
- **Ryzyka:** Podobnych rekomendatorów będzie kilka, więc innowacyjność jest średnia.

<a id="p068"></a>
### #68. Godzina dla osiedla – mikrowolontariat
**Wyzwanie:** W2 · **Typ:** Społeczność · **Wynik: 59.8** ★★☆☆☆ (ocena jury 6.50/10)

- **Opis:** „Masz godzinę? Zrób coś dla osiedla”: pomoc w lokalnym wydarzeniu, wypełnienie konsultacji, zbiórka elektrośmieci do ekopunktu.
- **Dane:** BO, KONS, WYD, EKO
- **Moment „wow” w demo:** Lista zadań na dziś w okolicy.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Relacje lokalne.
- **Ryzyka:** Słaba podstawa danych.

<a id="p069"></a>
### #69. Miasto-gąbka 2076
**Wyzwanie:** W1 · **Typ:** AI wizja komputerowa, analityka · **Wynik: 59.7** ★★☆☆☆ (ocena jury 7.55/10)

- **Opis:** Model segmentacji (np. SAM / DeepLabV3) na ortofotomapie liczy udział powierzchni nieprzepuszczalnych w kwartałach. Zestawiamy to z intensywnością opadów ze stacji ZOM i proponujemy miejsca na ogrody deszczowe. Możemy wygenerować gotowy szkic wniosku BO.
- **Dane:** POG (intensywność opadu), BO, KONS; + ortofoto (segmentacja nawierzchni)
- **Moment „wow” w demo:** Ortofoto z nałożoną maską betonu i rankingiem kwartałów do odbetonowania.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 7 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Odbetonowanie to gorący temat w Warszawie. Sensowne AI, nie dla ozdoby.
- **Ryzyka:** Segmentacja w 24 h na dużym obszarze bywa zawodna. Ortofoto nie pochodzi z portalu.

<a id="p070"></a>
### #70. Metro 2076 – zaprojektuj sieć i zobacz skutki
**Wyzwanie:** W1 · **Typ:** Symulacja, mapa · **Wynik: 59.4** ★★☆☆☆ (ocena jury 7.10/10)

- **Opis:** Interaktywne rysowanie nowych linii metra i tramwaju. Narzędzie od razu liczy, ilu mieszkańców i transakcji z RCN znajdzie się w zasięgu 800 m, ile przystanków autobusowych zostanie odciążonych i jak może zmienić się cena m² (na podstawie historycznego efektu otwarcia M2).
- **Dane:** PRZYST, LINIE, ODJ, RCN
- **Moment „wow” w demo:** Juror rysuje linię palcem na tablecie, a liczniki od razu się zmieniają.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 9 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 7
- **Uzasadnienie:** Silny związek z Warszawą (M3, M4), atrakcyjna interakcja.
- **Ryzyka:** Brak danych o populacji w portalu (potrzebne dane GUS). Uproszczony model.

<a id="p071"></a>
### #71. Ratownik w okolicy – społecznościowi ratownicy i AED
**Wyzwanie:** W3 · **Typ:** Aplikacja ratunkowa · **Wynik: 59.4** ★★☆☆☆ (ocena jury 6.80/10)

- **Opis:** Model szwedzkiego Heartrunnera: przeszkoleni wolontariusze dostają alert o zatrzymaniu krążenia w pobliżu. Jedna osoba biegnie po AED, druga do poszkodowanego.
- **Dane:** AED, PRZYST, WYD
- **Moment „wow” w demo:** Symulacja alertu na 2 telefonach.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ratuje życie, dobre demo.
- **Ryzyka:** Wdrożenie wymaga integracji z dyspozytorami PRM (nie z miastem). Istnieją podobne inicjatywy.

<a id="p072"></a>
### #72. Kapsuła Czasu Warszawy
**Wyzwanie:** W1 · **Typ:** Partycypacja, AI podsumowanie · **Wynik: 59.3** ★★☆☆☆ (ocena jury 6.15/10)

- **Opis:** Mieszkańcy zostawiają geotagowane wiadomości i życzenia dla Warszawy 2076, powiązane z najbliższymi konsultacjami i projektami BO. AI agreguje je w „mapę marzeń” dzielnic, a kapsuła otworzy się w 2076 r.
- **Dane:** KONS, BO (kontekst lokalizacji)
- **Moment „wow” w demo:** Mapa marzeń wygenerowana z wpisów zebranych od innych uczestników hackathonu.
- **Oceny:** Dane 4 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Ładna idea społecznościowa, bardzo prosta technicznie.
- **Ryzyka:** Słabe wykorzystanie danych i mała użyteczność dziś.

<a id="p073"></a>
### #73. SegregujAI – zdjęcie śmiecia i właściwy pojemnik
**Wyzwanie:** W3 · **Typ:** AI wizja · **Wynik: 59.3** ★★☆☆☆ (ocena jury 6.15/10)

- **Opis:** Model wizji rozpoznaje odpad na zdjęciu i mówi, do którego pojemnika go wrzucić i gdzie jest najbliższy ekopunkt.
- **Dane:** SEG, Typy odpadów, EKO
- **Moment „wow” w demo:** Zdjęcie kubka po kawie.
- **Oceny:** Dane 6 · Innowacyjność 3 · Wdrożenie 8 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 6
- **Uzasadnienie:** Wdrażalne w SegregujNa5.
- **Ryzyka:** Prawie identyczny projekt (SeGregiusz) wygrał miejski hackathon w 2021 r., więc brak nowości.

<a id="p074"></a>
### #74. Za 0 zł – darmowa Warszawa dziś
**Wyzwanie:** W2 · **Typ:** Rekomendacje · **Wynik: 59.2** ★★☆☆☆ (ocena jury 6.20/10)

- **Opis:** Wszystko, co można dziś robić bezpłatnie, z dojazdem komunikacją.
- **Dane:** WYD, SPORT, BOISKA, TRASY, ODJ
- **Moment „wow” w demo:** Lista „dziś za darmo”.
- **Oceny:** Dane 7 · Innowacyjność 4 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 9 · Dopasowanie do jury 5
- **Uzasadnienie:** Czytelna wartość.
- **Ryzyka:** Niska innowacyjność.

<a id="p075"></a>
### #75. Czy boisko jest wolne? – crowdsourcing zajętości
**Wyzwanie:** W3 · **Typ:** Aplikacja · **Wynik: 59.1** ★★☆☆☆ (ocena jury 6.50/10)

- **Opis:** Szybki check-in „jest wolne” lub „zajęte” na otwartych boiskach.
- **Dane:** BOISKA
- **Moment „wow” w demo:** Check-in.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Prosty.
- **Ryzyka:** Zimny start bez użytkowników.

<a id="p076"></a>
### #76. Izochrony na żywo – jak daleko zajadę teraz
**Wyzwanie:** W3 · **Typ:** Analityka, mapa · **Wynik: 58.8** ★★☆☆☆ (ocena jury 7.10/10)

- **Opis:** Mapa zasięgu 15, 30 i 45 minut komunikacją z dowolnego punktu, liczona z bieżących opóźnień.
- **Dane:** GPS, ODJ, PRZYST
- **Moment „wow” w demo:** Pulsujące izochrony.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Ładne i zrozumiałe.
- **Ryzyka:** Routing w 24 h bez GTFS jest trudny.

<a id="p077"></a>
### #77. AI Urbanista – przekrój ulicy z opisu
**Wyzwanie:** W1 · **Typ:** AI 3D, generatywny design · **Wynik: 58.6** ★★☆☆☆ (ocena jury 7.40/10)

- **Opis:** Piszesz „więcej drzew, buspas, mniej parkingów” dla wybranej ulicy. AI generuje przekrój ulicy 3D (w stylu Streetmix) i szacuje skutki: cień, temperatura, przepustowość komunikacji na podstawie liczby linii i odjazdów.
- **Dane:** PRZYST, LINIE, AQ, POG, UTR
- **Moment „wow” w demo:** Ulica zmienia się w 3D w odpowiedzi na komendę głosową.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Efektowne połączenie AI i 3D.
- **Ryzyka:** Szacunki wpływu są dyskusyjne, a dane służą głównie jako tło.

<a id="p078"></a>
### #78. Gdzie zamieszkać na 50 lat – plan życia 2076
**Wyzwanie:** W1 · **Typ:** Analityka, rekomendacja · **Wynik: 58.6** ★★☆☆☆ (ocena jury 6.70/10)

- **Opis:** Rekomendator dzielnic dla młodych ludzi planujących zakup na całe życie. Łączy obecne ceny, trend cen, plany inwestycyjne (konsultacje, BO) i klimat.
- **Dane:** RCN, AQ, PRZYST, KONS, BO
- **Moment „wow” w demo:** Porównanie dwóch dzielnic w 2026 vs 2076.
- **Oceny:** Dane 8 · Innowacyjność 6 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Dobre wykorzystanie RCN.
- **Ryzyka:** Podobne serwisy komercyjne już istnieją. Prognozy na 50 lat są niewiarygodne.

<a id="p079"></a>
### #79. Voxel Warszawa – instalacja artystyczna danych
**Wyzwanie:** W3 · **Typ:** Sztuka danych, 3D · **Wynik: 58.4** ★★☆☆☆ (ocena jury 6.75/10)

- **Opis:** Wokselowa Warszawa, w której smog to mgła, tramwaje to światła, a deszcz to cząsteczki. Instalacja na żywo.
- **Dane:** AQ, GPS, POG; + LoD2
- **Moment „wow” w demo:** Fullscreen art.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 7 · Dopasowanie do jury 5
- **Uzasadnienie:** Duży wow.
- **Ryzyka:** Brak użyteczności.

<a id="p080"></a>
### #80. Martwe przystanki – obszary niedoobsłużone przez komunikację
**Wyzwanie:** W3 · **Typ:** Analityka transportowa · **Wynik: 58.1** ★★☆☆☆ (ocena jury 6.65/10)

- **Opis:** Liczymy częstotliwość odjazdów dla każdego przystanku i wskazujemy obszary z najsłabszą obsługą.
- **Dane:** PRZYST, LINIE, ODJ
- **Moment „wow” w demo:** Mapa częstotliwości.
- **Oceny:** Dane 8 · Innowacyjność 5 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Solidne.
- **Ryzyka:** Ciężkie pobieranie odjazdów przystanek po przystanku przez API.

<a id="p081"></a>
### #81. Okno pogodowe – planer aktywności
**Wyzwanie:** W2 · **Typ:** Rekomendacje · **Wynik: 57.9** ★☆☆☆☆ (ocena jury 6.30/10)

- **Opis:** Powiadomienie „dziś 18:00–19:30 idealne warunki na tenisa, kort przy SP 12 wolny, 9 min od Ciebie”, oparte na pogodzie ZOM, powietrzu i godzinach boisk.
- **Dane:** POG, AQ, BOISKA, SPORT, TRASY
- **Moment „wow” w demo:** Push z propozycją dopasowaną do lokalizacji jurora.
- **Oceny:** Dane 7 · Innowacyjność 5 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Proste i użyteczne.
- **Ryzyka:** Mało innowacyjne.

<a id="p082"></a>
### #82. Razem na konsultacje – sąsiedzkie spotkania
**Wyzwanie:** W2 · **Typ:** Społeczność · **Wynik: 57.9** ★☆☆☆☆ (ocena jury 6.30/10)

- **Opis:** Umawianie się z sąsiadami na wspólne pójście na spotkania konsultacyjne i lokalne wydarzenia.
- **Dane:** KONS (lokalizacje spotkań), WYD
- **Moment „wow” w demo:** Mapa spotkań.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 6
- **Uzasadnienie:** Buduje relacje lokalne.
- **Ryzyka:** Słabe dane i mała skala.

<a id="p083"></a>
### #83. Sprawdzam! – fact-checking wypowiedzi na danych miasta
**Wyzwanie:** W3 · **Typ:** AI LLM · **Wynik: 57.7** ★☆☆☆☆ (ocena jury 6.60/10)

- **Opis:** Bot weryfikujący twierdzenia o Warszawie (np. „powietrze jest coraz gorsze”) na otwartych danych.
- **Dane:** BO, AQ, RCN, KONS
- **Moment „wow” w demo:** Weryfikacja przykładowej wypowiedzi.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 5 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ciekawa idea.
- **Ryzyka:** Polityczne ryzyko przed jury z urzędu. Wąskie dane.

<a id="p084"></a>
### #84. Cień i słońce 2076 – gdzie postawić ławki i drzewa
**Wyzwanie:** W1 · **Typ:** 3D, symulacja słońca · **Wynik: 57.6** ★☆☆☆☆ (ocena jury 7.35/10)

- **Opis:** Symulacja nasłonecznienia na modelu 3D dla upalnych dni lipca. Szukamy przystanków i fragmentów tras turystycznych bez cienia w godzinach szczytu i proponujemy nasadzenia lub wiaty.
- **Dane:** POG (temp. nawierzchni), PRZYST, TRASY; + LoD2
- **Moment „wow” w demo:** Animacja cieni w ciągu dnia nad Śródmieściem i lista „najgorętszych przystanków”.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 5 · Dopasowanie do jury 6
- **Uzasadnienie:** Ładne 3D i konkretne rekomendacje.
- **Ryzyka:** Obliczeniowo ciężkie, trzeba ograniczyć obszar.

<a id="p085"></a>
### #85. Tablica sąsiedzka – e-ink z odjazdami i wydarzeniami do klatki schodowej
**Wyzwanie:** W3 · **Typ:** Hardware + dane · **Wynik: 57.3** ★☆☆☆☆ (ocena jury 6.55/10)

- **Opis:** Tani wyświetlacz e-ink (ESP32 lub Raspberry Pi) do klatek schodowych i domów kultury: najbliższe odjazdy, jakość powietrza, wydarzenia i konsultacje na osiedlu. Dla wspólnot i spółdzielni.
- **Dane:** ODJ, GPS, WYD, AQ, UTR, KONS
- **Moment „wow” w demo:** Fizyczne urządzenie na scenie z danymi na żywo.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Fizyczny artefakt zapada w pamięć.
- **Ryzyka:** Potrzebny sprzęt, który trzeba mieć ze sobą (sam sprzęt to nie kod, więc wolno).

<a id="p086"></a>
### #86. Warszawa w Minecrafcie 2076
**Wyzwanie:** W1 · **Typ:** 3D, gra, edukacja · **Wynik: 57.0** ★☆☆☆☆ (ocena jury 7.20/10)

- **Opis:** Generator świata Minecraft z prawdziwej Warszawy, w którym dzieci projektują dzielnicę przyszłości. Żywe dane (pozycje tramwajów, jakość powietrza) pojawiają się w świecie gry. Pasuje do edukacji i 42 Warsaw.
- **Dane:** PRZYST, GPS (pojazdy jako wagoniki), AQ, BO; + LoD2/OSM
- **Moment „wow” w demo:** Na żywo przejazd tramwaju w Minecrafcie zsynchronizowany z GPS ZTM.
- **Oceny:** Dane 6 · Innowacyjność 8 · Wdrożenie 5 · Warszawa/wyzwanie 8 · Prezentacja 9 · Wykonalność 5 · Dopasowanie do jury 7
- **Uzasadnienie:** Wysoki efekt wow i dobra historia edukacyjna.
- **Ryzyka:** Konwersja geometrii i serwer MC w 24 h są ryzykowne. Wdrożenie niszowe.

<a id="p087"></a>
### #87. Bezpieczna droga do szkoły
**Wyzwanie:** W3 · **Typ:** Analityka · **Wynik: 56.8** ★☆☆☆☆ (ocena jury 6.50/10)

- **Opis:** Analiza dojść do szkół: utrudnienia, przystanki, AED w pobliżu szkół.
- **Dane:** BOISKA (lista szkół), UTR, PRZYST, AED
- **Moment „wow” w demo:** Mapa szkół z oceną.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 7 · Warszawa/wyzwanie 8 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Ważny temat.
- **Ryzyka:** Brak danych o wypadkach i przejściach.

<a id="p088"></a>
### #88. Wojna śmieciowa – quiz segregacji dzielnic
**Wyzwanie:** W3 · **Typ:** Gra · **Wynik: 55.9** ★☆☆☆☆ (ocena jury 5.85/10)

- **Opis:** Quiz z rankingiem dzielnic.
- **Dane:** SEG, Typy odpadów
- **Moment „wow” w demo:** Quiz z jury.
- **Oceny:** Dane 6 · Innowacyjność 4 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 7 · Wykonalność 9 · Dopasowanie do jury 5
- **Uzasadnienie:** Proste.
- **Ryzyka:** Mało innowacyjne.

<a id="p089"></a>
### #89. Czasoprzestrzenna kostka wydarzeń 3D
**Wyzwanie:** W3 · **Typ:** Dataviz 3D · **Wynik: 54.9** ★☆☆☆☆ (ocena jury 6.35/10)

- **Opis:** Wydarzenia jako punkty w przestrzeni 3D (x, y = mapa, z = czas).
- **Dane:** WYD, SPORT
- **Moment „wow” w demo:** Obrót kostki.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 4 · Warszawa/wyzwanie 7 · Prezentacja 8 · Wykonalność 7 · Dopasowanie do jury 5
- **Uzasadnienie:** Efektowna wizualizacja.
- **Ryzyka:** Mała użyteczność.

<a id="p090"></a>
### #90. Autonomiczna komunikacja 2076 – symulacja
**Wyzwanie:** W1 · **Typ:** Symulacja agentowa · **Wynik: 54.3** ★☆☆☆☆ (ocena jury 6.55/10)

- **Opis:** Symulacja zastąpienia części linii autobusowych autonomicznymi busami na żądanie. Wejściem są dzisiejsze rozkłady i pozycje, wynikiem porównanie czasów i kosztów.
- **Dane:** GPS, ODJ, PRZYST, LINIE
- **Moment „wow” w demo:** Animacja dwóch światów obok siebie.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Futurystyczne i oparte na danych transportowych.
- **Ryzyka:** Bez danych o popycie wyniki są spekulacją.

<a id="p091"></a>
### #91. Wellbeing Map dla pracodawców (B2B)
**Wyzwanie:** W2 · **Typ:** Analityka B2B · **Wynik: 53.8** ★☆☆☆☆ (ocena jury 6.15/10)

- **Opis:** Raport dla działów HR: co w okolicy biura sprzyja odpoczynkowi pracowników, plus automatyczny program „well-being week” z miejskiej oferty.
- **Dane:** BOISKA, SPORT, WYD, TRASY, PRZYST, AQ
- **Moment „wow” w demo:** Raport PDF dla biurowca na Woli.
- **Oceny:** Dane 6 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 7 · Dopasowanie do jury 6
- **Uzasadnienie:** Model biznesowy dla inwestora w jury.
- **Ryzyka:** Mało emocjonalne.

<a id="p092"></a>
### #92. Biegaj czysto – planer biegów wg smogu
**Wyzwanie:** W2 · **Typ:** Rekomendacje · **Wynik: 53.7** ★☆☆☆☆ (ocena jury 5.90/10)

- **Opis:** Wybór pory i trasy biegu z najmniejszym zanieczyszczeniem.
- **Dane:** AQ, POG, TRASY
- **Moment „wow” w demo:** Wykres „najlepsza godzina na bieg”.
- **Oceny:** Dane 6 · Innowacyjność 5 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Prosty i zrozumiały.
- **Ryzyka:** Mało stacji pomiarowych, a podobne aplikacje istnieją.

<a id="p093"></a>
### #93. AED Trening – gra edukacyjna 3D
**Wyzwanie:** W3 · **Typ:** Gra 3D, edukacja · **Wynik: 53.5** ★☆☆☆☆ (ocena jury 6.45/10)

- **Opis:** Krótka gra 3D: ktoś upada na ulicy w prawdziwej Warszawie, a Ty musisz znaleźć najbliższy AED i wykonać RKO.
- **Dane:** AED; + LoD2
- **Moment „wow” w demo:** Rozgrywka na scenie.
- **Oceny:** Dane 5 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 6 · Prezentacja 8 · Wykonalność 6 · Dopasowanie do jury 6
- **Uzasadnienie:** Edukacyjne, z elementem 3D.
- **Ryzyka:** Słabe użycie danych.

<a id="p094"></a>
### #94. GeoGuessr Warszawa z danymi
**Wyzwanie:** W3 · **Typ:** Gra · **Wynik: 53.2** ★☆☆☆☆ (ocena jury 5.85/10)

- **Opis:** Zgadujesz lokalizację na podstawie zdjęcia, a po odpowiedzi dostajesz ciekawostki z danych o tym miejscu.
- **Dane:** TRASY, WYD, RCN; + Mapillary
- **Moment „wow” w demo:** Runda z jury.
- **Oceny:** Dane 5 · Innowacyjność 5 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Zabawne.
- **Ryzyka:** Dane są tylko dodatkiem.

<a id="p095"></a>
### #95. Dyspozytor ZTM – gra symulacyjna
**Wyzwanie:** W3 · **Typ:** Gra · **Wynik: 52.9** ★☆☆☆☆ (ocena jury 6.75/10)

- **Opis:** Gra, w której zarządzasz siecią w czasie rzeczywistym: reagujesz na prawdziwe utrudnienia i przesuwasz pojazdy.
- **Dane:** GPS, LINIE, PRZYST, UTR
- **Moment „wow” w demo:** Rozgrywka na żywo.
- **Oceny:** Dane 7 · Innowacyjność 7 · Wdrożenie 4 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 5 · Dopasowanie do jury 6
- **Uzasadnienie:** Angażujące.
- **Ryzyka:** Brak wdrożenia, trudne w 24 h.

<a id="p096"></a>
### #96. Ruch w przerwie – firmowe wyzwania sportowe
**Wyzwanie:** W2 · **Typ:** Gamifikacja B2B · **Wynik: 52.3** ★☆☆☆☆ (ocena jury 5.75/10)

- **Opis:** Rywalizacja zespołów firmowych w korzystaniu z miejskiej infrastruktury sportowej.
- **Dane:** BOISKA, SPORT, TRASY
- **Moment „wow” w demo:** Ranking firm.
- **Oceny:** Dane 6 · Innowacyjność 5 · Wdrożenie 6 · Warszawa/wyzwanie 6 · Prezentacja 6 · Wykonalność 8 · Dopasowanie do jury 5
- **Uzasadnienie:** Prosty model biznesowy.
- **Ryzyka:** Słaby związek z danymi i niska innowacyjność.

<a id="p097"></a>
### #97. Spokojny dojazd – trasy z mniejszym stresem
**Wyzwanie:** W2 · **Typ:** Planer tras · **Wynik: 52.1** ★☆☆☆☆ (ocena jury 6.35/10)

- **Opis:** Planer, który wybiera nie najszybszą, tylko najmniej stresującą trasę: mniej przesiadek, linie punktualne w ostatnich godzinach według GPS, omijanie utrudnień.
- **Dane:** GPS, ODJ, UTR, PRZYST
- **Moment „wow” w demo:** Porównanie dwóch tras z „indeksem stresu”.
- **Oceny:** Dane 7 · Innowacyjność 6 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 6 · Wykonalność 6 · Dopasowanie do jury 5
- **Uzasadnienie:** Ciekawa reinterpretacja planera.
- **Ryzyka:** Konkurencja z Jakdojade i Google. Trudne w 24 h.

<a id="p098"></a>
### #98. Pora na sport – rekomendator zajęć
**Wyzwanie:** W2 · **Typ:** Rekomendacje · **Wynik: 52.0** ★☆☆☆☆ (ocena jury 5.45/10)

- **Opis:** Wyszukiwarka i rekomendator miejskich zajęć sportowych według wieku, dnia i dzielnicy.
- **Dane:** SPORT, BOISKA
- **Moment „wow” w demo:** Filtr zajęć.
- **Oceny:** Dane 6 · Innowacyjność 4 · Wdrożenie 6 · Warszawa/wyzwanie 7 · Prezentacja 5 · Wykonalność 9 · Dopasowanie do jury 5
- **Uzasadnienie:** Łatwe.
- **Ryzyka:** Powtarza istniejący serwis sport.um.warszawa.pl.

<a id="p099"></a>
### #99. Korytarze przewietrzania 2076
**Wyzwanie:** W1 · **Typ:** 3D, symulacja CFD-lite · **Wynik: 51.3** ★☆☆☆☆ (ocena jury 6.95/10)

- **Opis:** Uproszczona symulacja przepływu wiatru między budynkami, ocena, czy nowa zabudowa blokuje korytarze przewietrzania, połączona z pomiarami powietrza.
- **Dane:** POG (wiatr), AQ; + LoD2
- **Moment „wow” w demo:** Strzałki wiatru płynące przez model 3D.
- **Oceny:** Dane 6 · Innowacyjność 7 · Wdrożenie 6 · Warszawa/wyzwanie 8 · Prezentacja 8 · Wykonalność 4 · Dopasowanie do jury 6
- **Uzasadnienie:** Temat ważny w planowaniu przestrzennym.
- **Ryzyka:** CFD w 24 h jest nierealne w sensownej jakości.

<a id="p100"></a>
### #100. Rower czy autobus? – porównywarka na żywo
**Wyzwanie:** W3 · **Typ:** Porównywarka · **Wynik: 50.6** ★☆☆☆☆ (ocena jury 5.85/10)

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
