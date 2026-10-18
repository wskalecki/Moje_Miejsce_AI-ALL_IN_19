# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy>=2", "shapely>=2", "pyproj>=3.6"]
# ///
"""Real per-osiedle metrics, category scores, profile matches and heatmaps.

Replaces the demo mock (build_mock_scores.py): no hand overrides, no district
priors, no showcase floors. Every number comes from a dataset listed in SOURCES.

Inputs (local files, no network):
  data/boundaries/warszawa_osiedla.geojson     143 MSI osiedla (committed)
  data/poi_mikolaj/*.geojson, data/lines/utrudnienia.geojson,
  data/grid/czasy_przejazdu.geojson            Mikołaj's ETL (committed)
  data/poi/{education,amenity,culture}.geojson siatka ETL, OSM + city WFS (gitignored,
                                               rebuild: cd data/scripts/siatka && uv run siatka run)
  data/raw/osm/*.json                          Overpass cache of siatka (parks/forests
                                               polygons, gastronomy amenity types)
  data/raw/city_address_points/*.json          city address points (anchor of each osiedle)
  data/raw/noise/                              GIOŚ HAŁAS contours (data/scripts/noise/)

Rule for "nearby": every *_1km metric counts objects within 1 km (straight line)
of the osiedle ANCHOR = the address point nearest to the mean of all city address
points inside the osiedle (the centre of its built-up area, always inside the
polygon). *_in metrics count objects inside the polygon. Distances are from the
anchor. Shares are of the polygon area. All geometry in EPSG:2180 (metres).

Scores: each category is a weighted mean of percentile ranks (across the 143
osiedla) of its metrics (CATEGORY_METRICS), then percentile-ranked again -> 0-100.
Profile match = weighted mean of the 10 category scores with PROFILE_WEIGHTS
from application/src/app/dictionary.ts.

Heatmaps: centres of the team grid cells (generate_grid.py) inside Warsaw; the same metrics per lattice point
(counts within 1 km, distances, noise/green share of the surrounding 1 km x 1 km),
percentile-ranked across lattice points.

Outputs (committed):
  application/public/data/osiedla-metrics.json
  application/public/data/osiedla-scores.json   {id: {student, rodzina, senior, cats, blurb}}
  application/public/data/heat.json             {bbox, spacing_m, profiles, points:[[lng,lat,wS,wR,wSn]]}
  application/public/data/heat-categories.json  {categories, spacing_m, points:[[lng,lat,c1..c10]]}

Run: data/scripts/siatka/.venv/bin/python -I data/scripts/build_osiedle_metrics.py
 or: uv run --script data/scripts/build_osiedle_metrics.py
"""

from __future__ import annotations

import json
import re
import statistics
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import Point, Polygon, shape

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "data/scripts/noise"))
sys.path.insert(0, str(ROOT / "data/scripts"))
import generate_grid  # noqa: E402
import gios_noise  # noqa: E402
from osm_geometry import element_polygons, find_green_cache  # noqa: E402

OSIEDLA = ROOT / "data/boundaries/warszawa_osiedla.geojson"
MIK = ROOT / "data/poi_mikolaj"
POI = ROOT / "data/poi"
RAW = ROOT / "data/raw"
TRAVEL = ROOT / "data/grid/czasy_przejazdu.geojson"
ROADWORKS = ROOT / "data/lines/utrudnienia.geojson"
DICTIONARY = ROOT / "application/src/app/dictionary.ts"
OUT = ROOT / "application/public/data"

PROFILES = ("student", "rodzina", "senior")
CATS = ("cisza", "zielen", "komunikacja", "gastronomia", "sport",
        "kultura", "edukacja", "zdrowie", "zakupy", "zycieNocne")
FEATURED = ("muranow", "natolin", "stare-bielany")
R = 1000.0           # "nearby" radius
HEAT_STEP = float(generate_grid.CELL_SIZE_M)  # heat points = centres of the team grid cells
RASTER = 50.0        # raster for noise/green share around heat points
EVENT_DAYS = 30
MIN_GREEN_M2 = 10_000  # parks/forests >= 1 ha (same as siatka)

TO_2180 = Transformer.from_crs(4326, 2180, always_xy=True)
TO_4326 = Transformer.from_crs(2180, 4326, always_xy=True)

# ------------------------------------------------------------------ sources
SOURCES = {
    "osm": {"name": "OpenStreetMap (Overpass API), siatka ETL", "license": "ODbL 1.0 — © współtwórcy OpenStreetMap",
            "file": "data/poi/*.geojson, data/raw/osm/"},
    "wfs": {"name": "WFS m.st. Warszawy (BIBLIOTEKI, UNIWERSYTETY_TRZECIEGO_WIEKU, punkty adresowe)",
            "license": "Ponowne wykorzystanie bezpłatne, źródło: Urząd m.st. Warszawy", "file": "data/poi/culture.geojson"},
    "um_stops_gtfs": {"name": "dane.um.warszawa.pl przystanki + GTFS Warszawa (M. Kuranowski), dzień roboczy",
                      "license": "CC BY — Urząd m.st. Warszawy; ZTM (dane), © OSM", "file": "data/poi_mikolaj/transit.geojson"},
    "um_aed": {"name": "dane.um.warszawa.pl — defibrylatory AED", "license": "CC BY — Urząd m.st. Warszawy",
               "file": "data/poi_mikolaj/amenities.geojson"},
    "um_events": {"name": "dane.um.warszawa.pl — kalendarz wydarzeń", "license": "CC BY — Urząd m.st. Warszawy",
                  "file": "data/poi_mikolaj/culture.geojson"},
    "um_sport": {"name": "dane.um.warszawa.pl — otwarte boiska, zajęcia sportowe", "license": "CC BY — Urząd m.st. Warszawy",
                 "file": "data/poi_mikolaj/sport.geojson"},
    "um_air": {"name": "dane.um.warszawa.pl — monitoring jakości powietrza (pomiar godzinowy)",
               "license": "CC BY — Urząd m.st. Warszawy", "file": "data/poi_mikolaj/environment.geojson"},
    "um_bo": {"name": "dane.um.warszawa.pl — budżet obywatelski 2019–2027 (w realizacji + zrealizowane)",
              "license": "CC BY — Urząd m.st. Warszawy", "file": "data/poi_mikolaj/future.geojson"},
    "um_roadworks": {"name": "dane.um.warszawa.pl — utrudnienia w ruchu drogowym", "license": "CC BY — Urząd m.st. Warszawy",
                     "file": "data/lines/utrudnienia.geojson"},
    "gtfs_travel": {"name": "GTFS Warszawa, routing Mikołaja (przyjazd 07:30–09:00, dzień roboczy)",
                    "license": "ZTM Warszawa (dane), M. Kuranowski (GTFS)", "file": "data/grid/czasy_przejazdu.geojson"},
    "gios_noise": {"name": "GIOŚ HAŁAS API — strategiczne mapy hałasu 2022 (dane 2021), Lden i Lnight, drogi + kolej z tramwajem",
                   "license": "CC BY 4.0 — Główny Inspektorat Ochrony Środowiska", "file": "data/raw/noise/ (cache)"},
}
METHODS = {
    "count_in": "liczba obiektów wewnątrz granicy osiedla (MSI)",
    "count_1km": "liczba obiektów w promieniu 1 km od punktu odniesienia osiedla (punkt adresowy najbliższy średniej wszystkich punktów adresowych osiedla)",
    "sum_1km": "suma wartości obiektów w promieniu 1 km od punktu odniesienia",
    "sum_in": "suma wartości obiektów wewnątrz granicy osiedla",
    "unique_1km": "liczba unikalnych wartości w promieniu 1 km od punktu odniesienia",
    "nearest_m": "odległość w linii prostej od punktu odniesienia do najbliższego obiektu (m)",
    "area_share": "udział powierzchni osiedla (%)",
    "area_share_1km": "udział powierzchni koła o promieniu 1 km wokół punktu odniesienia (%)",
    "nearest_value": "wartość z najbliższego czujnika",
    "median_cells": f"mediana z komórek siatki {generate_grid.CELL_SIZE_M} m, których środek leży w osiedlu",
}

