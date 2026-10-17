# -*- coding: utf-8 -*-
"""
Generuje dwa pliki z bazy pomysly_dane.py:
  POMYSLY.md        – pomysły dla naszego wyzwania W3 „Warszawa: Twój ruch!”
                      (główna kategoria W3 + pomysły z W1/W2 oznaczone jako pasujące do W3)
  POMYSLY_W1_W2.md  – pozostałe pomysły (tylko W1 / W2), odłożone na bok
Uruchom: python3 generuj.py
"""
import re
import sys

sys.dont_write_bytecode = True
from pomysly_dane import POMYSLY  # noqa: E402

WAGI = dict(D=0.20, I=0.25, W=0.20, R=0.15, P=0.20)


def ocena_jury(x):
    return sum(WAGI[k] * x[k] for k in WAGI)


def wynik(x):
    mnoznik = 0.55 + 0.045 * x["F"]          # F=10 -> 1.00, F=5 -> 0.775, F=4 -> 0.73
    bonus = (x["J"] - 5) * 0.6               # J=10 -> +3.0, J=5 -> 0, J=4 -> -0.6
    return round(ocena_jury(x) * mnoznik * 10 + bonus, 1)


def gwiazdki(s):
    if s >= 75: return "★★★★★"
    if s >= 70: return "★★★★☆"
    if s >= 65: return "★★★☆☆"
    if s >= 58: return "★★☆☆☆"
    return "★☆☆☆☆"


def pasuje_do_w3(x):
    return x["wyz"].startswith("W3") or "alt. W3" in x["wyz"]


for x in POMYSLY:
    x["jury"] = round(ocena_jury(x), 2)
    x["wynik"] = wynik(x)


def ranking(pomysly):
    r = sorted(pomysly, key=lambda x: (-x["wynik"], -x["jury"]))
    for i, x in enumerate(r, 1):
        x["rank"] = i
    return r


def kotwica(x):
    return f"p{x['rank']:03d}"


def etykieta_w3(x):
    return "W3" if x["wyz"].startswith("W3") else f"{x['wyz'].split()[0]} → pasuje do W3"


def rozwiaz_odwolania(tekst, rank):
    """Zamienia {R:początek nazwy} na #pozycję w danym rankingu."""
    def _ref(m):
        trafienia = [x for x in rank if x["nazwa"].startswith(m.group(1))]
        assert len(trafienia) == 1, m.group(1)
        return f"#{trafienia[0]['rank']}"
    return re.sub(r"\{R:([^}]+)\}", _ref, tekst)


def karty(w, rank, etykieta):
    for x in rank:
        w(f'<a id="{kotwica(x)}"></a>')
        w(f"### #{x['rank']}. {x['nazwa']}")
        w(f"**Kategoria:** {etykieta(x)} · **Typ:** {x['tagi']} · **Wynik: {x['wynik']}** {gwiazdki(x['wynik'])} (ocena jury {x['jury']:.2f}/10)\n")
        w(f"- **Opis:** {x['opis']}")
        w(f"- **Dane:** {x['dane']}")
        w(f"- **Moment „wow” w demo:** {x['demo']}")
        w(f"- **Oceny:** Dane {x['D']} · Innowacyjność {x['I']} · Wdrożenie {x['W']} · Warszawa/wyzwanie {x['R']} · Prezentacja {x['P']} · Wykonalność {x['F']} · Dopasowanie do jury {x['J']}")
        w(f"- **Uzasadnienie:** {x['uzas']}")
        w(f"- **Ryzyka:** {x['ryzyko']}\n")


def tabela_rankingu(w, rank, etykieta):
    w("| # | Pomysł | Kategoria | D | I | W | R | P | F | J | Ocena jury | **Wynik** | |")
    w("|---|---|---|---|---|---|---|---|---|---|---|---|---|")
    for x in rank:
        w(f"| {x['rank']} | [{x['nazwa']}](#{kotwica(x)}) | {etykieta(x)} | {x['D']} | {x['I']} | {x['W']} | {x['R']} | {x['P']} | {x['F']} | {x['J']} | {x['jury']:.2f} | **{x['wynik']}** | {gwiazdki(x['wynik'])} |")
    w("")


