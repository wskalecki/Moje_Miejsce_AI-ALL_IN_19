# -*- coding: utf-8 -*-
"""
Baza 100 pomysłów na Warsaw Open Data Hackathon 2026 + oceny cząstkowe.
Uruchom: python3 generuj.py  -> tworzy POMYSLY.md
Skale ocen: 1-10.
  D = wykorzystanie danych m.st. Warszawy        (waga jury 20%)
  I = innowacyjność na tle konkurencji           (waga jury 25%)
  W = potencjał wdrożeniowy                      (waga jury 20%)
  R = związek z Warszawą i wyzwaniem             (waga jury 15%)
  P = potencjał prezentacji / efekt "wow" demo   (waga jury 20%)
  F = wykonalność w 24 h (mnożnik ryzyka)
  J = dopasowanie do konkretnego składu jury (bonus/kara)
Wyzwania: W1 = "Warszawa 2076", W2 = "Warszawa – złap oddech!", W3 = "Warszawa: Twój ruch!"
"""

POMYSLY = []


def P(nazwa, wyz, tagi, dane, opis, demo, uzas, ryzyko, D, I, W, R, Pr, F, J):
    POMYSLY.append(dict(nazwa=nazwa, wyz=wyz, tagi=tagi, dane=dane, opis=opis, demo=demo,
                        uzas=uzas, ryzyko=ryzyko, D=D, I=I, W=W, R=R, P=Pr, F=F, J=J))


# ======================================================================
# WYZWANIE 1: WARSZAWA 2076
# ======================================================================

P("Okno 2076 – generatywny podgląd przyszłości dowolnego miejsca", "W1 (alt. W3)", "AI obraz, 3D, mapa",
  "BO, KONS, POG (temp. nawierzchni), AQ, PRZYST/LINIE; + LoD2 GUGiK, Mapillary",
  "Mapa 3D Warszawy (budynki LoD2/OSM w deck.gl lub MapLibre). Klikasz dowolny punkt: widzisz zdjęcie ulicy dziś (Mapillary) i wersję „2076” wygenerowaną modelem image-to-image. Prompt nie jest wymyślony – składa się z danych: zaplanowane projekty BO i konsultacje w promieniu 300 m, temperatura nawierzchni ze stacji ZOM, jakość powietrza, dostępność komunikacji. Każdy render ma „paragon danych”, czyli wyjaśnienie, z czego wynika każda zmiana, oraz przycisk „wpłyń na to dziś”, który prowadzi do trwającej konsultacji albo głosowania BO.",
  "Jurorka podaje adres swojego biura, a po 15 s widzi jego wersję z 2076 r. z listą danych, które ją ukształtowały.",
  "Maksymalny efekt wow i mocny związek z W1. Paragon danych podnosi ocenę za wykorzystanie danych, a link do konsultacji daje ścieżkę wdrożenia dla Biura Strategii.",
  "Obrazy AI mogą być odebrane jako gadżet. Trzeba mocno pokazać logikę danych. Ryzyko integracji 3D i Mapillary w 24 h.",
  7, 9, 7, 9, 10, 6, 8)

P("Rzecznik Przyszłych Pokoleń – AI ocena wpływu konsultacji na Warszawę 2076", "W1 (alt. W3)", "AI LLM (Bielik), polityka publiczna",
  "KONS (+kategorie, dzielnice), BO, AQ, POG, PRZYST, RCN",
  "Inspiracja walijskim Well-being of Future Generations Act. Dla każdej trwającej konsultacji społecznej panel agentów AI (na Bieliku) odgrywa przyszłych mieszkańców 2076: dziecko urodzone dziś, seniorkę, osobę z niepełnosprawnością, przyrodę. Agenci analizują projekt na tle danych o okolicy. Wynikiem jest „Ocena Wpływu Międzypokoleniowego”: karta 1 strony z ryzykami, szansami i pytaniami, które warto zadać w konsultacji. Narzędzie nie składa uwag w imieniu ludzi, tylko pomaga mieszkańcom i urzędnikom myśleć długoterminowo.",
  "Na żywo debata agentów o realnej konsultacji z portalu, a na końcu wygenerowana karta oceny z mapą i danymi.",
  "Bardzo wysoka innowacyjność w sensie polityki publicznej. W jury zasiada przedstawiciel Wydziału Innowacyjnych Polityk Publicznych MC, pełnomocniczka ds. strategii i COO Bielik.AI. Wdrożenie: moduł na konsultacje.um.warszawa.pl.",
  "Trzeba uniknąć wrażenia, że AI zastępuje głos mieszkańców. Jakość analiz zależy od jakości opisów konsultacji.",
  7, 9, 8, 9, 8, 8, 9)

P("Dachy 2076 – kataster zielonych dachów, PV i retencji w 3D", "W1 (alt. W3)", "3D, analityka przestrzenna, AI wizja",
  "POG (temp. nawierzchni, opady), BOISKA (szkoły), BO, AQ; + LoD2 GUGiK (geometria dachów), ortofoto",
  "Z modelu LoD2 liczymy płaskie i lekko nachylone dachy, ich powierzchnię i orientację. Dla każdego budynku szacujemy potencjał zielonego dachu, fotowoltaiki i retencji deszczówki. Priorytet rośnie tam, gdzie stacje ZOM pokazują najgorętszą nawierzchnię i największe opady, oraz przy szkołach (z bazy otwartych boisk). Efektem jest mapa 3D z dachami pokolorowanymi według potencjału i symulacja „Warszawa 2076, jeśli zazielenimy 20% dachów”.",
  "Lot kamerą nad 3D Warszawą, dachy zmieniają kolor na zielony, a licznik pokazuje m² zieleni, MWh i m³ zatrzymanej wody.",
  "Spektakularne 3D z twardą analityką i realnym programem miejskim (dotacje na zielone dachy, adaptacja do zmian klimatu).",
  "Parsowanie CityGML LoD2 dla całego miasta jest ciężkie. Trzeba ograniczyć się do 1–2 dzielnic. Sama stacja ZOM to mała rozdzielczość przestrzenna.",
  7, 8, 8, 9, 9, 6, 7)

P("Parkingi → Parki 2076", "W1", "AI obraz, symulacja",
  "PARK (lokalizacje i pojemność), PRZYST/LINIE, GPS, POG; + ortofoto",
  "Scenariusz: w 2076 r. autonomiczne, współdzielone pojazdy zmniejszają zapotrzebowanie na parkingi o X%. Na danych o miejskich parkingach (pojemność, obłożenie na żywo) i dostępności komunikacji liczymy, które parkingi „uwolnią się” najpierw. AI generuje wizualizację parkingu zamienionego w park, plac albo mieszkania.",
  "Suwak „rok” od 2026 do 2076: parkingi na mapie znikają, a w ich miejscu pojawiają się wygenerowane parki.",
  "Silny storytelling i spójność z W1. Dane o parkingach to nietypowy wybór, mało zespołów po nie sięgnie.",
  "Słaba ścieżka wdrożeniowa (spekulacja). Parkingów w zbiorze jest niewiele.",
  7, 8, 5, 8, 9, 7, 7)

P("Wehikuł czasu 1945 → 2026 → 2076", "W1", "3D, AI obraz, historia",
  "ortofoto 1945/2025 (serwis mapowy m.st.), BO, KONS, TRASY; + LoD2",
  "Suwak czasu na mapie: ortofotomapa zniszczonej Warszawy z 1945 r., dzisiejsza i AI-ekstrapolacja 2076 oparta na planowanych inwestycjach (BO, konsultacje). Budynki 3D „wyrastają” między epokami. Do tego narracja: jak Warszawa odbudowała się w 80 lat i co możemy zrobić w kolejne 50.",
  "Płynne przejście od ruin 1945 do zielonej Warszawy 2076 w jednym ujęciu kamery.",
  "Emocjonalnie najsilniejszy możliwy pitch o Warszawie, idealny dla W1.",
  "Ortofoto nie jest na portalu dane.um, więc trzeba je dopiąć jako dodatek. Rdzeń danych z portalu jest słaby. Ciężkie rastry.",
  6, 8, 5, 10, 10, 5, 7)

P("Gra o Warszawę 2076 – strategia na prawdziwych danych", "W1", "Gra, AI narrator (Bielik)",
  "BO (koszty projektów), AQ, PRZYST, RCN, KONS",
  "Przeglądarkowa gra turowa: jesteś prezydentem w latach 2026–2076. Co 5 lat dostajesz budżet i karty decyzji zbudowane z prawdziwych projektów BO z ich kosztami. Model pokazuje wpływ na powietrze, dostępność transportu i ceny mieszkań. Bielik jako narrator komentuje skutki i porównuje je z celami strategii #Warszawa2030.",
  "Juror rozgrywa 1 turę na scenie, a mapa reaguje na jego decyzję.",
  "Wysoka angażowalność i edukacja obywatelska. Pasuje do 42 Warsaw.",
  "Modele wpływu będą uproszczone i łatwo je podważyć w Q&A. Wdrożenie niejasne.",
  6, 8, 5, 8, 9, 6, 7)

