#!/usr/bin/env python3
"""Precompute MOCK static data for the frontend: profile heatmap + osiedle scores.

Inputs (local, no network):
  data/grid/warsaw_grid_1km.geojson    cells (id, center)
  data/grid/cell_metrics.json          cells{id: {metrics_norm{key: 0-100}}}
  data/poi/*.geojson                   POI points (subtype)
  data/boundaries/warszawa_osiedla.geojson   143 MSI osiedla polygons

Outputs (committed, served statically by Vite/Netlify):
  application/public/data/heat.json
      {"bbox": [w,s,e,n], "spacing_m": 250, "profiles": [...],
       "points": [[lng, lat, wStudent, wRodzina, wSenior], ...]}   weights 0-1
  application/public/data/osiedla-scores.json
      {<osiedle id>: {student, rodzina, senior, cats{10 keys}, blurb{...}}}

Method (short): every point of a 125 m lattice inside Warsaw gets
  * Gaussian kernel densities (sigma 400 m) of POI subtypes,
  * IDW-interpolated cell metrics_norm (from ~1 km cells),
mapped to 10 UI categories (0-100). Osiedle cats = mean over lattice points in
the polygon (= area-weighted). Profile match = weighted mean of cats, rescaled
to 35-91 across osiedla; three showcase osiedla are overridden to 94-97.
Heatmap = profile score per 250 m point, contrasted against the other
profiles, with a mild district prior and Gaussian boosts at the showcase
osiedla. This is a demo mock, not a real recommendation model.

Run:  python3 data/scripts/build_mock_scores.py
"""

from __future__ import annotations

import hashlib
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GRID = ROOT / "data/grid/warsaw_grid_1km.geojson"
METRICS = ROOT / "data/grid/cell_metrics.json"
POI_DIR = ROOT / "data/poi"
OSIEDLA = ROOT / "data/boundaries/warszawa_osiedla.geojson"
OUT_DIR = ROOT / "application/public/data"
OUT_HEAT = OUT_DIR / "heat.json"
OUT_SCORES = OUT_DIR / "osiedla-scores.json"

PROFILES = ("student", "rodzina", "senior")
CATS = ("cisza", "zielen", "komunikacja", "gastronomia", "sport",
        "kultura", "edukacja", "zdrowie", "zakupy", "zycieNocne")

# Profile weights over the 10 UI categories.
WEIGHTS = {
    "student": {"zycieNocne": 3, "komunikacja": 3, "gastronomia": 2, "kultura": 1.5,
                "zakupy": 1, "sport": 1, "zielen": 0.5, "zdrowie": 0.3, "cisza": 0.2,
                "edukacja": 0},
    "rodzina": {"edukacja": 3, "zielen": 3, "cisza": 2.5, "sport": 1.5, "zakupy": 1.2,
                "zdrowie": 1.2, "komunikacja": 0.8, "kultura": 0.4, "gastronomia": 0.3,
                "zycieNocne": 0},
    "senior": {"zdrowie": 3, "zielen": 2, "cisza": 1.8, "kultura": 1.8, "zakupy": 1.5,
               "komunikacja": 1.5, "gastronomia": 0.6, "sport": 0.2, "edukacja": 0,
               "zycieNocne": 0},
}

# Mock district prior (multiplier on heat weight / raw match) to steer the demo story.
DISTRICT_PRIOR = {
    "student": {"Śródmieście": 1.18, "Ochota": 1.12, "Mokotów": 1.10, "Wola": 1.04,
                "Żoliborz": 1.02, "Praga-Północ": 1.03},
    "rodzina": {"Wilanów": 1.26, "Ursynów": 1.22, "Białołęka": 1.2, "Bemowo": 1.2,
                "Wawer": 1.05, "Wesoła": 1.05, "Bielany": 0.97, "Śródmieście": 0.85},
    "senior": {"Żoliborz": 1.22, "Praga-Południe": 1.15, "Mokotów": 1.15,
               "Ochota": 1.04, "Bielany": 0.98, "Śródmieście": 0.95},
}