METODOLOGIA = """Każdy pomysł oceniłem w 7 kategoriach w skali 1–10. Pięć pierwszych **odwzorowuje oficjalne kryteria jury z dokładnie tymi samymi wagami** (regulamin §5A ust. 12), a dwie ostatnie modelują szansę dowiezienia projektu i dopasowanie do składu jury.

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
"""

ZRODLA = """- Regulamin Warsaw Open Data Hackathon 2026 (PDF): https://42warsaw.pl/wp-content/uploads/2026/09/Regulamin-Warsaw-Open-Data-Hackathon_2026.pdf
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
"""

DANE = [
    ("GPS", "Lokalizacja pojazdów komunikacji miejskiej", "10 s", "Lat/Lon, linia, numer pojazdu, typ (1 autobus, 2 tramwaj). **Tylko stan bieżący, więc historię trzeba zbierać samemu w trakcie hackathonu.**"),
    ("TABOR", "Pojazdy transportu publicznego", "codziennie", "**Rok produkcji, trakcja**, marka, operator, zajezdnia, malowanie, kolor tapicerki (sic!). Rzadko używany zbiór i kopalnia nieoczywistych pomysłów."),
    ("PRZYST", "Lokalizacja przystanków", "codziennie", "Słupki przystankowe z lokalizacją."),
    ("LINIE", "Linie dostępne na przystanku", "codziennie", "Powiązanie przystanek → linie."),
    ("ODJ", "Odjazdy linii z przystanku", "codziennie", "Rozkład dla (przystanek, słupek, linia), czyli wiele zapytań."),
    ("PARK", "Wolne miejsca parkingowe", "1 min", "Parkingi ZTP, ZDM, PKiN (w tym P+R)."),
    ("UTR", "Utrudnienia w ruchu drogowym", "1 min", "Z infoulice: daty, treść, geometria."),
    ("AQ", "Monitoring jakości powietrza", "10 min", "Indeks PIJP, rekomendacje, stacje w Warszawie i gminach ościennych."),
    ("POG", "Pogoda (stacje ZOM)", "10 min", "Temp. powietrza, **temperatura nawierzchni**, wilgotność, wiatr, **intensywność opadu**."),
    ("RCN", "Rejestr Cen Nieruchomości", "codziennie", "Transakcje z aktów notarialnych: cena, data, rodzaj, lokalizacja, parametry. Filtr: dzielnica, rodzaj nieruchomości i rynku, rok. Sprawdź warunki wykorzystania (mapa.um.warszawa.pl/warunki.html)."),
    ("AED", "Lokalizacja defibrylatorów", "codziennie", "Aktywne AED: współrzędne, **dostępność 24/7**, publiczny dostęp, opis lokalizacji. **Zbiór promowany w ogłoszeniach, więc dużo zespołów po niego sięgnie.**"),
    ("WC", "Toalety", "tydzień", "Zarządca, typ, **dostępność bez barier, płatność, przewijak, godziny**."),
    ("EKO", "Eko punkty", "tydzień", "Punkty zbiórki leków i elektrośmieci: współrzędne, godziny dla każdego dnia."),
    ("SEG", "Segregacja odpadów + Typy odpadów", "codziennie", "Dane z SegregujNa5 (2 zbiory)."),
    ("SPORT", "Zajęcia sportowe", "2 h", "Kategoria, adresaci (np. seniorzy), dzielnica, data, godzina, obiekt."),
    ("BOISKA", "Otwarte boiska", "tydzień", "Szkolne obiekty sportowe z **godzinami dostępności dla każdego dnia**, typ, nawierzchnia. Pośrednio lista szkół."),
    ("TRASY", "Trasy turystyczne", "brak", "Nazwa, długość, opis, ślad GPS, punkty turystyczne."),
    ("WYD", "Kalendarz wydarzeń", "2 h", "Tytuły, opisy, terminy, adresy, lokalizacja."),
    ("KONS", "Konsultacje społeczne (+ słowniki kategorii i dzielnic)", "2 h", "Tytuł, opis, daty, kategoria, dzielnica, **lat/lon**, zdjęcia, grupa odbiorców, tagi (3 zbiory)."),
    ("BO", "Budżet obywatelski", "tydzień", "**Tylko projekty zrealizowane i w realizacji.** Pola: tytuł, opis, uzasadnienie, **współrzędne (`pins`)**, **koszt i kosztorys (`costSummary`)**, status, historia, kategorie, odbiorcy, głosy, weryfikacja, projektowanie uniwersalne. Zawiera też **imiona i nazwiska autorów, których nie wolno pokazywać (RODO)**. Najbogatszy semantycznie zbiór, idealny dla AI."),
]