P("List z 2076", "W1", "AI tekst + obraz",
  "AQ, POG, BO, KONS, RCN (dla adresu)",
  "Wpisujesz swój adres i dostajesz list od wnuka z 2076 r., który opisuje Twoją okolicę. Treść wynika z trendów w danych: ceny, powietrze, upał, projekty BO, konsultacje. Do listu dołączona jest wygenerowana „pocztówka”.",
  "Odczytanie listu dla adresu jurorki.",
  "Bardzo łatwe, wzruszające, dobre na pitch.",
  "Gadżet bez problemu do rozwiązania, więc niska ocena wdrożeniowa i ryzyko „kolejnej apki”.",
  5, 7, 4, 7, 9, 9, 6)

P("Klimat 2076 dla Twojej ulicy", "W1", "Analityka klimatyczna, AI obraz",
  "POG (temp. powietrza i nawierzchni, opady), AQ, WC, AED; + projekcje klimatyczne",
  "Bierzemy pomiary ze stacji ZOM i nakładamy przesunięcie z projekcji klimatycznych (Warszawa 2076 ≈ dzisiejszy Belgrad lub Budapeszt). Pokazujemy liczbę dni upalnych, temperaturę asfaltu i ryzyka zdrowotne. Rekomendujemy adaptacje (zacienienie, woda pitna, toalety, AED), a AI wizualizuje ulicę po adaptacji.",
  "Termometr 2076 dla ulicy jurora i jej wersja po adaptacji.",
  "Klimat to temat strategiczny dla miasta, a temperatura nawierzchni jest unikalnym polem w danych ZOM.",
  "Mała liczba stacji. Projekcje to zewnętrzny model, więc trzeba być ostrożnym w twierdzeniach.",
  6, 7, 6, 9, 8, 7, 7)

P("Metro 2076 – zaprojektuj sieć i zobacz skutki", "W1", "Symulacja, mapa",
  "PRZYST, LINIE, ODJ, RCN",
  "Interaktywne rysowanie nowych linii metra i tramwaju. Narzędzie od razu liczy, ilu mieszkańców i transakcji z RCN znajdzie się w zasięgu 800 m, ile przystanków autobusowych zostanie odciążonych i jak może zmienić się cena m² (na podstawie historycznego efektu otwarcia M2).",
  "Juror rysuje linię palcem na tablecie, a liczniki od razu się zmieniają.",
  "Silny związek z Warszawą (M3, M4), atrakcyjna interakcja.",
  "Brak danych o populacji w portalu (potrzebne dane GUS). Uproszczony model.",
  7, 7, 5, 9, 8, 6, 7)

P("Radar Gentryfikacji", "W1 (alt. W3)", "Analityka, ML",
  "RCN (szereg czasowy), BO, KONS, PRZYST",
  "Wykrywamy mikroobszary, w których ceny transakcyjne rosną najszybciej względem średniej dzielnicy, i zestawiamy je z inwestycjami (BO, konsultacje, nowe linie). Wynikiem jest wczesne ostrzeganie dla polityki mieszkaniowej: gdzie grozi wypieranie mieszkańców i gdzie miasto może przechwycić wzrost wartości (opłata adiacencka).",
  "Animowana mapa zmian cen 2015–2026 z hotspotami i prognozą na 2030.",
  "Mocna wartość dla Biura Strategii i ciekawy wątek dla inwestora w jury.",
  "Interpretacja przyczynowa jest ryzykowna. RCN wymaga uważnego czyszczenia.",
  8, 8, 7, 9, 8, 6, 7)

P("Miasto-gąbka 2076", "W1", "AI wizja komputerowa, analityka",
  "POG (intensywność opadu), BO, KONS; + ortofoto (segmentacja nawierzchni)",
  "Model segmentacji (np. SAM / DeepLabV3) na ortofotomapie liczy udział powierzchni nieprzepuszczalnych w kwartałach. Zestawiamy to z intensywnością opadów ze stacji ZOM i proponujemy miejsca na ogrody deszczowe. Możemy wygenerować gotowy szkic wniosku BO.",
  "Ortofoto z nałożoną maską betonu i rankingiem kwartałów do odbetonowania.",
  "Odbetonowanie to gorący temat w Warszawie. Sensowne AI, nie dla ozdoby.",
  "Segmentacja w 24 h na dużym obszarze bywa zawodna. Ortofoto nie pochodzi z portalu.",
  6, 8, 7, 9, 8, 5, 7)

P("Kapsuła Czasu Warszawy", "W1", "Partycypacja, AI podsumowanie",
  "KONS, BO (kontekst lokalizacji)",
  "Mieszkańcy zostawiają geotagowane wiadomości i życzenia dla Warszawy 2076, powiązane z najbliższymi konsultacjami i projektami BO. AI agreguje je w „mapę marzeń” dzielnic, a kapsuła otworzy się w 2076 r.",
  "Mapa marzeń wygenerowana z wpisów zebranych od innych uczestników hackathonu.",
  "Ładna idea społecznościowa, bardzo prosta technicznie.",
  "Słabe wykorzystanie danych i mała użyteczność dziś.",
  4, 7, 5, 8, 7, 9, 6)

P("Warszawa w Minecrafcie 2076", "W1", "3D, gra, edukacja",
  "PRZYST, GPS (pojazdy jako wagoniki), AQ, BO; + LoD2/OSM",
  "Generator świata Minecraft z prawdziwej Warszawy, w którym dzieci projektują dzielnicę przyszłości. Żywe dane (pozycje tramwajów, jakość powietrza) pojawiają się w świecie gry. Pasuje do edukacji i 42 Warsaw.",
  "Na żywo przejazd tramwaju w Minecrafcie zsynchronizowany z GPS ZTM.",
  "Wysoki efekt wow i dobra historia edukacyjna.",
  "Konwersja geometrii i serwer MC w 24 h są ryzykowne. Wdrożenie niszowe.",
  6, 8, 5, 8, 9, 5, 7)

P("AR: zobacz projekt na swojej ulicy (text-to-3D + WebXR)", "W1 (alt. W3)", "AI 3D, AR",
  "BO (opisy i lokalizacje), KONS",
  "Z opisu projektu BO lub konsultacji model text-to-3D (np. TRELLIS / Hunyuan3D / Meshy) generuje obiekt: ławkę, plac zabaw, wiatę. Telefon w WebXR stawia go w prawdziwym miejscu w skali 1:1. Mieszkańcy widzą, na co głosują.",
  "Wideo z AR nagrane w nocy na ulicy przy kampusie 42 i na żywo model na scenie.",
  "Najwyższa innowacyjność i świetne dopasowanie do Twojego zainteresowania 3D/AI.",
  "Najwyższe ryzyko techniczne (WebXR, jakość modeli 3D). Demo w sali jest trudne.",
  7, 9, 7, 9, 9, 4, 7)

P("AI Urbanista – przekrój ulicy z opisu", "W1", "AI 3D, generatywny design",
  "PRZYST, LINIE, AQ, POG, UTR",
  "Piszesz „więcej drzew, buspas, mniej parkingów” dla wybranej ulicy. AI generuje przekrój ulicy 3D (w stylu Streetmix) i szacuje skutki: cień, temperatura, przepustowość komunikacji na podstawie liczby linii i odjazdów.",
  "Ulica zmienia się w 3D w odpowiedzi na komendę głosową.",
  "Efektowne połączenie AI i 3D.",
  "Szacunki wpływu są dyskusyjne, a dane służą głównie jako tło.",
  6, 8, 6, 8, 9, 5, 7)

P("Cień i słońce 2076 – gdzie postawić ławki i drzewa", "W1", "3D, symulacja słońca",
  "POG (temp. nawierzchni), PRZYST, TRASY; + LoD2",
  "Symulacja nasłonecznienia na modelu 3D dla upalnych dni lipca. Szukamy przystanków i fragmentów tras turystycznych bez cienia w godzinach szczytu i proponujemy nasadzenia lub wiaty.",
  "Animacja cieni w ciągu dnia nad Śródmieściem i lista „najgorętszych przystanków”.",
  "Ładne 3D i konkretne rekomendacje.",
  "Obliczeniowo ciężkie, trzeba ograniczyć obszar.",
  6, 7, 7, 8, 9, 5, 6)

P("Korytarze przewietrzania 2076", "W1", "3D, symulacja CFD-lite",
  "POG (wiatr), AQ; + LoD2",
  "Uproszczona symulacja przepływu wiatru między budynkami, ocena, czy nowa zabudowa blokuje korytarze przewietrzania, połączona z pomiarami powietrza.",
  "Strzałki wiatru płynące przez model 3D.",
  "Temat ważny w planowaniu przestrzennym.",
  "CFD w 24 h jest nierealne w sensownej jakości.",
  6, 7, 6, 8, 8, 4, 6)

P("Spacer 360° po Warszawie 2076 (VR)", "W1", "AI obraz 360°, VR",
  "KONS (np. Plac Defilad, nadbrzeże), BO; + Mapillary 360",
  "Dla kluczowych miejsc objętych konsultacjami generujemy panoramy 360° „2076”. Można je oglądać w przeglądarce lub goglach VR i przechodzić między punktami.",
  "Juror w goglach VR „stoi” na Placu Defilad w 2076 r.",
  "Ogromny efekt na scenie.",
  "Generowanie spójnych panoram 360 jest trudne. Dane są głównie pretekstem.",
  6, 8, 5, 9, 10, 6, 7)