# ------------------------------------------------------------------ helpers


def to_xy(lng, lat):
    x, y = TO_2180.transform(np.asarray(lng, float), np.asarray(lat, float))
    return np.asarray(x), np.asarray(y)


def geom_2180(g):
    return shapely.transform(g, lambda c: np.column_stack(TO_2180.transform(c[:, 0], c[:, 1])))


def read_features(path: Path) -> list[dict]:
    return json.loads(path.read_text())["features"]


class Layer:
    """Points in EPSG:2180 with optional per-point values."""

    def __init__(self, feats: list[dict], **values):
        coords = np.array([f["geometry"]["coordinates"][:2] for f in feats], float).reshape(-1, 2)
        self.x, self.y = to_xy(coords[:, 0], coords[:, 1]) if len(coords) else (np.zeros(0), np.zeros(0))
        self.feats = feats
        self.values = {k: np.asarray([fn(f) for f in feats], float) for k, fn in values.items()}

    def __len__(self):
        return len(self.x)


def points(path: Path, subtypes: set[str], keep=lambda f: True) -> list[dict]:
    return [f for f in read_features(path)
            if f["properties"].get("subtype") in subtypes and (f.get("geometry") or {}).get("type") == "Point" and keep(f)]


def dists(layer: Layer, px: np.ndarray, py: np.ndarray, chunk: int = 2000):
    """Yield (slice, distance matrix chunk [n_pts, n_layer])."""
    for i in range(0, len(px), chunk):
        sl = slice(i, i + chunk)
        dx = px[sl, None] - layer.x[None, :]
        dy = py[sl, None] - layer.y[None, :]
        yield sl, np.hypot(dx, dy)


def count_within(layer: Layer, px, py, r=R, weight: str | None = None):
    out = np.zeros(len(px))
    if not len(layer):
        return out
    w = layer.values[weight] if weight else None
    for sl, d in dists(layer, px, py):
        m = d <= r
        out[sl] = (m * w[None, :]).sum(1) if w is not None else m.sum(1)
    return out


def nearest(layer: Layer, px, py):
    out = np.full(len(px), np.nan)
    idx = np.full(len(px), -1)
    if not len(layer):
        return out, idx
    for sl, d in dists(layer, px, py):
        idx[sl] = d.argmin(1)
        out[sl] = d.min(1)
    return out, idx


def pct_rank(vals, higher_better=True) -> np.ndarray:
    """0..1 percentile rank, ties share their mean rank; NaN = worst."""
    a = np.asarray(vals, float)
    x = a if higher_better else -a
    x = np.where(np.isnan(x), -np.inf, x)
    n = len(x)
    _, inv, counts = np.unique(x, return_inverse=True, return_counts=True)
    cum = np.cumsum(counts)
    avg = (cum - counts + cum - 1) / 2.0
    return avg[inv] / max(n - 1, 1)


def pl(n: int, one: str, few: str, many: str) -> str:
    n = abs(int(n))
    if n == 1:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


def fmt_int(n) -> str:
    return f"{int(round(n)):,}".replace(",", " ")


def read_profile_weights() -> dict:
    src = DICTIONARY.read_text()
    block = src[src.index("export const PROFILE_WEIGHTS"):]
    block = block[:block.index("\n}\n")]
    out = {}
    for prof in PROFILES:
        m = re.search(rf"{prof}:\s*\{{([^}}]*)\}}", block)
        out[prof] = {k: float(v) for k, v in re.findall(r"(\w+):\s*([\d.]+)", m.group(1))}
        assert set(out[prof]) == set(CATS), (prof, out[prof])
    return out


def find_osm_cache(predicate) -> Path:
    for p in sorted((RAW / "osm").glob("*.json")):
        if p.name.endswith(".meta.json"):
            continue
        els = json.loads(p.read_text())["elements"]
        if els and predicate(els):
            return p
    raise FileNotFoundError("OSM cache not found")


def share_of(els, key, values, min_share=0.8):
    hits = sum(1 for e in els if e.get("tags", {}).get(key) in values)
    return hits / len(els) >= min_share