# ===========================================================================
# PLIK 1: POMYSLY.md – tylko W3
# ===========================================================================
W3 = ranking([x for x in POMYSLY if pasuje_do_w3(x)])
n_glowne = sum(x["wyz"].startswith("W3") for x in W3)
n_alt = len(W3) - n_glowne

out = []
w = out.append

w("# Warsaw Open Data Hackathon 2026: pomysły dla W3 „Warszawa: Twój ruch!”\n")
w(f"> Nasz zespół startuje w **wyzwaniu 3 „Warszawa: Twój ruch!”** (kategoria otwarta: dowolny problem i forma, min. 1 zbiór otwartych danych m.st. Warszawy). Ten plik zawiera **{len(W3)} pomysłów**: {n_glowne} z główną kategorią W3 i {n_alt} pomysłów z W1/W2, które pasują też do W3 (oznaczone „→ pasuje do W3”). Pozostałe pomysły są w [`POMYSLY_W1_W2.md`](POMYSLY_W1_W2.md).  ")
w("> Hackathon: sob. 17.10 – niedz. 18.10.2026, kampus 42 Warsaw, al. Solidarności 171B.  ")
w("> Pliki źródłowe: `pomysly_dane.py` (baza pomysłów i ocen) oraz `generuj.py` (formuła i generator). Zmień oceny lub wagi i uruchom `python3 generuj.py`, a oba pliki przeliczą się same.\n")

w("## Spis treści\n")
w("1. [TL;DR – co robić](#tldr)")
w("2. [Co wiemy o hackathonie (fakty z regulaminu)](#fakty)")
w("3. [Dostępne dane miejskie (23 zbiory)](#dane)")
w("4. [Wnioski strategiczne dla W3](#strategia)")
w("5. [Metodologia oceny](#metodologia)")
w(f"6. [Ranking {len(W3)} pomysłów dla W3](#ranking)")
w("7. [Koncepcja finałowa: Widzialny Budżet](#final)")
w("8. [Alternatywy, gdyby Widzialny Budżet nie wypalił](#alternatywy)")
w("9. [Checklista na start](#checklista)")
w(f"10. [Karty {len(W3)} pomysłów](#karty)")
w("11. [Źródła](#zrodla)\n")

# ---------------------------------------------------------------------------
w('<a id="tldr"></a>\n## 1. TL;DR – co robić\n')
w("**Rekomendacja: robimy „Widzialny Budżet”**, czyli połączenie {R:BO w obrazach} *BO w obrazach* + {R:Asystent wniosku BO} *Asystent wniosku BO* + mapa luk z {R:15-minutowa} *15-minutowa Warszawa*. Szczegóły w [sekcji 7](#final).\n")
w("**W jednym zdaniu:** mieszkaniec widzi, jak będzie wyglądał projekt z budżetu obywatelskiego, ile kosztował i czy podobne projekty naprawdę powstały, a do tego dostaje gotowy szkic własnego wniosku tam, gdzie w jego okolicy czegoś brakuje.\n")
w("**Top 10 dla W3:**\n")
w("| # | Pomysł | Kategoria | Wynik |")
w("|---|---|---|---|")
for x in W3[:10]:
    w(f"| {x['rank']} | [{x['nazwa']}](#{kotwica(x)}) | {etykieta_w3(x)} | **{x['wynik']}** {gwiazdki(x['wynik'])} |")
