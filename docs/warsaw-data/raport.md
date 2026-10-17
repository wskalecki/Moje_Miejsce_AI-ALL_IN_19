# Testy Warsaw Open Data

2026-10-17T12:12:31.026421+02:00

Pierwszy udokumentowany przykład na zbiór; maksymalnie 5 zapisanych rekordów. Liczba rekordów dotyczy odpowiedzi, nie pełnego zasobu.

Wynik: 22 poprawne odpowiedzi, 1 błąd HTTP 500. RCN zwrócił 500 również po zmianie Bemowo na bemowo.

| Zbiór | Status | HTTP | Rekordy w odpowiedzi | Próbka |
|---|---|---|---|---|
| Monitoring jakości powietrza | OK | 200 | 141 | 5 |
| Wolne miejsca parkingowe | OK | 200 | 19 | 5 |
| Utrudnienia w ruchu drogowym | OK | 200 | 62 | 5 |
| Zajęcia sportowe | OK | 200 | 592 | 5 |
| Lokalizacja pojazdów komunikacji miejskiej | OK | 200 | 1201 | 5 |
| Rejestr Cen Nieruchomości | HTTP_ERROR | 500 | — | — |
| Linie dostepne na przystanku | OK | 200 | 4 | 4 |
| Pojazdy transportu publicznego | OK | 200 | 3456 | 5 |
| Lokalizacja defibrylatorów (AED) | OK | 200 | 710 | 5 |
| Odjazdy linii z przystanku | OK | 200 | 71 | 5 |
| Pogoda | OK | 200 | 16 | 5 |
| Konsultacje społeczne | OK | 200 | 6 | 5 |
| Lokalizacja przystanków komunikacji miejskiej | OK | 200 | 6789 | 5 |
| Otwarte boiska | OK | 200 | 1227 | 5 |
| Segregacja odpadów | OK | 200 | 1079 | 5 |
| Typy odpadów | OK | 200 | 13 | 5 |
| Trasy turystyczne | OK | 200 | 9 | 5 |
| Eko punkty | OK | 200 | 775 | 5 |
| Toalety | OK | 200 | 695 | 5 |
| Konsultacje społeczne kategorie | OK | 200 | 10 | 5 |
| Konsultacje społeczne dzielnice | OK | 200 | 19 | 5 |
| Budżet obywatelski | OK | 200 | 408 | 5 |
| Kalendarz wydarzeń | OK | 200 | 652 | 5 |

Liczba pojazdów obejmuje łącznie rekordy pojazdów oraz słowników marek. Szczegółowe liczby grup podano w raporcie JSON. Próbki grupowane używają pól collection/value.

## Pola

### Monitoring jakości powietrza

address, data, data_source, ijp, lat, lon, name, owner, station, station_type

### Wolne miejsca parkingowe

acceptedPaymentMethod, additionalEquipment, additionalSecurity, adress, allowedVehicleType, dimensions, entrances, free_places_total, latitude, levels, longitude, manager, managerEmail, managerTelephone, maximumParkingTime, name, opening_hours, operatorTelephone, parkingCategory, tariffs, total_places

### Utrudnienia w ruchu drogowym

content, detour_type, end_date, geo, id, name, start_date, streets

### Zajęcia sportowe

address, availableLanguages, category, date, day, dedicated, image, language, localization, map, text, time, title, url

### Lokalizacja pojazdów komunikacji miejskiej

Brigade, Lat, Lines, Lon, Time, VehicleNumber

### Rejestr Cen Nieruchomości

Brak danych — błąd API.

### Linie dostepne na przystanku

values

### Pojazdy transportu publicznego

collection, value

busy: idMarki, kolorPojazdu, kolorPoreczy, kolorTapicerki, nazwaOperatora, nazwaSkroconaOperatora, nazwaZajezdni, numerRejestracyjny, numerTaborowy, rokProdukcji, schematMalowania, trakcja

kolej: evn, idMarki, kolorPojazdu, kolorPoreczy, kolorTapicerki, nazwaOperatora, nazwaSkroconaOperatora, nazwaZajezdni, numerTaborowy, rokProdukcji, schematMalowania, trakcja

markiBus: dlugosc, idMarki, katWielkosci, klimatyzacja, komGlosWewnatrz, komGlosZewnatrz, liczMiejscSiedzacychTab, liczMiejscSpec, liczMiejscStojacychTab, liczMiejscTab, liczMiejscWozekDziec, liczMiejscWozekInwalid, marka, operator, operatorSkrot, platnosc, podloga, posiadaSSB, powierzchniaPodlogi, producent, rodzajZasilania, szerokosc, typ, ukladSiedzen, wariant, wersja, wysokoscCalkowita, zasilanie