# ------------------------------------------------------------------ load
def load():
    print("loading inputs ...")
    osiedla = []
    for f in read_features(OSIEDLA):
        p = f["properties"]
        poly = geom_2180(shape(f["geometry"]))
        shapely.prepare(poly)
        osiedla.append({"id": p["id"], "name": p["name"], "district": p["district"],
                        "area_km2": p["area_km2"], "poly": poly})

    L: dict[str, Layer] = {}
    edu = POI / "education.geojson"
    for st in ("kindergarten", "school", "high_school", "university"):
        L[st] = Layer(points(edu, {st}))
    am = POI / "amenity.geojson"
    for st in ("clinic", "pharmacy", "supermarket", "playground"):
        L[st] = Layer(points(am, {st}))
    cu = POI / "culture.geojson"
    for st in ("gastronomy", "library", "utw"):
        L[st] = Layer(points(cu, {st}))
    # bars and pubs: amenity type of the same OSM objects from the Overpass cache
    gastro_raw = find_osm_cache(lambda e: share_of(e, "amenity", {"restaurant", "cafe", "bar", "pub"}))
    amenity_of = {f"{e['type'][0]}{e['id']}": e.get("tags", {}).get("amenity") for e in json.loads(gastro_raw.read_text())["elements"]}
    L["bar_pub"] = Layer([f for f in L["gastronomy"].feats if amenity_of.get(f["properties"]["sourceId"]) in ("bar", "pub")])

    tr = MIK / "transit.geojson"
    L["stop"] = Layer(points(tr, {"stop"}), dep=lambda f: f["properties"]["meta"].get("odjazdy_dzien") or 0)
    L["metro"] = Layer(points(tr, {"metro_station"}))
    L["rail"] = Layer(points(tr, {"rail_station"}))
    L["aed"] = Layer(points(MIK / "amenities.geojson", {"aed"}))

    culture = json.loads((MIK / "culture.geojson").read_text())
    ref_day = datetime.fromisoformat(culture["generatedAt"]).date()
    end_day = ref_day + timedelta(days=EVENT_DAYS)

    def in_window(f):
        for t in f["properties"]["meta"].get("terminy") or []:
            d0 = datetime.fromisoformat(t["od"]).date()
            d1 = datetime.fromisoformat(t.get("do") or t["od"]).date()
            if d0 < end_day and d1 >= ref_day:
                return True
        return False

    L["event30"] = Layer(points(MIK / "culture.geojson", {"event"}, in_window))
    sp = MIK / "sport.geojson"
    L["pitch"] = Layer(points(sp, {"pitch"}), objects=lambda f: f["properties"]["meta"].get("liczba_obiektow") or 1)
    L["sports_class"] = Layer(points(sp, {"sports_class"}))
    # a PM2.5 of exactly 0 µg/m³ is a failed reading (e.g. Warszawa-12860: PM1 0, PM2.5 0, PM10 0.27), not clean air
    L["air"] = Layer(points(MIK / "environment.geojson", {"air_sensor"}, lambda f: (f["properties"]["meta"].get("pm25") or 0) > 0),
                     pm25=lambda f: f["properties"]["meta"]["pm25"])
    air_time = max(f["properties"]["meta"].get("czas_pomiaru") or "" for f in L["air"].feats)
    L["bo"] = Layer(points(MIK / "future.geojson", {"bo_project", "bo_done"}),
                    cost=lambda f: float(f["properties"]["meta"].get("koszt_zl") or 0))

    # address points -> anchors
    addr_path = next(p for p in (RAW / "city_address_points").glob("*.json") if not p.name.endswith(".meta.json"))
    addr = np.array([f["geometry"]["coordinates"][:2] for f in read_features(addr_path) if f.get("geometry")], float)
    ax, ay = to_xy(addr[:, 0], addr[:, 1])

    # green polygons (>= 1 ha): ways and multipolygon relations with their holes, as in siatka
    green_raw = find_green_cache(RAW / "osm")
    green = []
    for el in json.loads(green_raw.read_text())["elements"]:
        for pg in element_polygons(el):
            pg = shapely.make_valid(shapely.transform(pg, lambda c: np.column_stack(to_xy(c[:, 0], c[:, 1]))))
            if pg.area >= MIN_GREEN_M2:
                green.append(pg)
    green_union = shapely.make_valid(shapely.union_all(green))
    shapely.prepare(green_union)
    green_tree = shapely.STRtree(green)

    # travel time cells
    cells = []
    for f in read_features(TRAVEL):
        ring = f["geometry"]["coordinates"][0][:4]
        lng = sum(p[0] for p in ring) / 4
        lat = sum(p[1] for p in ring) / 4
        t = f["properties"]["t"]["centrum"]
        cells.append((lng, lat, {m: (v[0] if v else None) for m, v in t.items()}))
    cx, cy = to_xy([c[0] for c in cells], [c[1] for c in cells])
    travel = {"x": cx, "y": cy, "t": [c[2] for c in cells]}

    roadworks = [geom_2180(shape(f["geometry"])) for f in read_features(ROADWORKS)]
    rw_tree = shapely.STRtree(roadworks)

    # Noise is required: "cisza" is defined only by the strategic noise maps, never by proxies.
    try:
        noise = gios_noise.load_unions("LDWN")
        noise_night = gios_noise.load_unions("LN")
    except FileNotFoundError as exc:
        raise SystemExit(f"noise unavailable: {exc}")
    for d in (*noise.values(), *noise_night.values()):
        for g in d.values():
            shapely.prepare(g)

    print("  " + ", ".join(f"{k} {len(v)}" for k, v in L.items()))
    # A failed download must not turn into "0 objects nearby": missing data is not zero.
    empty = [k for k, v in L.items() if len(v) == 0] + [k for k, v in (("addresses", ax), ("green", green),
                                                                       ("travel cells", cells)) if len(v) == 0]
    if empty:
        raise SystemExit(f"empty input layers {empty}: re-run the ETL that produces them instead of writing zeros")
    print(f"  addresses {len(ax)}, green polygons {len(green)}, travel cells {len(cells)}, road works {len(roadworks)}, "
          f"events window {ref_day}..{end_day}")
    return dict(osiedla=osiedla, L=L, ax=ax, ay=ay, green=green, green_union=green_union, green_tree=green_tree,
                travel=travel, roadworks=roadworks, rw_tree=rw_tree, noise=noise, noise_night=noise_night, ref_day=ref_day,
                air_time=air_time)


