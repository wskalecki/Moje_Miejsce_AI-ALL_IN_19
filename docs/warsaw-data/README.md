# Warsaw Open Data — pobieranie i testy API

Skrypty wymagają Pythona 3.10+ i wyłącznie biblioteki standardowej.
Uruchamiaj polecenia z katalogu głównego repozytorium.

## Klucz

Skrypty czytają najpierw lokalną zmienną `UM_WARSZAWA_API_KEY`, następnie
plik `--key-file` (domyślnie `apiKey.txt`). Nie umieszczaj wartości klucza
w kodzie, argumentach polecenia ani repozytorium. Przekazuj tylko ścieżkę.
Nie używaj zmiennych `VITE_*` dla miejskiego klucza API.

```sh
python3 scripts/pobierz_toalety.py --key-file /sciezka/do/apiKey.txt
python3 scripts/testuj_zbiory.py --key-file /sciezka/do/apiKey.txt
```

Jeśli Python na macOS nie znajduje zaufanych certyfikatów, dodaj
`--ca-file /etc/ssl/cert.pem`. Weryfikacja TLS pozostaje włączona.
Na innych systemach użyj właściwego lokalnego pakietu CA lub ustawień domyślnych.

## Toalety

Źródło: https://dane.um.warszawa.pl/pl/catalogue/59485767-5566-4cb6-9545-a9053efca4ff

- `POST https://dane.um.warszawa.pl/api/action/get_m_toalety`
- Nagłówek `Authorization`: klucz bez prefiksu Bearer.
- Przykład wywołania: https://dane.um.warszawa.pl/files/m_toalety_pw.json
- Parametry: https://dane.um.warszawa.pl/files/m_toalety_pa.json
- Brak udokumentowanej paginacji/limitu; próbka jest wycinana lokalnie.

Skrypt zapisuje 5 rekordów do `data/toalety_test.geojson`, weryfikuje zapis,
a następnie zapisuje pełną otrzymaną odpowiedź do `data/toalety.geojson`.
Oba pliki mają format FeatureCollection. Istniejący plik jest sprawdzany:
identyczny pozostaje bez zmian, różny zatrzymuje pracę bez nadpisania.

## Wszystkie zbiory

Tester pobiera bieżący katalog `/api/datasets` ze stronicowaniem, dokumentację
zbiorów i wykonuje pierwszy przykład odczytu na każdy zbiór. Nie wykonuje
poleceń shell z dokumentacji. Klucz wysyła wyłącznie przez HTTPS do
`dane.um.warszawa.pl/api/action/get_*`; przekierowania są wyłączone.

Odpowiedzi mają różne formaty: listy, FeatureCollection, pojedyncze Feature,
sekwencje Feature, obiekty z carParks i grupy pojazdów/słowników. Tester zapisuje
maksymalnie 5 rekordów na zbiór oraz raport w nowym katalogu `data/testy-*`.
Liczby w raporcie dotyczą otrzymanych odpowiedzi przy danych filtrach, a nie
całego zasobu miejskiego. Grupy pojazdów używają w próbce pól collection/value.
Limit odpowiedzi to 40 MiB; timeout pojedynczego żądania wynosi 30 sekund.
Raport podaje błędy poszczególnych zbiorów; kod wyjścia 0 oznacza ukończenie
raportu, nie sukces wszystkich endpointów. Należy sprawdzić pole summary.

## Wynik testu 17.10.2026

- 23 zbiory sprawdzone, 22 poprawne odpowiedzi i zweryfikowane pliki próbek.
- Rejestr Cen Nieruchomości: HTTP 500 dla przykładu dokumentacji i ponownie
  dla dzielnicy `bemowo` zamiast `Bemowo`.
- Toalety: 695 rekordów; próbka 5 rekordów.
- BO: 408 rekordów dla roku 2020 i statusu zrealizowane — to nie wszystkie edycje.

Szczegóły i nazwy pól: [raport.md](raport.md), [raport.json](raport.json).
Ścieżki próbek w raporcie wskazują lokalne pliki z tamtego uruchomienia;
same rekordy nie są publikowane w repozytorium. Test potwierdza odczyt i format,
nie kompletność ani aktualność merytoryczną wszystkich danych.

Przed publikacją danych sprawdź licencję konkretnego zbioru i wybierz potrzebne
pola. Dane BO zawierają m.in. pola autorów; nie są potrzebne do demonstracji mapy.