# Showcase overrides: (osiedle id, profile, match value).
OVERRIDES = [("powisle", "student", 96), ("blonia-wilanowskie", "rodzina", 95),
             ("saska-kepa", "senior", 96)]
# Mock category floors for the showcase osiedla (local knowledge the POI data
# under-represents: Wisła boulevards/BUW, Wilanów parks, Park Skaryszewski).
SHOWCASE_FLOORS = {
    "powisle": {"zycieNocne": 95, "gastronomia": 92, "kultura": 93, "komunikacja": 90},
    "blonia-wilanowskie": {"zielen": 92, "cisza": 88, "edukacja": 93, "sport": 85},
    "saska-kepa": {"zdrowie": 92, "zielen": 90, "kultura": 86, "cisza": 80},
}

SUBTYPES = ("gastronomy", "event", "library", "utw", "university", "kindergarten",
            "school", "high_school", "clinic", "pharmacy", "supermarket", "playground",
            "pitch", "park", "forest", "stop", "tram_stop", "metro_station", "aed", "toilet")

STEP_M = 125.0          # feature lattice
HEAT_STRIDE = 2         # heat output every 2nd lattice point -> 250 m
SIGMA = 400.0           # POI kernel
CUT = 3 * SIGMA
BUCKET = 500.0
CENTRE = (21.0067, 52.2319)  # Pałac Kultury

LAT0 = 52.23
KX = 111320.0 * math.cos(math.radians(LAT0))
KY = 110574.0


def to_xy(lng: float, lat: float) -> tuple[float, float]:
    return (lng - 21.0) * KX, (lat - LAT0) * KY


def to_ll(x: float, y: float) -> tuple[float, float]:
    return x / KX + 21.0, y / KY + LAT0


