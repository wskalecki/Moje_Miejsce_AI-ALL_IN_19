/**
 * Mock content for the 3 featured osiedla (one hero pick per profile).
 *
 * Shape follows `docs/core/mock-spec.md` §6.2 (`FeaturedOsiedle`), plus a few extras:
 * `prices.rent2PokAvg`, `prices.sourceNote`, `trafficRoad`.
 * Prices and planned investments come from public reports (see docs/data/zrodla-danych.md,
 * section "Mock: 3 osiedla"). Route geometries are real street routes from OSRM
 * (routing.openstreetmap.de, OSM data © OpenStreetMap contributors, ODbL).
 * Photos: Wikimedia Commons, attribution in `public/osiedla/credits.json`.
 *
 * Generated once by a script, then hand-maintained. Values are plausible, not live data.
 */
import type { LineString } from 'geojson'

export type ProfileId = 'student' | 'rodzina' | 'senior'
export type CategoryId =
  | 'cisza'
  | 'zielen'
  | 'komunikacja'
  | 'gastronomia'
  | 'sport'
  | 'kultura'
  | 'edukacja'
  | 'zdrowie'
  | 'zakupy'
  | 'zycieNocne'
export type TravelMode = 'pieszo' | 'rower' | 'komunikacja' | 'auto'
export type LngLat = [number, number]
export type OsiedleSlug = 'powisle' | 'miasteczko-wilanow' | 'saska-kepa'

export interface HeroImage {
  src: string
  alt: string
  credit: string
}

export interface Highlight {
  id: string
  name: string
  category: CategoryId
  coord: LngLat
  description: string
  /** Approximate walking distance (street network ≈ 1.3 × straight line). */
  distanceM?: number
  walkMin?: number
}

export interface Prices {
  /** PLN per m², asking price, secondary market, 2026. */
  buyPerM2: number
  /** PLN per m² per month. */
  rentPerM2: number
  /** Typical monthly rent for a 2-room flat, PLN (without utilities). */
  rent2PokAvg: number
  cityBuyPerM2: number
  cityRentPerM2: number
  /** YYYY-MM */
  asOf: string
  sourceNote: string
}

export interface Commute {
  id: string
  label: string
  /** Door-to-door minutes on a weekday at peak. */
  minutes: Partial<Record<TravelMode, number>>
}

export interface Route {
  id: string
  label: string
  category: CategoryId
  destinationName: string
  geometry: LineString
  distanceM: number
  minutes: Partial<Record<TravelMode, number>>
}

export interface TimelineEvent {
  id: string
  year: 2026 | 2027 | 2028 | 2029 | 2030
  title: string
  description: string
  category: CategoryId
  status: 'planowana' | 'w budowie' | 'zakończona'
  coord?: LngLat
  statDeltas: Partial<Record<CategoryId, number>>
  matchDelta?: number
}

export interface Portal {
  name: 'Otodom' | 'Morizon'
  rentUrl: string
  buyUrl: string
}

export interface Osiedle {
  slug: OsiedleSlug
  /** Id in public/data/osiedla.geojson (MSI area). */
  msiId: string
  name: string
  district: string
  profile: ProfileId
  tagline: string
  aiSummary: string
  center: LngLat
  cameraBearing: number
  cameraZoom?: number
  match: Record<ProfileId, number>
  heroImages: HeroImage[]
  stats: Record<CategoryId, number>
  highlights: Highlight[]
  prices: Prices
  /** Name of the main exit road the `traffic` curve describes. */
  trafficRoad: string
  /** Exactly 24 values 0–100, index = hour, typical weekday. */
  traffic: number[]
  commute: Commute[]
  routes: Route[]
  timeline: TimelineEvent[]
  portals: Portal[]
}

/** Alias matching the spec name. */
export type FeaturedOsiedle = Osiedle

/** Polish labels and lucide-react icon names per category. */
export const CATEGORY_META: Record<CategoryId, { label: string; icon: string }> = {
  cisza: { label: 'Cisza', icon: 'VolumeX' },
  zielen: { label: 'Zieleń', icon: 'Trees' },
  komunikacja: { label: 'Komunikacja', icon: 'TramFront' },
  gastronomia: { label: 'Gastronomia', icon: 'UtensilsCrossed' },
  sport: { label: 'Sport', icon: 'Dumbbell' },
  kultura: { label: 'Kultura', icon: 'Theater' },
  edukacja: { label: 'Edukacja i przedszkola', icon: 'GraduationCap' },
  zdrowie: { label: 'Zdrowie', icon: 'HeartPulse' },
  zakupy: { label: 'Zakupy', icon: 'ShoppingBasket' },
  zycieNocne: { label: 'Życie nocne', icon: 'Martini' },
}