w("")
w("**Dlaczego Widzialny Budżet?** W tym konkursie 55% oceny (dane 20% + wdrożenie 20% + związek z Warszawą 15%) nagradza projekty osadzone w procesach miasta, a 45% (innowacyjność 25% + prezentacja 20%) nagradza efekt wow. Widzialny Budżet łączy jedno i drugie: **AI generuje coś widowiskowego (wizualizację, wniosek), ale tylko z prawdziwych danych miasta**. Ma też oczywiste miejsce wdrożenia: proces budżetu obywatelskiego. Czyste projekty 3D/AI mają najwyższe noty za wow, ale tracą na wykonalności w 24 h i na wdrożeniu, dlatego 3D i generowanie obrazów służą tu jako **warstwa prezentacji**, a nie jako sam pomysł.\n")

# ---------------------------------------------------------------------------
w('<a id="fakty"></a>\n## 2. Co wiemy o hackathonie (fakty z regulaminu i stron organizatora)\n')
w("| Element | Szczegóły |")
w("|---|---|")
w("| Termin i miejsce | 17–18.10.2026, kampus 42 Warsaw, al. Solidarności 171B (Wola). Rejestracja od 9:00, otwarcie 10:00, **start prac 11:00 (sob.)**, **koniec prac 11:00 (niedz.)**, prezentacje 11:30–13:30, obrady 13:30–14:30, wyniki 14:30. |")
w("| Organizator i finansowanie | Fundacja „Wolność Wyboru” (operator 42 Warsaw). Finansowanie: m.st. Warszawa. Partner: Play. |")
w("| Uczestnicy | Maks. 120 osób, zespoły 3–5 osób. To ok. 25–35 zespołów, czyli **ok. 8–12 zespołów w W3**. |")
w("| **Nasze wyzwanie: W3 „Warszawa: Twój ruch!”** | Dowolny problem i forma (aplikacja, gra, wizualizacja, model predykcyjny, bot), z użyciem min. 1 zbioru otwartych danych m.st. Warszawy. |")
w("| Warunek konieczny | Rozwiązanie **musi używać min. 1 zbioru z dane.um.warszawa.pl lub miejskiego API**. Inaczej nie podlega ocenie (§4 ust. 9). Dodatkowe dane zewnętrzne (OSM, GUGiK LoD2, Mapillary) są dozwolone jako uzupełnienie. |")
w("| **Kod przed hackathonem** | **Zakazany.** „Całość Rozwiązania musi zostać wytworzona w trakcie trwania Wydarzenia… Niedozwolone jest wykorzystywanie fragmentów kodu ani innych elementów przygotowanych przed Wydarzeniem” (§4 ust. 3). Wolno używać darmowych bibliotek open source z licencją dopuszczającą użycie komercyjne. |")
w("| **AI** | **Dozwolone** (kod, treści, grafiki), ale trzeba **opisać zakres użycia AI w dokumentacji** (§4 ust. 4). |")
w("| Co oddać (do końca Etapu II, czyli niedz. 11:00!) | a) prezentacja/pitch deck, b) link do repozytorium, c) dokumentacja: użyte dane miejskie, założenia, frameworki i narzędzia (§4 ust. 5–6). **Po 11:00 nie wolno nic zmieniać** (§5A ust. 6). |")
w("| Pitch | **Do 5 minut + do 2 minut odpowiedzi na pytania jury** (§5A ust. 7). Po polsku lub angielsku. Projektor jest zapewniony. |")
w("| Kryteria i wagi (§5A ust. 12) | **Wykorzystanie i związek z otwartymi danymi m.st. Warszawy 20%. Innowacyjność i pomysłowość 25%. Praktyczne zastosowanie i potencjał wdrożeniowy 20%. Związek z wyzwaniami i realiami Warszawy 15%. Jakość prezentacji 20%.** Każdy juror ocenia 1–5 w każdym kryterium. |")
w("| Nagrody w W3 | I miejsce 4 000 zł, II miejsce 1 000 zł, III miejsce nagroda rzeczowa (brutto). Możliwe wyróżnienia i promocja przez miasto. |")
w("| IP | Kod zostaje nasz. Laureaci udzielają miastu i organizatorowi niewyłącznej licencji (§7). |")
w("")
w("**Jury i czego prawdopodobnie szuka każdy juror:**\n")
w("| Juror | Rola | Na co będzie wrażliwy |")
w("|---|---|---|")
w("| dr Paulina Nowicka-Karpińska | Pełnomocniczka Prezydenta ds. strategii rozwoju miasta, Biuro Strategii i Analiz | Spójność ze strategią #Warszawa2030, partycypacja, decyzje oparte na danych |")
w("| Monika Rogowska | Naczelniczka Wydziału Zarządzania Danymi, Biuro Informatyki UM | **Głębokie i poprawne użycie ich zbiorów**, łączenie zbiorów, promocja portalu, feedback o jakości danych |")
w("| Karol Wilczyński | Wydział Innowacyjnych Polityk Publicznych, Ministerstwo Cyfryzacji | Innowacje w polityce publicznej, GovTech, AI w administracji, skalowalność na inne miasta |")
w("| Sonia Staniek | COO Bielik.AI | **Użycie polskiego LLM Bielik**, suwerenność AI, sensowne (nie dekoracyjne) AI |")
w("| Michał Ziółkowski | CTO i członek zarządu Play | Wykonalność techniczna, mobile, kanały telekomunikacyjne (SMS/RCS/głos), skala |")
w("| Artur Kurasiński | Przedsiębiorca, inwestor | Problem → produkt → model biznesowy/utrzymania, storytelling, alergia na „AI dla AI” |")
w("| Aleksandra Czetwertyńska, Magda Gołębiewska | 42 Warsaw | Kreatywność, praca zespołowa, edukacja, jakość wykonania |")
w("")
w("**Lekcja z poprzedniego miejskiego hackathonu (Warsaw Hacks, 2021):** wygrały *SeGregiusz* (ML rozpoznaje odpad na zdjęciu, czyli rozszerzenie istniejącej aplikacji miasta SegregujNa5) i *SIUP* (weryfikacja tożsamości urzędników, realna obawa mieszkańców). Dyrektor cyfryzacji: *„Nie chodziło nam o pomysły na kolejne apki”*. Jury miejskie nagradza **realny problem + wpięcie w istniejący proces lub usługę miasta**, a nie kolejną aplikację z mapą.\n")