def assign(osiedla, x, y) -> np.ndarray:
    """Index of the osiedle containing each point, -1 outside."""
    out = np.full(len(x), -1)
    for k, o in enumerate(osiedla):
        b = o["poly"].bounds
        cand = np.where((out < 0) & (x >= b[0]) & (x <= b[2]) & (y >= b[1]) & (y <= b[3]))[0]
        if len(cand):
            hit = shapely.contains_xy(o["poly"], x[cand], y[cand])
            out[cand[hit]] = k
    return out


# ------------------------------------------------------------------ metrics
# key: (label, unit, source, method)
METRIC_DEFS: dict[str, tuple[str, str, str, str]] = {}


def mdef(key, label, unit, source, method):
    METRIC_DEFS[key] = (label, unit, source, method)


COUNT_LAYERS = [  # layer, key stem, label, source
    ("kindergarten", "kindergartens", "Przedszkola", "osm"),
    ("school", "schools", "Szkoły podstawowe", "osm"),
    ("high_school", "high_schools", "Szkoły średnie", "osm"),
    ("university", "universities", "Uczelnie", "osm"),
    ("clinic", "clinics", "Przychodnie i gabinety lekarskie", "osm"),
    ("pharmacy", "pharmacies", "Apteki", "osm"),
    ("supermarket", "supermarkets", "Supermarkety", "osm"),
    ("gastronomy", "gastronomy", "Gastronomia (restauracje, kawiarnie, bary, puby)", "osm"),
    ("bar_pub", "bars_pubs", "Bary i puby", "osm"),
    ("playground", "playgrounds", "Place zabaw", "osm"),
    ("library", "libraries", "Biblioteki", "wfs"),
    ("utw", "utw", "Uniwersytety trzeciego wieku", "wfs"),
    ("event30", "events_30d", f"Punkty wydarzeń w ciągu {EVENT_DAYS} dni", "um_events"),
    ("aed", "aed", "Defibrylatory AED", "um_aed"),
    ("stop", "stops", "Przystanki (słupki) autobus/tramwaj", "um_stops_gtfs"),
    ("pitch", "pitches", "Szkoły z otwartymi boiskami", "um_sport"),
    ("sports_class", "sports_classes", "Zajęcia sportowe (oferty)", "um_sport"),
    ("bo", "bo_projects", "Projekty budżetu obywatelskiego 2019–2027 (lokalizacje)", "um_bo"),
]
NEAREST_LAYERS = [
    ("metro", "metro_dist_m", "Najbliższa stacja metra", "um_stops_gtfs"),
    ("rail", "rail_dist_m", "Najbliższa stacja kolei (SKM/KM)", "um_stops_gtfs"),
    ("kindergarten", "kindergarten_dist_m", "Najbliższe przedszkole", "osm"),
    ("school", "school_dist_m", "Najbliższa szkoła podstawowa", "osm"),
    ("clinic", "clinic_dist_m", "Najbliższa przychodnia", "osm"),
    ("pharmacy", "pharmacy_dist_m", "Najbliższa apteka", "osm"),
    ("supermarket", "supermarket_dist_m", "Najbliższy supermarket", "osm"),
]
for _, stem, label, src in COUNT_LAYERS:
    mdef(f"{stem}_in", label, "szt.", src, "count_in")
    mdef(f"{stem}_1km", label, "szt.", src, "count_1km")
for _, key, label, src in NEAREST_LAYERS:
    mdef(key, label, "m", src, "nearest_m")
mdef("departures_1km", "Odjazdy w dzień roboczy z przystanków w 1 km", "odjazdy/dzień", "um_stops_gtfs", "sum_1km")
mdef("departures_in", "Odjazdy w dzień roboczy z przystanków w osiedlu", "odjazdy/dzień", "um_stops_gtfs", "sum_in")
mdef("lines_1km", "Linie autobusowe i tramwajowe w 1 km", "linie", "um_stops_gtfs", "unique_1km")
mdef("sport_venues_1km", "Miejsca zajęć sportowych", "szt.", "um_sport", "unique_1km")
mdef("pitch_objects_1km", "Boiska w szkołach (obiekty)", "szt.", "um_sport", "sum_1km")
mdef("bo_cost_in_zl", "Koszt projektów BO w osiedlu", "zł", "um_bo", "sum_in")
mdef("bo_cost_1km_zl", "Koszt projektów BO w 1 km", "zł", "um_bo", "sum_1km")
mdef("green_share", "Parki i lasy (≥ 1 ha)", "%", "osm", "area_share")
mdef("green_share_1km", "Parki i lasy (≥ 1 ha) w 1 km", "%", "osm", "area_share_1km")
mdef("green_dist_m", "Najbliższy park lub las (krawędź, ≥ 1 ha)", "m", "osm", "nearest_m")
mdef("pm25_ugm3", "PM2.5", "µg/m³", "um_air", "nearest_value")
mdef("pm25_sensor_dist_m", "Odległość do czujnika PM2.5", "m", "um_air", "nearest_m")
for t in (55, 60, 65, 70):
    mdef(f"noise_lden{t}_share", f"Hałas drogowy lub kolejowy (z tramwajem) Lden ≥ {t} dB", "%", "gios_noise", "area_share")
mdef("noise_road_lden60_share", "Hałas drogowy Lden ≥ 60 dB", "%", "gios_noise", "area_share")
mdef("noise_rail_lden60_share", "Hałas kolejowy i tramwajowy Lden ≥ 60 dB", "%", "gios_noise", "area_share")
for t in (50, 55, 60):
    mdef(f"noise_lnight{t}_share", f"Hałas nocny drogowy lub kolejowy (z tramwajem) Lnight ≥ {t} dB", "%", "gios_noise", "area_share")
for mode in ("wszystkie", "autobus", "tramwaj", "metro", "kolej"):
    mdef(f"travel_centrum_{mode}_min", f"Dojazd do centrum (Rondo Dmowskiego), {mode}", "min", "gtfs_travel", "median_cells")
mdef("roadworks_in", "Utrudnienia w ruchu (aktualne)", "szt.", "um_roadworks", "count_in")
mdef("roadworks_1km", "Utrudnienia w ruchu (aktualne) w 1 km", "szt.", "um_roadworks", "count_1km")