markiKolej: dlugosc, dlugoscPrzedzialu, efektywnaSzerWejscia, idMarki, katWielkosci, klimatyzacja, komGlosWewnatrz, komGlosZewnatrz, liczMiejscSiedzacychTab, liczMiejscSpec, liczMiejscStojacychTab, liczMiejscTab, liczMiejscWozekDziec, liczMiejscWozekInwalid, marka, operator, operatorSkrot, platnosc, posiadaSSB, powierzchniaPodlogi, producent, szerokosc, typ, ukladSiedzen, wariant, wersja, wysokoscCalkowita

markiMetro: dlugosc, dlugoscPrzedzialu, efektywnaSzerWejscia, idMarki, katWielkosci, klimatyzacja, komGlosWewnatrz, komGlosZewnatrz, liczMiejscSiedzacychTab, liczMiejscSpec, liczMiejscStojacychTab, liczMiejscTab, liczMiejscWozekDziec, liczMiejscWozekInwalid, marka, operator, operatorSkrot, platnosc, posiadaSSB, powierzchniaPodlogi, producent, szerokosc, typ, ukladSiedzen, wariant, wersja, wysokoscCalkowita

markiTramwaje: dlugosc, idMarki, katWielkosci, kierunkowosc, klimatyzacja, komGlosWewnatrz, komGlosZewnatrz, liczMiejscSiedzacychTab, liczMiejscSpec, liczMiejscStojacychTab, liczMiejscTab, liczMiejscWozekDziec, liczMiejscWozekInwalid, marka, operator, operatorSkrot, platnosc, podloga, posiadaSSB, powierzchniaPodlogi, producent, szerokosc, typ, ukladSiedzen, wariant, wersja, wysokoscCalkowita

metro: idMarki, kolorPojazdu, kolorPoreczy, kolorTapicerki, nazwaOperatora, nazwaSkroconaOperatora, nazwaZajezdni, numerTaborowy, rokProdukcji, schematMalowania, trakcja

tramwaje: idMarki, kolorPojazdu, kolorPoreczy, kolorTapicerki, nazwaOperatora, nazwaSkroconaOperatora, nazwaZajezdni, numerTaborowy, rokProdukcji, schematMalowania, trakcja

### Lokalizacja defibrylatorów (AED)

geometry, properties

### Odjazdy linii z przystanku

Brak danych — błąd API.

### Pogoda

czas, int_opadu, kier_wiatru, lat, lokalizacja, lon, pred_wiatru, temp_naw, temp_pow, wilg_pow

### Konsultacje społeczne

address, banner_image, category_id, description, district_id, end_date, hero_image, id, latitude, longitude, recipients, short_description, slug, start_date, subtitle, tags, title, url, zip_code

### Lokalizacja przystanków komunikacji miejskiej

values

### Otwarte boiska

Adres obiektu, Boisk uniwersalne zawiera, Czwartek, Data aktualizacji, Dzielnica, Nazwa placówki oświatowej, Niedziela, Obiekt wyposażony w piłkochwyty, Obiekt wyposażony w trybuny, Piątek, Poniedziałek, Rodzaj nawierzchni, Sobota, Typ obiektu, Uwagi, Wtorek, Środa

### Segregacja odpadów

additional_info, id, synonyms_list, title, type_name, url

### Typy odpadów

additional_info, co_sie_dzieje, czym_sa, id, nalezy, name, nie_nalezy, recykling, synonyms_list

### Trasy turystyczne

description, length, title, tourist_points, traces

### Eko punkty

dlugosc, dni_pracy, dzielnica, mail, nazwa, opis_lokalizacji, szerokosc, telefon, typ_punktu, ulica, ulica_lokal, ulica_numer

### Toalety

aktu_dan, dostepnosc, dzielnica, godziny, lokalizacja, platnosc, poch_dan, przewijak, typ, uwagi, zarzadca

### Konsultacje społeczne kategorie

id, name

### Konsultacje społeczne dzielnice

address, id, name

### Budżet obywatelski

argumentation, attachments, availabilityDescription, classifications, cocreators, comments, cost, costSummary, created, description, editionName, firstName, history, id, lastName, lat, lng, localName, localization, localizationExtra, mainRegionName, number, pins, recipients, shortDescription, status, submitted, taskLevel, title, universalDesign, universalDesignArgumentation, url, verification, votes

### Kalendarz wydarzeń

address, availableLanguages, category, image, language, lead, localization, map, occurrence, text, title, url