# ---------------------------------------------------------------------------
w('<a id="dane"></a>\n## 3. Dostępne dane miejskie (23 zbiory na dane.um.warszawa.pl)\n')
w("Wszystkie zbiory są dostępne przez API `POST https://dane.um.warszawa.pl/api/action/get_<zbiór>` z nagłówkiem `Authorization: <token>` (token z zakładki „Klucz API”). Dokumentacja każdego zbioru: `https://dane.um.warszawa.pl/files/<prefix>_pa.json` (parametry) i `_pw.json` (przykład wywołania).\n")
w("| Kod | Zbiór | Odświeżanie | Najciekawsze pola / uwagi |")
w("|---|---|---|---|")
for k, n, o, u in DANE:
    w(f"| {k} | {n} | {o} | {u} |")
w("")
w("**Dane uzupełniające (dozwolone jako dodatek, nie zamiast zbioru miejskiego):** modele 3D budynków LoD1/LoD2 (GUGiK, CityGML, bezpłatne), budynki 3D z OpenStreetMap (najprostsze do `fill-extrusion` w MapLibre), ortofotomapy m.st. Warszawy 1945–2025 (WMS w serwisie mapowym miasta), zdjęcia uliczne Mapillary (CC-BY-SA, darmowe API), GTFS ZTM (nieoficjalne mirrory), GBFS Veturilo, czujniki hałasu z platformy iot.warszawa.pl (sezonowo tylko bulwary).\n")
w("**Pułapki danych:** (1) większość zbiorów transportowych i środowiskowych to **stan bieżący bez historii**, więc modele predykcyjne trzeba trenować na danych zebranych w trakcie 24 h albo ograniczyć się do zbiorów historycznych (BO, RCN, konsultacje); (2) w ogłoszeniach wymieniano hałas, ale **na portalu nie ma zbioru hałasu**; (3) każde wywołanie wymaga tokenu, a limitów zapytań nie znamy, więc **cache'ujcie odpowiedzi lokalnie od pierwszej godziny**.\n")