def clip(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return lo if v < lo else hi if v > hi else v


# ---------------------------------------------------------------- geometry
class Poly:
    def __init__(self, rings_ll):
        self.rings = [[to_xy(*p) for p in r] for r in rings_ll]
        xs = [p[0] for p in self.rings[0]]
        ys = [p[1] for p in self.rings[0]]
        self.bbox = (min(xs), min(ys), max(xs), max(ys))
        # area-weighted centroid of outer ring
        a = cx = cy = 0.0
        r = self.rings[0]
        for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
            c = x1 * y2 - x2 * y1
            a += c
            cx += (x1 + x2) * c
            cy += (y1 + y2) * c
        self.centroid = (cx / (3 * a), cy / (3 * a)) if a else (sum(xs) / len(xs), sum(ys) / len(ys))

    def contains(self, x: float, y: float) -> bool:
        b = self.bbox
        if x < b[0] or x > b[2] or y < b[1] or y > b[3]:
            return False
        inside = False
        for ring in self.rings:  # even-odd handles holes
            n = len(ring)
            j = n - 1
            for i in range(n):
                xi, yi = ring[i]
                xj, yj = ring[j]
                if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                    inside = not inside
                j = i
        return inside


class Hash:
    def __init__(self, size: float):
        self.size = size
        self.b: dict[tuple[int, int], list] = defaultdict(list)

    def add(self, x, y, item):
        self.b[(int(x // self.size), int(y // self.size))].append((x, y, item))

    def near(self, x, y, r):
        s = self.size
        for i in range(int((x - r) // s), int((x + r) // s) + 1):
            for j in range(int((y - r) // s), int((y + r) // s) + 1):
                yield from self.b.get((i, j), ())


# ---------------------------------------------------------------- load
def load():
    grid = json.loads(GRID.read_text())
    cells = json.loads(METRICS.read_text())["cells"]
    cell_hash = Hash(1000.0)
    for f in grid["features"]:
        cid = f["properties"]["id"]
        if cid in cells:
            x, y = to_xy(*f["properties"]["center"])
            cell_hash.add(x, y, cells[cid]["metrics_norm"])

    poi_hash = Hash(BUCKET)
    metro = Hash(1000.0)
    n_poi = 0
    for path in sorted(POI_DIR.glob("*.geojson")):
        for f in json.loads(path.read_text())["features"]:
            st = f["properties"].get("subtype")
            g = f.get("geometry") or {}
            if st not in SUBTYPES or g.get("type") != "Point":
                continue
            x, y = to_xy(*g["coordinates"][:2])
            poi_hash.add(x, y, st)
            if st == "metro_station":
                metro.add(x, y, st)
            n_poi += 1

    osiedla = []
    for f in json.loads(OSIEDLA.read_text())["features"]:
        p = f["properties"]
        osiedla.append({**p, "poly": Poly(f["geometry"]["coordinates"])})
    return cell_hash, poi_hash, metro, osiedla, n_poi


# ---------------------------------------------------------------- features
def raw_features(x, y, cell_hash, poi_hash, metro):
    d = dict.fromkeys(SUBTYPES, 0.0)
    two_s2 = 2 * SIGMA * SIGMA
    cut2 = CUT * CUT
    for px, py, st in poi_hash.near(x, y, CUT):
        dd = (px - x) ** 2 + (py - y) ** 2
        if dd < cut2:
            d[st] += math.exp(-dd / two_s2)
    # nearest metro
    best = 1e9
    for r in (1000.0, 2500.0, 5000.0):
        for px, py, _ in metro.near(x, y, r):
            best = min(best, math.hypot(px - x, py - y))
        if best < r:
            break
    d["_metro_m"] = best
    cx, cy = to_xy(*CENTRE)
    d["_centre_m"] = math.hypot(cx - x, cy - y)
    # IDW of cell metrics_norm
    acc: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0])
    for px, py, mn in cell_hash.near(x, y, 1600.0):
        dist = math.hypot(px - x, py - y)
        if dist > 1600.0:
            continue
        w = 1.0 / (dist + 150.0) ** 2
        for k, v in mn.items():
            if v is not None:
                a = acc[k]
                a[0] += w * v
                a[1] += w
    d["_m"] = {k: a[0] / a[1] for k, a in acc.items() if a[1] > 0}
    return d


def make_normaliser(samples):
    """Per-subtype reference = 90th percentile of non-zero densities."""
    ref = {}
    for st in SUBTYPES:
        vals = sorted(s[st] for s in samples if s[st] > 1e-3)
        ref[st] = vals[int(0.9 * (len(vals) - 1))] if vals else 1.0
    return ref


def categories(f, ref):
    def n(*sts, w=None):
        w = w or [1.0] * len(sts)
        v = sum(f[s] * wi for s, wi in zip(sts, w))
        r = sum(ref[s] * wi for s, wi in zip(sts, w))
        return 100.0 * min(1.0, v / r) ** 0.6 if r > 0 else 0.0

    m = f["_m"]

    def M(k, default=50.0):
        return m.get(k, default)

    centre = clip(100.0 * (1 - f["_centre_m"] / 9000.0))
    metro = clip(100.0 * (2200.0 - f["_metro_m"]) / (2200.0 - 350.0))
    gastro = n("gastronomy")
    c = {}
    c["gastronomia"] = 0.75 * gastro + 0.25 * M("gastronomy_1km")
    c["zycieNocne"] = (0.45 * gastro + 0.2 * n("event") + 0.25 * n("university")
                       + 0.1 * centre)
    c["komunikacja"] = (0.4 * metro + 0.25 * n("tram_stop") + 0.2 * n("stop")
                        + 0.15 * M("transit_stops_count"))
    c["zielen"] = (0.35 * M("park_dist_m") + 0.3 * n("park", "forest", w=[1.0, 0.6])
                   + 0.2 * M("aq_pm25_idw") + 0.15 * (100 - gastro))
    c["sport"] = 0.6 * n("pitch") + 0.25 * M("sport_places") + 0.15 * n("playground")
    c["kultura"] = (0.35 * n("library") + 0.25 * n("event") + 0.15 * n("utw")
                    + 0.25 * centre)
    c["edukacja"] = (0.3 * n("kindergarten") + 0.25 * n("school") + 0.1 * n("high_school")
                     + 0.15 * n("playground")
                     + 0.2 * (M("kindergarten_dist_m") + M("school_dist_m")) / 2)
    c["zdrowie"] = (0.35 * n("clinic") + 0.3 * n("pharmacy")
                    + 0.2 * (M("clinic_dist_m") + M("pharmacy_dist_m")) / 2 + 0.15 * n("aed"))
    c["zakupy"] = 0.6 * n("supermarket") + 0.4 * M("supermarket_dist_m")
    c["cisza"] = (0.3 * (100 - gastro) + 0.2 * (100 - n("stop", "tram_stop"))
                  + 0.15 * M("traffic_disruptions_1km", 70) + 0.2 * c["zielen"]
                  + 0.15 * (100 - centre))
    return {k: clip(v) for k, v in c.items()}


def profile_score(cats, prof):
    w = WEIGHTS[prof]
    tw = sum(w.values())
    return sum(cats[k] * w[k] for k in CATS) / tw


# ---------------------------------------------------------------- blurbs
STRONG = {
    "cisza": ["spokojna, cicha okolica", "kameralna zabudowa i mało hałasu"],
    "zielen": ["dużo zieleni i parków pod ręką", "bliskość parków i terenów zielonych"],
    "komunikacja": ["szybki dojazd metrem lub tramwajem", "świetna komunikacja miejska"],
    "gastronomia": ["bogaty wybór kawiarni i restauracji",
                    "knajpki i kawiarnie na wyciągnięcie ręki"],
    "sport": ["boiska i miejsca do aktywności w pobliżu",
              "dobre zaplecze do sportu na świeżym powietrzu"],
    "kultura": ["łatwy dostęp do kultury i wydarzeń",
                "biblioteki i wydarzenia kulturalne w okolicy"],
    "edukacja": ["przedszkola i szkoły w zasięgu spaceru", "gęsta sieć przedszkoli i szkół"],
    "zdrowie": ["przychodnie i apteki blisko domu", "dobry dostęp do opieki zdrowotnej"],
    "zakupy": ["wygodne zakupy na co dzień", "supermarkety kilka minut od domu"],
    "zycieNocne": ["tętniące życiem wieczory i studencki klimat",
                   "bogate życie nocne i bliskość uczelni"],
}
WEAK = {
    "cisza": ["w ciągu dnia bywa tu głośno", "ruch uliczny potrafi dać się we znaki"],
    "zielen": ["zieleni jest tu niewiele", "do większego parku trzeba się przejść"],
    "komunikacja": ["do metra jest stąd daleko", "komunikacja miejska kursuje rzadziej niż w centrum"],
    "gastronomia": ["wybór knajp i kawiarni jest skromny", "na kawę na mieście trzeba podjechać"],
    "sport": ["brakuje ogólnodostępnych boisk", "miejsc do sportu jest niewiele"],
    "kultura": ["do bibliotek i domów kultury trzeba dojechać",
                "oferta kulturalna jest dość uboga"],
    "edukacja": ["przedszkoli i szkół jest w okolicy mało",
                 "do przedszkola czy szkoły trzeba często dojeżdżać"],
    "zdrowie": ["do przychodni bywa daleko", "apteki i przychodnie są rozproszone"],
    "zakupy": ["do większego supermarketu trzeba podjechać", "sklepów na co dzień jest niewiele"],
    "zycieNocne": ["wieczorami bywa tu raczej sennie", "życie nocne toczy się gdzie indziej"],
}
# used when even the weakest relevant category is decent (>= 60)
MILD = {
    "cisza": "bywa tu momentami gwarno",
    "zielen": "zieleni mogłoby być trochę więcej",
    "komunikacja": "do metra jest kawałek",
    "gastronomia": "knajp jest mniej niż w ścisłym centrum",
    "sport": "boisk mogłoby być więcej",
    "kultura": "na większe wydarzenia kulturalne trzeba czasem podjechać",
    "edukacja": "o miejsce w pobliskim przedszkolu bywa trudno",
    "zdrowie": "do specjalisty trzeba czasem podjechać",
    "zakupy": "duże sklepy są nieco dalej niż reszta usług",
    "zycieNocne": "wieczorami jest raczej spokojnie",
}
PERSONA_GEN = {"student": "studenta", "rodzina": "rodziny z dziećmi", "senior": "seniora"}

# {S} = two strengths joined; every template is grammatical for singular and
# plural osiedle names ("{N} to ...") and for singular/plural strength phrases.
TPL_HIGH = [
    "{N} to przede wszystkim {S}, choć {w}.",
    "Dla {P} to mocny kandydat: {S} — trzeba tylko pamiętać, że {w}.",
    "Tu liczą się {S}; jedyny minus jest taki, że {w}.",
    "W tej okolicy przekonują dwie rzeczy: {S}, nawet jeśli {w}.",
]
TPL_MID = [
    "Na plus {S}, na minus to, że {w}.",
    "{N} to rozsądna opcja dla {P}: {S}, ale {w}.",
    "Największe atuty tego miejsca to {S}, choć {w}.",
    "Atutami są tu {S}; słabszą stroną jest to, że {w}.",
]
TPL_LOW = [
    "Mimo atutów takich jak {S}, dla {P} minusem jest to, że {w}.",
    "{N} to raczej kompromis dla {P}: plusem są {S}, ale {w}.",
    "Owszem, atutami są tu {S}, jednak {w}.",
]


def pick(options, *seed):
    h = int(hashlib.md5("|".join(map(str, seed)).encode()).hexdigest(), 16)
    return options[h % len(options)]


def blurb(oid, name, prof, cats, match):
    w = WEIGHTS[prof]
    rel = [k for k in CATS if w[k] >= 0.5]
    strengths = sorted(rel, key=lambda k: -(cats[k] * (0.6 + 0.4 * w[k] / 3)))[:2]
    weak_pool = [k for k in CATS if w[k] >= 1 and k not in strengths]
    weakness = min(weak_pool, key=lambda k: cats[k] - 1.5 * w[k])
    weak_txt = MILD[weakness] if cats[weakness] >= 60 else pick(WEAK[weakness], oid, prof, 3)
    s1 = pick(STRONG[strengths[0]], oid, prof, 1)
    s2 = pick(STRONG[strengths[1]], oid, prof, 2)
    tpl = TPL_HIGH if match >= 72 else TPL_MID if match >= 50 else TPL_LOW
    joiner = ", a do tego " if " i " in s1 + s2 and tpl is not TPL_LOW else " oraz "
    s = pick(tpl, oid, prof).format(
        N=name, P=PERSONA_GEN[prof], S=s1 + joiner + s2,
        w=weak_txt,
    )
    return s[0].upper() + s[1:]


# ---------------------------------------------------------------- main
def main() -> int:
    cell_hash, poi_hash, metro, osiedla, n_poi = load()
    print(f"loaded: {n_poi} POI, {len(osiedla)} osiedla")

    # lattice over the union of osiedla
    W = min(o["poly"].bbox[0] for o in osiedla)
    S = min(o["poly"].bbox[1] for o in osiedla)
    E = max(o["poly"].bbox[2] for o in osiedla)
    N = max(o["poly"].bbox[3] for o in osiedla)
    pts = []  # (i, j, x, y, osiedle index)
    ny, nx = int((N - S) / STEP_M) + 1, int((E - W) / STEP_M) + 1
    for j in range(ny):
        y = S + (j + 0.5) * STEP_M
        for i in range(nx):
            x = W + (i + 0.5) * STEP_M
            for k, o in enumerate(osiedla):
                if o["poly"].contains(x, y):
                    pts.append((i, j, x, y, k))
                    break
    print(f"lattice: {len(pts)} points @ {STEP_M:.0f} m")

    feats = [raw_features(x, y, cell_hash, poi_hash, metro) for _, _, x, y, _ in pts]
    ref = make_normaliser(feats)
    cats_pts = [categories(f, ref) for f in feats]

    # ---- osiedla cats (mean over lattice points; centroid fallback)
    members = defaultdict(list)
    for idx, p in enumerate(pts):
        members[p[4]].append(idx)
    for k, o in enumerate(osiedla):
        idxs = members.get(k, [])
        cs = [cats_pts[i] for i in idxs]
        if len(cs) < 4:
            cx, cy = o["poly"].centroid
            cs.append(categories(raw_features(cx, cy, cell_hash, poi_hash, metro), ref))
        o["cats"] = {c: sum(d[c] for d in cs) / len(cs) for c in CATS}
        o["n_samples"] = len(cs)

    # stretch every category across osiedla to 5-98 so cards read well
    for c in CATS:
        vals = sorted(o["cats"][c] for o in osiedla)
        lo, hi = vals[int(0.03 * len(vals))], vals[int(0.97 * len(vals)) - 1]
        for o in osiedla:
            o["cats"][c] = clip(5 + 93 * (o["cats"][c] - lo) / max(hi - lo, 1e-6), 3, 99)

    # showcase: lift the categories that matter for the overridden profile
    by_id = {o["id"]: o for o in osiedla}
    for oid, prof, _ in OVERRIDES:
        o = by_id[oid]
        for c in CATS:
            if WEIGHTS[prof][c] >= 1.5:
                o["cats"][c] = max(o["cats"][c], o["cats"][c] + (100 - o["cats"][c]) * 0.55)
        for c, floor in SHOWCASE_FLOORS[oid].items():
            o["cats"][c] = max(o["cats"][c], floor)

    # ---- profile match
    for prof in PROFILES:
        raw = {o["id"]: profile_score(o["cats"], prof)
               * DISTRICT_PRIOR[prof].get(o["district"], 1.0) for o in osiedla}
        others = [v for k, v in raw.items() if k not in {x[0] for x in OVERRIDES if x[1] == prof}]
        lo, hi = min(others), max(others)
        for o in osiedla:
            t = (raw[o["id"]] - lo) / (hi - lo)
            o.setdefault("match", {})[prof] = round(35 + 56 * t ** 0.9)
    for oid, prof, val in OVERRIDES:
        by_id[oid]["match"][prof] = val

    scores = {}
    for o in osiedla:
        cats = {c: int(round(o["cats"][c])) for c in CATS}
        scores[o["id"]] = {
            **{p: o["match"][p] for p in PROFILES},
            "cats": cats,
            "blurb": {p: blurb(o["id"], o["name"], p, cats, o["match"][p]) for p in PROFILES},
        }

    # ---- heatmap (250 m)
    prof_pts = [[profile_score(c, p) for p in PROFILES] for c in cats_pts]
    contrast = []
    for idx, (s, p) in enumerate(zip(prof_pts, pts)):
        dist = osiedla[p[4]]["district"]
        mean = sum(s) / 3
        contrast.append([(v - 0.55 * mean) * DISTRICT_PRIOR[pr].get(dist, 1.0)
                         for v, pr in zip(s, PROFILES)])
    weights = []
    for k, prof in enumerate(PROFILES):
        vals = sorted(c[k] for c in contrast)
        lo, hi = vals[int(0.35 * len(vals))], vals[int(0.995 * len(vals))]
        weights.append([clip((c[k] - lo) / (hi - lo), 0, 1) ** 1.4 for c in contrast])
    # Gaussian boosts at showcase osiedla
    for oid, prof, _ in OVERRIDES:
        k = PROFILES.index(prof)
        cx, cy = by_id[oid]["poly"].centroid
        for idx, p in enumerate(pts):
            dd = (p[2] - cx) ** 2 + (p[3] - cy) ** 2
            if dd < 2000.0 ** 2:
                b = math.exp(-dd / (2 * 700.0 ** 2))
                weights[k][idx] = max(weights[k][idx], min(1.0, weights[k][idx] + b))

    heat_pts = []
    for idx, p in enumerate(pts):
        if p[0] % HEAT_STRIDE or p[1] % HEAT_STRIDE:
            continue
        w = [round(weights[k][idx], 2) for k in range(3)]
        if max(w) < 0.05:
            continue
        lng, lat = to_ll(p[2], p[3])
        heat_pts.append([round(lng, 5), round(lat, 5), *w])
    wl, sl = to_ll(W, S)
    el, nl = to_ll(E, N)
    heat = {"bbox": [round(wl, 5), round(sl, 5), round(el, 5), round(nl, 5)],
            "spacing_m": int(STEP_M * HEAT_STRIDE), "profiles": list(PROFILES),
            "points": heat_pts}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_HEAT.write_text(json.dumps(heat, separators=(",", ":")))
    OUT_SCORES.write_text(json.dumps(scores, ensure_ascii=False, separators=(",", ":")))

    return validate(scores, heat, osiedla, pts, weights)


# ---------------------------------------------------------------- validation
def validate(scores, heat, osiedla, pts, weights) -> int:
    errors = []
    if len(scores) != 143:
        errors.append(f"expected 143 osiedla, got {len(scores)}")
    for oid, s in scores.items():
        for p in PROFILES:
            if not (isinstance(s[p], int) and 0 <= s[p] <= 100):
                errors.append(f"{oid}.{p} out of range: {s[p]}")
            if not s["blurb"][p].endswith("."):
                errors.append(f"{oid} blurb {p} malformed")
        if set(s["cats"]) != set(CATS) or not all(0 <= v <= 100 for v in s["cats"].values()):
            errors.append(f"{oid} cats invalid")
    for oid, prof, _ in OVERRIDES:
        top = max(scores, key=lambda k: scores[k][prof])
        if top != oid or not 94 <= scores[oid][prof] <= 97:
            errors.append(f"override {oid} not #1 for {prof}")
        rest = max(v[prof] for k, v in scores.items() if k != oid)
        if rest >= scores[oid][prof]:
            errors.append(f"override {oid} tied for {prof}")
    for pt in heat["points"]:
        if not all(0 <= w <= 1 for w in pt[2:]):
            errors.append("heat weight out of range")
            break
    size_heat = OUT_HEAT.stat().st_size
    size_scores = OUT_SCORES.stat().st_size
    if size_heat > 700_000:
        errors.append(f"heat.json too big: {size_heat}")

    # showcase visibility in heatmap: mean weight within 600 m of centroid
    by_id = {o["id"]: o for o in osiedla}
    print("\nheat near showcase centroids (mean weight within 600 m):")
    for oid, prof, _ in OVERRIDES:
        cx, cy = by_id[oid]["poly"].centroid
        near = [i for i, p in enumerate(pts) if (p[2] - cx) ** 2 + (p[3] - cy) ** 2 < 600 ** 2]
        row = "  ".join(f"{p}={sum(weights[k][i] for i in near) / len(near):.2f}"
                        for k, p in enumerate(PROFILES))
        print(f"  {oid:20s} ({prof}): {row}")

    # mean heat weight per district per profile (sanity check of patterns)
    print("\nmean heat weight per district:")
    acc = defaultdict(lambda: [0.0, 0.0, 0.0, 0])
    for i, p in enumerate(pts):
        a = acc[osiedla[p[4]]["district"]]
        for k in range(3):
            a[k] += weights[k][i]
        a[3] += 1
    print(f"  {'district':16s} student rodzina senior")
    for d, a in sorted(acc.items()):
        print(f"  {d:16s} {a[0] / a[3]:7.2f} {a[1] / a[3]:7.2f} {a[2] / a[3]:6.2f}")

    names = {o["id"]: o["name"] for o in osiedla}
    print("\ntop-5 osiedla per profile:")
    for p in PROFILES:
        top = sorted(scores, key=lambda k: -scores[k][p])[:5]
        print(f"  {p:8s} " + " | ".join(f"{names[k]} {scores[k][p]}" for k in top))
        vals = [s[p] for s in scores.values()]
        print(f"           range {min(vals)}-{max(vals)}")
    for oid, prof, _ in OVERRIDES:
        print(f"  blurb {oid}/{prof}: {scores[oid]['blurb'][prof]}")

    print(f"\nheat.json: {len(heat['points'])} points, {size_heat / 1024:.0f} KB")
    print(f"osiedla-scores.json: {len(scores)} osiedla, {size_scores / 1024:.0f} KB")
    if errors:
        print("\nVALIDATION FAILED:\n  " + "\n  ".join(errors[:20]))
        return 1
    print("validation OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
