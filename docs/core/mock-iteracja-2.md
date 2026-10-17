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

## Plan zadań (iteracja 2)

- [ ] I2-0 Analiza gałęzi `feat/grid-tile-lab` i `mikolaj` (co można przenieść)
- [ ] I2-1 Drobne osiedla + hierarchia granic (dane)
- [ ] I2-2 Przeliczenie wskaźników na prawdziwych danych, liczby per osiedle
- [ ] I2-3 Nowa nazwa + redesign ankiety
- [ ] I2-4 Mapa: panel filtrów z wagami, solo kategorii, legenda
- [ ] I2-5 Mapa: POI i budynki 3D kolorowane wg funkcji, drogi asfalt + krawężnik
- [ ] I2-6 Mapa: korki na drogach + suwak godziny
- [ ] I2-7 Panel osiedla: liczby, mniej tekstu, grupowanie, wybór obiektów, karuzela, oś do 2040, oferty
- [ ] I2-8 Deploy + QA end-to-end
