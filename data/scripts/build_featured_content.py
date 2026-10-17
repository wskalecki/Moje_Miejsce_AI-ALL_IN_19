# /// script
# requires-python = ">=3.11"
# dependencies = ["numpy>=2", "shapely>=2", "pyproj>=3.6"]
# ///
"""Content of the 3 featured osiedla -> application/src/mock/osiedla.ts (generated, do not edit by hand).

Every number in the output is either read from a committed dataset or derived here by an explicit
method; researched facts (timeline, prices, photos, place names) come from the hand-curated, cited
files data/featured/<slug>.json. Nothing is tuned by hand.

Inputs
  data/featured/<slug>.json                     curated + cited: highlights, route destinations,
                                                timeline (with sources), portal links, hero images,
                                                camera framing
  application/public/data/fine-metrics/index.json  RCN transaction median per MSI area
                                                (data/scripts/build_kwartal_metrics.py)
  data/rcn/lokale_mieszkalne.csv                RCN flat transactions of the whole city, filtered
                                                (data/scripts/rcn/fetch_rcn.py, git-ignored)
  application/public/data/osiedla-metrics.json  per-osiedle metrics, category scores, ranks
                                                (data/scripts/build_osiedle_metrics.py)
  application/public/data/osiedla-scores.json   cats + profile match (same script)
  data/boundaries/warszawa_osiedla.geojson      MSI polygons
  data/grid/czasy_przejazdu.geojson             public-transport times (GTFS ZTM, Mikołaj's router)
  data/raw/osm/<green cache>.json               OSM parks/forests polygons (siatka Overpass cache)
  application/public/data/3d/<slug>/traffic.json  hourly planned slowdown (data/scripts/osm3d/build_traffic.py)
  OSRM FOSSGIS (routing.openstreetmap.de, profiles foot / bike), cached in data/raw/featured_osrm/

Derived values and methods
  stats / match / rank   copied from osiedla-scores.json / osiedla-metrics.json (no overrides)
  metrics                selected keys of osiedla-metrics.json (value, unit, source)
  highlights.distanceM / walkMin, routes   OSRM foot / bike from the osiedle anchor (address point
                         nearest to the mean of all address points); for parks and forests the
                         destination is the nearest point of the OSM polygon edge
  commute.komunikacja    median over the grid cells (generate_grid.CELL_SIZE_M) whose centre lies in the MSI polygon of the
                         mean travel time (arrival 07:30-09:00, 10 slots) to each target
  commute.rower / pieszo OSRM bike / foot from the anchor to the target point (pieszo only <= 60 min)
  traffic                area median of traffic.json x 100 = planned slowdown of buses and trams vs
                         the fastest hour, % (ZTM timetable, not live traffic)
  timeline.statDeltas    each event's `effect` (new metro station, facility, park...) changes the
                         metrics of this osiedle (distance / count within 1 km / green share), then the
                         10 category scores are recomputed for all 143 osiedla with the same method as
                         build_osiedle_metrics.py (weighted mean of percentile ranks, re-ranked);
                         delta = score after the event - score before (cumulative in year order)
  summary / tagline      fixed template filled with numbers (summaryKind 'z-danych')
  prices                 RCN transaction medians (zł/m²): the MSI area from fine-metrics/index.json and
                         the whole city from the same filtered packages and period; no rent figures
                         (no open official source), no listings from commercial portals

Run: data/scripts/siatka/.venv/bin/python -I data/scripts/build_featured_content.py [--offline]
 or: uv run --script data/scripts/build_featured_content.py
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import statistics
import sys
import time
import urllib.request
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import LineString, Point, Polygon, shape
from shapely.ops import nearest_points

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_grid  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
FEATURED = ROOT / "data/featured"
METRICS = ROOT / "application/public/data/osiedla-metrics.json"
SCORES = ROOT / "application/public/data/osiedla-scores.json"
OSIEDLA_GEO = ROOT / "data/boundaries/warszawa_osiedla.geojson"
TRAVEL = ROOT / "data/grid/czasy_przejazdu.geojson"
GREEN_CACHE = ROOT / "data/raw/osm/e39479af49a915ad.json"
TRAFFIC = ROOT / "application/public/data/3d/{slug}/traffic.json"
KWARTAL_INDEX = ROOT / "application/public/data/fine-metrics/index.json"
RCN_CSV = ROOT / "data/rcn/lokale_mieszkalne.csv"
OSRM_CACHE = ROOT / "data/raw/featured_osrm"
OUT_TS = ROOT / "application/src/mock/osiedla.ts"

# order = profile order of the app (student, rodzina, senior)
SLUGS = ("muranow", "natolin", "stare-bielany")
PROFILES = ("student", "rodzina", "senior")
CATS = ("cisza", "zielen", "komunikacja", "gastronomia", "sport", "kultura", "edukacja", "zdrowie", "zakupy", "zycieNocne")
PROFILE_LABEL = {"student": "student", "rodzina": "rodzina z dziećmi", "senior": "senior"}
OSRM = "https://routing.openstreetmap.de/routed-{profile}/route/v1/driving/{a};{b}?overview=full&geometries=geojson"
UA = "OkolicaHackathon/1.0 (hackathon demo; featured osiedla content)"
OFFLINE = "--offline" in sys.argv
TODAY = "2026-10-17"

TO_2180 = Transformer.from_crs(4326, 2180, always_xy=True)
TO_4326 = Transformer.from_crs(2180, 4326, always_xy=True)

METRIC_KEYS = [  # shown in the panel as concrete numbers
    "kindergartens_1km", "schools_1km", "high_schools_1km", "universities_1km", "playgrounds_1km",
    "clinics_1km", "pharmacies_1km", "supermarkets_1km", "gastronomy_1km", "bars_pubs_1km",
    "libraries_1km", "events_30d_1km", "stops_1km", "departures_1km", "lines_1km", "metro_dist_m",
    "green_share_1km", "green_dist_m", "noise_lden60_share", "noise_lnight50_share", "travel_centrum_wszystkie_min",
]


def xy(lng, lat):
    return TO_2180.transform(lng, lat)


def dist_m(a, b) -> float:
    (x1, y1), (x2, y2) = xy(*a), xy(*b)
    return math.hypot(x1 - x2, y1 - y2)


def g2180(g):
    return shapely.transform(g, lambda c: np.column_stack(TO_2180.transform(c[:, 0], c[:, 1])))


def g4326(g):
    return shapely.transform(g, lambda c: np.column_stack(TO_4326.transform(c[:, 0], c[:, 1])))


def pl(n: int, one: str, few: str, many: str) -> str:
    n = abs(int(n))
    if n == 1:
        return one
    if 2 <= n % 10 <= 4 and not 12 <= n % 100 <= 14:
        return few
    return many


def fmt_int(n) -> str:
    return f"{int(round(n)):,}".replace(",", " ")


# ------------------------------------------------------------------ OSRM
_last_call = [0.0]


def osrm(profile: str, a, b) -> dict:
    url = OSRM.format(profile=profile, a=f"{a[0]:.5f},{a[1]:.5f}", b=f"{b[0]:.5f},{b[1]:.5f}")
    OSRM_CACHE.mkdir(parents=True, exist_ok=True)
    cf = OSRM_CACHE / (hashlib.sha1(url.encode()).hexdigest()[:16] + ".json")
    if cf.exists():
        return json.loads(cf.read_text())
    if OFFLINE:
        raise RuntimeError(f"OSRM cache miss in --offline mode: {url}")
    wait = 0.6 - (time.time() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            data = json.load(urllib.request.urlopen(req, timeout=60))
            break
        except Exception as exc:  # noqa: BLE001
            if attempt == 3:
                raise
            print(f"  OSRM retry ({exc})")
            time.sleep(3 * (attempt + 1))
    _last_call[0] = time.time()
    if data.get("code") != "Ok":
        raise RuntimeError(f"OSRM {data.get('code')} for {url}")
    r = data["routes"][0]
    out = {"url": url, "fetched_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "distance": r["distance"],
           "duration": r["duration"], "coordinates": r["geometry"]["coordinates"]}
    cf.write_text(json.dumps(out))
    return out


def simplify_line(coords, tol_m=2.0):
    line = g2180(LineString(coords)).simplify(tol_m, preserve_topology=False)
    return [[round(x, 5), round(y, 5)] for x, y in g4326(line).coords]


def minutes(sec: float) -> int:
    return max(1, int(round(sec / 60)))


# ------------------------------------------------------------------ green polygons
def load_green(ids: set[str]) -> dict[str, dict]:
    out = {}
    if not ids:
        return out
    for el in json.loads(GREEN_CACHE.read_text())["elements"]:
        key = f"{el['type']}/{el['id']}"
        if key not in ids:
            continue
        rings = []
        if el["type"] == "way" and el.get("geometry"):
            rings = [el["geometry"]]
        elif el["type"] == "relation":
            rings = [m["geometry"] for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
        if el["type"] == "way":
            polys = [Polygon([(p["lon"], p["lat"]) for p in r]) for r in rings if len(r) >= 4]
        else:
            # relation outer members are open segments: merge them into closed rings
            lines = [LineString([(p["lon"], p["lat"]) for p in r]) for r in rings if len(r) >= 2]
            merged = shapely.line_merge(shapely.union_all(lines))
            polys = list(shapely.get_parts(shapely.polygonize(list(shapely.get_parts(merged)))))
        if not polys:  # relation without member geometry in the cache -> Nominatim polygon (cached)
            polys = [shape(nominatim_polygon(key))]
        geom = shapely.make_valid(shapely.union_all([shapely.make_valid(p) for p in polys]))
        g = g2180(geom)
        out[key] = {"geom": geom, "geom2180": g, "area_ha": g.area / 10_000, "name": el.get("tags", {}).get("name")}
    missing = ids - set(out)
    if missing:
        raise SystemExit(f"green polygons not found in {GREEN_CACHE.name}: {sorted(missing)}")
    return out


def nominatim_polygon(key: str) -> dict:
    """GeoJSON polygon of an OSM object from Nominatim /lookup (cached in data/raw/featured_osm/)."""
    cache = ROOT / "data/raw/featured_osm" / (key.replace("/", "_") + ".json")
    if cache.exists():
        return json.loads(cache.read_text())
    if OFFLINE:
        raise RuntimeError(f"Nominatim cache miss in --offline mode: {key}")
    t, i = key.split("/")
    url = f"https://nominatim.openstreetmap.org/lookup?osm_ids={t[0].upper()}{i}&polygon_geojson=1&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    res = json.load(urllib.request.urlopen(req, timeout=60))
    time.sleep(1.1)
    geo = res[0]["geojson"]
    if geo["type"] not in ("Polygon", "MultiPolygon"):
        raise SystemExit(f"Nominatim returned {geo['type']} for {key}")
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(geo))
    return geo


def green_entry(anchor, g) -> list[float]:
    """Nearest point of the polygon edge to the anchor (lng, lat)."""
    p = Point(*xy(*anchor))
    poly = g["geom2180"]
    q = nearest_points(poly.boundary, p)[0] if not poly.contains(p) else p
    lng, lat = TO_4326.transform(q.x, q.y)
    return [round(lng, 5), round(lat, 5)]


# ------------------------------------------------------------------ scores (same method as build_osiedle_metrics.py)
def pct_rank(vals, higher_better=True) -> np.ndarray:
    a = np.asarray(vals, float)
    x = a if higher_better else -a
    x = np.where(np.isnan(x), -np.inf, x)
    n = len(x)
    _, inv, counts = np.unique(x, return_inverse=True, return_counts=True)
    cum = np.cumsum(counts)
    avg = (cum - counts + cum - 1) / 2.0
    return avg[inv] / max(n - 1, 1)


class Scorer:
    def __init__(self, metrics_json: dict):
        self.ids = list(metrics_json["osiedla"])
        self.cm = metrics_json["meta"]["category_metrics"]
        self.weights = metrics_json["meta"]["profile_weights"]
        keys = {p["metric"] for parts in self.cm.values() for p in parts}
        self.M = {k: np.array([np.nan if metrics_json["osiedla"][i]["metrics"][k]["value"] is None
                               else metrics_json["osiedla"][i]["metrics"][k]["value"] for i in self.ids], float)
                  for k in keys}

    def scores(self, idx: int, override: dict[str, float]) -> tuple[dict, dict]:
        n = len(self.ids)
        cats = {}
        for c, parts in self.cm.items():
            acc = np.zeros(n)
            tw = 0.0
            for p in parts:
                v = self.M[p["metric"]].copy()
                if p["metric"] in override:
                    v[idx] = override[p["metric"]]
                if np.isnan(v).all():
                    continue
                acc += p["weight"] * pct_rank(v, p["higher_is_better"])
                tw += p["weight"]
            cats[c] = pct_rank(acc / tw)
        cat_i = {c: int(round(100 * cats[c][idx])) for c in CATS}
        match_i = {}
        for prof, w in self.weights.items():
            s = sum(w[c] * cats[c] for c in CATS) / sum(w.values())
            match_i[prof] = int(round(100 * s[idx]))
        return cat_i, match_i


EFFECT_COUNT = {  # facility type -> (count metric, nearest-distance metric)
    "school": ("schools_1km", "school_dist_m"),
    "kindergarten": ("kindergartens_1km", "kindergarten_dist_m"),
    "high_school": ("high_schools_1km", None),
    "clinic": ("clinics_1km", "clinic_dist_m"),
    "supermarket": ("supermarkets_1km", "supermarket_dist_m"),
    "library": ("libraries_1km", None),
    "playground": ("playgrounds_1km", None),
}


def apply_effect(eff: dict, cur: dict, anchor, poly2180) -> list[str]:
    """Mutate `cur` (metric values) by the effect; return human-readable changes."""
    t = eff["type"]
    changes = []
    if t in ("metro_station", "rail_station"):
        key = "metro_dist_m" if t == "metro_station" else "rail_dist_m"
        d = dist_m(anchor, eff["coord"])
        if d < cur[key]:
            changes.append(f"{key}: {fmt_int(cur[key])} → {fmt_int(d)} m")
            cur[key] = round(d)
    elif t == "tram_line":
        near = [s for s in eff.get("stops", []) if dist_m(anchor, s) <= 1000]
        if near:
            lines = int(eff.get("lines") or 1)
            changes.append(f"lines_1km: {fmt_int(cur['lines_1km'])} → {fmt_int(cur['lines_1km'] + lines)} "
                           f"({len(near)} nowych przystanków w 1 km; liczba odjazdów nieznana, bez zmian)")
            cur["lines_1km"] += lines
    elif t in EFFECT_COUNT:
        cnt, dkey = EFFECT_COUNT[t]
        d = dist_m(anchor, eff["coord"])
        if d <= 1000:
            changes.append(f"{cnt}: {fmt_int(cur[cnt])} → {fmt_int(cur[cnt] + 1)}")
            cur[cnt] += 1
        if dkey and d < cur[dkey]:
            changes.append(f"{dkey}: {fmt_int(cur[dkey])} → {fmt_int(d)} m")
            cur[dkey] = round(d)
    elif t == "park":
        c = Point(*xy(*eff["coord"]))
        r = math.sqrt(float(eff["area_ha"]) * 10_000 / math.pi)
        park = c.buffer(r, quad_segs=32)
        a = Point(*xy(*anchor))
        d = max(0.0, a.distance(park))
        if d < cur["green_dist_m"]:
            changes.append(f"green_dist_m: {fmt_int(cur['green_dist_m'])} → {fmt_int(d)} m")
            cur["green_dist_m"] = round(d)
        circle = a.buffer(1000, quad_segs=64)
        add1 = 100 * park.intersection(circle).area / circle.area
        if add1 >= 0.05:
            new = min(100.0, cur["green_share_1km"] + add1)
            changes.append(f"green_share_1km: {cur['green_share_1km']:.1f} → {new:.1f}%")
            cur["green_share_1km"] = round(new, 1)
        add_in = 100 * park.intersection(poly2180).area / poly2180.area
        if add_in >= 0.05:
            new = min(100.0, cur["green_share"] + add_in)
            changes.append(f"green_share: {cur['green_share']:.1f} → {new:.1f}%")
            cur["green_share"] = round(new, 1)
    else:
        raise SystemExit(f"unknown effect type {t}")
    return changes


# ------------------------------------------------------------------ text templates (z danych)
def phrase(cat: str, m: dict, profile: str) -> str:
    v = lambda k: m[k]["value"]  # noqa: E731
    if cat == "edukacja":
        if profile == "student":
            u = int(v("universities_1km"))
            return f"{u} {pl(u, 'uczelnia', 'uczelnie', 'uczelni')} w 1 km"
        k, s = int(v("kindergartens_1km")), int(v("schools_1km"))
        return (f"{k} {pl(k, 'przedszkole', 'przedszkola', 'przedszkoli')} i {s} "
                f"{pl(s, 'szkoła podstawowa', 'szkoły podstawowe', 'szkół podstawowych')} w 1 km")
    if cat == "komunikacja":
        dep = int(v("departures_1km"))
        out = f"metro {fmt_int(round(v('metro_dist_m'), -1))} m" if v("metro_dist_m") <= 1500 else ""
        out += (", " if out else "") + f"{fmt_int(dep)} {pl(dep, 'odjazd', 'odjazdy', 'odjazdów')} dziennie z przystanków w 1 km"
        return out
    if cat == "gastronomia":
        n = int(v("gastronomy_1km"))
        return f"{n} {pl(n, 'lokal gastronomiczny', 'lokale gastronomiczne', 'lokali gastronomicznych')} w 1 km"
    if cat == "zycieNocne":
        b = int(v("bars_pubs_1km"))
        return f"{b} {pl(b, 'bar lub pub', 'bary lub puby', 'barów lub pubów')} w 1 km"
    if cat == "zielen":
        d = v("green_dist_m")
        return (f"parki i lasy na {int(round(v('green_share_1km')))}% terenu w promieniu 1 km"
                + (f", najbliższy {fmt_int(round(d, -1))} m" if d > 0 else ""))
    if cat == "cisza":
        return f"hałas ≥ 60 dB na {int(round(v('noise_lden60_share')))}% powierzchni"
    if cat == "sport":
        p = int(v("pitches_1km"))
        return f"{p} {pl(p, 'szkoła', 'szkoły', 'szkół')} z otwartymi boiskami w 1 km"
    if cat == "kultura":
        b, e = int(v("libraries_1km")), int(v("events_30d_1km"))
        return (f"{b} {pl(b, 'biblioteka', 'biblioteki', 'bibliotek')} i {e} "
                f"{pl(e, 'wydarzenie', 'wydarzenia', 'wydarzeń')} w 30 dni w 1 km")
    if cat == "zdrowie":
        c, a = int(v("clinics_1km")), int(v("pharmacies_1km"))
        return f"{c} {pl(c, 'przychodnia', 'przychodnie', 'przychodni')} i {a} {pl(a, 'apteka', 'apteki', 'aptek')} w 1 km"
    if cat == "zakupy":
        s = int(v("supermarkets_1km"))
        return f"{s} {pl(s, 'supermarket', 'supermarkety', 'supermarketów')} w 1 km"
    raise KeyError(cat)


def texts(o: dict, profile: str, weights: dict) -> tuple[str, str, list[str]]:
    """(tagline, summary, strengths). Strengths = 2 categories with the largest contribution
    weight x score to the profile match; weakness = weakest category with weight >= 0.1 if < 50,
    otherwise the weakest category overall if < 30."""
    w = weights[profile]
    cats, m = o["cats"], o["metrics"]
    strong = sorted(CATS, key=lambda c: -w[c] * cats[c])[:2]
    rel = [c for c in CATS if w[c] >= 0.1 and c not in strong]
    weak = min(rel, key=lambda c: cats[c])
    if cats[weak] >= 50:
        weak = min((c for c in CATS if c not in strong), key=lambda c: cats[c])
        weak = weak if cats[weak] < 30 else None
    rank, match = o["rank"][profile], o["match"][profile]
    s1 = f"{rank}. miejsce na 143 osiedla dla profilu „{PROFILE_LABEL[profile]}” ({match}% dopasowania): " \
         f"{phrase(strong[0], m, profile)}; {phrase(strong[1], m, profile)}."
    s2 = f" Słabiej: {phrase(weak, m, profile)}." if weak else ""
    tag_parts = {
        "student": [phrase("komunikacja", m, profile).split(",")[0], phrase("gastronomia", m, profile).replace(" w 1 km", ""),
                    phrase("edukacja", m, profile)],
        "rodzina": [phrase("komunikacja", m, profile).split(",")[0],
                    f"{int(m['kindergartens_1km']['value'])} przedszkoli i {int(m['playgrounds_1km']['value'])} placów zabaw w 1 km"],
        "senior": [phrase("komunikacja", m, profile).split(",")[0], phrase("zdrowie", m, profile)],
    }[profile]
    tagline = " · ".join(tag_parts)
    tagline = tagline[0].upper() + tagline[1:]
    return tagline, s1 + s2, strong


# ------------------------------------------------------------------ prices
def fmt_month(iso: str) -> str:
    return f"{iso[5:7]}.{iso[:4]}"


def city_rcn(period: list[str]) -> dict:
    """Median price per m² of all filtered RCN flat transactions in `period` (whole Warsaw)."""
    if not RCN_CSV.exists():
        raise SystemExit(f"missing {RCN_CSV.relative_to(ROOT)}: run data/scripts/rcn/fetch_rcn.py --years 2024,2025,2026")
    with RCN_CSV.open(encoding="utf-8") as f:
        vals = [float(r["price_m2"]) for r in csv.DictReader(f) if period[0] <= r["date"] <= period[1]]
    q = statistics.quantiles(vals, n=4, method="inclusive")
    return {"med": round(statistics.median(vals)), "p25": round(q[0]), "p75": round(q[2]), "n": len(vals)}


def featured_prices(msi: str, kw_index: dict, city: dict) -> dict:
    """Transaction prices from RCN only; rent stays null (no open official source)."""
    rcn = kw_index["metadata"]["rcn"]
    period = rcn["main_period"]
    area = kw_index["areas"][msi]["msi_price"]
    span = f"{fmt_month(period[0])}–{fmt_month(period[1])}"
    return {
        "buyPerM2": area["med"],
        "rentPerM2": None,
        "rent2PokAvg": None,
        "cityBuyPerM2": city["med"],
        "cityRentPerM2": None,
        "asOf": period[1][:7],
        "basisLabel": f"Mediana cen transakcyjnych RCN ({span})",
        "cityLabel": "Warszawa: mediana transakcyjna RCN",
        "sourceNote": (f"Rejestr Cen Nieruchomości m.st. Warszawy (paczki GML), akty notarialne {period[0]} – {period[1]}, "
                       f"filtry: {rcn['filters']}. Obszar MSI: mediana {fmt_int(area['med'])} zł/m², n = {fmt_int(area['n'])}"
                       + (f", kwartyle {fmt_int(area['p25'])}–{fmt_int(area['p75'])}" if area.get("p25") else "")
                       + f". Warszawa: mediana {fmt_int(city['med'])} zł/m², n = {fmt_int(city['n'])}."),
        "rentNote": "Brak otwartych danych urzędowych o czynszach najmu, dlatego najmu nie pokazujemy.",
        "estimate": False,
        "rcn": {"period": period, "msi": area, "city": city},
    }


# ------------------------------------------------------------------ build
def main() -> int:
    mj = json.loads(METRICS.read_text())
    scores = json.loads(SCORES.read_text())
    kw_index = json.loads(KWARTAL_INDEX.read_text())
    city = city_rcn(kw_index["metadata"]["rcn"]["main_period"])
    metric_sources = mj["meta"]["sources"]
    scorer = Scorer(mj)
    weights = mj["meta"]["profile_weights"]
    polys = {f["properties"]["id"]: shape(f["geometry"]) for f in json.loads(OSIEDLA_GEO.read_text())["features"]}
    travel = json.loads(TRAVEL.read_text())
    targets = travel["metadata"]["cele"]
    cell_pts = []
    for f in travel["features"]:
        ring = f["geometry"]["coordinates"][0][:4]
        cell_pts.append(((sum(p[0] for p in ring) / 4, sum(p[1] for p in ring) / 4), f["properties"]["t"]))

    # sanity: our scorer reproduces the committed category scores. Metric values in the JSON are
    # rounded (shares to 0.1 %), which can swap near-ties, so allow +-3 points; deltas are always
    # computed against this scorer's own baseline, never against the committed numbers.
    worst = 0
    for i, oid in enumerate(scorer.ids):
        c, _ = scorer.scores(i, {})
        worst = max(worst, max(abs(c[k] - mj["osiedla"][oid]["cats"][k]) for k in CATS))
    print(f"scorer vs committed category scores: max |diff| = {worst}")
    if worst > 3:
        raise SystemExit("scorer does not reproduce build_osiedle_metrics.py")

    out = []
    report = []
    for slug in SLUGS:
        cur = json.loads((FEATURED / f"{slug}.json").read_text())
        msi = cur["msiId"]
        om = mj["osiedla"][msi]
        profile = cur["profile"]
        anchor = om["anchor"]
        poly = polys[msi]
        poly2180 = g2180(poly)
        print(f"== {slug} ({om['name']}), anchor {anchor}")

        green_ids = {h["green"] for h in cur["highlights"] if h.get("green")}
        green_ids |= {d["green"] for g in cur["routeGroups"] for d in g["destinations"] if d.get("green")}
        greens = load_green(green_ids)

        # ---- highlights
        highlights = []
        for h in cur["highlights"]:
            target = green_entry(anchor, greens[h["green"]]) if h.get("green") else h["coord"]
            r = osrm("foot", anchor, target)
            desc = h["description"]
            if h.get("green"):
                desc = f"{desc} Ok. {greens[h['green']]['area_ha']:.0f} ha." if greens[h["green"]]["area_ha"] >= 1.5 \
                    else desc
            highlights.append({
                # parks / forests: marker at the nearest edge point (where the walk ends), not the centroid
                "id": h["id"], "name": h["name"], "category": h["category"], "coord": target,
                "description": desc, "distanceM": int(round(r["distance"])), "walkMin": minutes(r["duration"]),
                **({"distanceTo": "skraj"} if h.get("green") else {}),
                "source": f"OSM {h['osm']}" if not h["osm"].startswith("ztm:") else f"GTFS ZTM, przystanek {h['osm'][4:]}",
            })

        group_order = ["edukacja", "zielen", "kultura", "zdrowie", "komunikacja", "zakupy"]
        highlights.sort(key=lambda h: group_order.index(h["category"]) if h["category"] in group_order else 99)

        # ---- routes
        routes = []
        for g in cur["routeGroups"]:
            for d in g["destinations"]:
                target = green_entry(anchor, greens[d["green"]]) if d.get("green") else d["coord"]
                fr, br = osrm("foot", anchor, target), osrm("bike", anchor, target)
                routes.append({
                    "id": f"{g['group']}-{d['id']}", "label": g["label"], "group": g["group"], "category": g["category"],
                    "destinationName": d["name"],
                    "geometry": {"type": "LineString", "coordinates": simplify_line(fr["coordinates"])},
                    "distanceM": int(round(fr["distance"])),
                    "minutes": {"pieszo": minutes(fr["duration"]), "rower": minutes(br["duration"])},
                    "bikeDistanceM": int(round(br["distance"])),
                    "source": f"OSRM FOSSGIS (foot, bike), OSM {d['osm']}",
                })

        # ---- commute
        inside = [t for (c, t) in cell_pts if poly.contains(Point(*c))]
        commute = []
        for tid, tg in targets.items():
            vals = [t[tid]["wszystkie"][0] for t in inside if t[tid]["wszystkie"]]
            by_mode = {}
            for mode in ("metro", "tramwaj", "autobus", "kolej"):
                mv = [t[tid][mode][0] for t in inside if t[tid][mode]]
                if len(mv) >= max(3, len(inside) // 4):
                    by_mode[mode] = round(statistics.median(mv), 1)
            dest = [tg["lon"], tg["lat"]]
            br, fr = osrm("bike", anchor, dest), osrm("foot", anchor, dest)
            mins = {"komunikacja": int(round(statistics.median(vals))), "rower": minutes(br["duration"])}
            if fr["duration"] <= 3600:
                mins["pieszo"] = minutes(fr["duration"])
            commute.append({
                "id": tid, "label": tg["nazwa"], "minutes": mins,
                "transitByMode": by_mode, "cells": len(vals),
                "source": (f"Komunikacja: mediana z {len(vals)} komórek {generate_grid.CELL_SIZE_M} m w osiedlu, średni czas przy przyjeździe "
                           f"{travel['metadata']['przyjazd']['od']}–{travel['metadata']['przyjazd']['do']} "
                           f"(rozkład ZTM GTFS, dzień {travel['metadata']['dzien']}, bez czekania na pierwszy pojazd). "
                           "Rower i pieszo: OSRM, bez postojów."),
            })
        cen = next(c for c in commute if c["id"] == "centrum")
        assert abs(statistics.median([t["centrum"]["wszystkie"][0] for t in inside if t["centrum"]["wszystkie"]])
                   - om["metrics"]["travel_centrum_wszystkie_min"]["value"]) < 0.06, "commute != metrics"

        # ---- traffic
        tp = Path(str(TRAFFIC).format(slug=msi))
        traffic, traffic_note = [], "brak pliku traffic.json"
        if tp.exists():
            tj = json.loads(tp.read_text())
            med = tj["area"]["median"]
            if len(med) == 24 and all(v is not None for v in med):
                traffic = [int(round(100 * v)) for v in med]
                traffic_note = f"{tj['source']}; {tj.get('serviceDate', '')}"

        # ---- timeline with derived deltas
        idx = scorer.ids.index(msi)
        state = {k: om["metrics"][k]["value"] for k in om["metrics"]}
        base_cats, base_match = scorer.scores(idx, {})
        prev_cats, prev_match = base_cats, base_match
        timeline = []
        events = sorted(cur.get("timeline", []), key=lambda e: (e.get("year") or 9999, e["id"]))
        for e in events:
            changes = apply_effect(e["effect"], state, anchor, poly2180) if e.get("effect") else []
            ov = {k: state[k] for k in scorer.M}
            new_cats, new_match = scorer.scores(idx, ov)
            deltas = {c: new_cats[c] - prev_cats[c] for c in CATS if new_cats[c] != prev_cats[c]}
            mdeltas = {p: new_match[p] - prev_match[p] for p in PROFILES if new_match[p] != prev_match[p]}
            prev_cats, prev_match = new_cats, new_match
            year = e.get("year")
            ev = {
                "id": e["id"], "year": year if year else e.get("yearHorizon", 2040),
                **({"yearUncertain": True} if not year or e.get("yearUncertain") else {}),
                **({"yearNote": e["yearNote"]} if e.get("yearNote") else {}),
                **({"yearPlacement": e["yearPlacement"]} if e.get("yearPlacement") else {}),
                "title": e["title"], "description": e["description"], "category": e["category"], "status": e["status"],
                **({"coord": e["coord"]} if e.get("coord") else {}),
                "statDeltas": deltas,
                **({"matchDelta": mdeltas.get(profile, 0)} if mdeltas.get(profile) else {}),
                **({"matchDeltas": mdeltas} if mdeltas else {}),
                "derivation": ("; ".join(changes) + (f". {e['effectNote']}" if e.get("effectNote") else "") if changes
                               else (e.get("effectNote") or "brak mierzalnego wpływu na wskaźniki")),
                "sourceUrl": e["sourceUrl"], "sourceTitle": e.get("sourceTitle", ""), "checkedAt": e.get("checkedAt", TODAY),
            }
            timeline.append(ev)

        # ---- prices
        prices = featured_prices(msi, kw_index, city)

        # ---- texts
        o_for_text = {"cats": scores[msi]["cats"], "metrics": om["metrics"], "rank": om["rank"], "match": om["match"]}
        tagline, summary, strong = texts(o_for_text, profile, weights)

        metrics = []
        for k in METRIC_KEYS:
            mm = om["metrics"][k]
            metrics.append({"key": k, "label": mj["meta"]["metric_labels"][k], "value": mm["value"], "unit": mm["unit"],
                            "source": metric_sources[mm["source"]]["name"]})

        o = {
            "slug": slug, "msiId": msi, "name": om["name"], "district": om["district"], "profile": profile,
            "tagline": tagline, "summary": summary, "summaryKind": "z-danych", "aiSummary": summary,
            "center": anchor, "cameraBearing": cur["camera"]["bearing"], "cameraZoom": cur["camera"]["zoom"],
            "match": {p: scores[msi][p] for p in PROFILES}, "rank": om["rank"],
            "heroImages": cur.get("heroImages", []),
            "stats": scores[msi]["cats"], "metrics": metrics,
            "highlights": highlights, "prices": prices,
            "trafficRoad": "Autobusy i tramwaje w okolicy: planowe spowolnienie wg rozkładu ZTM",
            "traffic": traffic, "trafficSource": f"/data/3d/{msi}/traffic.json", "trafficKind": "gtfs-planowe-spowolnienie",
            "commute": commute, "routes": routes, "timeline": timeline, "portals": cur.get("portals", []),
        }
        out.append(o)
        report.append((slug, o, traffic_note, strong))

    write_ts(out)
    for slug, o, tn, strong in report:
        print(f"\n{slug}: match {o['match']} rank {o['rank']}")
        print(f"  tagline: {o['tagline']}\n  summary: {o['summary']}")
        print(f"  highlights {len(o['highlights'])}, routes {len(o['routes'])}, commute {[(c['id'], c['minutes']) for c in o['commute']]}")
        print(f"  traffic {o['traffic']} ({tn})")
        for e in o["timeline"]:
            print(f"  {e['year']}{'?' if e.get('yearUncertain') else ''} {e['title']}: {e['statDeltas']} {e.get('matchDeltas', {})} | {e['derivation']}")
    print(f"\nwrote {OUT_TS.relative_to(ROOT)} ({OUT_TS.stat().st_size / 1024:.0f} KB)")
    return 0


TS_HEADER = '''/**
 * Content of the 3 featured osiedla (one per profile), chosen from the honest real-data ranking
 * (docs/core/mock-iteracja-2.md): Muranów (student), Natolin (rodzina), Stare Bielany (senior).
 *
 * GENERATED by data/scripts/build_featured_content.py — do not edit by hand; edit the cited inputs in
 * data/feature d/<slug>.json and re-run. Provenance of every field: docs/data/raport-danych.md,
 * section "Iteracja 2 — 3 osiedla".
 *  - stats / match / rank / metrics: application/public/data/osiedla-scores.json + osiedla-metrics.json
 *  - highlights / routes: OSM objects, OSRM FOSSGIS (routing.openstreetmap.de, © OpenStreetMap, ODbL)
 *  - commute: GTFS ZTM (data/grid/czasy_przejazdu.geojson) + OSRM; no car times (no real source)
 *  - traffic: planned slowdown of buses/trams from the ZTM timetable (trafficSource), not live traffic
 *  - timeline: cited sources; statDeltas derived from each event's effect on the metrics
 *  - prices: RCN transaction medians (MSI area and whole city, same filters and period); no rent figures
 *  - photos: Wikimedia Commons, attribution in public/osiedla/credits.json
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
export type OsiedleSlug = 'muranow' | 'natolin' | 'stare-bielany'

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
  /** OSRM walking distance from the osiedle anchor (for parks/forests: to the nearest edge). */
  distanceM?: number
  walkMin?: number
  distanceTo?: 'skraj'
  /** OSM object or GTFS stop id. */
  source?: string
}

export interface RcnPrice {
  med: number
  n: number
  p25?: number | null
  p75?: number | null
}

export interface Prices {
  /** PLN per m², median RCN transaction price in the MSI area. */
  buyPerM2: number
  /** No open official source for rents: always null. */
  rentPerM2: number | null
  rent2PokAvg: number | null
  /** PLN per m², median RCN transaction price of the whole city (same filters and period). */
  cityBuyPerM2: number
  cityRentPerM2: number | null
  /** YYYY-MM of the latest notarial act in the period. */
  asOf: string
  /** Caption of the osiedle price, e.g. "Mediana cen transakcyjnych RCN (01.2024–08.2026)". */
  basisLabel: string
  /** Caption of the city comparison. */
  cityLabel: string
  sourceNote: string
  /** Why rent figures are missing. */
  rentNote?: string
  estimate: false
  rcn: { period: [string, string]; msi: RcnPrice; city: RcnPrice }
}

export interface Commute {
  id: string
  label: string
  /** Minutes: komunikacja = GTFS median (arrival 7:30–9:00), rower/pieszo = OSRM. No car times. */
  minutes: Partial<Record<TravelMode, number>>
  transitByMode?: Partial<Record<'metro' | 'tramwaj' | 'autobus' | 'kolej', number>>
  cells?: number
  source?: string
}

export type RouteGroup = 'uczelnia' | 'szkola' | 'przedszkole' | 'przychodnia' | 'kultura' | 'park'

export interface Route {
  id: string
  label: string
  /** Routes of one group are alternatives the user can choose from. */
  group?: RouteGroup
  category: CategoryId
  destinationName: string
  geometry: LineString
  distanceM: number
  minutes: Partial<Record<TravelMode, number>>
  bikeDistanceM?: number
  source?: string
}

export interface TimelineEvent {
  id: string
  /** Officially stated year; with `yearUncertain` it is only the horizon the source gives (or 2040). */
  year: number
  yearUncertain?: boolean
  yearNote?: string
  /** Why the event sits at `year` when it is uncertain (e.g. "edycja BO na rok 2026", "bez terminu"). */
  yearPlacement?: string
  title: string
  description: string
  category: CategoryId
  status: 'planowana' | 'w przetargu' | 'w budowie' | 'zrealizowana' | 'zakończona'
  coord?: LngLat
  /** Derived: recomputed category score minus the previous one (see `derivation`). */
  statDeltas: Partial<Record<CategoryId, number>>
  /** Derived change of the owner profile's match. */
  matchDelta?: number
  matchDeltas?: Partial<Record<ProfileId, number>>
  derivation?: string
  sourceUrl?: string
  sourceTitle?: string
  checkedAt?: string
}

export interface Portal {
  name: 'Otodom' | 'Morizon'
  rentUrl: string
  buyUrl: string
}

export interface Metric {
  key: string
  label: string
  value: number | null
  unit: string
  source: string
}

export interface Osiedle {
  slug: OsiedleSlug
  /** Id in public/data/osiedla.geojson (MSI area). */
  msiId: string
  name: string
  district: string
  profile: ProfileId
  /** Generated from the numbers (summaryKind 'z-danych'). */
  tagline: string
  summary: string
  summaryKind: 'z-danych'
  /** Same text as `summary` (kept for older consumers; it is a template, not an AI text). */
  aiSummary: string
  center: LngLat
  cameraBearing: number
  cameraZoom?: number
  match: Record<ProfileId, number>
  /** Rank among the 143 osiedla per profile. */
  rank: Record<ProfileId, number>
  heroImages: HeroImage[]
  stats: Record<CategoryId, number>
  metrics: Metric[]
  highlights: Highlight[]
  prices: Prices
  /** Caption of the `traffic` curve. */
  trafficRoad: string
  /** 24 values, index = hour: planned slowdown of buses and trams vs the fastest hour, % (0–100). Empty = no data. */
  traffic: number[]
  trafficSource: string
  trafficKind: 'gtfs-planowe-spowolnienie'
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
'''.replace("data/feature d/", "data/featured/")

TS_FOOTER = '''
/** Same list under the spec name read by `src/map/featured.ts`. */
export const FEATURED = OSIEDLA

export const OSIEDLA_BY_SLUG: Record<OsiedleSlug, Osiedle> = Object.fromEntries(
  OSIEDLA.map((o) => [o.slug, o]),
) as Record<OsiedleSlug, Osiedle>
'''


def to_ts(v, ind: int = 0) -> str:
    """JSON with 2-space indent, but lists of numbers / coordinate pairs kept on one line."""
    pad = "  " * ind
    if isinstance(v, dict):
        if not v:
            return "{}"
        items = [f"{pad}  {json.dumps(k, ensure_ascii=False)}: {to_ts(x, ind + 1)}" for k, x in v.items()]
        return "{\n" + ",\n".join(items) + f"\n{pad}}}"
    if isinstance(v, list):
        flat = all(isinstance(x, (int, float)) or (isinstance(x, list) and all(isinstance(y, (int, float)) for y in x))
                   for x in v)
        if flat:
            return json.dumps(v, separators=(", ", ": "))
        if not v:
            return "[]"
        return "[\n" + ",\n".join(f"{pad}  {to_ts(x, ind + 1)}" for x in v) + f"\n{pad}]"
    return json.dumps(v, ensure_ascii=False)


def write_ts(osiedla: list[dict]) -> None:
    body = to_ts(osiedla)
    OUT_TS.write_text(TS_HEADER + "\nexport const OSIEDLA: Osiedle[] = " + body + "\n" + TS_FOOTER)


if __name__ == "__main__":
    sys.exit(main())