P("Gdzie zamieszkać na 50 lat – plan życia 2076", "W1", "Analityka, rekomendacja",
  "RCN, AQ, PRZYST, KONS, BO",
  "Rekomendator dzielnic dla młodych ludzi planujących zakup na całe życie. Łączy obecne ceny, trend cen, plany inwestycyjne (konsultacje, BO) i klimat.",
  "Porównanie dwóch dzielnic w 2026 vs 2076.",
  "Dobre wykorzystanie RCN.",
  "Podobne serwisy komercyjne już istnieją. Prognozy na 50 lat są niewiarygodne.",
  8, 6, 5, 8, 7, 7, 6)

P("Senior 2076 – audyt miasta dla starzejącego się społeczeństwa", "W1 (alt. W3)", "Analityka dostępności",
  "WC (dostępność, godziny), AED, PRZYST, SPORT (oferta dla seniorów), WYD",
  "W 2076 r. co trzeci warszawiak będzie seniorem. Liczymy indeks „przyjazności dla seniora” w siatce heksagonów: toalety bez barier, AED, przystanki, zajęcia dla 60+. Wskazujemy luki i priorytety inwestycyjne.",
  "Mapa heksagonów z lukami i wygenerowana lista 10 rekomendacji.",
  "Solidne, wdrażalne, mocny związek ze strategią.",
  "Dość klasyczna analityka, mniej wow.",
  7, 6, 7, 9, 6, 8, 7)

P("Elektryfikacja 2076 – które linie elektryfikować najpierw", "W1 (alt. W3)", "Analityka, optymalizacja",
  "TABOR (rok produkcji, trakcja), GPS (numer pojazdu na linii), AQ, BOISKA (szkoły), PRZYST",
  "Łączymy rejestr taboru (rok, trakcja) z pozycjami na żywo, żeby wiedzieć, które linie dziś obsługują stare diesle. Nakładamy to na jakość powietrza i lokalizację szkół. Algorytm układa kolejność elektryfikacji linii tak, by jak najszybciej zmniejszyć ekspozycję dzieci na spaliny. Do tego ścieżka do 100% zeroemisyjnej floty.",
  "Mapa linii pokolorowanych według wieku i trakcji pojazdów na żywo oraz ranking priorytetów.",
  "Bardzo dobre, nieoczywiste łączenie 3–5 zbiorów. Realny decydent (ZTM/MZA). Mało kto zajrzy do zbioru o taborze.",
  "Dopasowanie pojazdów z GPS do taboru wymaga ostrożnego łączenia numerów taborowych.",
  9, 8, 8, 9, 8, 7, 8)

P("Autonomiczna komunikacja 2076 – symulacja", "W1", "Symulacja agentowa",
  "GPS, ODJ, PRZYST, LINIE",
  "Symulacja zastąpienia części linii autobusowych autonomicznymi busami na żądanie. Wejściem są dzisiejsze rozkłady i pozycje, wynikiem porównanie czasów i kosztów.",
  "Animacja dwóch światów obok siebie.",
  "Futurystyczne i oparte na danych transportowych.",
  "Bez danych o popycie wyniki są spekulacją.",
  6, 7, 4, 8, 8, 6, 6)

P("Strategia #Warszawa2030 → 2076 Tracker", "W1", "Dashboard, monitoring polityk",
  "AQ, BO, KONS, PRZYST, AED, WC, SPORT",
  "Publiczny monitor celów strategii miasta (np. „miasto 15-minutowe”, „czyste powietrze”, „aktywni mieszkańcy”) z wskaźnikami liczonymi automatycznie z otwartych danych i ekstrapolacją do 2076.",
  "Dashboard z kafelkami celów i strzałkami trendu.",
  "Bezpośrednio adresuje pracę pełnomocniczki ds. strategii w jury.",
  "Dashboardy są mało innowacyjne. Wiele wskaźników wymaga danych spoza portalu.",
  8, 6, 7, 9, 6, 7, 8)

P("Cyfrowy bliźniak transportu na żywo w 3D", "W1 (alt. W3)", "3D, real-time",
  "GPS (co 10 s), PRZYST, LINIE, TABOR, UTR, AQ; + LoD2",
  "Wszystkie autobusy i tramwaje na żywo w trójwymiarowej Warszawie (deck.gl TripsLayer): smugi ruchu, opóźnienia, utrudnienia, chmury jakości powietrza. Tryb 2076 pokazuje tę samą sieć po planowanych rozbudowach.",
  "Pełnoekranowy, „filmowy” widok miasta pulsującego ruchem.",
  "Wow na scenie i świetne wykorzystanie danych live.",
  "Kolejna „mapa autobusów”, więc jury może uznać, że to nic nowego.",
  8, 6, 6, 8, 10, 7, 7)

# ======================================================================
# WYZWANIE 2: WARSZAWA – ZŁAP ODDECH!
# ======================================================================

P("Radio Dzielnica – codzienny, personalizowany briefing audio", "W2", "AI tekst + TTS, audio",
  "WYD, SPORT, UTR, AQ, POG, KONS, BO, BOISKA",
  "Codziennie rano 3-minutowy „podcast” generowany dla Twojej okolicy i trasy dojazdu: pogoda i powietrze, utrudnienia, 2–3 wydarzenia i zajęcia sportowe na wieczór, trwająca konsultacja do wypełnienia. Tekst pisze Bielik, a czyta naturalny polski głos. Dystrybucja przez podcast RSS, WhatsApp, Spotify lub kanał operatora.",
  "Na scenie odtwarzamy odcinek wygenerowany na niedzielę 18.10 dla Woli. Jury słyszy produkt, zamiast oglądać slajdy.",
  "Świetna prezentacja (audio). Łączy work-life balance, wydarzenia i relacje lokalne, czyli wszystkie elementy W2. Bielik i Play w jury.",
  "Jakość polskiego TTS i ryzyko halucynacji. Trzeba ograniczyć LLM do faktów z danych.",
  8, 8, 7, 8, 9, 8, 8)

P("Kalendarz, który dba – asystent work-life balance w Google/Outlook", "W2", "Integracja kalendarza, AI",
  "WYD, SPORT, BOISKA, TRASY, ODJ, AQ, POG",
  "Wtyczka do kalendarza wykrywa przeciążenie (np. 4 wieczory z rzędu z pracą). W wolne okna proponuje konkretną aktywność z danych miasta z policzonym dojazdem i rezerwuje czas jednym kliknięciem. Model B2B: benefit wellbeingowy dla pracodawców.",
  "Pokaz prawdziwego kalendarza z zaproponowanymi blokami „złap oddech”.",
  "Dosłownie odpowiada na W2. Inwestor w jury doceni model B2B.",
  "Integracja OAuth i kalendarza w 24 h jest możliwa, ale żmudna.",
  7, 7, 7, 7, 8, 7, 7)

P("Mikroprzerwa 30 min", "W2", "Aplikacja mobilna",
  "BOISKA, SPORT, TRASY, AQ, POG, WC",
  "Podajesz, gdzie jesteś i ile masz czasu (np. 30 min w przerwie). Dostajesz jedną propozycję: siłownię plenerową 6 min od biura, krótki odcinek trasy turystycznej albo zajęcia, z uwzględnieniem pogody i powietrza.",
  "Jeden przycisk „mam 30 minut” i natychmiastowa propozycja.",
  "Prosta, czytelna wartość.",
  "Podobnych rekomendatorów będzie kilka, więc innowacyjność jest średnia.",
  7, 6, 6, 7, 7, 8, 6)

P("Gramy dziś – sąsiedzkie mecze na otwartych boiskach szkolnych", "W2", "Aplikacja społecznościowa",
  "BOISKA (godziny dostępności), SPORT, POG, AQ, PRZYST",
  "Baza bezpłatnych boisk szkolnych z godzinami otwarcia i matchmaking: „brakuje 3 osób do piłki dziś o 19:00 na boisku przy SP 85”. Buduje relacje sąsiedzkie (wprost w opisie W2) i zwiększa wykorzystanie infrastruktury, za którą miasto płaci.",
  "Dwóch jurorów dołącza do meczu w aplikacji i dostaje powiadomienia.",
  "Mocna wartość społeczna, realny właściciel wdrożenia (Biuro Sportu, Biuro Edukacji).",
  "Efekt sieciowy: bez użytkowników aplikacja jest pusta (pytanie z Q&A).",
  7, 7, 8, 8, 7, 8, 6)

P("Spokojna Warszawa – miasto przyjazne sensorycznie", "W2", "Mapa, rekomendacje",
  "WYD (tłumy), WC, TRASY, PRZYST, GPS; + czujniki hałasu IoT (bulwary)",
  "Mapa i planer dla osób z wypaleniem, neuroatypowych i introwertyków: spokojne miejsca i pory, trasy z dala od dużych wydarzeń, toalety, ciche przystanki. Na żywo pokazuje „gdzie teraz jest tłoczno”.",
  "Planer omija koncert na Narodowym i wybiera spokojną trasę.",
  "Nietypowa grupa docelowa, dobra innowacja społeczna.",
  "Dane o hałasie są szczątkowe (sezonowo tylko bulwary).",
  6, 8, 6, 8, 7, 7, 6)