# ---------------------------------------------------------------------------
w('<a id="strategia"></a>\n## 4. Wnioski strategiczne dla W3\n')
w("1. **Rywalizujemy tylko w W3 (~8–12 zespołów).** Kategoria jest otwarta, więc spodziewajmy się najszerszego przekroju pomysłów. Wyróżnienie się na tle typowych projektów jest ważniejsze niż „najlepszy pomysł w ogóle”.")
w("2. **Przewiduj tłok.** Najbardziej oczywiste pomysły, które zrobi kilka zespołów: mapa opóźnień ZTM, „czatbot o Warszawie”, mapa smogu, wyszukiwarka AED, rekomendator mieszkań lub dzielnic. Jeśli robicie coś z tej listy, potrzebny jest mocny twist (optymalizacja zamiast wyszukiwarki, kanał głosowy zamiast czatu, rzadki zbiór typu TABOR lub temp. nawierzchni).")
w("3. **Rzadko używane, bogate zbiory to łatwe punkty za „wykorzystanie danych”:** BO (opisy, koszty, kosztorysy, głosy), konsultacje (lat/lon i opisy), TABOR (rok i trakcja), POG (temp. nawierzchni), WC (przewijak, dostępność, godziny), BOISKA (godziny dla każdego dnia).")
w("4. **AI ma być „silnikiem”, nie „lakierem”.** W jury jest COO Bielik.AI i inwestor wyczulony na hype. AI powinna przekształcać dane miejskie w coś, czego wcześniej nie było (wizualizację projektu, wniosek, ocenę), a jej wyniki muszą być **ugruntowane w danych** (pokazujcie „paragon danych” lub źródła). Użycie **Bielika** w krytycznej ścieżce to tani bonus u jednej jurorki i w MC (suwerenne AI).")
w("5. **Wdrożenie = wskaż konkretną komórkę urzędu i istniejący kanał.** „Rozszerzenie procesu BO”, „moduł do konsultacje.um.warszawa.pl”, „narzędzie dla ZOM lub ZTM” brzmi wiarygodnie. „Nowa aplikacja, którą pobiorą mieszkańcy” brzmi słabo.")
w("6. **Prezentacja to 20% i 5 minut.** Live demo przygotowane na 3–5 zapisanych w cache scenariuszach, jedno „wow” (obraz, głos, telefon jurora), slajd z listą użytych zbiorów i slajd „kto, kiedy, za ile wdraża”. Mówcie wprost językiem kryteriów, bo juror wypełnia tabelkę.")
w("7. **3D i generatywne AI** dają największy efekt na scenie, ale kosztują najwięcej czasu. Najlepsza strategia to **lekkie 3D** (budynki OSM `fill-extrusion` w MapLibre/deck.gl: 1–2 h zamiast dnia z CityGML) i **image-to-image na zdjęciach Mapillary** (zamiast text-to-3D i AR).\n")

# ---------------------------------------------------------------------------
w('<a id="metodologia"></a>\n## 5. Metodologia oceny\n')
w(METODOLOGIA)

# ---------------------------------------------------------------------------
w(f'<a id="ranking"></a>\n## 6. Ranking {len(W3)} pomysłów dla W3\n')
w("Pozycje liczone są tylko w obrębie W3. „→ pasuje do W3” oznacza pomysł pierwotnie przypisany do W1/W2, który można zgłosić w W3 po zmianie narracji (W3 jest kategorią otwartą).\n")
tabela_rankingu(w, W3, etykieta_w3)