# category -> [(metric, higher_is_better, weight)]
CATEGORY_METRICS = {
    # only noise from the strategic noise maps: day-evening-night and night, two thresholds each, equal weights
    "cisza": [("noise_lden60_share", False, 0.25), ("noise_lden65_share", False, 0.25),
              ("noise_lnight50_share", False, 0.25), ("noise_lnight55_share", False, 0.25)],
    "zielen": [("green_share", True, 0.4), ("green_share_1km", True, 0.3), ("green_dist_m", False, 0.3)],
    "komunikacja": [("departures_1km", True, 0.3), ("lines_1km", True, 0.1), ("metro_dist_m", False, 0.2),
                    ("rail_dist_m", False, 0.1), ("travel_centrum_wszystkie_min", False, 0.3)],
    "gastronomia": [("gastronomy_1km", True, 1.0)],
    "sport": [("pitches_1km", True, 0.45), ("sport_venues_1km", True, 0.35), ("playgrounds_1km", True, 0.2)],
    "kultura": [("libraries_1km", True, 0.4), ("events_30d_1km", True, 0.45), ("utw_1km", True, 0.15)],
    "edukacja": [("kindergartens_1km", True, 0.35), ("schools_1km", True, 0.35), ("high_schools_1km", True, 0.15),
                 ("kindergarten_dist_m", False, 0.075), ("school_dist_m", False, 0.075)],
    "zdrowie": [("clinics_1km", True, 0.4), ("pharmacies_1km", True, 0.35), ("clinic_dist_m", False, 0.1),
                ("aed_1km", True, 0.15)],
    "zakupy": [("supermarkets_1km", True, 0.7), ("supermarket_dist_m", False, 0.3)],
    "zycieNocne": [("bars_pubs_1km", True, 0.5), ("gastronomy_1km", True, 0.2), ("universities_1km", True, 0.15),
                   ("events_30d_1km", True, 0.15)],
}


def unique_within(layer: Layer, px, py, keyfn, r=R):
    out = np.zeros(len(px))
    keys = [keyfn(f) for f in layer.feats]
    for sl, d in dists(layer, px, py):
        for i, row in enumerate(d <= r):
            s = set()
            for j in np.where(row)[0]:
                s.update(keys[j])
            out[sl.start + i] = len(s)
    return out


def point_metrics(D, px, py) -> dict[str, np.ndarray]:
    """Metrics that depend only on a point (anchor or heat lattice point)."""
    L = D["L"]
    m = {}
    for layer, stem, _, _ in COUNT_LAYERS:
        m[f"{stem}_1km"] = count_within(L[layer], px, py)
    for layer, key, _, _ in NEAREST_LAYERS:
        m[key] = nearest(L[layer], px, py)[0]
    m["departures_1km"] = count_within(L["stop"], px, py, weight="dep")
    m["pitch_objects_1km"] = count_within(L["pitch"], px, py, weight="objects")
    m["bo_cost_1km_zl"] = count_within(L["bo"], px, py, weight="cost")
    m["lines_1km"] = unique_within(L["stop"], px, py, lambda f: f["properties"]["meta"].get("linie") or [])
    m["sport_venues_1km"] = unique_within(
        L["sports_class"], px, py,
        lambda f: [(round(f["geometry"]["coordinates"][0], 4), round(f["geometry"]["coordinates"][1], 4))])
    dist, idx = nearest(L["air"], px, py)
    m["pm25_ugm3"] = np.where(idx >= 0, L["air"].values["pm25"][idx], np.nan)
    m["pm25_sensor_dist_m"] = dist
    pts = shapely.points(px, py)
    _, gd = D["green_tree"].query_nearest(pts, return_distance=True, all_matches=False)
    m["green_dist_m"] = gd
    pairs = D["rw_tree"].query(pts, predicate="dwithin", distance=R)
    m["roadworks_1km"] = np.bincount(pairs[0], minlength=len(px)).astype(float)
    return m


def osiedle_metrics(D):
    os_ = D["osiedla"]
    L = D["L"]
    n = len(os_)
    # anchors
    a_idx = assign(os_, D["ax"], D["ay"])
    anchors = np.zeros((n, 2))
    n_addr = np.zeros(n, int)
    for k, o in enumerate(os_):
        sel = np.where(a_idx == k)[0]
        n_addr[k] = len(sel)
        if len(sel):
            mx, my = D["ax"][sel].mean(), D["ay"][sel].mean()
            j = sel[np.argmin(np.hypot(D["ax"][sel] - mx, D["ay"][sel] - my))]
            anchors[k] = D["ax"][j], D["ay"][j]
        else:
            p = o["poly"].point_on_surface()
            anchors[k] = p.x, p.y
    px, py = anchors[:, 0], anchors[:, 1]
    M = point_metrics(D, px, py)

    # inside-polygon counts
    for layer, stem, _, _ in COUNT_LAYERS:
        idx = assign(os_, L[layer].x, L[layer].y)
        M[f"{stem}_in"] = np.bincount(idx[idx >= 0], minlength=n).astype(float)
        if layer == "stop":
            M["departures_in"] = np.bincount(idx[idx >= 0], weights=L["stop"].values["dep"][idx >= 0], minlength=n)
        if layer == "bo":
            M["bo_cost_in_zl"] = np.bincount(idx[idx >= 0], weights=L["bo"].values["cost"][idx >= 0], minlength=n)

    # shares
    gu = D["green_union"]
    M["green_share"] = np.array([100 * o["poly"].intersection(gu).area / o["poly"].area for o in os_])
    circles = [Point(x, y).buffer(R, quad_segs=32) for x, y in anchors]
    M["green_share_1km"] = np.array([100 * c.intersection(gu).area / c.area for c in circles])
    noise, night = D["noise"], D["noise_night"]
    for t in (55, 60, 65, 70):
        M[f"noise_lden{t}_share"] = np.array([100 * o["poly"].intersection(noise["any"][t]).area / o["poly"].area for o in os_])
    for s in ("road", "rail"):
        M[f"noise_{s}_lden60_share"] = np.array([100 * o["poly"].intersection(noise[s][60]).area / o["poly"].area for o in os_])
    for t in (50, 55, 60):
        M[f"noise_lnight{t}_share"] = np.array([100 * o["poly"].intersection(night["any"][t]).area / o["poly"].area for o in os_])

    # travel times: median of cells whose centre lies in the osiedle
    tv = D["travel"]
    c_idx = assign(os_, tv["x"], tv["y"])
    for mode in ("wszystkie", "autobus", "tramwaj", "metro", "kolej"):
        vals = np.full(n, np.nan)
        for k in range(n):
            v = [tv["t"][i][mode] for i in np.where(c_idx == k)[0] if tv["t"][i][mode] is not None]
            if v:
                vals[k] = statistics.median(v)
        M[f"travel_centrum_{mode}_min"] = vals
    if np.isnan(M["travel_centrum_wszystkie_min"]).any():  # tiny osiedla without a cell centre: nearest cell
        for k in np.where(np.isnan(M["travel_centrum_wszystkie_min"]))[0]:
            j = int(np.argmin(np.hypot(tv["x"] - px[k], tv["y"] - py[k])))
            M["travel_centrum_wszystkie_min"][k] = tv["t"][j]["wszystkie"] if tv["t"][j]["wszystkie"] is not None else np.nan

    M["roadworks_in"] = np.array([sum(1 for g in D["roadworks"] if g.intersects(o["poly"])) for o in os_], float)
    return M, anchors, n_addr