P("Syrenka oprowadza – generatywny audioprzewodnik", "W2", "AI tekst + głos, audio",
  "TRASY (punkty turystyczne), WYD, WC, AQ, POG, ODJ",
  "Trasy turystyczne miasta zamienione w dynamiczne audiospacery. Syrenka, czyli postać AI z głosem, opowiada o mijanych punktach, wtrąca dzisiejsze wydarzenia po drodze, mówi, gdzie jest toaleta, i dopasowuje długość spaceru do pogody. Pytanie zadane głosem dostaje odpowiedź na bieżąco.",
  "Fragment audio i zadanie Syrence pytania na żywo.",
  "Odkrywanie miasta (W2), świetne audio na scenie, dopasowanie do Bielika.",
  "Treści o punktach trzeba wzbogacić (Wikipedia), co niesie ryzyko halucynacji.",
  7, 8, 6, 9, 9, 7, 8)

P("Rodzinny Weekend – planer dla rodziców małych dzieci", "W2", "Planer",
  "WYD, WC (przewijak!, dostępność), BOISKA, SPORT, AQ, POG",
  "Planer weekendu dla rodzin, który wykorzystuje rzadko zauważane pole „przewijak” w danych o toaletach. Proponuje wydarzenia dla dzieci, trasę bez barier dla wózka, toalety z przewijakiem, boiska i place zabaw, z uwzględnieniem smogu.",
  "Plan soboty z dzieckiem z mapą toalet z przewijakami.",
  "Konkretny problem, dobre wykorzystanie pól danych.",
  "Konkurencja ze strony innych planerów wydarzeń.",
  8, 6, 7, 8, 7, 8, 6)

P("Spontan – swipe na wieczór ze znajomymi", "W2", "Aplikacja społecznościowa",
  "WYD, SPORT, ODJ, GPS, POG",
  "Grupa znajomych przesuwa propozycje wydarzeń na dziś (jak w Tinderze). Aplikacja wybiera tę z największą zgodą i optymalnym dojazdem dla wszystkich.",
  "Jury głosuje na telefonach na żywo.",
  "Zabawna, interaktywna prezentacja.",
  "Mało odkrywcze, pomysł znany z innych miast.",
  7, 6, 6, 7, 8, 8, 6)

P("Mikroprzygody – dzielnicowe questy i liga dzielnic", "W2", "Gamifikacja",
  "TRASY, WYD, BOISKA, EKO, KONS, AED",
  "Codzienne questy: „odwiedź punkt z trasy”, „zagraj na boisku”, „oddaj elektrośmieci w ekopunkcie”, „wypełnij konsultację”. Punkty zbierają dzielnice, a ranking dzielnic buduje lokalną tożsamość i relacje.",
  "Ranking dzielnic na żywo i quest wykonany przez jurora.",
  "Łączy wiele zbiorów i aktywność obywatelską.",
  "Gamifikacja jest częsta na hackathonach. Ryzyko pustej aplikacji.",
  7, 7, 6, 8, 8, 8, 6)

P("Nocna Warszawa – dla tych, dla których miasto nigdy nie zasypia", "W2", "Aplikacja, analityka",
  "GPS i ODJ (linie nocne), WC (godziny), AED, WYD, SPORT",
  "Opis W2 zaczyna się od zdania „Miasto nigdy nie zasypia”. Ten projekt jest dla pracowników zmianowych, medyków, kurierów i gastronomii. Pokazuje odpoczynek i aktywność w nietypowych godzinach: zajęcia rano, linie nocne na żywo, toalety czynne w nocy, wydarzenia poza godzinami szczytu. Do tego analiza dla miasta: gdzie nocą brakuje usług.",
  "Mapa „Warszawa o 3:00” i luki w usługach.",
  "Odpowiada wprost na tekst wyzwania i na zaniedbaną grupę.",
  "Mniej danych o nocnych usługach.",
  8, 7, 6, 9, 7, 8, 6)

P("Dźwięk Warszawy – miasto jako relaksująca muzyka na żywo", "W2", "Sonifikacja, generatywna muzyka",
  "GPS (rytm ruchu), AQ, POG (wiatr, opad), WYD",
  "Generatywny ambient na żywo z danych miasta: tramwaje dają tony, wiatr i deszcz ze stacji ZOM tworzą tekstury, a jakość powietrza ustala tonację. Na skupienie, medytację i odpoczynek. Można go też odtwarzać jako instalację w przestrzeni publicznej, np. w metrze albo w parku.",
  "Pitch zaczyna się od 20 s ciszy, a potem gra Warszawa „teraz”.",
  "Najbardziej zapamiętywalne demo w całym konkursie i bardzo oryginalne.",
  "Potencjał wdrożeniowy jest dyskusyjny, Q&A może to obnażyć.",
  7, 9, 5, 8, 10, 8, 6)

P("Wtedy i teraz – historia na trasach turystycznych (AI + archiwa)", "W2", "AI obraz, AR-lite",
  "TRASY, WYD; + ortofoto 1945, archiwa",
  "Na punktach tras turystycznych pokazujemy zestawienie „wtedy i teraz”: archiwalna ortofotomapa 1945, archiwalne zdjęcie koloryzowane przez AI i współczesny widok. Do tego wydarzenia kulturalne w okolicy dziś.",
  "Przesuwany suwak między 1945 a dziś na Starym Mieście.",
  "Emocjonalne, warszawskie, idealne na odkrywanie miasta.",
  "Prawa do archiwów i jakość koloryzacji.",
  7, 7, 6, 9, 9, 6, 6)

P("Okno pogodowe – planer aktywności", "W2", "Rekomendacje",
  "POG, AQ, BOISKA, SPORT, TRASY",
  "Powiadomienie „dziś 18:00–19:30 idealne warunki na tenisa, kort przy SP 12 wolny, 9 min od Ciebie”, oparte na pogodzie ZOM, powietrzu i godzinach boisk.",
  "Push z propozycją dopasowaną do lokalizacji jurora.",
  "Proste i użyteczne.",
  "Mało innowacyjne.",
  7, 5, 6, 7, 7, 8, 6)

P("Biegaj czysto – planer biegów wg smogu", "W2", "Rekomendacje",
  "AQ, POG, TRASY",
  "Wybór pory i trasy biegu z najmniejszym zanieczyszczeniem.",
  "Wykres „najlepsza godzina na bieg”.",
  "Prosty i zrozumiały.",
  "Mało stacji pomiarowych, a podobne aplikacje istnieją.",
  6, 5, 6, 7, 6, 8, 5)

P("Gazetka osiedlowa AI – drukowana dla wykluczonych cyfrowo", "W2 (alt. W3)", "AI tekst, druk",
  "WYD, KONS, BO, UTR, SPORT, WC, AED, EKO",
  "Co tydzień generowana jednostronicowa gazetka dla osiedla (PDF do druku w domach kultury, bibliotekach i spółdzielniach): wydarzenia, konsultacje, utrudnienia, zajęcia dla seniorów, ekopunkty. Tekst łatwy do czytania. Docieramy do ludzi, do których aplikacje nie dotrą.",
  "Rozdajemy jury wydrukowane gazetki dla ich dzielnic.",
  "Bardzo wdrażalne i tanie. Fizyczny artefakt na pitchu zapada w pamięć.",
  "Mniej techniczne, część jury może uznać to za mało ambitne.",
  8, 7, 7, 8, 7, 9, 7)

P("Zadzwoń do Warszawy – telefoniczny asystent głosowy dla seniorów", "W2 (alt. W3)", "AI głos, telefonia",
  "WYD, SPORT (60+), ODJ, GPS, WC, AED, AQ, KONS, EKO",
  "Zwykły numer telefonu, bez aplikacji i internetu. Senior dzwoni i pyta po polsku: „Co ciekawego jest jutro na Bielanach?”, „Kiedy przyjedzie 180?”. Agent głosowy (STT, Bielik z narzędziami do API miasta, TTS) odpowiada z prawdziwych danych. Kanał operatora telekomunikacyjnego to naturalne wdrożenie.",
  "Juror dzwoni ze swojego telefonu na scenie i dostaje odpowiedź z danych na żywo.",
  "Najmocniejsze demo „na żywo” i walka z wykluczeniem cyfrowym. CTO Play i Bielik.AI w jury.",
  "Opóźnienia głosu i hałas na sali. Trzeba mieć nagrany backup.",
  8, 8, 8, 8, 9, 7, 9)

P("Wellbeing Map dla pracodawców (B2B)", "W2", "Analityka B2B",
  "BOISKA, SPORT, WYD, TRASY, PRZYST, AQ",
  "Raport dla działów HR: co w okolicy biura sprzyja odpoczynkowi pracowników, plus automatyczny program „well-being week” z miejskiej oferty.",
  "Raport PDF dla biurowca na Woli.",
  "Model biznesowy dla inwestora w jury.",
  "Mało emocjonalne.",
  6, 6, 6, 7, 6, 7, 6)

P("Ruch w przerwie – firmowe wyzwania sportowe", "W2", "Gamifikacja B2B",
  "BOISKA, SPORT, TRASY",
  "Rywalizacja zespołów firmowych w korzystaniu z miejskiej infrastruktury sportowej.",
  "Ranking firm.",
  "Prosty model biznesowy.",
  "Słaby związek z danymi i niska innowacyjność.",
  6, 5, 6, 6, 6, 8, 5)

