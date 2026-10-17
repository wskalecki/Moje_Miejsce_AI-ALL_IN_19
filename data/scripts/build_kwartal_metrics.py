# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6", "shapely>=2.1", "numpy>=1.26"]
# ///
"""Per-kwartał facts: RCN flat prices, buildings, nearby services, noise, travel time.

Every value is either read from a source (REAL) or computed from one with the rule written
here (DERIVED). Nothing is imputed: missing data stays null / absent.

Inputs (run the fetchers first; raw caches are git-ignored):
  application/public/data/fine/<msi_id>.geojson   kwartały (fetch_osiedla_fine.py)
  data/boundaries/warszawa_osiedla.geojson        MSI areas
  data/rcn/lokale_mieszkalne.csv                  RCN flat transactions (rcn/fetch_rcn.py)
  data/raw/city_wfs/budynki_mieszkalne.json       city building register, RODZAJ='m'
  data/raw/city_wfs/budynki_niemieszkalne.json    city building register, RODZAJ<>'m'
  data/poi/education.geojson, amenity.geojson     OSM POI (siatka ETL)
  data/poi_mikolaj/transit.geojson                ZTM stops / metro / SKM with odjazdy_dzien (GTFS)
  data/raw/osm/<hash>.json                        OSM parks/forests with geometry (siatka cache)
  data/raw/noise/unions.json                      GIOŚ Lden contours (noise/gios_noise.py)
  data/grid/czasy_przejazdu.geojson               GTFS travel times per team grid cell (generate_grid.py)

Method (all distances straight-line in EPSG:2180 metres):
  ref point   = kwartał centroid, or a point on its surface if the centroid falls outside.
  prices      = RCN flats (whole flats, free-market sales, 15+ m², 3–60 k zł/m², see fetch_rcn.py)
                assigned to a kwartał by the centroid of their building in the city register
                (lokal id prefix = ID_BUDYNKU), else by the RCN point. Main period: deeds
                2024-01-01 … latest (IV 2026). If the kwartał has < 5 such flats, the main
                figures use all flats within 300 m of the ref point plus those in the kwartał
                (scope "radius300"). low_n = true when the used sample is still < 5.
  buildings   = residential buildings (RODZAJ='m') whose centroid lies in the kwartał; floors =
                KONDYGNACJE_NADZIEMNE; res_share = residential / all building footprint area.
                The register has no construction year (fields: ID, RODZAJ, floors only).
  nearby      = nearest POI of each type (name, distance rounded to 10 m; beyond 3 km only the
                distance, to keep files small) and counts within 500 m. Parks/forests (OSM, ≥ 1 ha): distance to the polygon edge, 0 inside.
                Walking time is not computed; rule for the UI: walk ≈ distance × 1.3 / 78 m/min
                (same detour 1.3 and 1.3 m/s as czasy_przejazdu.geojson).
  dep400      = sum of scheduled daily departures (ZTM GTFS, Mon 19 X 2026) of all stop posts,
                metro and SKM stations within 400 m.
  noise       = share of the kwartał area with Lden ≥ 55/60/65 dB, road OR rail/tram (GIOŚ,
                4th round SMH 2022, data 2021).
  travel      = public transport to Centrum (Rondo Dmowskiego), Rondo Daszyńskiego and
                Służewiec from the grid cell containing the ref point: mean / min minutes for
                arrivals 07:30–09:00 (GTFS router, data/scripts/etl_czasy_przejazdu.py).

Outputs:
  application/public/data/fine-metrics/<msi_id>.json   {<kwartał id>: {...}}  (schema in index.json)
  application/public/data/fine-metrics/index.json      schema, sources, per-MSI summary

Run: data/scripts/siatka/.venv/bin/python -I data/scripts/build_kwartal_metrics.py [--only muranow,natolin]
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import statistics
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import Point, Polygon, shape

REPO = Path(__file__).resolve().parents[2]
FINE = REPO / "application/public/data/fine"
OUT = REPO / "application/public/data/fine-metrics"
MSI = REPO / "data/boundaries/warszawa_osiedla.geojson"
RCN = REPO / "data/rcn/lokale_mieszkalne.csv"
RCN_SUMMARY = REPO / "data/rcn/summary.json"
BLD_RES = REPO / "data/raw/city_wfs/budynki_mieszkalne.json"
BLD_OTHER = REPO / "data/raw/city_wfs/budynki_niemieszkalne.json"
POI = REPO / "data/poi"
TRANSIT = REPO / "data/poi_mikolaj/transit.geojson"
OSM_RAW = REPO / "data/raw/osm"
NOISE = REPO / "data/raw/noise/unions.json"
TRAVEL = REPO / "data/grid/czasy_przejazdu.geojson"

MAIN_FROM = "2024-01-01"
YEARS = (2023, 2024, 2025, 2026)
MIN_N = 5
RADIUS = 300.0
COUNT_R = 500.0
DEP_R = 400.0
NOISE_DB = (55, 60, 65)
MIN_GREEN_M2 = 10_000
NAME_MAX_M = 3000  # keep POI names up to this distance (file size)

T4326 = Transformer.from_crs(4326, 2180, always_xy=True)
T2178 = Transformer.from_crs(2178, 2180, always_xy=True)
TBACK = Transformer.from_crs(2180, 4326, always_xy=True)


def to2180(geom, tr=T4326):
    return shapely.transform(geom, lambda c: np.column_stack(tr.transform(c[:, 0], c[:, 1])))


def ref_point(poly) -> Point:
    c = poly.centroid
    return c if poly.contains(c) else poly.representative_point()


def med(v):
    return round(statistics.median(v)) if v else None


def quart(v):
    if len(v) < 4:
        return None, None
    q = statistics.quantiles(v, n=4, method="inclusive")
    return round(q[0]), round(q[2])


# ---------------------------------------------------------------- loaders

def load_kwartaly(only: set[str] | None):
    out = {}
    for f in sorted(FINE.glob("*.geojson")):
        msi = f.stem
        if only and msi not in only:
            continue
        feats = json.loads(f.read_text())["features"]
        out[msi] = [(ft["properties"], to2180(shape(ft["geometry"]))) for ft in feats]
    return out


def load_buildings():
    """-> centroids (2180), floors, footprint area, residential flag, id->index."""
    ids, pts, floors, area, res = [], [], [], [], []
    for path, is_res in ((BLD_RES, True), (BLD_OTHER, False)):
        for ft in json.loads(path.read_text())["features"]:
            g = shape(ft["geometry"])  # EPSG:2178, easting first
            if g.is_empty:
                continue
            c = g.centroid
            ids.append(ft["properties"].get("ID_BUDYNKU"))
            pts.append(T2178.transform(c.x, c.y))
            fl = ft["properties"].get("KONDYGNACJE_NADZIEMNE")
            floors.append(float(fl) if fl is not None else np.nan)
            area.append(g.area)
            res.append(is_res)
    pts = np.array(pts)
    return {
        "ids": ids,
        "geom": shapely.points(pts[:, 0], pts[:, 1]),
        "floors": np.array(floors),
        "area": np.array(area),
        "res": np.array(res),
        "by_id": {i: k for k, i in enumerate(ids) if i},
    }


def load_rcn(bld):
    rows = list(csv.DictReader(open(RCN, encoding="utf-8")))
    xs, ys, how = [], [], {"building": 0, "point": 0}
    bx = shapely.get_x(bld["geom"])
    by = shapely.get_y(bld["geom"])
    for r in rows:
        k = bld["by_id"].get(r["building_id"])
        if k is not None:
            xs.append(bx[k]); ys.append(by[k]); how["building"] += 1
        else:
            x, y = T4326.transform(float(r["lon"]), float(r["lat"]))
            xs.append(x); ys.append(y); how["point"] += 1
    return {
        "geom": shapely.points(np.array(xs), np.array(ys)),
        "date": np.array([r["date"] for r in rows]),
        "year": np.array([int(r["year"]) for r in rows]),
        "ppm": np.array([float(r["price_m2"]) for r in rows]),
        "area": np.array([float(r["area_m2"]) for r in rows]),
        "rooms": np.array([float(r["rooms"]) if r["rooms"] else np.nan for r in rows]),
        "market": np.array([r["market"] for r in rows]),
        "how": how,
        "latest": max(r["date"] for r in rows),
    }


def load_points(path: Path, subtypes: set[str]):
    out = defaultdict(lambda: ([], []))
    for ft in json.loads(path.read_text())["features"]:
        p = ft["properties"]
        if p["subtype"] in subtypes and ft["geometry"]["type"] == "Point":
            lon, lat = ft["geometry"]["coordinates"][:2]
            out[p["subtype"]][0].append(T4326.transform(lon, lat))
            out[p["subtype"]][1].append(p)
    return out


def load_green():
    """OSM leisure=park / landuse=forest / natural=wood outer rings >= 1 ha (siatka cache)."""
    src = None
    for f in OSM_RAW.glob("*.json"):
        if f.name.endswith(".meta.json") or f.stat().st_size < 5_000_000:
            continue
        head = f.read_text()[:400_000]
        if '"leisure": "park"' in head or '"leisure":"park"' in head:
            src = f
    if src is None:
        raise SystemExit("OSM park cache not found in data/raw/osm (run the siatka ETL)")
    parks, forests = ([], []), ([], [])
    for el in json.loads(src.read_text())["elements"]:
        tags = el.get("tags", {})
        if el["type"] == "way" and el.get("geometry"):
            rings = [el["geometry"]]
        elif el["type"] == "relation":
            rings = [m["geometry"] for m in el.get("members", []) if m.get("role") == "outer" and m.get("geometry")]
        else:
            continue
        polys = []
        for ring in rings:
            pts = [(g["lon"], g["lat"]) for g in ring]
            if len(pts) >= 4 and pts[0] == pts[-1]:
                poly = to2180(Polygon(pts))
                if poly.is_valid and poly.area >= MIN_GREEN_M2:
                    polys.append(poly)
        if not polys:
            continue
        g = shapely.union_all(polys)
        tgt = parks if tags.get("leisure") == "park" else forests
        tgt[0].append(g)
        tgt[1].append({"name": tags.get("name")})
    return {"park": parks, "forest": forests}, src.name


# ---------------------------------------------------------------- per-MSI build

def price_block(idx, rcn, main_mask):
    sel = idx[main_mask[idx]]
    p = rcn["ppm"][sel]
    out = {"n": int(len(sel)), "med": med(list(p))}
    out["p25"], out["p75"] = quart(list(p))
    return out, sel


def build(only):
    print("loading ...", file=sys.stderr)
    kw = load_kwartaly(only)
    bld = load_buildings()
    rcn = load_rcn(bld)
    edu = load_points(POI / "education.geojson", {"kindergarten", "school", "high_school", "university"})
    amen = load_points(POI / "amenity.geojson", {"clinic", "pharmacy", "supermarket"})
    tr = load_points(TRANSIT, {"stop", "metro_station", "rail_station"})
    green, green_src = load_green()
    noise_raw = json.loads(NOISE.read_text())["any"]
    noise = {int(t): shapely.from_wkb(bytes.fromhex(noise_raw[str(t)])) for t in NOISE_DB}
    travel = json.loads(TRAVEL.read_text())
    msi_geoms = {f["properties"]["id"]: to2180(shape(f["geometry"])) for f in json.loads(MSI.read_text())["features"]}

    # point layers: name, geometry tree
    layers = {}
    for key, (src, sub) in {
        "kindergarten": (edu, "kindergarten"), "school": (edu, "school"), "high_school": (edu, "high_school"),
        "university": (edu, "university"), "clinic": (amen, "clinic"), "pharmacy": (amen, "pharmacy"),
        "supermarket": (amen, "supermarket"), "metro": (tr, "metro_station"), "skm": (tr, "rail_station"),
    }.items():
        xy, props = src[sub]
        layers[key] = (shapely.points(np.array(xy)), [p.get("name") for p in props])
    # stops: all ZTM posts; tram = posts served by tram
    sxy, sprops = tr["stop"]
    layers["stop"] = (shapely.points(np.array(sxy)), [p.get("name") for p in sprops])
    is_tram = ["tramwaj" in ((p.get("meta") or {}).get("tryby") or []) for p in sprops]
    txy = [xy for xy, t in zip(sxy, is_tram) if t]
    layers["tram"] = (shapely.points(np.array(txy)), [p.get("name") for p, t in zip(sprops, is_tram) if t])
    for key in ("park", "forest"):
        layers[key] = (np.array(green[key][0], dtype=object), [p["name"] for p in green[key][1]])
    trees = {k: shapely.STRtree(g) for k, (g, _) in layers.items()}

    dep_geom, dep_val = [], []
    for sub in ("stop", "metro_station", "rail_station"):
        xy, props = tr[sub]
        dep_geom.extend(xy)
        dep_val.extend((p.get("meta") or {}).get("odjazdy_dzien") or 0 for p in props)
    dep_tree = shapely.STRtree(shapely.points(np.array(dep_geom)))
    dep_val = np.array(dep_val)

    cells = [to2180(shape(f["geometry"])) for f in travel["features"]]
    cell_tree = shapely.STRtree(cells)
    cell_t = [f["properties"]["t"] for f in travel["features"]]

    bld_tree = shapely.STRtree(bld["geom"])
    rcn_tree = shapely.STRtree(rcn["geom"])
    main_mask = rcn["date"] >= MAIN_FROM

    OUT.mkdir(parents=True, exist_ok=True)
    index_areas, featured_rows = {}, {}
    for msi, items in kw.items():
        polys = [g for _, g in items]
        refs = shapely.points([(p.x, p.y) for p in (ref_point(g) for g in polys)]) if polys else []
        res = {}
        # nearest + counts, vectorised per layer
        near = {}
        for key, tree in trees.items():
            names = layers[key][1]
            (ri, ti), dist = tree.query_nearest(refs, return_distance=True, all_matches=False)
            near[key] = {int(a): (names[int(b)], float(d)) for a, b, d in zip(ri, ti, dist)}
        counts = {}
        for key in ("kindergarten", "school", "high_school", "clinic", "pharmacy", "supermarket", "stop"):
            pairs = trees[key].query(refs, predicate="dwithin", distance=COUNT_R)
            counts[key] = np.bincount(pairs[0], minlength=len(polys))
        dpairs = dep_tree.query(refs, predicate="dwithin", distance=DEP_R)
        dep = np.bincount(dpairs[0], weights=dep_val[dpairs[1]], minlength=len(polys))
        # noise: clip unions to the MSI bbox once
        if polys:
            bx = shapely.total_bounds(np.array(polys, dtype=object))
            nclip = {t: shapely.clip_by_rect(g, *bx) for t, g in noise.items()}
        # MSI-level price (context)
        mg = msi_geoms.get(msi)
        msi_idx = rcn_tree.query(mg, predicate="contains") if mg is not None else np.array([], int)
        msi_main = msi_idx[main_mask[msi_idx]]
        n5 = 0
        for i, ((props, poly), ref) in enumerate(zip(items, refs)):
            kid = props["id"]
            rec: dict = {}
            # ---- prices
            in_idx = rcn_tree.query(poly, predicate="contains")
            main_kw, sel = price_block(in_idx, rcn, main_mask)
            years = {}
            for y in YEARS:
                v = rcn["ppm"][in_idx[rcn["year"][in_idx] == y]]
                if len(v):
                    years[str(y)] = [int(len(v)), med(list(v))] if len(v) >= 3 else [int(len(v))]
            scope = "kwartal"
            used = sel
            if main_kw["n"] < MIN_N:
                rad_idx = np.union1d(rcn_tree.query(ref, predicate="dwithin", distance=RADIUS), in_idx)
                main_used, used = price_block(rad_idx, rcn, main_mask)
                scope = "radius300"
            else:
                main_used = main_kw
                n5 += 1
            pr = {"scope": scope, **main_used, "n_kw": main_kw["n"]}
            if main_used["n"] < MIN_N:
                pr["low_n"] = True
            if years:
                pr["years"] = years
            if len(used):
                for mk, lab in (("pierwotny", "primary"), ("wtorny", "secondary")):
                    v = rcn["ppm"][used[rcn["market"][used] == mk]]
                    if len(v):
                        pr[lab] = [int(len(v)), med(list(v))] if len(v) >= 3 else [int(len(v))]
                a = rcn["area"][used]
                pr["area_med"] = round(float(np.median(a)), 1)
                r = rcn["rooms"][used]
                r = r[~np.isnan(r) & (r > 0)]
                if len(r):
                    pr["rooms_med"] = float(np.median(r))
            if main_used["n"] == 0:
                pr = {"scope": scope, "n": 0, "n_kw": 0, "low_n": True, **({"years": years} if years else {})}
            rec["price"] = pr
            # ---- buildings
            bi = bld_tree.query(poly, predicate="contains")
            if len(bi):
                resm = bld["res"][bi]
                fl = bld["floors"][bi][resm]
                fl = fl[~np.isnan(fl)]
                tot_area = float(bld["area"][bi].sum())
                b = {"res": int(resm.sum()), "other": int((~resm).sum())}
                if len(fl):
                    b["fl_max"] = int(fl.max())
                    b["fl_med"] = float(np.median(fl))
                if tot_area > 0:
                    b["res_share"] = round(float(bld["area"][bi][resm].sum()) / tot_area, 2)
                rec["bld"] = b
            # ---- nearby
            nb = {}
            for key in trees:
                if i in near[key]:
                    nm, d = near[key][i]
                    dm = int(round(d / 10.0) * 10)
                    nb[key] = [nm, dm] if dm <= NAME_MAX_M else dm  # far away: distance only
            rec["near"] = nb
            rec["n500"] = {k: int(v[i]) for k, v in counts.items() if v[i]}  # missing key = 0
            rec["dep400"] = int(dep[i])
            # ---- noise
            if poly.area > 0:
                rec["noise"] = [round(float(shapely.intersection(poly, nclip[t]).area / poly.area), 2) for t in NOISE_DB]
            # ---- travel
            ci = cell_tree.query(ref, predicate="intersects")
            if len(ci):
                t = cell_t[int(ci[0])]
                tv = {}
                for dest, lab in (("centrum", "centrum"), ("rondo_daszynskiego", "daszynskiego"), ("sluzewiec", "sluzewiec")):
                    v = (t.get(dest) or {}).get("wszystkie")
                    if v:
                        # [mean, min] minutes; a third value = reachable arrivals, only when < 10 of 10
                        tv[lab] = [round(v[0]), round(v[1])] + ([v[3]] if v[3] < 10 else [])
                if tv:
                    rec["travel"] = tv
            res[kid] = rec
            featured_rows.setdefault(msi, []).append((props["name"], rec))
        path = OUT / f"{msi}.json"
        path.write_text(json.dumps(res, ensure_ascii=False, separators=(",", ":")))
        p = rcn["ppm"][msi_main]
        index_areas[msi] = {
            "kwartaly": len(items), "with_n5": n5,
            "msi_price": {"n": int(len(msi_main)), "med": med(list(p)), **dict(zip(("p25", "p75"), quart(list(p))))},
            "kb": round(path.stat().st_size / 1024),
        }
        print(f"  {msi}: {len(items)} kwartały, {n5} with n>=5, {index_areas[msi]['kb']} KB", file=sys.stderr)
    write_index(index_areas, rcn, green_src, only)
    return index_areas, featured_rows


def write_index(areas, rcn, green_src, only):
    idx_path = OUT / "index.json"
    prev = json.loads(idx_path.read_text())["areas"] if (only and idx_path.exists()) else {}
    prev.update(areas)
    rcn_sum = json.loads(RCN_SUMMARY.read_text()) if RCN_SUMMARY.exists() else {}
    meta = {
        "generated": date.today().isoformat(),
        "script": "data/scripts/build_kwartal_metrics.py",
        "doc": "docs/data/raport-danych.md (Kwartały — status danych), docs/data/zrodla-danych.md §3a",
        "rcn": {
            "source": "Rejestr Cen Nieruchomości, Urząd m.st. Warszawy (Biuro Geodezji i Katastru), paczki GML "
                      "https://architektura.um.warszawa.pl/udostepniane-dane-rcn1; te same rekordy co GUGiK WFS ms:lokale",
            "licence": "RCN bezpłatny od 13.02.2026 (art. 40a ust. 2 pkt 1 lit. k PGiK); podać źródło",
            "packages": rcn_sum.get("packages"),
            "filters": "lokal mieszkalny, nieruchomość lokalowa, udział 1/1, sprzedaż wolnorynkowa, pow. >= 15 m2, 3-60 tys. zł/m2",
            "main_period": [MAIN_FROM, rcn["latest"]],
            "assignment": rcn["how"],
        },
        "schema": {
            "price.scope": "kwartal (>= 5 transakcji w kwartale, okres główny) | radius300 (transakcje w 300 m od punktu kwartału + w kwartale)",
            "price.n / med / p25 / p75": "liczba transakcji i mediana / kwartyle ceny zł/m2 (cena brutto lokalu / pow. użytkowa) w okresie głównym; p25/p75 dla n >= 4",
            "price.n_kw": "liczba transakcji w samym kwartale (okres główny)",
            "price.low_n": "true, gdy użyta próba < 5",
            "price.years": "{rok: [n, mediana]} tylko w kwartale; mediana dla n >= 3, inaczej [n]",
            "price.primary / secondary": "[n, mediana] rynek pierwotny / wtórny w użytej próbie (mediana dla n >= 3)",
            "price.area_med / rooms_med": "mediana pow. użytkowej (m2) i liczby izb w użytej próbie",
            "bld.res / other": "budynki mieszkalne / pozostałe z rejestru miasta (środek budynku w kwartale)",
            "bld.fl_max / fl_med": "kondygnacje nadziemne budynków mieszkalnych: max / mediana",
            "bld.res_share": "udział powierzchni zabudowy budynków mieszkalnych w całej zabudowie kwartału",
            "near.<typ>": "[nazwa lub null (brak nazwy w źródle), odległość w linii prostej w m, zaokr. do 10] od punktu kwartału; powyżej 3 km sama liczba (nazwa pominięta)",
            "n500.<typ>": "liczba obiektów w promieniu 500 m (brak klucza = 0); typy: kindergarten, school, high_school, clinic, pharmacy, supermarket, stop",
            "dep400": "suma odjazdów w dniu roboczym (rozkład ZTM 19.10.2026) ze wszystkich słupków, metra i SKM w 400 m",
            "noise": "[udział >= 55, >= 60, >= 65 dB] powierzchni kwartału, Lden, drogi lub kolej/tramwaj (GIOŚ, dane 2021)",
            "travel.<cel>": "[średnia, min] minut komunikacją przy przyjeździe 07:30-09:00 (10 terminów co 10 min); trzecia wartość = liczba osiągalnych terminów, tylko gdy < 10",
            "ref point": "środek ciężkości kwartału albo punkt na jego powierzchni, gdy środek wypada poza",
            "walk rule (UI)": "czas pieszo ~ odległość x 1.3 / 78 m/min (jak czasy_przejazdu.geojson)",
        },
        "near_types": {
            "kindergarten": "przedszkole (OSM)", "school": "szkoła podstawowa (OSM)", "high_school": "szkoła średnia (OSM)",
            "university": "uczelnia (OSM)", "clinic": "przychodnia (OSM)", "pharmacy": "apteka (OSM)",
            "supermarket": "supermarket (OSM)", "park": f"park >= 1 ha, odległość do krawędzi (OSM, {green_src})",
            "forest": "las >= 1 ha, odległość do krawędzi (OSM)", "stop": "słupek ZTM (dane.um.warszawa.pl)",
            "tram": "słupek z tramwajem (ZTM GTFS)", "metro": "stacja metra (ZTM GTFS)", "skm": "stacja SKM (ZTM GTFS)",
        },
        "sources": [
            {"id": "rcn", "label": "Rejestr Cen Nieruchomości — Urząd m.st. Warszawy", "licence": "ponowne wykorzystanie bezpłatne, podać źródło"},
            {"id": "budynki", "label": "Rejestr budynków (EGiB) — GeoServer m.st. Warszawy wfs:budynki", "licence": "Urząd m.st. Warszawy"},
            {"id": "osm", "label": "OpenStreetMap (Overpass)", "licence": "ODbL 1.0 — © współtwórcy OpenStreetMap"},
            {"id": "ztm", "label": "ZTM Warszawa (GTFS, M. Kuranowski), przystanki dane.um.warszawa.pl", "licence": "CC BY — Urząd m.st. Warszawy"},
            {"id": "gios", "label": "GIOŚ HAŁAS API, SMH 2022 (4. runda)", "licence": "CC BY 4.0 — GIOŚ"},
        ],
    }
    idx_path.write_text(json.dumps({"metadata": meta, "areas": dict(sorted(prev.items()))}, ensure_ascii=False, indent=1))


def summarize(featured_rows, areas, names=("muranow", "stare-bielany", "natolin")):
    for msi in names:
        if msi not in featured_rows:
            continue
        rows = featured_rows[msi]
        a = areas[msi]
        meds = [r["price"]["med"] for _, r in rows if r["price"].get("scope") == "kwartal" and r["price"].get("med")]
        print(f"\n== {msi}: {a['kwartaly']} kwartały, {a['with_n5']} with >= 5 transactions (2024–2026), "
              f"MSI median {a['msi_price']['med']} zł/m² (n={a['msi_price']['n']})")
        if meds:
            print(f"   kwartał medians (n>=5): {min(meds)} – {max(meds)} zł/m²")
        sample = sorted(rows, key=lambda r: -r[1]["price"].get("n_kw", 0))[:5]
        for name, r in sample:
            p, b, nb = r["price"], r.get("bld", {}), r["near"]
            print(f"   - {name}: {p.get('med')} zł/m² ({p['scope']}, n={p.get('n')}, IQR {p.get('p25')}–{p.get('p75')}), "
                  f"bud. {b.get('res')} (do {b.get('fl_max')} kond.), "
                  f"przedszkole {nb.get('kindergarten', [None, None])[1]} m, przystanek {nb.get('stop', [None, None])[1]} m, "
                  f"odjazdy/400 m {r['dep400']}, hałas>=60 {r.get('noise', [None]*3)[1]}, "
                  f"centrum {r.get('travel', {}).get('centrum', [None])[0]} min")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated MSI ids")
    args = ap.parse_args()
    only = set(args.only.split(",")) if args.only else None
    areas, rows = build(only)
    summarize(rows, areas)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