def category_scores(M: dict[str, np.ndarray], n: int) -> dict[str, np.ndarray]:
    cats = {}
    for c, parts in CATEGORY_METRICS.items():
        acc = np.zeros(n)
        tw = 0.0
        for key, hib, w in parts:
            v = M[key]
            if np.isnan(v).all():
                continue  # dataset unavailable -> drop the metric, renormalise
            acc += w * pct_rank(v, hib)
            tw += w
        cats[c] = pct_rank(acc / tw) if tw else np.full(n, np.nan)
    return cats


# ------------------------------------------------------------------ heat lattice
def raster_share(geom, bbox, step=RASTER):
    """Boolean raster of `geom` over bbox, returned with origin for windowed shares."""
    x0, y0, x1, y1 = bbox
    xs = np.arange(x0 + step / 2, x1, step)
    ys = np.arange(y0 + step / 2, y1, step)
    gx, gy = np.meshgrid(xs, ys)
    inside = shapely.contains_xy(geom, gx.ravel(), gy.ravel()).reshape(gx.shape)
    sat = np.pad(inside.astype(np.int32).cumsum(0).cumsum(1), ((1, 0), (1, 0)))
    return sat, x0, y0, step, inside.shape


def window_share(r, px, py, half=500.0):
    sat, x0, y0, step, (ny, nx) = r
    i0 = np.clip(((px - half - x0) / step).astype(int), 0, nx)
    i1 = np.clip(((px + half - x0) / step).astype(int), 0, nx)
    j0 = np.clip(((py - half - y0) / step).astype(int), 0, ny)
    j1 = np.clip(((py + half - y0) / step).astype(int), 0, ny)
    tot = sat[j1, i1] - sat[j0, i1] - sat[j1, i0] + sat[j0, i0]
    area = np.maximum((i1 - i0) * (j1 - j0), 1)
    return 100.0 * tot / area