export const OSIEDLA: Osiedle[] = [
  {
    slug: 'powisle',
    msiId: 'powisle',
    name: 'Powiśle',
    district: 'Śródmieście',
    profile: 'student',
    tagline: 'BUW, bulwary i metro pod nosem — studenckie serce miasta.',
    aiSummary: 'Powiśle łączy kampus Uniwersytetu Warszawskiego, Bibliotekę Uniwersytecką z ogrodem na dachu i Centrum Nauki Kopernik z najżywszym odcinkiem Bulwarów Wiślanych. Metro M2 i SKM Powiśle dowiozą Cię na zajęcia w kilka minut, a wieczorem nie musisz nigdzie jechać — bary i kluby są za rogiem. Cena tej wygody to hałas w weekendy i jedne z najwyższych czynszów w Warszawie.',
    center: [21.0255, 52.241],
    cameraBearing: 255,
    cameraZoom: 15.8,
    match: {
      student: 96,
      rodzina: 62,
      senior: 74,
    },
    heroImages: [
      {
        src: '/osiedla/powisle/01.jpg',
        alt: 'Centrum Nauki Kopernik z zielonym dachem nad Wisłą, widok z drona',
        credit: 'fot. Kapitel, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/powisle/02.jpg',
        alt: 'Bulwary Wiślane w słoneczny dzień, schody nad wodą i barki',
        credit: 'fot. Adrian Grycuk, CC BY 3.0 pl, Wikimedia Commons',
      },
      {
        src: '/osiedla/powisle/03.jpg',
        alt: 'Ogród na dachu Biblioteki Uniwersyteckiej z widokiem na Pałac Kultury',
        credit: 'fot. krysi@, CC BY 3.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/powisle/04.jpg',
        alt: 'Bulwar na Powiślu z mostem średnicowym i mostem Poniatowskiego',
        credit: 'fot. Dariusz Kowalczyk, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/powisle/05.jpg',
        alt: 'Zrewitalizowana Elektrownia Powiśle z food hallem',
        credit: 'fot. Panek, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/powisle/06.jpg',
        alt: 'Bulwary i Centrum Nauki Kopernik widziane z mostu Świętokrzyskiego',
        credit: 'fot. Adrian Grycuk, CC BY-SA 3.0 pl, Wikimedia Commons',
      },
    ],
    stats: {
      cisza: 28,
      zielen: 66,
      komunikacja: 94,
      gastronomia: 96,
      sport: 74,
      kultura: 98,
      edukacja: 72,
      zdrowie: 76,
      zakupy: 78,
      zycieNocne: 98,
    },
    highlights: [
      {
        id: 'buw',
        name: 'BUW – ogród na dachu',
        category: 'edukacja',
        coord: [21.02507, 52.24264],
        description: 'Biblioteka Uniwersytecka czynna do późna i jeden z największych ogrodów dachowych w Europie.',
        distanceM: 450,
        walkMin: 6,
      },
      {
        id: 'kampus-uw',
        name: 'Kampus Główny UW',
        category: 'edukacja',
        coord: [21.01885, 52.24021],
        description: 'Brama przy Krakowskim Przedmieściu, wydziały humanistyczne i Pałac Kazimierzowski.',
        distanceM: 630,
        walkMin: 8,
      },
      {
        id: 'cnk',
        name: 'Centrum Nauki Kopernik',
        category: 'kultura',
        coord: [21.0286, 52.24178],
        description: 'Interaktywne wystawy, planetarium Niebo Kopernika i wieczory dla dorosłych.',
        distanceM: 300,
        walkMin: 4,
      },
      {
        id: 'bulwary',
        name: 'Bulwary Wiślane – Barka Wynurzenie',
        category: 'zycieNocne',
        coord: [21.02984, 52.24241],
        description: 'Letnie bary na wodzie, schody nad Wisłą i rowerowa trasa wzdłuż rzeki.',
        distanceM: 550,
        walkMin: 7,
      },
      {
        id: 'elektrownia',
        name: 'Elektrownia Powiśle',
        category: 'gastronomia',
        coord: [21.02785, 52.24077],
        description: 'Food hall, kino i sklepy w zabytkowej elektrowni z XIX wieku.',
        distanceM: 210,
        walkMin: 3,
      },
      {
        id: 'metro-cnk',
        name: 'Metro Centrum Nauki Kopernik (M2)',
        category: 'komunikacja',
        coord: [21.0298, 52.23985],
        description: 'Linia M2: Świętokrzyska 2 min, Rondo Daszyńskiego 6 min.',
        distanceM: 430,
        walkMin: 6,
      },
    ],
    prices: {
      buyPerM2: 23800,
      rentPerM2: 105,
      rent2PokAvg: 4900,
      cityBuyPerM2: 17975,
      cityRentPerM2: 84,
      asOf: '2026-10',
      sourceNote: 'Zakup: średnia ofertowa Domiporta, X 2026 (1709 ofert, przedział 21 878–27 258 zł/m²); transakcyjnie ok. 21 650 zł/m² (SonarHome). Najem: szacunek dla Śródmieścia z indeksów ofertowych (znajdznajem.pl, otodom), mieszkanie 2-pok. ok. 45 m².',
    },
    trafficRoad: 'Wybrzeże Kościuszkowskie (Wisłostrada) w stronę centrum',
    traffic: [8, 6, 5, 5, 7, 15, 38, 72, 86, 74, 58, 52, 54, 56, 60, 68, 82, 90, 78, 58, 42, 30, 20, 12],
    commute: [
      {
        id: 'centrum',
        label: 'Centrum (Rondo ONZ)',
        minutes: {
          komunikacja: 12,
          rower: 10,
          auto: 15,
          pieszo: 30,
        },
      },
      {
        id: 'pw',
        label: 'Politechnika Warszawska',
        minutes: {
          komunikacja: 18,
          rower: 12,
          auto: 16,
          pieszo: 34,
        },
      },
      {
        id: 'ochota',
        label: 'Kampus Ochota (UW/WUM, ul. Banacha)',
        minutes: {
          komunikacja: 28,
          rower: 22,
          auto: 24,
        },
      },
    ],
    routes: [
      {
        id: 'buw',
        label: 'Uczelnia',
        category: 'edukacja',
        destinationName: 'Biblioteka Uniwersytecka (BUW)',
        geometry: {
          type: 'LineString',
          coordinates: [[21.02553, 52.24101], [21.02531, 52.24124], [21.02537, 52.24126], [21.02543, 52.24128], [21.02532, 52.24141], [21.02527, 52.24145], [21.02514, 52.24158], [21.02509, 52.24163], [21.02508, 52.24164], [21.0249, 52.24184], [21.02488, 52.24189], [21.02486, 52.24191], [21.02483, 52.24194], [21.02481, 52.24197], [21.0248, 52.24197], [21.02474, 52.24201], [21.02467, 52.24225], [21.02448, 52.24248], [21.02419, 52.24284], [21.02409, 52.24292], [21.02407, 52.24294], [21.02404, 52.24297], [21.02403, 52.24298], [21.02399, 52.24303], [21.02398, 52.24304], [21.02396, 52.24306], [21.02395, 52.24307], [21.02394, 52.24308], [21.02392, 52.24309], [21.02389, 52.24311], [21.02389, 52.24313], [21.02388, 52.24317], [21.02388, 52.24318], [21.02387, 52.24321], [21.02386, 52.24323], [21.02389, 52.24324], [21.02396, 52.24326], [21.02411, 52.24331], [21.02423, 52.24335], [21.02442, 52.24312], [21.02461, 52.24318], [21.02486, 52.24326], [21.0249, 52.24321], [21.0252, 52.24285], [21.02521, 52.24284], [21.02529, 52.2428], [21.02528, 52.24279], [21.02528, 52.24278], [21.02528, 52.24276], [21.02529, 52.24275], [21.0253, 52.24274], [21.02528, 52.24272], [21.02529, 52.24271]],
        },
        distanceM: 446,
        minutes: {
          pieszo: 6,
          rower: 2,
        },
      },
      {
        id: 'uw',
        label: 'Kampus UW',
        category: 'edukacja',
        destinationName: 'Kampus Główny UW',
        geometry: {
          type: 'LineString',
          coordinates: [[21.02553, 52.24101], [21.02574, 52.24078], [21.02568, 52.24076], [21.02563, 52.24075], [21.02564, 52.24073], [21.02525, 52.24061], [21.02521, 52.24059], [21.02489, 52.24049], [21.02378, 52.24014], [21.02375, 52.24013], [21.02372, 52.24012], [21.02359, 52.24008], [21.0233, 52.23998], [21.02318, 52.23995], [21.02316, 52.23994], [21.0231, 52.23992], [21.02301, 52.23989], [21.02299, 52.23988], [21.02295, 52.23986], [21.02299, 52.23981], [21.02299, 52.2398], [21.02297, 52.23978], [21.02294, 52.23977], [21.02256, 52.23967], [21.02235, 52.23962], [21.02216, 52.23958], [21.02182, 52.23953], [21.02138, 52.23951], [21.02125, 52.2395], [21.02109, 52.2395], [21.02099, 52.23949], [21.02093, 52.23951], [21.02075, 52.2395], [21.02073, 52.23951], [21.0207, 52.23955], [21.0207, 52.23957], [21.02069, 52.23959], [21.02062, 52.2397], [21.02055, 52.23978], [21.02025, 52.24018], [21.02019, 52.24016], [21.02007, 52.24013], [21.01997, 52.24027], [21.01993, 52.24032], [21.01992, 52.24035], [21.01956, 52.24025], [21.0192, 52.24015], [21.0192, 52.24016], [21.0191, 52.24029], [21.01885, 52.24021]],
        },
        distanceM: 627,
        minutes: {
          pieszo: 8,
          rower: 3,
        },
      },
      {
        id: 'metro',
        label: 'Metro',
        category: 'komunikacja',
        destinationName: 'Stacja metra Centrum Nauki Kopernik',
        geometry: {
          type: 'LineString',
          coordinates: [[21.02553, 52.24101], [21.02574, 52.24078], [21.02581, 52.2408], [21.02587, 52.24083], [21.0259, 52.24079], [21.02592, 52.2408], [21.02594, 52.24078], [21.02596, 52.24075], [21.02598, 52.24073], [21.02602, 52.24069], [21.02614, 52.24073], [21.02618, 52.24068], [21.02647, 52.24037], [21.02649, 52.24035], [21.02659, 52.2404], [21.02674, 52.24047], [21.0268, 52.24042], [21.02689, 52.24035], [21.02694, 52.24031], [21.02698, 52.24028], [21.02702, 52.24025], [21.02712, 52.2403], [21.02723, 52.24026], [21.02724, 52.24027], [21.02727, 52.24028], [21.02738, 52.24034], [21.02789, 52.24011], [21.02847, 52.23988], [21.02891, 52.23968], [21.02967, 52.24001], [21.02969, 52.24], [21.02974, 52.23995], [21.02978, 52.23993], [21.02979, 52.23991], [21.02984, 52.23993], [21.02989, 52.23993], [21.02994, 52.23989], [21.02982, 52.23984]],
        },
        distanceM: 428,
        minutes: {
          pieszo: 6,
          rower: 2,
        },
      },
      {
        id: 'bulwary',
        label: 'Bulwary',
        category: 'zycieNocne',
        destinationName: 'Bulwar Grzymały-Siedleckiego',
        geometry: {
          type: 'LineString',
          coordinates: [[21.02553, 52.24101], [21.02574, 52.24078], [21.02581, 52.2408], [21.02587, 52.24083], [21.0259, 52.24079], [21.02592, 52.2408], [21.02597, 52.24082], [21.02599, 52.24084], [21.02609, 52.24087], [21.0261, 52.24089], [21.02616, 52.24091], [21.02619, 52.2409], [21.02624, 52.24092], [21.02679, 52.24109], [21.02688, 52.24112], [21.02728, 52.24124], [21.02735, 52.24127], [21.02747, 52.2413], [21.0276, 52.24134], [21.0277, 52.24137], [21.0277, 52.2414], [21.02785, 52.24145], [21.02784, 52.24147], [21.02789, 52.2415], [21.02795, 52.24152], [21.028, 52.24155], [21.02808, 52.24159], [21.02821, 52.24148], [21.02839, 52.24135], [21.02867, 52.24114], [21.02881, 52.24104], [21.02885, 52.24106], [21.02888, 52.24107], [21.0289, 52.24108], [21.02891, 52.24109], [21.02895, 52.24107], [21.02903, 52.24104], [21.02905, 52.24104], [21.02908, 52.24104], [21.02911, 52.24105], [21.02948, 52.24124], [21.0294, 52.2413], [21.02953, 52.24136], [21.02955, 52.24134], [21.02958, 52.24136], [21.02996, 52.24157], [21.03001, 52.24159], [21.03004, 52.24161], [21.02999, 52.24164], [21.03, 52.24165], [21.03008, 52.24169], [21.03014, 52.24173], [21.0303, 52.24183], [21.03033, 52.24181], [21.03037, 52.24183], [21.03044, 52.24187], [21.02975, 52.24226], [21.02966, 52.24232]],
        },
        distanceM: 546,
        minutes: {
          pieszo: 7,
          rower: 3,
        },
      },
    ],
    timeline: [
      {
        id: 'mpzp-powisle-polnocne',
        year: 2026,
        title: 'Plan miejscowy Powiśla Północnego',
        description: 'Ponownie wyłożony projekt planu chroni zieleń skarpy i ogrody UW oraz ogranicza wysokość nowej zabudowy.',
        category: 'zielen',
        status: 'planowana',
        coord: [21.0225, 52.2425],
        statDeltas: {
          zielen: 2,
          cisza: 2,
        },
      },
      {
        id: 'park-kazimierzowski',
        year: 2027,
        title: 'Odnowiony Park Kazimierzowski i skwer „Agatona”',
        description: 'Zarząd Zieleni rozstrzygnął konkurs na modernizację 4,3 ha parku za kampusem UW i 2,2 ha skweru przy Dobrej.',
        category: 'zielen',
        status: 'planowana',
        coord: [21.0212, 52.2418],
        statDeltas: {
          zielen: 5,
          cisza: 2,
          sport: 1,
        },
        matchDelta: 1,
      },
      {
        id: 'arkady-bulwary',
        year: 2029,
        title: 'Zielone arkady pod mostem średnicowym',
        description: 'Nowa koncepcja domknięcia Bulwarów Wiślanych przy moście kolejowym: otwarte arkady z zielenią. Na razie bez finansowania.',
        category: 'sport',
        status: 'planowana',
        coord: [21.0352, 52.2348],
        statDeltas: {
          sport: 3,
          zielen: 2,
          gastronomia: 2,
        },
      },
      {
        id: 'srednica',
        year: 2030,
        title: 'Przebudowa linii średnicowej',
        description: 'PKP PLK planuje nowe przystanki podmiejskie Nowy Świat (pod rondem de Gaulle’a) i Solec; przystanek Powiśle zostanie zamknięty. Prace główne po 2030 r.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.0225, 52.2318],
        statDeltas: {
          komunikacja: 4,
          cisza: -3,
        },
      },
    ],
    portals: [
      {
        name: 'Otodom',
        rentUrl: 'https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/srodmiescie/powisle',
        buyUrl: 'https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/srodmiescie/powisle',
      },
      {
        name: 'Morizon',
        rentUrl: 'https://www.morizon.pl/do-wynajecia/mieszkania/warszawa/powisle/',
        buyUrl: 'https://www.morizon.pl/mieszkania/warszawa/powisle/',
      },
    ],
  },
  {
    slug: 'miasteczko-wilanow',
    msiId: 'blonia-wilanowskie',
    name: 'Miasteczko Wilanów',
    district: 'Wilanów',
    profile: 'rodzina',
    tagline: 'Przedszkole za rogiem, plac zabaw pod oknem, pałacowy park na spacer.',
    aiSummary: 'Miasteczko Wilanów to najmłodsza dzielnica Warszawy z kwartałami kamienic wokół zielonych dziedzińców, kilkunastoma przedszkolami i szkołami w promieniu kilometra oraz placami zabaw niemal na każdym podwórku. Od 2024 r. do centrum jeździ tramwaj, a w weekend rodziny spacerują po parku przy Pałacu w Wilanowie. Słabszą stroną są poranne korki na Sobieskiego i mało życia po 22:00.',
    center: [21.075, 52.163],
    cameraBearing: 200,
    cameraZoom: 15.6,
    match: {
      student: 54,
      rodzina: 96,
      senior: 70,
    },
    heroImages: [
      {
        src: '/osiedla/miasteczko-wilanow/01.jpg',
        alt: 'Miasteczko Wilanów z lotu ptaka, kwartały z zielonymi dziedzińcami',
        credit: 'fot. Emptywords, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/miasteczko-wilanow/02.jpg',
        alt: 'Świątynia Opatrzności Bożej i aleja Rzeczypospolitej, w tle centrum',
        credit: 'fot. Emptywords, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/miasteczko-wilanow/03.jpg',
        alt: 'Zielony pas Osi Królewskiej z alejkami spacerowymi',
        credit: 'fot. Wistula, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/miasteczko-wilanow/04.jpg',
        alt: 'Park przy zbiorniku retencyjnym wśród nowych kamienic',
        credit: 'fot. Wistula, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/miasteczko-wilanow/05.jpg',
        alt: 'Świątynia Opatrzności Bożej',
        credit: 'fot. Adrian Grycuk, CC BY-SA 3.0 pl, Wikimedia Commons',
      },
      {
        src: '/osiedla/miasteczko-wilanow/06.jpg',
        alt: 'Brama Pałacu w Wilanowie',
        credit: 'fot. Marek Śliwecki, CC BY-SA 4.0, Wikimedia Commons',
      },
    ],
    stats: {
      cisza: 78,
      zielen: 86,
      komunikacja: 52,
      gastronomia: 64,
      sport: 82,
      kultura: 58,
      edukacja: 94,
      zdrowie: 80,
      zakupy: 80,
      zycieNocne: 28,
    },
    highlights: [
      {
        id: 'sp400',
        name: 'Szkoła Podstawowa nr 400 im. M. Skłodowskiej-Curie',
        category: 'edukacja',
        coord: [21.06604, 52.1637],
        description: 'Publiczna podstawówka przy Osi Królewskiej, nowy budynek z halą sportową.',
        distanceM: 880,
        walkMin: 12,
      },
      {
        id: 'p424',
        name: 'Przedszkole nr 424 im. Królowej Marysieńki',
        category: 'edukacja',
        coord: [21.07473, 52.16718],
        description: 'Publiczne przedszkole (oddział) w sercu osiedla, obok kilkunastu niepublicznych.',
        distanceM: 500,
        walkMin: 7,
      },
      {
        id: 'os-krolewska',
        name: 'Zielony pas Osi Królewskiej',
        category: 'zielen',
        coord: [21.07508, 52.16498],
        description: 'Szeroki pas zieleni z alejkami, idealny na rower biegowy i hulajnogę.',
        distanceM: 280,
        walkMin: 4,
      },
      {
        id: 'swiatynia',
        name: 'Świątynia Opatrzności Bożej',
        category: 'kultura',
        coord: [21.07211, 52.15861],
        description: 'Charakterystyczna kopuła, Muzeum Jana Pawła II i Prymasa Wyszyńskiego, koncerty.',
        distanceM: 680,
        walkMin: 9,
      },
      {
        id: 'palac',
        name: 'Pałac i park w Wilanowie',
        category: 'kultura',
        coord: [21.09047, 52.1651],
        description: 'Barokowa rezydencja Jana III Sobieskiego, ogrody i zimowy Królewski Ogród Światła.',
        distanceM: 2080,
        walkMin: 26,
      },
      {
        id: 'medicover',
        name: 'Szpital Medicover',
        category: 'zdrowie',
        coord: [21.07795, 52.15504],
        description: 'Prywatny szpital z SOR-em i oddziałem pediatrycznym przy al. Rzeczypospolitej 5.',
        distanceM: 1250,
        walkMin: 17,
      },
    ],
    prices: {
      buyPerM2: 19900,
      rentPerM2: 84,
      rent2PokAvg: 4200,
      cityBuyPerM2: 17975,
      cityRentPerM2: 84,
      asOf: '2026-10',
      sourceNote: 'Zakup: Miasteczko Wilanów od ok. 20 000 zł/m² (przewodnik Domus Global, VI 2026); Wilanów ogółem 17 850–20 130 zł/m² (SonarHome, rankingi 2026). Najem: Wilanów 84–86 zł/m² (Domiporta, otodom, IX 2026), mieszkanie 2-pok. ok. 50 m².',
    },
    trafficRoad: 'ul. Sobieskiego w stronę Mokotowa i centrum',
    traffic: [6, 4, 3, 3, 6, 22, 58, 92, 97, 80, 55, 45, 44, 46, 52, 64, 80, 86, 72, 50, 34, 22, 14, 9],
    commute: [
      {
        id: 'centrum',
        label: 'Centrum (Rondo ONZ)',
        minutes: {
          komunikacja: 45,
          rower: 40,
          auto: 42,
        },
      },
      {
        id: 'mokotow',
        label: 'Mokotów biurowy (ul. Domaniewska)',
        minutes: {
          komunikacja: 32,
          rower: 24,
          auto: 25,
        },
      },
      {
        id: 'lotnisko',
        label: 'Lotnisko Chopina',
        minutes: {
          komunikacja: 50,
          rower: 40,
          auto: 25,
        },
      },
    ],
    routes: [
      {
        id: 'sp400',
        label: 'Szkoła',
        category: 'edukacja',
        destinationName: 'Szkoła Podstawowa nr 400',
        geometry: {
          type: 'LineString',
          coordinates: [[21.07501, 52.163], [21.07502, 52.16299], [21.07545, 52.16322], [21.07534, 52.16333], [21.07532, 52.16335], [21.07512, 52.16355], [21.0751, 52.16357], [21.07506, 52.16361], [21.07492, 52.16375], [21.07483, 52.16384], [21.07477, 52.16389], [21.07476, 52.1639], [21.07474, 52.16392], [21.07472, 52.16394], [21.07471, 52.16396], [21.07463, 52.16404], [21.07457, 52.16412], [21.07452, 52.1642], [21.07451, 52.16422], [21.0745, 52.16423], [21.07447, 52.16432], [21.07445, 52.16442], [21.07443, 52.16447], [21.07441, 52.1645], [21.07437, 52.1645], [21.07422, 52.1645], [21.07402, 52.1645], [21.07365, 52.16449], [21.07342, 52.16449], [21.07306, 52.16449], [21.0729, 52.16448], [21.07255, 52.16448], [21.07221, 52.16448], [21.07149, 52.16448], [21.07137, 52.16448], [21.07131, 52.16446], [21.07106, 52.16445], [21.07075, 52.16445], [21.07065, 52.16445], [21.07032, 52.16445], [21.0703, 52.1645], [21.07029, 52.16453], [21.07029, 52.16455], [21.07029, 52.16458], [21.07024, 52.16458], [21.07017, 52.16458], [21.07012, 52.16457], [21.07003, 52.16457], [21.06999, 52.16457], [21.06994, 52.16457], [21.06989, 52.16456], [21.06981, 52.16456], [21.06976, 52.16456], [21.06971, 52.16455], [21.06967, 52.16455], [21.06961, 52.16457], [21.06957, 52.16458], [21.06943, 52.16461], [21.06941, 52.16461], [21.06937, 52.16461], [21.06908, 52.1646], [21.0686, 52.16459], [21.06856, 52.1646], [21.06826, 52.16459], [21.06779, 52.16458], [21.06733, 52.16454], [21.0671, 52.16452], [21.06707, 52.16452], [21.06705, 52.16452], [21.06698, 52.16451], [21.06691, 52.1645], [21.06682, 52.16448], [21.06677, 52.16448], [21.06682, 52.16438], [21.06684, 52.16436], [21.06679, 52.16434], [21.06671, 52.16429], [21.06662, 52.16425], [21.06636, 52.16414], [21.0663, 52.16413], [21.06617, 52.16412], [21.06609, 52.1641], [21.06604, 52.16408], [21.06601, 52.16406], [21.06599, 52.16405], [21.06598, 52.16403], [21.06597, 52.164], [21.06598, 52.16397], [21.06601, 52.16393], [21.06622, 52.16371], [21.06608, 52.16366]],
        },
        distanceM: 876,
        minutes: {
          pieszo: 12,
          rower: 4,
        },
      },
      {
        id: 'p424',
        label: 'Przedszkole',
        category: 'edukacja',
        destinationName: 'Przedszkole nr 424 (oddział)',
        geometry: {
          type: 'LineString',
          coordinates: [[21.07501, 52.163], [21.07502, 52.16299], [21.07545, 52.16322], [21.07534, 52.16333], [21.07532, 52.16335], [21.07512, 52.16355], [21.0751, 52.16357], [21.07506, 52.16361], [21.07492, 52.16375], [21.07483, 52.16384], [21.07477, 52.16389], [21.07476, 52.1639], [21.07474, 52.16392], [21.07472, 52.16394], [21.07471, 52.16396], [21.07463, 52.16404], [21.07457, 52.16412], [21.07452, 52.1642], [21.07451, 52.16422], [21.0745, 52.16423], [21.07447, 52.16432], [21.07445, 52.16442], [21.07443, 52.16447], [21.07441, 52.1645], [21.07437, 52.1645], [21.07437, 52.16453], [21.07437, 52.16463], [21.07437, 52.16465], [21.07437, 52.16468], [21.07437, 52.16474], [21.07437, 52.16488], [21.07437, 52.16494], [21.07437, 52.16497], [21.07437, 52.16499], [21.07438, 52.16506], [21.0744, 52.16515], [21.07441, 52.16521], [21.07441, 52.16538], [21.07441, 52.16549], [21.07441, 52.16554], [21.0744, 52.16561], [21.0744, 52.16576], [21.07439, 52.16594], [21.0744, 52.16613], [21.0744, 52.16617], [21.07441, 52.16624], [21.07442, 52.16628], [21.07444, 52.1664], [21.07446, 52.16647], [21.07448, 52.16651], [21.0745, 52.16655], [21.07453, 52.16662], [21.07477, 52.16699], [21.07487, 52.16715]],
        },
        distanceM: 504,
        minutes: {
          pieszo: 7,
          rower: 3,
        },
      },
      {
        id: 'medicover',
        label: 'Szpital',
        category: 'zdrowie',
        destinationName: 'Szpital Medicover',
        geometry: {
          type: 'LineString',
          coordinates: [[21.07501, 52.163], [21.07502, 52.16299], [21.07456, 52.16275], [21.0741, 52.16251], [21.07404, 52.16247], [21.07402, 52.16247], [21.07353, 52.16231], [21.07365, 52.16222], [21.07372, 52.1621], [21.07382, 52.16191], [21.07386, 52.16187], [21.0741, 52.16163], [21.0742, 52.16154], [21.07318, 52.16114], [21.07246, 52.16087], [21.07216, 52.16075], [21.07211, 52.16073], [21.07218, 52.16063], [21.0722, 52.16061], [21.07222, 52.16059], [21.07231, 52.16051], [21.07235, 52.16051], [21.07246, 52.16051], [21.07251, 52.16053], [21.07253, 52.1605], [21.07254, 52.16049], [21.0726, 52.16044], [21.07264, 52.16041], [21.07268, 52.16038], [21.07269, 52.16036], [21.07272, 52.16034], [21.07275, 52.16031], [21.07277, 52.1603], [21.07278, 52.16025], [21.07279, 52.16024], [21.07279, 52.16022], [21.07279, 52.1602], [21.0728, 52.16018], [21.07282, 52.16016], [21.07294, 52.16007], [21.07297, 52.16002], [21.07341, 52.15969], [21.07362, 52.1595], [21.07364, 52.15948], [21.07367, 52.15946], [21.0737, 52.15944], [21.07376, 52.15941], [21.07377, 52.15941], [21.0738, 52.15939], [21.07382, 52.15936], [21.07383, 52.15936], [21.07386, 52.15931], [21.07472, 52.15865], [21.0748, 52.15859], [21.07486, 52.15855], [21.07494, 52.15848], [21.07499, 52.15845], [21.0754, 52.15813], [21.07548, 52.15807], [21.07554, 52.15801], [21.0756, 52.15798], [21.07562, 52.15797], [21.07565, 52.15794], [21.07567, 52.15792], [21.07569, 52.1579], [21.07569, 52.15789], [21.0757, 52.15788], [21.07629, 52.15743], [21.07638, 52.15736], [21.07653, 52.15726], [21.07656, 52.15724], [21.07674, 52.15707], [21.07687, 52.15698], [21.07689, 52.15697], [21.07692, 52.15696], [21.07694, 52.15695], [21.07697, 52.15695], [21.07701, 52.15695], [21.07704, 52.15696], [21.07717, 52.157], [21.07719, 52.15698], [21.07724, 52.15692], [21.07728, 52.15687], [21.07729, 52.15686], [21.07731, 52.15683], [21.07733, 52.1568], [21.07736, 52.15678], [21.07738, 52.15675], [21.07736, 52.15673], [21.0773, 52.15669], [21.07727, 52.15667], [21.07716, 52.15657], [21.07713, 52.15654], [21.07709, 52.15652], [21.07704, 52.15647], [21.07731, 52.15634], [21.07745, 52.15627], [21.07786, 52.15608], [21.07886, 52.15564], [21.0789, 52.15563], [21.07885, 52.15558], [21.07883, 52.15556], [21.07857, 52.15532], [21.07852, 52.15528], [21.07841, 52.15524], [21.07841, 52.15518], [21.07843, 52.15514]],
        },
        distanceM: 1254,
        minutes: {
          pieszo: 17,
          rower: 6,
        },
      },
      {
        id: 'palac',
        label: 'Park',
        category: 'zielen',
        destinationName: 'Park przy Pałacu w Wilanowie',
        geometry: {
          type: 'LineString',
          coordinates: [[21.07501, 52.163], [21.07502, 52.16299], [21.07545, 52.16322], [21.07534, 52.16333], [21.07536, 52.16334], [21.0754, 52.16336], [21.07545, 52.16338], [21.07555, 52.16328], [21.07568, 52.16331], [21.07621, 52.16343], [21.07695, 52.1636], [21.07712, 52.16363], [21.07708, 52.16372], [21.07708, 52.16395], [21.07707, 52.16415], [21.07706, 52.16452], [21.07706, 52.16456], [21.07709, 52.16456], [21.07751, 52.16456], [21.07794, 52.16456], [21.07839, 52.16456], [21.07877, 52.16457], [21.07884, 52.16457], [21.07886, 52.16457], [21.07892, 52.16457], [21.07897, 52.16457], [21.07908, 52.16458], [21.07906, 52.16478], [21.07906, 52.16483], [21.07905, 52.16506], [21.07905, 52.16509], [21.07904, 52.1656], [21.07904, 52.16586], [21.07904, 52.16595], [21.07905, 52.16598], [21.07908, 52.16604], [21.07932, 52.16644], [21.07939, 52.16651], [21.0794, 52.16653], [21.07942, 52.16656], [21.07944, 52.16658], [21.07953, 52.16673], [21.07953, 52.16674], [21.08088, 52.16643], [21.08118, 52.16636], [21.08227, 52.16611], [21.08253, 52.16605], [21.08263, 52.16602], [21.08278, 52.16596], [21.0831, 52.16583], [21.08335, 52.16573], [21.08343, 52.1657], [21.08349, 52.16566], [21.08354, 52.16561], [21.08358, 52.16556], [21.08362, 52.16551], [21.08364, 52.16547], [21.08365, 52.16541], [21.08381, 52.16542], [21.08387, 52.16542], [21.08391, 52.16542], [21.08395, 52.16544], [21.08398, 52.16546], [21.084, 52.16548], [21.084, 52.1655], [21.08399, 52.16561], [21.084, 52.16564], [21.08401, 52.16567], [21.08402, 52.1657], [21.08404, 52.16574], [21.08407, 52.16579], [21.08408, 52.16581], [21.08409, 52.16582], [21.08411, 52.16592], [21.08412, 52.16596], [21.08418, 52.16595], [21.08426, 52.16593], [21.08439, 52.1659], [21.08454, 52.16587], [21.08467, 52.16586], [21.08482, 52.16584], [21.08491, 52.16584], [21.08524, 52.16581], [21.08544, 52.1658], [21.08558, 52.16579], [21.08632, 52.16582], [21.08638, 52.16582], [21.08642, 52.16583], [21.08643, 52.16578], [21.08643, 52.16577], [21.08646, 52.16553], [21.08652, 52.16511], [21.08653, 52.16505], [21.08656, 52.16449], [21.08657, 52.16433], [21.0866, 52.16428], [21.08666, 52.16429], [21.08684, 52.1643], [21.08814, 52.16434], [21.08868, 52.16435], [21.08875, 52.16435], [21.08941, 52.16437], [21.08963, 52.16437], [21.08983, 52.16438], [21.0899, 52.16438], [21.0899, 52.16437], [21.08991, 52.16436], [21.08993, 52.16435], [21.08994, 52.16434], [21.08996, 52.16434], [21.08998, 52.16434], [21.09, 52.16435], [21.09001, 52.16436], [21.09002, 52.16437], [21.09002, 52.16438], [21.09009, 52.16439], [21.09029, 52.16439], [21.09043, 52.1644], [21.0905, 52.1644], [21.09054, 52.16441], [21.09053, 52.16446], [21.09068, 52.16458], [21.09077, 52.16464], [21.09074, 52.165], [21.09072, 52.16518], [21.09071, 52.16537], [21.09041, 52.16536], [21.09039, 52.16561], [21.09033, 52.16561], [21.09028, 52.16561], [21.08986, 52.1656], [21.08946, 52.16559], [21.08908, 52.16558], [21.08909, 52.16547], [21.08909, 52.1654], [21.08912, 52.16534], [21.08929, 52.16536], [21.08944, 52.16538], [21.08956, 52.16539], [21.08969, 52.16539], [21.08982, 52.16539], [21.0899, 52.16538], [21.08998, 52.16536], [21.09006, 52.16533], [21.09012, 52.16529], [21.09017, 52.16524], [21.09019, 52.16516], [21.09028, 52.16517], [21.0903, 52.16517], [21.09038, 52.16517]],
        },
        distanceM: 2077,
        minutes: {
          rower: 9,
          pieszo: 26,
        },
      },
    ],
    timeline: [
      {
        id: 'sp300',
        year: 2026,
        title: 'Nowe miejsca w szkołach – adaptacja SP nr 300',
        description: 'Dzielnica Wilanów ogłosiła przetarg na prace adaptacyjne w SP nr 300 (oferty do 31.08.2026), żeby rozładować tłok w podstawówkach.',
        category: 'edukacja',
        status: 'w budowie',
        statDeltas: {
          edukacja: 3,
        },
      },
      {
        id: 'wilanow-park',
        year: 2028,
        title: 'Wilanów Park: nowy park i centrum handlowe',
        description: 'Przy ul. Uprawnej ma powstać publiczny park o powierzchni ponad 2,2 ha razem z centrum handlowym. Otwarcie planowane na 2028 r.',
        category: 'zielen',
        status: 'planowana',
        coord: [21.0795, 52.1525],
        statDeltas: {
          zielen: 3,
          zakupy: 5,
          gastronomia: 3,
        },
        matchDelta: 1,
      },
      {
        id: 'tramwaj-wilanow-park',
        year: 2029,
        title: 'Przedłużenie tramwaju do Wilanów Park',
        description: 'Ok. 500 m torów w rejonie Uprawnej i al. Rzeczypospolitej. Deweloper przekaże projekt Tramwajom Warszawskim w IV kw. 2028, termin budowy zależy od finansowania.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.0785, 52.1545],
        statDeltas: {
          komunikacja: 4,
        },
      },
      {
        id: 'm4',
        year: 2030,
        title: 'Metro M4 (Tarchomin – Wilanów) w projektowaniu',
        description: 'Studium dla całej linii M4 kończy się w XI 2027, a od 2028 miasto może zlecić projekt i pozwolenia. Pociągi pojadą najwcześniej po 2035 r.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.075, 52.163],
        statDeltas: {
          komunikacja: 3,
        },
        matchDelta: 1,
      },
    ],
    portals: [
      {
        name: 'Otodom',
        rentUrl: 'https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/wilanow/blonia-wilanowskie',
        buyUrl: 'https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/wilanow/blonia-wilanowskie',
      },
      {
        name: 'Morizon',
        rentUrl: 'https://www.morizon.pl/do-wynajecia/mieszkania/warszawa/wilanow/',
        buyUrl: 'https://www.morizon.pl/mieszkania/warszawa/blonia-wilanowskie/',
      },
    ],
  },
  {
    slug: 'saska-kepa',
    msiId: 'saska-kepa',
    name: 'Saska Kępa',
    district: 'Praga-Południe',
    profile: 'senior',
    tagline: 'Modernistyczne wille, kawiarnie na Francuskiej i park na co dzień.',
    aiSummary: 'Saska Kępa to spokojne, zielone uliczki z modernistycznymi willami z lat 30., przy których wszystko załatwisz pieszo: przychodnię, aptekę, bibliotekę i kawę na Francuskiej. Park Skaryszewski z Jeziorem Kamionkowskim i Plaża Saska dają codzienny kontakt z naturą, a tramwaje z ronda Waszyngtona dowiozą do centrum w kwadrans. Minusem jest hałas przy Trasie Łazienkowskiej i wysokie ceny willowej zabudowy.',
    center: [21.0555, 52.233],
    cameraBearing: 305,
    cameraZoom: 15.8,
    match: {
      student: 72,
      rodzina: 88,
      senior: 97,
    },
    heroImages: [
      {
        src: '/osiedla/saska-kepa/01.jpg',
        alt: 'Kolorowe parasolki nad kawiarnią przy ul. Francuskiej',
        credit: 'fot. Grzegorz W. Tężycki, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/saska-kepa/02.jpg',
        alt: 'Ulica Francuska z kawiarnianymi ogródkami',
        credit: 'fot. Adrian Grycuk, CC BY-SA 3.0 pl, Wikimedia Commons',
      },
      {
        src: '/osiedla/saska-kepa/03.jpg',
        alt: 'Cieniste alejki Parku Skaryszewskiego',
        credit: 'fot. Adrian Grycuk, CC BY 3.0 pl, Wikimedia Commons',
      },
      {
        src: '/osiedla/saska-kepa/04.jpg',
        alt: 'Jezioro Kamionkowskie z liliami wodnymi',
        credit: 'fot. Andrzej Błaszczak, CC BY-SA 4.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/saska-kepa/05.jpg',
        alt: 'Zachód słońca nad Wisłą i panoramą centrum',
        credit: 'fot. Michal Gorski, CC BY-SA 3.0, Wikimedia Commons',
      },
      {
        src: '/osiedla/saska-kepa/06.jpg',
        alt: 'Piaszczysta Plaża Saska nad Wisłą',
        credit: 'fot. Adrian Grycuk, CC BY-SA 3.0 pl, Wikimedia Commons',
      },
    ],
    stats: {
      cisza: 82,
      zielen: 88,
      komunikacja: 70,
      gastronomia: 82,
      sport: 72,
      kultura: 80,
      edukacja: 78,
      zdrowie: 90,
      zakupy: 76,
      zycieNocne: 42,
    },
    highlights: [
      {
        id: 'francuska',
        name: 'Ulica Francuska',
        category: 'gastronomia',
        coord: [21.05396, 52.2351],
        description: 'Kawiarnie, cukiernie i restauracje z ogródkami. Co roku Święto Saskiej Kępy.',
        distanceM: 330,
        walkMin: 4,
      },
      {
        id: 'skaryszewski',
        name: 'Park Skaryszewski',
        category: 'zielen',
        coord: [21.05557, 52.24227],
        description: '58 ha starodrzewu, Jezioro Kamionkowskie, kawiarnia nad wodą i ławki w cieniu.',
        distanceM: 820,
        walkMin: 11,
      },
      {
        id: 'przychodnia',
        name: 'Przychodnia, ul. Saska 61',
        category: 'zdrowie',
        coord: [21.06039, 52.23147],
        description: 'Przychodnia POZ w zasięgu krótkiego spaceru, obok apteka.',
        distanceM: 570,
        walkMin: 8,
      },
      {
        id: 'cm-saska',
        name: 'Centrum Medyczne „Saska Kępa”',
        category: 'zdrowie',
        coord: [21.06487, 52.23668],
        description: 'Specjaliści, rehabilitacja i badania przy ul. Międzynarodowej 56.',
        distanceM: 980,
        walkMin: 12,
      },
      {
        id: 'biblioteka',
        name: 'Biblioteka, ul. Meksykańska 3',
        category: 'kultura',
        coord: [21.05731, 52.23062],
        description: 'Wypożyczalnia nr 94 z czytelnią, spotkaniami autorskimi i klubem książki.',
        distanceM: 330,
        walkMin: 4,
      },
      {
        id: 'plaza-saska',
        name: 'Plaża Saska',
        category: 'sport',
        coord: [21.04944, 52.2281],
        description: 'Piaszczysta plaża nad Wisłą z leżakami, nordic walking wzdłuż wału.',
        distanceM: 890,
        walkMin: 11,
      },
    ],
    prices: {
      buyPerM2: 19500,
      rentPerM2: 88,
      rent2PokAvg: 4100,
      cityBuyPerM2: 17975,
      cityRentPerM2: 84,
      asOf: '2026-10',
      sourceNote: 'Zakup: średnia ofertowa Adresowo, VIII 2026 (19 550 zł/m², mediana 20 000); transakcyjnie ok. 16 500 zł/m² (SonarHome), oferty otodom ok. 22 700 zł/m². Najem: szacunek powyżej mediany Pragi-Południe (3 388 zł, znajdznajem.pl X 2026), mieszkanie 2-pok. ok. 47 m².',
    },
    trafficRoad: 'Trasa Łazienkowska (most Łazienkowski) w stronę centrum',
    traffic: [7, 5, 4, 4, 8, 24, 55, 84, 88, 70, 52, 46, 47, 49, 55, 66, 80, 84, 70, 50, 35, 24, 15, 10],
    commute: [
      {
        id: 'centrum',
        label: 'Centrum (Rondo ONZ)',
        minutes: {
          komunikacja: 25,
          rower: 18,
          auto: 24,
        },
      },
      {
        id: 'lazienki',
        label: 'Łazienki Królewskie',
        minutes: {
          komunikacja: 25,
          rower: 14,
          auto: 15,
        },
      },
      {
        id: 'grochowski',
        label: 'Szpital Grochowski',
        minutes: {
          komunikacja: 20,
          rower: 12,
          auto: 12,
        },
      },
    ],
    routes: [
      {
        id: 'przychodnia',
        label: 'Przychodnia',
        category: 'zdrowie',
        destinationName: 'Przychodnia, ul. Saska 61',
        geometry: {
          type: 'LineString',
          coordinates: [[21.05518, 52.23293], [21.05533, 52.23268], [21.05539, 52.23258], [21.05543, 52.23252], [21.05564, 52.23219], [21.05567, 52.2321], [21.05568, 52.23208], [21.05588, 52.23179], [21.05595, 52.23169], [21.05603, 52.2317], [21.05605, 52.23167], [21.05607, 52.23163], [21.0561, 52.23158], [21.05612, 52.23155], [21.05627, 52.23158], [21.05712, 52.23174], [21.05718, 52.23176], [21.05723, 52.23179], [21.05774, 52.23186], [21.05777, 52.23186], [21.05836, 52.23197], [21.05843, 52.23198], [21.05909, 52.23206], [21.05915, 52.23198], [21.05925, 52.23183], [21.05934, 52.23171], [21.05937, 52.23166], [21.05938, 52.23163], [21.05939, 52.23162], [21.0596, 52.23166], [21.05986, 52.23125], [21.05997, 52.23108], [21.06003, 52.2311], [21.06014, 52.23109], [21.06058, 52.2312]],
        },
        distanceM: 566,
        minutes: {
          pieszo: 8,
          rower: 3,
        },
      },
      {
        id: 'park',
        label: 'Park',
        category: 'zielen',
        destinationName: 'Park Skaryszewski (wejście od ronda Waszyngtona)',
        geometry: {
          type: 'LineString',
          coordinates: [[21.05518, 52.23293], [21.05504, 52.23315], [21.05502, 52.23318], [21.05499, 52.2332], [21.05498, 52.23321], [21.05496, 52.23324], [21.05495, 52.23327], [21.05495, 52.23329], [21.05495, 52.23332], [21.05493, 52.23335], [21.05477, 52.23361], [21.05474, 52.23363], [21.0547, 52.23365], [21.0546, 52.23382], [21.05455, 52.23389], [21.0545, 52.23398], [21.05442, 52.23412], [21.05437, 52.2342], [21.05431, 52.23428], [21.05429, 52.23432], [21.05411, 52.2346], [21.05395, 52.23486], [21.05394, 52.2349], [21.05394, 52.23493], [21.05393, 52.23496], [21.05392, 52.23499], [21.05389, 52.23498], [21.05386, 52.235], [21.05382, 52.23506], [21.05367, 52.23531], [21.05364, 52.23535], [21.05362, 52.23537], [21.05358, 52.23542], [21.05358, 52.23546], [21.05356, 52.23549], [21.05343, 52.2357], [21.05331, 52.2359], [21.05329, 52.23594], [21.05325, 52.23604], [21.05323, 52.23607], [21.05318, 52.23615], [21.0532, 52.23617], [21.05319, 52.23619], [21.05317, 52.23621], [21.05315, 52.23624], [21.05314, 52.23625], [21.0531, 52.23624], [21.05296, 52.23646], [21.05292, 52.23654], [21.05289, 52.23658], [21.05287, 52.23662], [21.05282, 52.23669], [21.05281, 52.23671], [21.05281, 52.23674], [21.05282, 52.23677], [21.05281, 52.23679], [21.0528, 52.23681], [21.05279, 52.23683], [21.05277, 52.23686], [21.05276, 52.23687], [21.05271, 52.23688], [21.05268, 52.23692], [21.0526, 52.23705], [21.0526, 52.23706], [21.05245, 52.23731], [21.05241, 52.23739], [21.05231, 52.23753], [21.0523, 52.23759], [21.0523, 52.23762], [21.0523, 52.23771], [21.05231, 52.23776], [21.05234, 52.23782], [21.05237, 52.23787], [21.05241, 52.23792], [21.05244, 52.23794], [21.0525, 52.23798], [21.05248, 52.238], [21.05245, 52.23806], [21.05242, 52.23812], [21.05233, 52.23828], [21.05233, 52.23829], [21.05231, 52.23832], [21.0523, 52.23833], [21.05225, 52.23842], [21.05222, 52.23848], [21.05219, 52.23853], [21.05218, 52.23855], [21.05216, 52.23858], [21.05216, 52.2386], [21.0522, 52.23865], [21.05226, 52.23873], [21.05229, 52.23876], [21.05231, 52.23879], [21.05232, 52.2388], [21.05233, 52.23881], [21.05234, 52.23882], [21.05271, 52.23925], [21.05282, 52.23923], [21.05295, 52.23921], [21.0531, 52.2392], [21.05351, 52.2392]],
        },
        distanceM: 823,
        minutes: {
          pieszo: 11,
          rower: 4,
        },
      },
      {
        id: 'biblioteka',
        label: 'Biblioteka',
        category: 'kultura',
        destinationName: 'Biblioteka, ul. Meksykańska 3',
        geometry: {
          type: 'LineString',
          coordinates: [[21.05518, 52.23293], [21.05533, 52.23268], [21.05539, 52.23258], [21.05543, 52.23252], [21.05564, 52.23219], [21.05567, 52.2321], [21.05568, 52.23208], [21.05588, 52.23179], [21.05595, 52.23169], [21.05603, 52.2317], [21.05605, 52.23167], [21.05607, 52.23163], [21.0561, 52.23158], [21.05612, 52.23155], [21.05613, 52.23152], [21.05617, 52.23147], [21.05628, 52.23128], [21.05635, 52.23119], [21.05641, 52.23108], [21.05646, 52.231], [21.05648, 52.23095], [21.0565, 52.23091], [21.05654, 52.23086], [21.0566, 52.23076], [21.05665, 52.23067], [21.05673, 52.23055], [21.05675, 52.23053], [21.05728, 52.23066]],
        },
        distanceM: 333,
        minutes: {
          pieszo: 4,
          rower: 2,
        },
      },
      {
        id: 'plaza',
        label: 'Plaża',
        category: 'sport',
        destinationName: 'Plaża Saska',
        geometry: {
          type: 'LineString',
          coordinates: [[21.05518, 52.23293], [21.05533, 52.23268], [21.05539, 52.23258], [21.05543, 52.23252], [21.05564, 52.23219], [21.05567, 52.2321], [21.05568, 52.23208], [21.05553, 52.23204], [21.05558, 52.23197], [21.05563, 52.2319], [21.05549, 52.23186], [21.05554, 52.23178], [21.05556, 52.23177], [21.05565, 52.23163], [21.05561, 52.23161], [21.05563, 52.23158], [21.05566, 52.23154], [21.05569, 52.23149], [21.0557, 52.23148], [21.05531, 52.23138], [21.05438, 52.23115], [21.05433, 52.23114], [21.05425, 52.23112], [21.05319, 52.23085], [21.05316, 52.23084], [21.05309, 52.23082], [21.05303, 52.2308], [21.05319, 52.23058], [21.05327, 52.23046], [21.05331, 52.2304], [21.05334, 52.23031], [21.05337, 52.23015], [21.05338, 52.23003], [21.05335, 52.22987], [21.05334, 52.22975], [21.0533, 52.22967], [21.05323, 52.22956], [21.05313, 52.22942], [21.05304, 52.22932], [21.05293, 52.22921], [21.05283, 52.22913], [21.0527, 52.22903], [21.05262, 52.22898], [21.05258, 52.22897], [21.05236, 52.22887], [21.0523, 52.22884], [21.0523, 52.22882], [21.05221, 52.22879], [21.05217, 52.22878], [21.05172, 52.22862], [21.05161, 52.22875], [21.05167, 52.22878], [21.05183, 52.22861], [21.05177, 52.22859], [21.05157, 52.22856], [21.0515, 52.22855], [21.05128, 52.2285], [21.05123, 52.22851], [21.05118, 52.22851], [21.05112, 52.22851], [21.05109, 52.2285], [21.05108, 52.22848], [21.05104, 52.22848], [21.05088, 52.22845], [21.05059, 52.22839], [21.05015, 52.2283], [21.04993, 52.22825], [21.04985, 52.22823], [21.04973, 52.2282], [21.04966, 52.22819], [21.04961, 52.22818], [21.04955, 52.22819], [21.04952, 52.2282]],
        },
        distanceM: 890,
        minutes: {
          pieszo: 11,
          rower: 4,
        },
      },
    ],
    timeline: [
      {
        id: 'trasa-lazienkowska',
        year: 2026,
        title: 'Koniec przebudowy Trasy Łazienkowskiej',
        description: 'Nowe wiadukty nad Paryską, ekrany akustyczne i oświetlenie. Termin z aneksu: lipiec 2026, możliwe opóźnienie.',
        category: 'cisza',
        status: 'w budowie',
        coord: [21.061, 52.2268],
        statDeltas: {
          cisza: 3,
          komunikacja: 2,
        },
      },
      {
        id: 'tramwaj-goclaw-budowa',
        year: 2027,
        title: 'Start budowy tramwaju na Gocław',
        description: 'Najwcześniej w IV kw. 2027 ruszy budowa 3,6 km torów przez Saską Kępę. Przez kilka lat będą utrudnienia.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.064, 52.233],
        statDeltas: {
          cisza: -2,
        },
      },
      {
        id: 'm3-budowa',
        year: 2028,
        title: 'Metro M3: start budowy (Stadion Narodowy – Gocław)',
        description: 'Pierwszy odcinek ma 8,1 km i 6 nowych stacji. Miasto celuje w rozpoczęcie budowy w 2028 r. i otwarcie ok. 2032 r., finansowanie nie jest jeszcze zamknięte.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.0454, 52.2398],
        statDeltas: {
          komunikacja: 2,
        },
      },
      {
        id: 'tramwaj-goclaw',
        year: 2030,
        title: 'Tramwaj na Gocław przez Saską Kępę',
        description: 'Linia z al. Waszyngtona przez Saską Kępę i węzeł przy al. Stanów Zjednoczonych do pętli Gocław. Do Metra Centrum ok. 20 min. Zakończenie planowane na III kw. 2030.',
        category: 'komunikacja',
        status: 'planowana',
        coord: [21.064, 52.233],
        statDeltas: {
          komunikacja: 8,
          cisza: 2,
        },
        matchDelta: 1,
      },
    ],
    portals: [
      {
        name: 'Otodom',
        rentUrl: 'https://www.otodom.pl/pl/wyniki/wynajem/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/praga--poludnie/saska-kepa',
        buyUrl: 'https://www.otodom.pl/pl/wyniki/sprzedaz/mieszkanie/mazowieckie/warszawa/warszawa/warszawa/praga--poludnie/saska-kepa',
      },
      {
        name: 'Morizon',
        rentUrl: 'https://www.morizon.pl/do-wynajecia/mieszkania/warszawa/saska-kepa/',
        buyUrl: 'https://www.morizon.pl/mieszkania/warszawa/saska-kepa/',
      },
    ],
  },
]

/** Same list under the spec name read by `src/map/featured.ts`. */
export const FEATURED = OSIEDLA

export const OSIEDLA_BY_SLUG: Record<OsiedleSlug, Osiedle> = Object.fromEntries(
  OSIEDLA.map((o) => [o.slug, o]),
) as Record<OsiedleSlug, Osiedle>