# ---------------------------------------------------------------------------
w('<a id="final"></a>\n## 7. Koncepcja finałowa: „Widzialny Budżet”\n')
w("""**Połączenie:** {R:BO w obrazach} *BO w obrazach* + {R:Asystent wniosku BO} *Asystent wniosku BO* + mapa luk z {R:15-minutowa} *15-minutowa Warszawa*.

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
""")

# ---------------------------------------------------------------------------
w('<a id="alternatywy"></a>\n## 8. Alternatywy, gdyby Widzialny Budżet nie wypalił\n')
w("""Kolejne mocne opcje w W3, uporządkowane według rankingu:

- **{R:Gdzie postawić?} Gdzie postawić? – optymalizator lokalizacji infrastruktury.** Najmocniejsze wykorzystanie danych i jasna decyzja dla urzędu. Trzeba odróżnić się od zespołów robiących zwykłą mapę AED.
- **{R:Rzecznik Przyszłych} Rzecznik Przyszłych Pokoleń** (pierwotnie W1). W W3 opowiadamy go jako „AI ocena wpływu konsultacji”, bez nacisku na 2076. Dopasowany do trzech jurorów: strategia, MC, Bielik.
- **{R:Konsultacje, które widać} Konsultacje, które widać.** Ten sam silnik co Widzialny Budżet, tylko zamiast BO są konsultacje. Dobry „plan B” bez zmiany architektury.
- **{R:Sprawiedliwość taborowa} Sprawiedliwość taborowa / Złap elektryka.** Rzadki zbiór TABOR, nieoczywiste pytanie badawcze, łatwe do zrobienia.
- **{R:Zadzwoń do Warszawy} Zadzwoń do Warszawy** (pierwotnie W2). Najmocniejsze demo na żywo (juror dzwoni) i dopasowanie do CTO Play i Bielik.AI.

**Jeśli koniecznie chcemy 3D/AI jako rdzeń:** najlepsze opcje „3D-first” w W3 to **{R:Elektryfikacja 2076} Elektryfikacja** (mapa linii, wysoka ocena dzięki danym), **{R:Okno 2076} Okno 2076**, **{R:Cyfrowy bliźniak} Cyfrowy bliźniak transportu w 3D**, **{R:Dachy 2076} Dachy 2076**, **{R:AR: zobacz} AR: projekt na ulicy**. Przy Oknie 2076 warto dodać kartę danych i link do konsultacji/BO: podniesienie oceny wdrożenia z 7 do 9 daje wynik ok. 74 pkt zamiast 70.7. Unikajcie CityGML LoD2 dla całego miasta (budynki OSM wystarczą na demo) oraz WebXR/AR na żywo na scenie.
""")

# ---------------------------------------------------------------------------
w('<a id="checklista"></a>\n## 9. Checklista na start (zgodnie z §4 ust. 3: kod piszemy dopiero od 11:00 w sobotę)\n')
w("""- [ ] Każda osoba ma **klucz API** z dane.um.warszawa.pl (zakładka „Klucz API”) i sprawdziła ręcznie (curl/Postman) zbiór BO.
- [ ] Przeczytana dokumentacja `_pa.json`/`_pw.json` zbiorów: BO, AED, WC, EKO, BOISKA, SPORT, PRZYST, KONS.
- [ ] Konta i klucze: Mapillary (token), dostawca modelu obrazowego, hosting (Vercel/Render/Fly). **Rozwiązanie budujemy w osobnym folderze lub repo, z commitami od 11:00 w sobotę.**
- [ ] **Bielik:** wagi (np. `Bielik-11B-v3` GGUF przez Ollama/llama.cpp, licencja Apache 2.0) pobrane i przetestowane pod kątem szybkości. Wagi modelu open source to dozwolona zależność, a nie nasz kod.
- [ ] Ustalony stack, który wszyscy znają (np. Python FastAPI + Vite/React + MapLibre/deck.gl), i podział ról z sekcji 7.7.
- [ ] Sprzęt: laptopy, ładowarki, przedłużacz, słuchawki, adapter HDMI/USB-C, hotspot jako zapas łącza, **dowód osobisty** (weryfikacja przy wejściu).
- [ ] Zasady regulaminu: **ujawnienie użycia AI w dokumentacji**, **oddanie wszystkiego do niedz. 11:00**, **5 min + 2 min Q&A**.
""")

