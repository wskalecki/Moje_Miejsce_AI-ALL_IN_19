# Brief wspólny dla wszystkich wariantów

Produkt: **Moje Miejsce** — aplikacja webowa (hackathon „Warszawa: Twój ruch!”), która pomaga wybrać
okolicę w Warszawie do zamieszkania, zanim zacznie się szukać mieszkania. Użytkownik wybiera profil
(Student / Rodzina / Senior), mapa 143 osiedli koloruje się dopasowaniem (0–100), kliknięcie osiedla
otwiera kartę z liczbami z otwartych danych miasta. Obecne UI: ciepły papierowy beż, glassmorphism,
Plus Jakarta Sans + Inter, pigułki i zaokrąglone karty — zespół chce alternatyw mniej „AI-owych”,
profesjonalnych, dopracowanych, pięknych.

## Ekran do zaprojektowania (jeden, w pełni dopracowany, 1440×900 jako główny cel)

Ekran mapy z otwartą kartą osiedla **Stare Bielany** (profil Senior, 1. miejsce ze 143, dopasowanie 81).
Musi zawierać (układ, hierarchia i forma — dowolne, to jest właśnie przedmiot wariantu):

1. Marka „Moje Miejsce” i przełącznik profilu Student / Rodzina / Senior (Senior aktywny). Przełączenie
   faktycznie przekolorowuje mapę i ranking (dane `match`/`rank` dla każdego profilu są w `MM.city.osiedla`).
2. Mapa Warszawy: 143 osiedla z `MM.city.osiedla[].d`, kolor wg dopasowania, Wisła `MM.city.river`,
   wyróżnione Stare Bielany. Hover → nazwa + dopasowanie. Klik w inne osiedle → przynajmniej zwięzła
   karta z `name`, `district`, `match`, `rank`, `blurb[profil]`, `cats` (pełna karta istnieje tylko dla
   Starych Bielan — klik w nie wraca do pełnej).
3. Karta Starych Bielan (`MM.featured`): nazwa, dzielnica, miejsce w rankingu, dopasowanie, zdjęcia
   (`heroImages`, z podpisem autora), zdanie podsumowania, 10 kategorii (wyróżnij priorytety seniora
   `MM.seniorPriorities`), miejsca w okolicy z minutami pieszo, dojazdy do 3 celów (komunikacja/rower),
   ceny (mediana 16 683 zł/m² vs Warszawa 15 655 zł/m², kwartyle z `prices.rcn`), ruch w ciągu doby
   (`traffic`, opcjonalnie), plany zmian w okolicy 2026–2040 (`timeline`, ze statusem), notka o danych.
4. Plan okolicy (`MM.neighborhood` — prawdziwe budynki, drogi, zieleń, woda, granica osiedla, punkty
   miejsc) — mocno zalecany: jako widok przybliżenia, wkładka albo ilustracja w karcie.

Wszystkie liczby wyłącznie z `window.MM` — nie wymyślaj danych. Teksty interfejsu po polsku, z
poprawnymi polskimi znakami, zwięzłe, rzeczowe, z perspektywy użytkownika.

## Techniczne

- Jeden samodzielny plik HTML (inline CSS + JS, bez frameworków i bez build stepu). Ładuje
  `<script src="../shared/data.js"></script>`; zdjęcia `../img/01.jpg` … `06.jpg`. Fonty: Google Fonts
  (z `latin-ext`) albo systemowe. Ikony: inline SVG własne (bez bibliotek).
- Dopracowanie jak produkcja: siatka spacingu, skala typograficzna, cyfry tabelaryczne, stany hover/focus,
  widoczny focus z klawiatury, `prefers-reduced-motion`, kontrast WCAG AA. Responsywność: ma się
  sensownie układać do ~390 px (mobile), ale 1440×900 jest priorytetem.
- Panel karty może się przewijać wewnętrznie; pierwszy ekran (bez scrolla) musi już wyglądać świetnie.
- Wstawiając SVG przez innerHTML zawsze cytuj atrybuty i zamykaj elementy `<path ...></path>`.
- Unikaj typowych „AI tells”: kremowe tło #F4F1EA + serif + terakota, czarne tło + jeden kwasowy akcent,
  identyczne zaokrąglone karty z tym samym cieniem, gradientowe plamy dekoracyjne, glassmorphism,
  WERSALIKOWE etykiety z rozstrzelonym trackingiem nad każdym nagłówkiem, „A · B · C” wszędzie,
  strzałki „→” doklejane do przycisków, monospace dla drobnych etykiet (chyba że wariant to uzasadnia).
  Odwaga w jednym miejscu, reszta zdyscyplinowana.

## Weryfikacja (obowiązkowa)

Rób zrzuty i oglądaj je (Read na PNG), poprawiaj, minimum 3 iteracje. Komenda:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --allow-file-access-from-files --virtual-time-budget=4000 --window-size=1440,900 \
  --screenshot=<SCRATCH>/vNN.png "file:///Users/czaacza/wwa42hackathon_ai_all_in/prototypes/ui-warianty/variants/<plik>.html" 2>/dev/null
```

Sprawdź też 390×844 (mobile) i błędy JS (np. `--enable-logging=stderr --v=0` lub `--dump-dom`).
Zapisuj zrzuty w katalogu scratch, NIE w repo. Nie modyfikuj niczego poza swoim plikiem wariantu.
