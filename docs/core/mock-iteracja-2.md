# Mock — iteracja 2 (feedback zespołu, 17.10.2026 ~19:30)

Źródło: nagranie przeglądu wersji live (`transcription-zmiany.txt`, kopia w `docs/notes/2026-10-17-transkrypcja-zmiany.md`).
Wersja 1 (obszary MSI) jest zachowana pod tagiem git `mock-v1-msi`.

## Co zmieniamy

| # | Obszar | Feedback | Decyzja |
|---|--------|----------|---------|
| 1 | Nazwa | „Siatka” brzmi słabo | Nowa nazwa produktu (jedna stała `APP_NAME`) |
| 2 | Ankieta | Wygląda „slopowo”, limit max 4 niezrozumiały | Redesign kroku 2: bez twardego limitu, priorytety wynikają z profilu i można je doprecyzować; mniej generycznego wyglądu |
| 3 | Mapa — gradient | Fioletowa „mgła” nie mówi, czego dotyczy | Czytelna legenda i podpis („dopasowanie do Twojego profilu”), gradient liczony z wag filtrów |
| 4 | Mapa — filtry | Panel do zmiany wag kategorii (%) zamiast „Polecane dla Ciebie”; najechanie na filtr pokazuje mapę tylko tej kategorii i jej punkty | Panel filtrów z suwakami wag, hover = solo kategorii (heatmapa + POI); polecane osiedla zostają jako znaczniki na mapie |
| 5 | Mapa — obiekty | Na widoku dzielnicy szkoły, przystanki itd. jako punkty; budynki szkół/uczelni kolorowane w 3D | Warstwy POI od zoomu ~13; budynki użyteczności publicznej z OSM wyciągnięte i pokolorowane wg funkcji |
| 6 | Ziarnistość | Obszary MSI to prawie dzielnice; chcemy prawdziwe osiedla | Hierarchia: dzielnica → obszar MSI → osiedle; cienkie granice wszystkich, 3 klikalne |
| 7 | Dane | Wyniki ~99 wszędzie, mało zróżnicowane; oprzeć się na prawdziwych danych z gałęzi `mikolaj` | Przeliczyć wskaźniki z danych zespołu; w panelu konkretne liczby zamiast punktów |
| 8 | Drogi | Słabo widoczne | Drogi z OSM w kolorze asfaltu z delikatnym szarym krawężnikiem (wzorzec: `feat/grid-tile-lab`) |
| 9 | Korki | Pokazać na mapie kolorem dróg + suwak godziny | Warstwa natężenia ruchu na drogach z suwakiem godziny (mapa „żyje”) |
| 10 | Panel osiedla | Karuzela zdjęć niedopasowana, za dużo tekstu, punkty bez odniesienia | Krótsze opisy, liczby („12 przedszkoli w 1 km”), lepsze grupowanie miejsc, wybór spośród kilku szkół/obiektów kultury zamiast jednej „najkrótszej drogi” |
| 11 | Oś czasu | Horyzont 2030 za krótki | Oś do 2040 (wszystkie znane inwestycje) |
| 12 | Oferty | Oferty Otodom dla osiedla to „potęga” | Linki do ofert zawężone lokalizacją/promieniem osiedla |

Poza zakresem: muzyka (żart z nagrania).

## Ustalenia doprecyzowane (wiadomość od zespołu)

- **Najpierw funkcje, design na końcu.** Teraz tylko lekki tuning wyglądu; dokładny design zespół wybierze na koniec.
- **Raport danych** (`docs/data/raport-danych.md`): każda liczba w UI oznaczona jako prawdziwa / wyliczona / szacowana / wymyślona, z planem zastąpienia szacunków prawdziwymi danymi.
- **Dane z innych gałęzi** (`mikolaj`, `feat/grid-tile-lab`, `feat/noise-dataset`) — scalić i z nich korzystać.
- **Drobna ziarnistość jako drugi krok:** po przybliżeniu wybranego obszaru (MSI) pokazujemy w nim małe osiedla mieszkaniowe (kilka budynków), z ceną za m² (np. z Rejestru Cen Nieruchomości) i wszystkimi dostępnymi informacjami. Próbujemy i commitujemy — w razie czego cofamy.

## Plan zadań (iteracja 2)

- [x] I2-0 Analiza gałęzi `feat/grid-tile-lab` i `mikolaj` (co można przenieść)
- [ ] I2-1 Drobne osiedla + hierarchia granic (dane)
- [x] I2-2 Przeliczenie wskaźników na prawdziwych danych, liczby per osiedle
- [x] I2-3 Nowa nazwa „Okolica” + ankieta bez limitu, wagi kategorii w store (lekki tuning)
- [ ] I2-4 Mapa: panel filtrów z wagami, solo kategorii, legenda
- [ ] I2-5 Mapa: POI i budynki 3D kolorowane wg funkcji, drogi asfalt + krawężnik
- [ ] I2-6 Mapa: korki na drogach + suwak godziny
- [ ] I2-7 Panel osiedla: liczby, mniej tekstu, grupowanie, wybór obiektów, karuzela, oś do 2040, oferty
- [x] I2-8 Raport danych (pochodzenie każdej liczby)
- [ ] I2-9 Drugi poziom: małe osiedla mieszkaniowe w obszarze MSI + ceny za m²
- [ ] I2-10 Deploy + QA end-to-end
- [ ] I2-11 (na końcu) wybór finalnego designu z zespołem

## Do podjęcia przez kolejne zadania

- „Siatka” zostało w `src/osiedle/Hero.tsx` i `src/cinematic/Interlude.tsx` → użyć `APP_NAME`.
- `src/osiedle/OsiedlePanel.tsx` obcina priorytety do 4 (`.slice(0, 4)`).
- Opis „Na stałe” w `dictionary.ts` mówi „do 2030 roku” → po przejściu osi czasu na 2040.
- Korki: brak prawdziwych danych godzinowych w gałęziach — proxy z rozkładów ZTM (GTFS), opisane jako planowane spowolnienie, nie ruch na żywo.

## Decyzja: nowe wyróżnione osiedla (uczciwy ranking)

Raport danych pokazał, że dopasowania 96/96/97% były ustawione ręcznie. Po przeliczeniu na prawdziwych danych
(bez nadpisań) Powiśle / Błonia Wilanowskie / Saska Kępa zajmują odpowiednio #8 / #39 / #73 w swoich profilach.
Dlatego wyróżniamy osiedla z uczciwej czołówki:

| Profil | Osiedle (MSI) | Miejsce w rankingu |
|--------|---------------|--------------------|
| Student | Muranów (`muranow`) | #1 (92) |
| Senior | Stare Bielany (`stare-bielany`) | #1 (79) |
| Rodzina | Natolin (`natolin`) | #3 (78) — #1 i #2 (Stare Bielany, Słodowiec) leżą obok siebie na Bielanach, wybieramy inną część miasta |

UI pokazuje prawdziwe miejsce w rankingu dla aktualnych wag (bez sztucznego „#1”).
