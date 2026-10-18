# Wspólne dane prototypów UI

`data.js` ustawia `window.MM` — prawdziwe dane z `application/public/data` i `application/src/mock/osiedla.ts`
(wygenerowane skryptem; nie edytować ręcznie).

```
MM.app            { name: 'Moje Miejsce', tagline }
MM.profiles       { student|rodzina|senior: { title, description } }
MM.activeProfile  'senior'
MM.categories     { cisza: 'Cisza', zielen: 'Zieleń', ... }  (10 kategorii)
MM.categoryColors { cisza: '#1798b0', ... }  (paleta z aplikacji — można zastąpić własną)
MM.seniorPriorities ['cisza','zielen','kultura']
MM.credits        string

MM.city  { w: 1000, h: 1063, river: 'M..' (ścieżka SVG Wisły, linia do obrysowania strokiem),
           osiedla: [ { id, name, district, areaKm2, d: 'M..Z' (ścieżka SVG w viewBox 0 0 w h),
                        cx, cy (centroid), match: {student, rodzina, senior} (0–100),
                        rank: {student, rodzina, senior} (1 = najlepsze, ze 143),
                        cats: {cisza: 0–100, ...}, blurb: {student, rodzina, senior} (zdanie z danych) } ] }

MM.neighborhood  plan okolicy Starych Bielan w viewBox 0 0 w h (w=1000, h≈1076):
           outline (granica osiedla), buildings [{d, h(wysokość m)}], green [{d, name, kind}],
           water [d], roads [{d (linia, stroke), hw (primary|secondary|tertiary|residential|…), name}],
           center [x,y], places [{id, xy:[x,y]}]  (id → MM.featured.highlights[].id)

MM.featured  pełna karta osiedla Stare Bielany:
           slug, name, district, tagline, summary, match{…}, rank{…}, stats{kat: 0–100},
           metrics [{key,label,value,unit}], highlights [{id,name,category,description,distanceM,walkMin}],
           prices {buyPerM2: 16683, cityBuyPerM2: 15655, rcn:{msi:{n,med,p25,p75}, city:{…}}, asOf, basisLabel, rentNote},
           trafficRoad, traffic [24 wartości, godziny 0–23],
           commute [{id,label,minutes:{komunikacja,rower},transitByMode:{metro,tramwaj,autobus}}],
           timeline [{id,year,title,description,category,status,yearNote}],
           routes [{id,label,destinationName,category,minutes}],
           heroImages [{src:'../img/0N.jpg', alt, credit}], portals [{name, rentUrl, buyUrl}]
```

Renderowanie: wstawiaj ścieżki jako `<path d="…"></path>` (bez samozamykających `/>` w innerHTML z
niecytowanymi atrybutami — rozjeżdża parser).