P("Warszawa Wrapped – miasto w stylu Spotify Wrapped", "W2 (alt. W3)", "Dataviz, social",
  "BO, KONS, RCN, WYD, GPS, AQ, AED, WC",
  "Interaktywne, udostępnialne „podsumowanie roku” Warszawy (lub Twojej dzielnicy) z danych: ile projektów BO zrealizowano, ile wydarzeń się odbyło, mediana ceny m², ile pojazdów jeździ teraz. Narzędzie promocji otwartych danych.",
  "Pionowa karuzela kart jak w Instagram Stories.",
  "Bardzo łatwe, ładne, promuje portal danych.",
  "Część zbiorów to tylko stan bieżący (brak historii). Słaby „problem do rozwiązania”.",
  7, 6, 5, 9, 9, 9, 7)

P("Razem na konsultacje – sąsiedzkie spotkania", "W2", "Społeczność",
  "KONS (lokalizacje spotkań), WYD",
  "Umawianie się z sąsiadami na wspólne pójście na spotkania konsultacyjne i lokalne wydarzenia.",
  "Mapa spotkań.",
  "Buduje relacje lokalne.",
  "Słabe dane i mała skala.",
  6, 6, 6, 8, 6, 8, 6)

P("Pora na sport – rekomendator zajęć", "W2", "Rekomendacje",
  "SPORT, BOISKA",
  "Wyszukiwarka i rekomendator miejskich zajęć sportowych według wieku, dnia i dzielnicy.",
  "Filtr zajęć.",
  "Łatwe.",
  "Powtarza istniejący serwis sport.um.warszawa.pl.",
  6, 4, 6, 7, 5, 9, 5)

P("Za 0 zł – darmowa Warszawa dziś", "W2", "Rekomendacje",
  "WYD, SPORT, BOISKA, TRASY, ODJ",
  "Wszystko, co można dziś robić bezpłatnie, z dojazdem komunikacją.",
  "Lista „dziś za darmo”.",
  "Czytelna wartość.",
  "Niska innowacyjność.",
  7, 4, 7, 8, 6, 9, 5)

P("Spokojny dojazd – trasy z mniejszym stresem", "W2", "Planer tras",
  "GPS, ODJ, UTR, PRZYST",
  "Planer, który wybiera nie najszybszą, tylko najmniej stresującą trasę: mniej przesiadek, linie punktualne w ostatnich godzinach według GPS, omijanie utrudnień.",
  "Porównanie dwóch tras z „indeksem stresu”.",
  "Ciekawa reinterpretacja planera.",
  "Konkurencja z Jakdojade i Google. Trudne w 24 h.",
  7, 6, 6, 7, 6, 6, 5)

P("Warszawa w RCS / SMS – info bez aplikacji", "W2 (alt. W3)", "Kanał telco",
  "WYD, ODJ, AQ, UTR, KONS",
  "Usługa wiadomości RCS i SMS: piszesz „Wola wieczór” i dostajesz karuzelę wydarzeń z dojazdem. Kanał natywny dla operatora.",
  "Demo w aplikacji Wiadomości na telefonie jurora.",
  "Bezpośrednio dopasowane do CTO Play.",
  "Dostęp do RCS Business Messaging w 24 h może być niemożliwy (fallback SMS).",
  7, 6, 7, 7, 6, 8, 8)

P("Godzina dla osiedla – mikrowolontariat", "W2", "Społeczność",
  "BO, KONS, WYD, EKO",
  "„Masz godzinę? Zrób coś dla osiedla”: pomoc w lokalnym wydarzeniu, wypełnienie konsultacji, zbiórka elektrośmieci do ekopunktu.",
  "Lista zadań na dziś w okolicy.",
  "Relacje lokalne.",
  "Słaba podstawa danych.",
  7, 6, 6, 8, 6, 8, 6)

P("Toalety dla kurierów i pracowników mobilnych", "W2 (alt. W3)", "Mapa",
  "WC (godziny, płatność), AED, PARK",
  "Kurierzy, kierowcy i dostawcy spędzają cały dzień w mieście bez dostępu do toalet. Mapa bezpłatnych toalet czynnych teraz plus analiza luk dla miasta i propozycje lokalizacji.",
  "Mapa „gdzie skorzystać teraz” i heatmapa luk.",
  "Zaniedbana grupa, bardzo konkretne.",
  "Wąski temat, może wydać się błahy.",
  7, 7, 7, 8, 6, 9, 6)

# ======================================================================
# WYZWANIE 3: WARSZAWA: TWÓJ RUCH! (otwarte)
# ======================================================================

P("Warszawa MCP – otwarte dane dla każdego asystenta AI (z Bielikiem)", "W3", "AI agent, infrastruktura",
  "Wszystkie 23 zbiory przez API",
  "Serwer Model Context Protocol, który udostępnia wszystkie zbiory miasta jako narzędzia dla AI. Dzięki temu dowolny asystent (Bielik, Claude, ChatGPT, Copilot) odpowiada na pytania o Warszawę na prawdziwych danych. Do tego referencyjny czat na Bieliku z mapą wyników. Miasto zmienia się z dostawcy plików w dostawcę danych dla ery AI.",
  "Ten sam prompt w 3 różnych asystentach i za każdym razem poprawna odpowiedź z danymi miasta na żywo.",
  "Dla Wydziału Zarządzania Danymi i Bielik.AI to strzał w dziesiątkę. Proste i wdrażalne.",
  "Czaty będą też u innych zespołów. Trzeba podkreślić aspekt infrastrukturalny.",
  9, 7, 9, 7, 7, 8, 10)

P("Zapytaj Dane – analityk AI dla urzędników (Bielik on-prem)", "W3", "AI agent, BI",
  "Wszystkie zbiory",
  "Urzędnik pyta w języku naturalnym („ile projektów BO o zieleni zrealizowano na Pradze i gdzie brakuje AED?”). Agent pisze zapytania, łączy zbiory i oddaje mapę lub wykres. Działa lokalnie na Bieliku, bez wysyłania danych do USA (suwerenność danych).",
  "Pytanie zadane przez jurora z urzędu i mapa w 20 s.",
  "Suwerenne AI w administracji to temat MC i Bielik.AI.",
  "Łatwo o błędne odpowiedzi agenta. Potrzebne jest pokazanie zapytań.",
  9, 7, 8, 7, 8, 7, 9)

P("BO w obrazach – zobacz projekt, zanim zagłosujesz", "W3 (alt. W1)", "AI obraz, analityka, partycypacja",
  "BO (opisy, lokalizacje, kosztorysy, statusy, wyniki głosowań), KONS; + Mapillary/ortofoto",
  "Dla każdego projektu Budżetu Obywatelskiego AI generuje fotorealistyczną wizualizację w prawdziwym miejscu: zdjęcie ulicy z Mapillary i edycja image-to-image według opisu projektu. Obok analityka z historii BO: koszt na mieszkańca, podobne projekty zrealizowane wcześniej i ich rzeczywisty koszt, opóźnienia. Wszystko na mapie 3D. Wyższa i bardziej świadoma frekwencja w głosowaniu.",
  "Projekt „zielone podwórko” z prawdziwym zdjęciem przed i AI po, a obok „3 podobne projekty kosztowały średnio X zł i trwały 14 mies.”",
  "Najlepszy balans wszystkich kryteriów: AI i wizualność, głębokie użycie bogatego zbioru, jasny właściciel (Centrum Komunikacji Społecznej, BO), czysto warszawski temat.",
  "Miejski zbiór BO zawiera tylko projekty zrealizowane i w realizacji, więc na demo pokazujemy „co tu powstanie”, a „zanim zagłosujesz” to cel wdrożenia. Wizualizacja może wprowadzać w błąd, potrzebna etykieta „poglądowe”. Jakość zdjęć Mapillary bywa różna. Zbiór zawiera imiona i nazwiska autorów, których nie wolno pokazywać (RODO).",
  9, 8, 9, 10, 9, 7, 8)

P("Konsultacje, które widać", "W3 (alt. W1)", "AI tekst + obraz, dostępność",
  "KONS (+kategorie, dzielnice), BO, PRZYST, AQ, AED, WC, RCN",
  "Każda konsultacja społeczna dostaje: streszczenie w tekście łatwym do czytania (ETR), tłumaczenie UA/EN, wizualizację AI „przed i po”, kontekst danych o okolicy (komunikacja, powietrze, ceny, infrastruktura) oraz 60-sekundowe audio. Cel: więcej i lepszych głosów w konsultacjach.",
  "Prawdziwa trwająca konsultacja w wersji urzędowej i w wersji z naszego narzędzia, obok siebie.",
  "Moduł do istniejącego portalu konsultacji, więc wdrożenie jest oczywiste. Dostępność (ETR) to temat bliski miastu (regulamin sam o nim mówi).",
  "Pokrywa się z „BO w obrazach”, warto je połączyć.",
  8, 8, 9, 9, 9, 7, 9)

P("Asystent wniosku BO – od luki w danych do gotowego projektu", "W3 (alt. W1)", "AI LLM, analityka przestrzenna",
  "BO (historia projektów i koszty), AED, WC, BOISKA, EKO, PRZYST, SPORT, AQ",
  "Mapa „czego brakuje w moim sąsiedztwie” (indeks 15-minutowy z miejskich zbiorów). Mieszkaniec klika lukę, a AI (Bielik) przygotowuje szkic wniosku do BO: uzasadnienie oparte na danych, realistyczny kosztorys z podobnych zrealizowanych projektów i wskazówki z projektów, które wygrały i powstały. Nabór do BO zwykle rusza na początku roku.",
  "Od kliknięcia luki na mapie do gotowego, pobieralnego wniosku w 30 s.",
  "Pełna ścieżka: dane → problem → działanie obywatela. Wysoka innowacyjność i wdrożenie w procesie BO.",
  "Weryfikacja wiarygodności kosztorysów. Nie zastępuje pracy urzędu. Zbiór BO nie zawiera projektów odrzuconych, więc asystent uczy się tylko na projektach, które przeszły.",
  9, 8, 9, 10, 8, 7, 9)