# ---------------------------------------------------------------------------
w(f'<a id="karty"></a>\n## 10. Karty {len(W3)} pomysłów (w kolejności rankingu W3)\n')
w("Legenda kodów danych: patrz [sekcja 3](#dane).\n")
karty(w, W3, etykieta_w3)

w('<a id="zrodla"></a>\n## 11. Źródła\n')
w(ZRODLA)

with open("POMYSLY.md", "w", encoding="utf-8") as f:
    f.write(rozwiaz_odwolania("\n".join(out), W3))


# ===========================================================================
# PLIK 2: POMYSLY_W1_W2.md – pomysły odłożone (tylko W1 / W2)
# ===========================================================================
INNE = ranking([x for x in POMYSLY if not pasuje_do_w3(x)])

out = []
w = out.append
w("# Warsaw Open Data Hackathon 2026: pomysły odłożone (tylko W1 i W2)\n")
w(f"> Nasz zespół startuje w W3, więc te **{len(INNE)} pomysłów** nie jest dla nas priorytetem. Pasują wyłącznie do „Warszawa 2076” (W1) lub „Warszawa – złap oddech!” (W2). Pomysły dla W3 są w [`POMYSLY.md`](POMYSLY.md), razem z metodologią oceny, faktami o hackathonie i opisem danych.  ")
w("> Pozycje w tym pliku liczone są tylko w obrębie odłożonych pomysłów. Formuła oceny jest ta sama co w `POMYSLY.md`.\n")

w("## Ranking\n")
tabela_rankingu(w, INNE, lambda x: x["wyz"])

for kod, nazwa in [("W1", "Warszawa 2076"), ("W2", "Warszawa – złap oddech!")]:
    w(f"### Najlepsze w {kod}: {nazwa}\n")
    w("| # | Pomysł | Wynik |")
    w("|---|---|---|")
    for x in [x for x in INNE if x["wyz"].startswith(kod)][:5]:
        w(f"| {x['rank']} | [{x['nazwa']}](#{kotwica(x)}) | {x['wynik']} |")
    w("")

w("""## Szkic koncepcji dla W2 (na wypadek przyszłych edycji): „Radio Dzielnica”

Codzienny, 3-minutowy, personalizowany odcinek audio o okolicy: pogoda i powietrze, utrudnienia na trasie, 2–3 propozycje odpoczynku na wieczór (wydarzenia, zajęcia, wolne boisko szkolne), jedna lokalna sprawa (konsultacja, projekt BO). Bielik pisze scenariusz wyłącznie z faktów, TTS czyta naturalnym polskim głosem. Dystrybucja: podcast RSS, WhatsApp, kanał operatora. Ten sam silnik może obsługiwać numer telefonu dla seniorów (pomysł „Zadzwoń do Warszawy”, który pasuje też do W3, więc jest w `POMYSLY.md`).

*Koncepcja „Rada 2076” dla W1 opiera się na pomyśle „Rzecznik Przyszłych Pokoleń”, który pasuje też do W3, dlatego jest opisany w `POMYSLY.md` (sekcja 8).*
""")

w("## Karty pomysłów\n")
karty(w, INNE, lambda x: x["wyz"])

with open("POMYSLY_W1_W2.md", "w", encoding="utf-8") as f:
    f.write(rozwiaz_odwolania("\n".join(out), INNE))

print(f"OK: POMYSLY.md ({len(W3)} pomysłów W3), POMYSLY_W1_W2.md ({len(INNE)} pomysłów)")
print("Top 10 W3:")
for x in W3[:10]:
    print(f"  {x['rank']:>3}. {x['wynik']:>5}  {etykieta_w3(x):<20} {x['nazwa']}")