def heat(D, weights):
    os_ = D["osiedla"]
    union = shapely.union_all([o["poly"] for o in os_])
    x0, y0, x1, y1 = union.bounds
    # align to the team grid so every heat point is the centre of one grid cell (cell_id)
    e0, n0 = generate_grid.ORIGIN_E, generate_grid.ORIGIN_N
    x0 = e0 + np.floor((x0 - e0) / HEAT_STEP) * HEAT_STEP
    y0 = n0 + np.floor((y0 - n0) / HEAT_STEP) * HEAT_STEP
    xs = np.arange(x0 + HEAT_STEP / 2, x1, HEAT_STEP)
    ys = np.arange(y0 + HEAT_STEP / 2, y1, HEAT_STEP)
    gx, gy = np.meshgrid(xs, ys)
    gx, gy = gx.ravel(), gy.ravel()
    inside = assign(os_, gx, gy) >= 0
    px, py = gx[inside], gy[inside]
    print(f"heat lattice: {len(px)} points @ {HEAT_STEP:.0f} m")
    M = point_metrics(D, px, py)
    bbox = (x0 - 1000, y0 - 1000, x1 + 1000, y1 + 1000)
    M["green_share"] = window_share(raster_share(D["green_union"], bbox), px, py)
    M["green_share_1km"] = M["green_share"]
    for t in (60, 65):
        M[f"noise_lden{t}_share"] = window_share(raster_share(D["noise"]["any"][t], bbox), px, py)
    for t in (50, 55):
        M[f"noise_lnight{t}_share"] = window_share(raster_share(D["noise_night"]["any"][t], bbox), px, py)
    tv = D["travel"]
    cell_layer = Layer([])
    cell_layer.x, cell_layer.y = tv["x"], tv["y"]
    _, jj = nearest(cell_layer, px, py)
    M["travel_centrum_wszystkie_min"] = np.array([tv["t"][i]["wszystkie"] if tv["t"][i]["wszystkie"] is not None else np.nan
                                                  for i in jj], float)
    cats = category_scores(M, len(px))
    prof = {}
    for p in PROFILES:
        s = sum(weights[p][c] * cats[c] for c in CATS) / sum(weights[p].values())
        prof[p] = pct_rank(s)
    lng, lat = TO_4326.transform(px, py)
    cells = [generate_grid.cell_id(int((y - n0) // HEAT_STEP), int((x - e0) // HEAT_STEP)) for x, y in zip(px, py)]
    return lng, lat, cats, prof, union, cells


# ------------------------------------------------------------------ blurbs
def phrase(cat: str, m: dict) -> str:
    g = lambda k: m[k]  # noqa: E731
    if cat == "edukacja":
        k, s = int(g("kindergartens_1km")), int(g("schools_1km"))
        return (f"{k} {pl(k, 'przedszkole', 'przedszkola', 'przedszkoli')} i {s} "
                f"{pl(s, 'szkoła podstawowa', 'szkoły podstawowe', 'szkół podstawowych')} w promieniu 1 km")
    if cat == "komunikacja":
        n, dep = int(g("stops_1km")), int(g("departures_1km"))
        t = g("travel_centrum_wszystkie_min")
        out = (f"{n} {pl(n, 'przystanek', 'przystanki', 'przystanków')} i {fmt_int(dep)} "
               f"{pl(dep, 'odjazd', 'odjazdy', 'odjazdów')} dziennie w 1 km")
        if g("metro_dist_m") <= 1500:
            out += f", metro {fmt_int(round(g('metro_dist_m'), -1))} m"
        if not np.isnan(t):
            out += f", do centrum ok. {int(round(t))} min"
        return out
    if cat == "gastronomia":
        n = int(g("gastronomy_1km"))
        return f"{n} {pl(n, 'lokal gastronomiczny', 'lokale gastronomiczne', 'lokali gastronomicznych')} w 1 km"
    if cat == "zycieNocne":
        b, u = int(g("bars_pubs_1km")), int(g("universities_1km"))
        return (f"{b} {pl(b, 'bar lub pub', 'bary lub puby', 'barów lub pubów')}, {u} "
                f"{pl(u, 'uczelnia', 'uczelnie', 'uczelni')} w 1 km")
    if cat == "zielen":
        share, d = g("green_share"), g("green_dist_m")
        out = f"parki i lasy to {int(round(share))}% powierzchni osiedla"
        if d > 0:
            out += f", najbliższy park lub las {fmt_int(round(d, -1))} m"
        return out
    if cat == "cisza":
        v = g("noise_lden60_share")
        if np.isnan(v):
            n = int(g("gastronomy_1km"))
            return f"{n} {pl(n, 'lokal', 'lokale', 'lokali')} gastronomicznych w 1 km"
        return f"hałas drogowy lub kolejowy ≥ 60 dB na {int(round(v))}% powierzchni"
    if cat == "sport":
        p, v = int(g("pitches_1km")), int(g("sport_venues_1km"))
        return (f"{p} {pl(p, 'szkoła', 'szkoły', 'szkół')} z otwartymi boiskami i {v} "
                f"{pl(v, 'miejsce', 'miejsca', 'miejsc')} zajęć sportowych w 1 km")
    if cat == "kultura":
        b, e = int(g("libraries_1km")), int(g("events_30d_1km"))
        return (f"{b} {pl(b, 'biblioteka', 'biblioteki', 'bibliotek')} i {e} "
                f"{pl(e, 'wydarzenie', 'wydarzenia', 'wydarzeń')} w ciągu {EVENT_DAYS} dni w 1 km")
    if cat == "zdrowie":
        c, a = int(g("clinics_1km")), int(g("pharmacies_1km"))
        return (f"{c} {pl(c, 'przychodnia', 'przychodnie', 'przychodni')} i {a} "
                f"{pl(a, 'apteka', 'apteki', 'aptek')} w 1 km")
    if cat == "zakupy":
        s = int(g("supermarkets_1km"))
        out = f"{s} {pl(s, 'supermarket', 'supermarkety', 'supermarketów')} w 1 km"
        if s == 0:
            out += f", najbliższy {fmt_int(round(g('supermarket_dist_m'), -1))} m"
        return out
    raise KeyError(cat)


def blurb(prof, cats: dict, m: dict, weights) -> str:
    w = weights[prof]
    rel = [c for c in CATS if w[c] >= 0.1]
    strengths = sorted(rel, key=lambda c: (-cats[c], -w[c]))[:2]
    weak = min((c for c in rel if c not in strengths), key=lambda c: (cats[c], -w[c]))
    s = f"{phrase(strengths[0], m)}; {phrase(strengths[1], m)}. Słabiej: {phrase(weak, m)}."
    return s[0].upper() + s[1:]


# ------------------------------------------------------------------ main
def rnd(v, key):
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    unit = METRIC_DEFS[key][1]
    if unit in ("%", "µg/m³", "min"):
        return round(float(v), 1)
    return int(round(float(v)))


def main() -> int:
    weights = read_profile_weights()
    D = load()
    os_ = D["osiedla"]
    n = len(os_)
    M, anchors, n_addr = osiedle_metrics(D)
    missing = set(METRIC_DEFS) - set(M)
    assert not missing, missing
    cats = category_scores(M, n)
    match = {p: sum(weights[p][c] * cats[c] for c in CATS) / sum(weights[p].values()) for p in PROFILES}

    alng, alat = TO_4326.transform(anchors[:, 0], anchors[:, 1])
    rank = {p: {os_[i]["id"]: r + 1 for r, i in enumerate(np.argsort(-match[p], kind="stable"))} for p in PROFILES}

    metrics_out = {}
    scores_out = {}
    for k, o in enumerate(os_):
        mvals = {key: M[key][k] for key in METRIC_DEFS}
        cat_k = {c: int(round(100 * cats[c][k])) for c in CATS}
        match_k = {p: int(round(100 * match[p][k])) for p in PROFILES}
        blurbs = {p: blurb(p, cat_k, mvals, weights) for p in PROFILES}
        metrics_out[o["id"]] = {
            "name": o["name"], "district": o["district"], "area_km2": o["area_km2"],
            "anchor": [round(float(alng[k]), 5), round(float(alat[k]), 5)], "address_points": int(n_addr[k]),
            "metrics": {key: {"value": rnd(mvals[key], key), "unit": METRIC_DEFS[key][1],
                              "source": METRIC_DEFS[key][2], "method": METRIC_DEFS[key][3]} for key in METRIC_DEFS},
            "cats": cat_k, "match": match_k, "rank": {p: rank[p][o["id"]] for p in PROFILES}, "blurb": blurbs,
        }
        scores_out[o["id"]] = {**match_k, "cats": cat_k, "blurb": blurbs}

    meta = {
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "script": "data/scripts/build_osiedle_metrics.py",
        "rule": ("*_1km: obiekty w promieniu 1 km (linia prosta) od punktu odniesienia osiedla = punkt adresowy "
                 "najbliższy średniej wszystkich punktów adresowych w osiedlu; *_in: obiekty w granicy osiedla; "
                 "odległości od punktu odniesienia; udziały powierzchni osiedla. EPSG:2180."),
        "scores": ("kategoria = ranga percentylowa (0–100, wśród 143 osiedli) średniej ważonej rang percentylowych "
                   "jej metryk (category_metrics); dopasowanie profilu = średnia ważona kategorii wagami "
                   "PROFILE_WEIGHTS z application/src/app/dictionary.ts. Bez ręcznych korekt."),
        "events_window": [str(D["ref_day"]), str(D["ref_day"] + timedelta(days=EVENT_DAYS))],
        "pm25_measured_at": D["air_time"],
        "noise": "available" if D["noise"] else "unavailable",
        "sources": SOURCES, "methods": METHODS,
        "metric_labels": {k: v[0] for k, v in METRIC_DEFS.items()},
        "category_metrics": {c: [{"metric": k, "higher_is_better": h, "weight": w} for k, h, w in parts]
                             for c, parts in CATEGORY_METRICS.items()},
        "profile_weights": weights,
    }

    # heat
    lng, lat, hcats, hprof, union, cells = heat(D, weights)
    keep = np.maximum.reduce([hprof[p] ** 2 for p in PROFILES]) >= 0.05
    heat_pts = [[round(float(lng[i]), 5), round(float(lat[i]), 5), *[round(float(hprof[p][i] ** 2), 2) for p in PROFILES]]
                for i in np.where(keep)[0]]
    b = union.bounds
    (w_, e_), (s_, n_) = TO_4326.transform([b[0], b[2]], [b[1], b[3]])
    bbox = [round(w_, 5), round(s_, 5), round(e_, 5), round(n_, 5)]
    heat_out = {"bbox": bbox, "spacing_m": int(HEAT_STEP), "profiles": list(PROFILES), "points": heat_pts,
                "method": "percentyl dopasowania profilu wśród punktów siatki 250 m, podniesiony do kwadratu (kontrast); punkty < 0,05 pominięte"}
    hc_out = {"bbox": bbox, "spacing_m": int(HEAT_STEP), "categories": list(CATS),
              "method": "percentyl kategorii wśród punktów siatki 250 m (0–1), te same metryki co dla osiedli, liczone od punktu",
              "points": [[round(float(lng[i]), 5), round(float(lat[i]), 5), *[round(float(hcats[c][i]), 2) for c in CATS]]
                         for i in range(len(lng))]}
    grid_meta = {"version": generate_grid.GRID_VERSION, "crs": generate_grid.GRID_CRS,
                 "cellSizeM": generate_grid.CELL_SIZE_M, "origin": [generate_grid.ORIGIN_E, generate_grid.ORIGIN_N]}
    heat_out.update(grid=grid_meta, cell_ids=[cells[i] for i in np.where(keep)[0]])
    hc_out.update(grid=grid_meta, cell_ids=cells)

    OUT.mkdir(parents=True, exist_ok=True)
    paths = {
        "osiedla-metrics.json": {"meta": meta, "osiedla": metrics_out},
        "osiedla-scores.json": scores_out,
        "heat.json": heat_out,
        "heat-categories.json": hc_out,
    }
    for name, obj in paths.items():
        (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))
    return validate(metrics_out, scores_out, heat_out, hc_out, M)


def validate(metrics_out, scores_out, heat_out, hc_out, M) -> int:
    errors = []
    if len(scores_out) != 143:
        errors.append(f"expected 143 osiedla, got {len(scores_out)}")
    for oid, s in scores_out.items():
        for p in PROFILES:
            if not 0 <= s[p] <= 100:
                errors.append(f"{oid}.{p}={s[p]}")
            if not s["blurb"][p].endswith(".") or "nan" in s["blurb"][p]:
                errors.append(f"{oid} blurb {p}: {s['blurb'][p]}")
        if set(s["cats"]) != set(CATS):
            errors.append(f"{oid} cats")
    for c in CATS:
        v = [s["cats"][c] for s in scores_out.values()]
        if max(v) - min(v) < 70 or statistics.pstdev(v) < 20:
            errors.append(f"category {c} not differentiated: {min(v)}-{max(v)}")
    for f in (heat_out, hc_out):
        for pt in f["points"]:
            if not all(0 <= w <= 1 for w in pt[2:]):
                errors.append("heat weight out of range")
                break
    sizes = {n: (OUT / n).stat().st_size for n in ("osiedla-metrics.json", "osiedla-scores.json", "heat.json", "heat-categories.json")}
    if sizes["heat-categories.json"] > 1_500_000:
        errors.append("heat-categories.json > 1.5 MB")
    if sizes["heat.json"] > 700_000:
        errors.append("heat.json > 700 KB")
    # totals sanity: inside counts never exceed layer sizes
    print("\ncity totals (sum of *_in over osiedla):")
    for _, stem, label, _ in COUNT_LAYERS:
        print(f"  {stem:16s} {int(M[stem + '_in'].sum()):6d}")
    print(f"  departures/day  {int(M['departures_in'].sum()):,}")
    if not np.isnan(M["noise_lden60_share"]).all():
        print("  noise Lden>=60 share: median {:.1f}%, max {:.1f}%".format(np.median(M["noise_lden60_share"]),
                                                                          M["noise_lden60_share"].max()))

    names = {k: v["name"] for k, v in metrics_out.items()}
    print("\nprofile match ranges:")
    for p in PROFILES:
        v = [s[p] for s in scores_out.values()]
        print(f"  {p:8s} {min(v)}-{max(v)} (median {statistics.median(v)})")
    print("\nfeatured osiedla (honest ranks of 143):")
    for oid in FEATURED:
        r = metrics_out[oid]["rank"]
        print(f"  {names[oid]:20s} " + "  ".join(f"{p} #{r[p]} ({scores_out[oid][p]})" for p in PROFILES))
    for p in PROFILES:
        top = sorted(scores_out, key=lambda k: metrics_out[k]["rank"][p])[:10]
        print(f"\ntop 10 {p}: " + " | ".join(f"{names[k]} {scores_out[k][p]}" for k in top))
    for oid in FEATURED:
        for p in PROFILES:
            print(f"  blurb {oid}/{p}: {scores_out[oid]['blurb'][p]}")
    print("\nsizes: " + ", ".join(f"{k} {v / 1024:.0f} KB" for k, v in sizes.items()))
    print(f"heat points {len(heat_out['points'])}, heat-categories points {len(hc_out['points'])}")
    if errors:
        print("\nVALIDATION FAILED:\n  " + "\n  ".join(errors[:30]))
        return 1
    print("validation OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