P("Gdzie postawić? – optymalizator lokalizacji infrastruktury (AED, WC, ekopunkty)", "W3", "Optymalizacja, analityka",
  "AED, WC, EKO, PRZYST, LINIE, WYD, TRASY, BOISKA",
  "Narzędzie dla urzędników: wybierasz typ infrastruktury i budżet (np. 20 nowych AED). Algorytm max-coverage wskazuje optymalne lokalizacje, ważąc węzły przesiadkowe, miejsca wydarzeń, trasy turystyczne i szkoły. Pokazuje wzrost pokrycia z 61% do 78%.",
  "Suwak „liczba nowych urządzeń” i rosnące pokrycie na mapie w czasie rzeczywistym.",
  "Najmocniejsze wykorzystanie danych (łączenie wielu zbiorów), konkretna decyzja i oszczędność pieniędzy.",
  "AED jest promowane w ogłoszeniach, więc inne zespoły też zrobią „mapę AED”. Trzeba się wyróżnić optymalizacją.",
  10, 7, 9, 9, 7, 8, 8)

P("Każda sekunda – AED a wydarzenia masowe", "W3", "Analityka, bezpieczeństwo",
  "AED, WYD, PRZYST, GPS, WC",
  "Dla każdego nadchodzącego wydarzenia z kalendarza miasta liczymy pieszy czas dotarcia do najbliższego AED i ostrzegamy organizatora („koncert X: najbliższy AED 7 min, rekomendujemy mobilny AED”). Do tego mapa „pustyń AED”.",
  "Lista weekendowych wydarzeń z czerwonymi flagami.",
  "Bardzo konkretne i ratujące życie.",
  "AED to oczywisty temat, więc tłok na konkursie.",
  8, 6, 9, 9, 7, 9, 7)

P("Bezpieczne wydarzenie – automatyczna karta dla organizatorów", "W3", "Automatyzacja, raporty",
  "WYD, AED, WC, PRZYST, ODJ, UTR, POG, AQ, PARK",
  "Dla każdego wydarzenia automatycznie generujemy kartę bezpieczeństwa i dostępności: najbliższe AED, toalety (w tym bez barier), dojazd komunikacją i utrudnienia w tym dniu, parkingi, prognoza pogody i powietrza. Może trafić do urzędu przy zgłaszaniu imprez.",
  "Generacja karty PDF dla prawdziwego wydarzenia z kalendarza.",
  "Łączy aż 9 zbiorów w jeden użyteczny produkt.",
  "Mało spektakularne wizualnie.",
  9, 7, 8, 8, 7, 9, 7)

P("Koszt utrudnienia – ile minut pasażerów zabiera remont", "W3", "Analityka transportowa",
  "UTR, GPS (zebrane w trakcie hackathonu), ODJ, LINIE",
  "Łączymy utrudnienia z infoulice z pozycjami pojazdów zbieranymi przez 20 h. Mierzymy, ile minut opóźnienia generuje każde utrudnienie dla linii przez nie przechodzących, i układamy ranking „najdroższych” remontów. To narzędzie dla ZDM do planowania objazdów.",
  "Mapa utrudnień z „licznikiem straconych minut” na żywo.",
  "Bardzo innowacyjna metryka, realna wartość dla ZDM i ZTM.",
  "Dopasowanie pozycji do rozkładu jest trudne (brak GTFS w portalu). 20 h danych to mało.",
  8, 8, 8, 9, 8, 5, 7)

P("Gdzie miasto stoi – wąskie gardła i priorytet tramwajowy", "W3", "Analityka transportowa",
  "GPS (zebrane w trakcie), PRZYST, ODJ, LINIE",
  "Z pozycji pojazdów zbieranych co 10 s wykrywamy segmenty, na których tramwaje i autobusy tracą najwięcej czasu, i ważymy je liczbą linii. Wynikiem jest lista 10 skrzyżowań, gdzie priorytet w sygnalizacji lub buspas oszczędziłby najwięcej czasu pasażerów.",
  "Heatmapa prędkości tramwajów po 20 h zbierania.",
  "Twarde dane i konkretne rekomendacje.",
  "Analizy punktualności ZTM robi się często, więc może być kilka podobnych projektów.",
  9, 7, 8, 9, 8, 6, 7)

P("Sprawiedliwość taborowa / Złap elektryka", "W3", "Analityka + aplikacja",
  "TABOR (rok, trakcja), GPS, AQ, PRZYST, LINIE",
  "Pytanie: czy niektóre dzielnice systematycznie dostają starsze, spalinowe autobusy? Łączymy rejestr taboru z GPS i mierzymy średni wiek i trakcję floty obsługującej każdą dzielnicę, zestawiając to z jakością powietrza. Funkcja dla pasażera: „za 4 min przyjedzie elektryk z 2024 r., za 6 min diesel z 2008 r.”.",
  "Mapa dzielnic według wieku taboru na żywo.",
  "Nieoczywiste pytanie badawcze, rzadko używany zbiór i temat sprawiedliwości.",
  "Może się okazać, że różnic nie ma. To też wynik, ale słabszy na pitch.",
  9, 8, 7, 9, 8, 8, 7)

P("Pokédex ZTM – kolekcjonerska gra taboru", "W3", "Gra mobilna",
  "TABOR (marki, modele, rocznik, malowanie), GPS",
  "Kolekcjonujesz pojazdy, którymi jedziesz: rzadkie modele, historyczne malowania, najstarsze tramwaje. Na żywo widzisz, gdzie teraz jeździ „legendarny” egzemplarz. Gra zachęca do komunikacji miejskiej i trafia do dużej społeczności miłośników komunikacji.",
  "Na mapie pojawia się rzadki Konstal 13N, a juror „łapie” go w aplikacji.",
  "Bardzo zabawne, unikalne użycie zbioru o taborze.",
  "Wdrożenie niepewne, może być odebrane jako żart.",
  8, 8, 5, 8, 9, 7, 6)

P("Ile kosztuje metro? – premia cenowa transportu", "W3 (alt. W1)", "Ekonometria, mapa",
  "RCN, PRZYST, LINIE, ODJ",
  "Model hedoniczny na transakcjach RCN: ile procent do ceny m² dodaje bliskość metra, tramwaju i częstych linii. Wynik dla polityki: ile wartości tworzą inwestycje transportowe i jak miasto może ją przechwycić. Z prognozą dla planowanych odcinków M3.",
  "Mapa „premii za metro” i wykres przed i po otwarciu stacji M2.",
  "Ciekawe dla strategii i inwestora. Mocne użycie RCN.",
  "Ekonometria w 24 h może być słaba statystycznie.",
  9, 7, 7, 9, 8, 7, 7)

P("Uczciwa cena – sprawdź, czy mieszkanie nie jest przepłacone", "W3", "Aplikacja konsumencka, ML",
  "RCN, PRZYST, AQ, AED, BOISKA, WC",
  "Wklejasz ogłoszenie. Model oparty na prawdziwych transakcjach z RCN szacuje cenę rynkową i pokazuje 10 porównywalnych transakcji oraz „jakość okolicy” z otwartych danych.",
  "Wklejenie ogłoszenia z portalu i werdykt.",
  "Bardzo zrozumiały problem.",
  "Istnieją serwisy komercyjne. Warunki wykorzystania RCN mogą ograniczać zastosowania.",
  9, 6, 7, 9, 8, 8, 7)

P("Ceny a smog – ile warte jest czyste powietrze", "W3", "Ekonometria",
  "RCN, AQ, POG",
  "Badanie, czy jakość powietrza wpływa na ceny transakcyjne w Warszawie.",
  "Wykres korelacji.",
  "Ciekawa teza.",
  "Mało stacji AQ, wynik może być nieistotny.",
  8, 7, 5, 8, 7, 7, 6)

P("Gdzie zamieszkać – dopasowanie dzielnicy do stylu życia", "W3", "Rekomendacje",
  "RCN, AQ, PRZYST, SPORT, WYD, BOISKA, WC, AED",
  "Quiz o stylu życia, z którego wychodzi ranking osiedli z ceną z RCN i dopasowaniem do preferencji.",
  "Quiz z jurorami.",
  "Łączy wiele zbiorów.",
  "Bardzo częsty pomysł na hackathonach.",
  10, 5, 6, 9, 8, 8, 7)

P("15-minutowa Warszawa – indeks dostępności usług", "W3 (alt. W1)", "Analityka przestrzenna",
  "PRZYST, AED, WC, EKO, BOISKA, SPORT, WYD, BO",
  "Siatka heksagonów z indeksem dostępności pieszej do miejskich usług z otwartych danych, zestawiona z historycznymi wydatkami BO. Pytanie: czy BO trafia tam, gdzie brakuje najwięcej?",
  "Mapa luk i wykres „wydatki BO a deficyt usług”.",
  "Analiza strategiczna, bardzo dobra dla Biura Strategii.",
  "Analizy 15-min są popularne. Pomaga połączenie z BO.",
  10, 6, 8, 9, 8, 8, 8)

P("BO pod lupą – co się udało, co utknęło", "W3", "Transparentność, dataviz",
  "BO (statusy, kosztorysy, edycje)",
  "Panel przejrzystości Budżetu Obywatelskiego: realizacja w czasie, opóźnienia, kategorie wygrywające w dzielnicach, rozkład pieniędzy na mieszkańca.",
  "Interaktywne wykresy według dzielnic i edycji.",
  "Solidne i wdrażalne.",
  "Dashboard to przeciętna innowacyjność.",
  9, 6, 7, 9, 7, 9, 7)

P("Czy mój projekt BO wygra? – trener wniosków", "W3", "ML, AI LLM",
  "BO (wyniki głosowań, opisy, koszty, lokalizacje)",
  "Model uczony na historycznych projektach BO przewiduje szansę wygranej i doradza (np. „projekty zieleni poniżej 200 tys. zł wygrywają w tej dzielnicy w 64%”). Bielik poprawia czytelność opisu.",
  "Wklejenie opisu i prawdopodobieństwo z rekomendacjami.",
  "Ciekawy ML na rzadko analizowanych danych.",
  "Etyka „optymalizacji pod głosowanie”. Niewielki zbiór treningowy.",
  8, 8, 6, 9, 8, 7, 7)

P("Konsultacje bez barier – ETR, ukraiński, angielski, audio", "W3", "AI LLM, dostępność",
  "KONS, KONS-kategorie, KONS-dzielnice",
  "Automatyczne wersje każdej konsultacji: tekst łatwy do czytania, ukraiński i angielski (duża społeczność ukraińska w Warszawie) oraz audio. Narzędzie może działać jako wtyczka do portalu konsultacji.",
  "Konsultacja w 4 wersjach i porównanie czytelności (indeks FOG).",
  "Bardzo wdrażalne, inkluzywne, tanie.",
  "Technicznie proste, mniej wow.",
  6, 7, 9, 9, 7, 9, 8)

P("Witaj w Warszawie – onboarding nowych mieszkańców", "W3", "Asystent wielojęzyczny",
  "SEG, EKO, WC, ODJ, PRZYST, WYD, SPORT, KONS",
  "Przewodnik dla nowych mieszkańców (studenci, migranci): jak segregować śmieci, gdzie oddać elektrośmieci, jak działa komunikacja, co się dzieje w okolicy, jak zabrać głos w konsultacjach. Dostępny w wielu językach.",
  "Rozmowa po ukraińsku i odpowiedzi z danych miasta.",
  "Duża grupa docelowa i realny problem.",
  "Czatowe asystenty to częsty pomysł.",
  9, 5, 8, 9, 6, 8, 7)

P("P+R Predict – prognoza wolnych miejsc i zachęta do przesiadki", "W3", "ML, aplikacja",
  "PARK (co minutę, zbierane w trakcie), ODJ, GPS, WYD, POG",
  "Model przewiduje obłożenie P+R za 30–60 min i mówi kierowcy: „zostaw auto na P+R Młociny, wolne miejsca będą do 8:20, metro za 3 min, oszczędzasz 14 min”.",
  "Prognoza na wykresie i powiadomienie dla kierowcy.",
  "Realny problem i dane live.",
  "Zaledwie 24 h historii do treningu.",
  8, 6, 8, 8, 7, 7, 6)

P("Infoulice AI – utrudnienia po ludzku", "W3", "AI LLM",
  "UTR, LINIE, PRZYST",
  "LLM zamienia komunikaty o utrudnieniach w strukturalne dane i proste streszczenia: które linie są dotknięte, jak długo, jaki jest objazd.",
  "Komunikat przed i po.",
  "Proste i przydatne.",
  "Mało spektakularne.",
  7, 6, 7, 8, 6, 8, 6)

P("Wyjdź wcześniej – utrudnienia w Twoim kalendarzu", "W3", "Integracja kalendarza",
  "UTR, GPS, ODJ",
  "Proaktywny alert: „Twoje spotkanie o 9:00, na trasie remont, wyjdź 12 min wcześniej, linia 523 ma opóźnienia”.",
  "Powiadomienie na podstawie kalendarza jurora.",
  "Codzienna wartość.",
  "Konkurencja z Google Maps.",
  7, 6, 7, 8, 7, 8, 6)

P("Gołoledź Alert – ostrzeżenia z temperatury nawierzchni", "W3", "Analityka, alerty",
  "POG (temp. nawierzchni, wilgotność, opad), PRZYST, TRASY, AED",
  "Stacje ZOM mierzą temperaturę nawierzchni, a mało kto o tym wie. Gdy nawierzchnia jest poniżej 0°C przy wilgoci, wysyłamy alert dla seniorów i rowerzystów i pokazujemy mapę ryzyka dla służb zimowego utrzymania (ZOM to właściciel danych). Do tego przewidywanie oblodzenia 2–3 h naprzód.",
  "Symulacja zimowej nocy i alerty pojawiające się na mapie.",
  "Bardzo nieoczywiste użycie danych, realny właściciel wdrożenia. Upadki seniorów kosztują system zdrowia.",
  "W październiku nie będzie realnego oblodzenia, więc demo musi być symulacją.",
  7, 8, 8, 9, 7, 8, 7)

P("Warszawa Data Stories – automatyczne dziennikarstwo danych", "W3", "AI LLM, dataviz",
  "Wszystkie zbiory",
  "Agent co tydzień przegląda dane miasta, znajduje anomalie i ciekawostki („najgorsze powietrze tygodnia na Targówku”, „rekordowa liczba wydarzeń”) i pisze krótkie artykuły z wykresami dla mediów lokalnych i social media.",
  "3 wygenerowane historie z dzisiejszych danych.",
  "Promuje portal otwartych danych, co odpowiada interesowi Wydziału Zarządzania Danymi.",
  "Wymaga historii danych, której w API często nie ma.",
  9, 7, 7, 8, 7, 8, 8)

P("Data Quality Watchdog – audyt jakości miejskich zbiorów", "W3", "Narzędzie dla urzędu",
  "Wszystkie zbiory",
  "Automatyczny monitoring kompletności, aktualności i spójności zbiorów (np. toalety bez godzin, AED z nieaktualną datą) z raportem dla urzędu i publicznym wskaźnikiem jakości.",
  "Raport „zdrowia” 23 zbiorów.",
  "Wdrażalne od jutra, cenne dla urzędu.",
  "Nudne na scenie. Może zostać odebrane jako wytykanie błędów.",
  9, 6, 8, 7, 5, 9, 8)

P("Dane w szkole – lekcje z Warszawą na żywo", "W3", "Edukacja, AI",
  "GPS, AQ, POG, RCN, BO",
  "Generator zadań z matematyki, geografii i WOS opartych na danych miasta z dzisiaj („oblicz średnią prędkość tramwaju 17”, „porównaj ceny m² na Woli i Bemowie”). Dla nauczycieli, z kartami pracy w PDF.",
  "Karta pracy wygenerowana na żywo z dzisiejszych danych.",
  "Edukacja to obszar 42 Warsaw. Wdrożenie przez Biuro Edukacji.",
  "Mało wow.",
  8, 7, 7, 8, 7, 8, 8)

P("Dyspozytor ZTM – gra symulacyjna", "W3", "Gra",
  "GPS, LINIE, PRZYST, UTR",
  "Gra, w której zarządzasz siecią w czasie rzeczywistym: reagujesz na prawdziwe utrudnienia i przesuwasz pojazdy.",
  "Rozgrywka na żywo.",
  "Angażujące.",
  "Brak wdrożenia, trudne w 24 h.",
  7, 7, 4, 8, 8, 5, 6)

P("GeoGuessr Warszawa z danymi", "W3", "Gra",
  "TRASY, WYD, RCN; + Mapillary",
  "Zgadujesz lokalizację na podstawie zdjęcia, a po odpowiedzi dostajesz ciekawostki z danych o tym miejscu.",
  "Runda z jury.",
  "Zabawne.",
  "Dane są tylko dodatkiem.",
  5, 5, 4, 8, 8, 8, 5)

P("Ratownik w okolicy – społecznościowi ratownicy i AED", "W3", "Aplikacja ratunkowa",
  "AED, PRZYST, WYD",
  "Model szwedzkiego Heartrunnera: przeszkoleni wolontariusze dostają alert o zatrzymaniu krążenia w pobliżu. Jedna osoba biegnie po AED, druga do poszkodowanego.",
  "Symulacja alertu na 2 telefonach.",
  "Ratuje życie, dobre demo.",
  "Wdrożenie wymaga integracji z dyspozytorami PRM (nie z miastem). Istnieją podobne inicjatywy.",
  6, 7, 6, 7, 8, 7, 6)

P("AED Trening – gra edukacyjna 3D", "W3", "Gra 3D, edukacja",
  "AED; + LoD2",
  "Krótka gra 3D: ktoś upada na ulicy w prawdziwej Warszawie, a Ty musisz znaleźć najbliższy AED i wykonać RKO.",
  "Rozgrywka na scenie.",
  "Edukacyjne, z elementem 3D.",
  "Słabe użycie danych.",
  5, 7, 6, 6, 8, 6, 6)

P("Słyszę przystanek – asystent dla osób niewidomych", "W3", "Dostępność, głos",
  "GPS, ODJ, PRZYST, LINIE, UTR, WC",
  "Aplikacja głosowa: „Twój autobus 160 jest dwa przystanki stąd, będzie za 3 minuty, podjedzie na stanowisko 02”. Ostrzega o utrudnieniach i prowadzi do toalet bez barier.",
  "Demo z zasłoniętymi oczami.",
  "Inkluzywne, wdrażalne.",
  "Istnieją podobne rozwiązania.",
  7, 6, 8, 8, 7, 8, 7)

P("Bezpieczna droga do szkoły", "W3", "Analityka",
  "BOISKA (lista szkół), UTR, PRZYST, AED",
  "Analiza dojść do szkół: utrudnienia, przystanki, AED w pobliżu szkół.",
  "Mapa szkół z oceną.",
  "Ważny temat.",
  "Brak danych o wypadkach i przejściach.",
  6, 6, 7, 8, 6, 7, 6)

P("Boiska otwarte naprawdę – analiza godzin dostępności", "W3", "Analityka",
  "BOISKA, SPORT",
  "Analiza, ile godzin tygodniowo szkolne boiska są dostępne dla mieszkańców w każdej dzielnicy, i rekomendacja wydłużenia godzin tam, gdzie brakuje infrastruktury.",
  "Mapa „godzin dostępnych na mieszkańca”.",
  "Tanie do wdrożenia (decyzja administracyjna).",
  "Wąski zakres.",
  6, 6, 8, 8, 6, 9, 6)

P("Eko-przypominacz po drodze", "W3", "Geofencing",
  "EKO, SEG, PRZYST",
  "Przypomnienie „mijasz ekopunkt, masz w plecaku baterie?” na podstawie trasy i listy rzeczy do oddania.",
  "Powiadomienie na trasie.",
  "Prosty nudge.",
  "Niski wow.",
  6, 7, 7, 7, 6, 8, 6)

P("SegregujAI – zdjęcie śmiecia i właściwy pojemnik", "W3", "AI wizja",
  "SEG, Typy odpadów, EKO",
  "Model wizji rozpoznaje odpad na zdjęciu i mówi, do którego pojemnika go wrzucić i gdzie jest najbliższy ekopunkt.",
  "Zdjęcie kubka po kawie.",
  "Wdrażalne w SegregujNa5.",
  "Prawie identyczny projekt (SeGregiusz) wygrał miejski hackathon w 2021 r., więc brak nowości.",
  6, 3, 8, 8, 7, 9, 6)

P("Wojna śmieciowa – quiz segregacji dzielnic", "W3", "Gra",
  "SEG, Typy odpadów",
  "Quiz z rankingiem dzielnic.",
  "Quiz z jury.",
  "Proste.",
  "Mało innowacyjne.",
  6, 4, 6, 7, 7, 9, 5)

P("Martwe przystanki – obszary niedoobsłużone przez komunikację", "W3", "Analityka transportowa",
  "PRZYST, LINIE, ODJ",
  "Liczymy częstotliwość odjazdów dla każdego przystanku i wskazujemy obszary z najsłabszą obsługą.",
  "Mapa częstotliwości.",
  "Solidne.",
  "Ciężkie pobieranie odjazdów przystanek po przystanku przez API.",
  8, 5, 7, 8, 6, 7, 6)

P("Izochrony na żywo – jak daleko zajadę teraz", "W3", "Analityka, mapa",
  "GPS, ODJ, PRZYST",
  "Mapa zasięgu 15, 30 i 45 minut komunikacją z dowolnego punktu, liczona z bieżących opóźnień.",
  "Pulsujące izochrony.",
  "Ładne i zrozumiałe.",
  "Routing w 24 h bez GTFS jest trudny.",
  8, 6, 6, 8, 8, 6, 6)

P("Puls Miasta – dashboard dla prezydenta", "W3", "Dashboard",
  "Wszystkie zbiory",
  "Jedno okno z bieżącym stanem miasta.",
  "Ekran z kafelkami.",
  "Dużo danych.",
  "Klasyczny dashboard o niskiej innowacyjności.",
  9, 4, 6, 8, 7, 8, 7)

P("Sprawdzam! – fact-checking wypowiedzi na danych miasta", "W3", "AI LLM",
  "BO, AQ, RCN, KONS",
  "Bot weryfikujący twierdzenia o Warszawie (np. „powietrze jest coraz gorsze”) na otwartych danych.",
  "Weryfikacja przykładowej wypowiedzi.",
  "Ciekawa idea.",
  "Polityczne ryzyko przed jury z urzędu. Wąskie dane.",
  7, 7, 5, 7, 7, 7, 6)

P("Czasoprzestrzenna kostka wydarzeń 3D", "W3", "Dataviz 3D",
  "WYD, SPORT",
  "Wydarzenia jako punkty w przestrzeni 3D (x, y = mapa, z = czas).",
  "Obrót kostki.",
  "Efektowna wizualizacja.",
  "Mała użyteczność.",
  7, 6, 4, 7, 8, 7, 5)

P("Voxel Warszawa – instalacja artystyczna danych", "W3", "Sztuka danych, 3D",
  "AQ, GPS, POG; + LoD2",
  "Wokselowa Warszawa, w której smog to mgła, tramwaje to światła, a deszcz to cząsteczki. Instalacja na żywo.",
  "Fullscreen art.",
  "Duży wow.",
  "Brak użyteczności.",
  6, 7, 4, 8, 9, 7, 5)

P("Czy boisko jest wolne? – crowdsourcing zajętości", "W3", "Aplikacja",
  "BOISKA",
  "Szybki check-in „jest wolne” lub „zajęte” na otwartych boiskach.",
  "Check-in.",
  "Prosty.",
  "Zimny start bez użytkowników.",
  6, 6, 7, 8, 6, 8, 5)

P("Dostępny przejazd – planer dla osób z niepełnosprawnościami", "W3", "Planer",
  "WC (Dostępność), PRZYST, ODJ, GPS, UTR",
  "Trasa z gwarancją toalet bez barier po drodze i ostrzeżeniami o utrudnieniach.",
  "Planer z filtrem dostępności.",
  "Inkluzywny.",
  "Mało danych o dostępności (brak danych o windach i peronach).",
  7, 5, 8, 8, 6, 8, 6)

P("Rower czy autobus? – porównywarka na żywo", "W3", "Porównywarka",
  "GPS, ODJ; + GBFS Veturilo",
  "Porównanie czasu przejazdu rowerem miejskim i komunikacją teraz.",
  "Wyścig na mapie.",
  "Zrozumiałe.",
  "Veturilo spoza portalu. Niska nowość.",
  6, 5, 5, 8, 6, 7, 5)

P("Tablica sąsiedzka – e-ink z odjazdami i wydarzeniami do klatki schodowej", "W3", "Hardware + dane",
  "ODJ, GPS, WYD, AQ, UTR, KONS",
  "Tani wyświetlacz e-ink (ESP32 lub Raspberry Pi) do klatek schodowych i domów kultury: najbliższe odjazdy, jakość powietrza, wydarzenia i konsultacje na osiedlu. Dla wspólnot i spółdzielni.",
  "Fizyczne urządzenie na scenie z danymi na żywo.",
  "Fizyczny artefakt zapada w pamięć.",
  "Potrzebny sprzęt, który trzeba mieć ze sobą (sam sprzęt to nie kod, więc wolno).",
  6, 6, 6, 7, 8, 7, 6)

P("Agent uwag do konsultacji – pomoc w napisaniu rzeczowej opinii", "W3 (alt. W1)", "AI LLM",
  "KONS, AQ, PRZYST, RCN, AED, WC",
  "Mieszkaniec mówi, co mu się nie podoba. AI pomaga sformułować konkretną, rzeczową uwagę z danymi („przystanek ma tylko 2 linie, a w promieniu 500 m...”) i wskazuje termin i formę złożenia.",
  "Przekształcenie emocjonalnej wypowiedzi w merytoryczną uwagę.",
  "Podnosi jakość partycypacji, co wprost pomaga urzędowi.",
  "Ryzyko „AI-spamu” w konsultacjach. Trzeba pokazać zabezpieczenia.",
  7, 7, 7, 9, 7, 8, 8)

P("Upał na przystanku – gdzie pasażerowie czekają najdłużej w słońcu", "W3 (alt. W1)", "Analityka klimatyczna",
  "PRZYST, LINIE, ODJ (częstotliwość = czas czekania), POG (temp. nawierzchni), AQ; + LoD2/OSM (zacienienie)",
  "Metryka „ekspozycja cieplna oczekiwania” = średni czas czekania (z częstotliwości odjazdów) × temperatura nawierzchni × brak cienia. Ranking przystanków, na których wiata, drzewo albo kurtyna wodna dadzą najwięcej, wraz z gotowym uzasadnieniem do BO lub ZTM.",
  "Top 10 „najgorętszych” przystanków ze zdjęciami i AI-wizualizacją po adaptacji.",
  "Nieoczywiste połączenie danych transportowych i pogodowych, konkretny i tani wynik.",
  "Zacienienie trzeba oszacować z danych zewnętrznych. Mała rozdzielczość stacji ZOM.",
  8, 7, 8, 9, 7, 8, 7)

assert len(POMYSLY) == 100, len(POMYSLY)
