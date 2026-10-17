#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6", "shapely>=2.1", "numpy>=1.26"]
# ///
"""Build the finest osiedle level: residential street blocks ("kwartały") inside each MSI area.

Hierarchy used by the app:  dzielnica (18) -> obszar MSI (143) -> kwartał / osiedle (this file).

Method (all OpenStreetMap, ODbL):
  1. Street network (highway motorway..living_street + pedestrian, railways, rivers/canals)
     plus the MSI borders are polygonized per MSI area -> blocks bounded by streets.
  2. A block is kept when it is residential: it contains the centroid of a residential
     building from the city register (wfs:budynki RODZAJ='m', EGiB) or at least 25% of it is
     OSM landuse=residential. Slivers (< 800 m2) are dropped.
  3. Very large blocks (> 0.25 km2, e.g. a forest edge with a few houses) are trimmed to the
     residential landuse plus a 35 m buffer around residential buildings. Blocks with more
     than 12 residential buildings are split into parts of ~8 buildings (k-means on building
     centroids, cuts along Voronoi edges between buildings), so a unit is "a handful of blocks".
  4. Name: the OSM name of a named residential polygon covering >= 30% of the block
     (name_source "osm"), otherwise "Kwartał <street A> / <street B>" from the two named
     streets with the longest frontage (name_source "generated").
     `osiedle` = the OSM place=neighbourhood/quarter (polygon or nearest node <= 900 m) in
     the same MSI area, e.g. "Miasteczko Wilanów", "Gocław".
  5. Shared borders are simplified together (coverage_simplify) so neighbours stay flush.

Inputs (cached under data/raw/, git-ignored; delete to refetch):
  data/raw/osm_fine/landuse.json, highways_<tile>.json        (Overpass API)
  data/raw/city_wfs/budynki_mieszkalne.json                    (city GeoServer WFS)
  data/boundaries/warszawa_osiedla.geojson                     (MSI areas, fetch_osiedla_boundaries.py)

Outputs:
  data/boundaries/warszawa_osiedla_fine.geojson          whole city
  application/public/data/fine/<msi_id>.geojson          one file per MSI area (lazy loading)
  application/public/data/fine/index.json                per-MSI counts, bbox and file sizes

Properties: id, name, name_source (osm|generated), osiedle, msi_id, district, area_km2,
            residential (dominant OSM residential=*, else apartments/houses from floors),
            buildings (residential buildings in the block), floors_max, source.

Run:  uv run data/scripts/fetch_osiedla_fine.py            (fetch if not cached, then build)
      uv run data/scripts/fetch_osiedla_fine.py --only powisle,saska-kepa
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer
from shapely.geometry import LineString, MultiPolygon, Point, Polygon, mapping, shape
from shapely.ops import polygonize, unary_union

REPO = Path(__file__).resolve().parents[2]
RAW = REPO / "data" / "raw" / "osm_fine"
MSI_FILE = REPO / "data" / "boundaries" / "warszawa_osiedla.geojson"
OUT_CITY = REPO / "data" / "boundaries" / "warszawa_osiedla_fine.geojson"
OUT_DIR = REPO / "application" / "public" / "data" / "fine"

BBOX = (52.09, 20.85, 52.37, 21.28)  # s, w, n, e
ENDPOINTS = (  # all three return 500/502 under load (X 2026), so rotate with backoff
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
)
USER_AGENT = "wwa42-hackathon/1.0 (Warsaw open-data hackathon; osiedla research)"

STREET_TYPES = (
    "motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|"
    "motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|pedestrian"
)
CITY_BUILDINGS = REPO / "data" / "raw" / "city_wfs" / "budynki_mieszkalne.json"
BUILDINGS_URL = (
    "https://wms2.um.warszawa.pl/geoserver/wfs/wfs?service=WFS&version=2.0.0&request=GetFeature"
    "&typeNames=wfs:budynki&outputFormat=application/json"
    "&propertyName=ID_BUDYNKU,KONDYGNACJE_NADZIEMNE,GEOMETRY&cql_filter=RODZAJ=%27m%27"
)

MIN_BLOCK_M2 = 800
MAX_BLD = 12  # blocks with more residential buildings are split ...
TARGET_BLD = 8  # ... into parts of about this many buildings
MIN_SPLIT_M2 = 12_000  # never split blocks smaller than this
MIN_RES_SHARE = 0.25
BIG_BLOCK_M2 = 250_000
NAME_OVERLAP = 0.30
PLACE_NODE_MAX_M = 900
SIMPLIFY_M = 3.0
DECIMALS = 6  # ~0.1 m; coarser rounding makes sub-metre overlaps between neighbours

TO_PL = Transformer.from_crs("EPSG:4326", "EPSG:2178", always_xy=True)
TO_WGS = Transformer.from_crs("EPSG:2178", "EPSG:4326", always_xy=True)
NO_FETCH = False
SOURCE = "OpenStreetMap (ODbL), bloki ulic w obszarach MSI m.st. Warszawy"


# ---------------------------------------------------------------- fetch
def overpass(name: str, query: str) -> list[dict]:
    path = RAW / f"{name}.json"
    if path.exists():
        return json.loads(path.read_text())["elements"]
    if NO_FETCH:
        print(f"  WARN {name}: not cached, skipped (--no-fetch)")
        return []
    RAW.mkdir(parents=True, exist_ok=True)
    body = urllib.parse.urlencode({"data": query}).encode()
    for attempt in range(6):
        for url in ENDPOINTS:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(req, timeout=900) as resp:
                    raw = resp.read()
            except Exception as exc:  # noqa: BLE001 - mirrors fail in many ways
                print(f"  {name}: {url} failed ({exc})")
                continue
            if b'"elements"' in raw[:3000] and b"runtime error" not in raw[-3000:]:
                path.write_bytes(raw)
                print(f"  {name}: {len(raw) / 1e6:.1f} MB from {url}")
                return json.loads(raw)["elements"]
            print(f"  {name}: {url} returned no elements: {raw[:120]!r}")
        time.sleep(15 * (attempt + 1))
    raise RuntimeError(f"Overpass failed for {name}")


def tiles(n: int = 2):
    s, w, nn, e = BBOX
    lats = np.linspace(s, nn, n + 1)
    lons = np.linspace(w, e, n + 1)
    for i in range(n):
        for j in range(n):
            yield f"{i}{j}", f"{lats[i]:.4f},{lons[j]:.4f},{lats[i + 1]:.4f},{lons[j + 1]:.4f}"


def fetch_all() -> tuple[list[dict], list[dict], list[dict]]:
    s, w, n, e = BBOX
    landuse = overpass(
        "landuse",
        f"[out:json][timeout:600][bbox:{s},{w},{n},{e}];("
        'nwr["landuse"="residential"];nwr["residential"];'
        'nwr["place"~"^(neighbourhood|quarter|suburb|city_block)$"];relation["boundary"="place"];'
        'nwr["name"~"^[Oo]siedle"];nwr["building"="apartments"]["name"];'
        ");out tags geom;",
    )
    highways, buildings = [], []
    for tid, bb in tiles(2):
        highways += overpass(
            f"highways_{tid}",
            f"[out:json][timeout:600][bbox:{bb}];("
            f'way["highway"~"^({STREET_TYPES})$"];way["railway"~"^(rail|light_rail)$"];'
            'way["waterway"~"^(river|canal)$"];'
            ");out tags geom;",
        )
    return landuse, highways, fetch_city_buildings()


def fetch_city_buildings() -> list[tuple[float, float, str, float | None]]:
    """Residential buildings (RODZAJ='m', EGiB) from the city GeoServer: (x, y, id, floors).

    Official and complete (110k of 184k buildings), already in EPSG:2178 (easting first).
    ID_BUDYNKU (e.g. 146510_8.0408.20_BUD) is the prefix of RCN LOK_ID_LOKALU, so RCN flat
    transactions can be joined to buildings and then to blocks.
    """
    path = CITY_BUILDINGS
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(BUILDINGS_URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=900) as resp:
            raw = resp.read()
        if b'"features"' not in raw[:2000]:
            raise RuntimeError(f"budynki WFS returned {raw[:200]!r}")
        path.write_bytes(raw)
        print(f"  budynki: {len(raw) / 1e6:.1f} MB")
    out = []
    for f in json.loads(path.read_text())["features"]:
        if not f.get("geometry"):
            continue
        c = shape(f["geometry"]).centroid
        p = f["properties"]
        out.append((c.x, c.y, p.get("ID_BUDYNKU") or "", p.get("KONDYGNACJE_NADZIEMNE")))
    return out


# ---------------------------------------------------------------- geometry helpers
def slugify(text: str) -> str:
    text = text.replace("ł", "l").replace("Ł", "L")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def to_pl(geom):
    return shapely.transform(geom, lambda x, y: TO_PL.transform(x, y), interleaved=False)


def to_wgs(geom):
    return shapely.transform(geom, lambda x, y: TO_WGS.transform(x, y), interleaved=False)


def way_coords(el: dict) -> list[tuple[float, float]]:
    return [(g["lon"], g["lat"]) for g in el.get("geometry", []) if g]


def element_polygon(el: dict):
    """Polygon (EPSG:2178) of a closed way or multipolygon relation, else None."""
    if el["type"] == "way":
        pts = way_coords(el)
        if len(pts) < 4 or pts[0] != pts[-1]:
            return None
        geom = Polygon(pts)
    elif el["type"] == "relation":
        outer, inner = [], []
        for m in el.get("members", []):
            if m.get("type") != "way" or len(m.get("geometry", [])) < 2:
                continue
            line = LineString([(g["lon"], g["lat"]) for g in m["geometry"]])
            (inner if m.get("role") == "inner" else outer).append(line)
        if not outer:
            return None
        geom = unary_union(list(polygonize(outer)))
        if inner:
            geom = geom.difference(unary_union(list(polygonize(inner))))
    else:
        return None
    if geom.is_empty:
        return None
    geom = shapely.make_valid(to_pl(geom))
    geom = geom if geom.geom_type in ("Polygon", "MultiPolygon") else unary_union(
        [g for g in getattr(geom, "geoms", []) if g.geom_type in ("Polygon", "MultiPolygon")]
    )
    return None if geom.is_empty else geom


def polygons_only(geom):
    if geom.is_empty:
        return geom
    if geom.geom_type in ("Polygon", "MultiPolygon"):
        return geom
    parts = [g for g in getattr(geom, "geoms", []) if g.geom_type in ("Polygon", "MultiPolygon")]
    return unary_union(parts) if parts else Polygon()


def split_block(block, pts) -> list:
    """Split a block with many buildings into compact parts of ~TARGET_BLD buildings.

    k-means on building centroids, then the Voronoi cells of the centroids are dissolved per
    cluster, so the cuts run between buildings of different clusters, not through them.
    """
    n = len(pts)
    if n <= MAX_BLD or block.area < MIN_SPLIT_M2:
        return [block]
    k = min(int(np.ceil(n / TARGET_BLD)), int(block.area // (MIN_SPLIT_M2 / 2)))
    if k < 2:
        return [block]
    xy = np.array([(p.x, p.y) for p in pts])
    order = np.argsort(xy[:, 0] + xy[:, 1])  # deterministic seeds spread across the block
    centers = xy[order[np.linspace(0, n - 1, k).astype(int)]].astype(float)
    for _ in range(30):
        label = np.argmin(((xy[:, None, :] - centers[None]) ** 2).sum(-1), axis=1)
        new = np.array([xy[label == c].mean(0) if (label == c).any() else centers[c] for c in range(k)])
        if np.allclose(new, centers):
            break
        centers = new
    uniq, first = np.unique(xy, axis=0, return_index=True)
    cells = shapely.voronoi_polygons(shapely.MultiPoint(uniq), extend_to=block, ordered=True)
    groups = collections.defaultdict(list)
    for cell, i in zip(cells.geoms, first):
        groups[label[i]].append(cell)
    parts = []
    for cs in groups.values():
        part = polygons_only(unary_union(cs).intersection(block))
        if not part.is_empty:
            parts.append(part)
    # glue slivers to the neighbour they share most border with
    big = [p for p in parts if p.area >= MIN_BLOCK_M2]
    if not big:
        return [block]
    for small in (p for p in parts if p.area < MIN_BLOCK_M2):
        j = max(range(len(big)), key=lambda j: big[j].buffer(0.5).intersection(small).area)
        big[j] = polygons_only(unary_union([big[j], small]))
    return big


# ---------------------------------------------------------------- build
def build(only: set[str] | None) -> None:
    landuse, highways, buildings = fetch_all()

    msi = []
    for f in json.loads(MSI_FILE.read_text())["features"]:
        p = f["properties"]
        msi.append({"id": p["id"], "name": p["name"], "district": p["district"],
                    "geom": shapely.make_valid(to_pl(shape(f["geometry"])))})

    # residential landuse, named estates, places
    res_polys, res_kind, named, place_polys, place_nodes = [], [], [], [], []
    for el in landuse:
        t = el.get("tags", {})
        name = (t.get("name") or "").strip()
        if el["type"] == "node":
            if name and t.get("place") in ("neighbourhood", "quarter", "suburb"):
                place_nodes.append((to_pl(Point(el["lon"], el["lat"])), name, t["place"]))
            continue
        geom = element_polygon(el)
        if geom is None:
            continue
        is_res = t.get("landuse") == "residential" or "residential" in t
        if is_res:
            res_polys.append(geom)
            res_kind.append(t.get("residential", ""))
        if t.get("place") in ("neighbourhood", "quarter", "suburb") or t.get("boundary") == "place":
            if name:
                place_polys.append((geom, name))
        elif name and (is_res or name.lower().startswith("osiedle")) and "building" not in t:
            if geom.area <= 600_000:  # bigger "names" are districts, not estates
                named.append((geom, name))
    print(f"residential polygons {len(res_polys)}, named estates {len(named)}, "
          f"place polygons {len(place_polys)}, place nodes {len(place_nodes)}")

    res_tree = shapely.STRtree(res_polys)
    named_tree = shapely.STRtree([g for g, _ in named])

    seen = set()
    lines, line_names = [], []
    for el in highways:
        if el["id"] in seen or len(el.get("geometry", [])) < 2:
            continue
        seen.add(el["id"])
        t = el.get("tags", {})
        if t.get("area") == "yes" or t.get("tunnel") in ("yes", "building_passage") or t.get("covered") == "yes":
            continue
        lines.append(to_pl(LineString(way_coords(el))))
        line_names.append(t.get("name", "") if "highway" in t else "")
    line_tree = shapely.STRtree(lines)
    print(f"divider lines {len(lines)}")

    bpts = [Point(x, y) for x, y, _, _ in buildings]
    bfloors = np.array([fl if fl is not None else np.nan for *_, fl in buildings], dtype=float)
    bpts_arr = np.array(bpts, dtype=object)
    btree = shapely.STRtree(bpts)
    print(f"residential buildings {len(bpts)}")

    records = []
    for area in msi:
        if only and area["id"] not in only:
            continue
        M = area["geom"]
        idx = line_tree.query(M.buffer(5))
        cut = [lines[i] for i in idx]
        noded = unary_union(cut + [M.boundary])
        faces = [f for f in polygonize(noded) if M.contains(f.representative_point())]
        res_here = unary_union([res_polys[i] for i in res_tree.query(M)]).intersection(M)
        res_here = polygons_only(res_here)
        kept = []
        for face in faces:
            face = polygons_only(face.intersection(M))
            if face.is_empty or face.area < MIN_BLOCK_M2:
                continue
            bi = btree.query(face, predicate="contains")
            res_share = face.intersection(res_here).area / face.area if not res_here.is_empty else 0
            if len(bi) == 0 and res_share < MIN_RES_SHARE:
                continue
            geom = face
            if face.area > BIG_BLOCK_M2:
                core = face.intersection(res_here) if not res_here.is_empty else Polygon()
                if len(bi):
                    core = unary_union([core, unary_union(list(bpts_arr[bi])).buffer(35)])
                core = polygons_only(core.buffer(10).buffer(-10).intersection(face))
                if core.is_empty or core.area < MIN_BLOCK_M2:
                    continue
                geom = core
            for part in split_block(geom, bpts_arr[bi]):
                pbi = btree.query(part, predicate="contains")
                kinds = collections.Counter()
                for i in res_tree.query(part, predicate="intersects"):
                    if res_kind[i]:
                        kinds[res_kind[i]] += part.intersection(res_polys[i]).area
                fl = bfloors[pbi] if len(pbi) else np.array([np.nan])
                fl = fl[~np.isnan(fl)]
                floors = int(np.max(fl)) if fl.size else None
                if not kinds and fl.size:
                    kinds["apartments" if np.median(fl) >= 3 else "houses"] += 1
                kept.append({"geom": part, "n_bld": int(len(pbi)), "floors": floors,
                             "kind": kinds.most_common(1)[0][0] if kinds else ""})

        if not kept:
            continue
        places_in = [(g, n) for g, n in place_polys if g.intersects(M) and g.intersection(M).area > 0.3 * g.area
                     and g.area < 0.9 * M.area]
        nodes_in = [(p, n) for p, n, _ in place_nodes if M.buffer(200).contains(p)]
        for k in kept:
            g = k["geom"]
            # name from named OSM estate polygon
            name, src = None, "generated"
            best = 0.0
            for i in named_tree.query(g, predicate="intersects"):
                ov = g.intersection(named[i][0]).area / g.area
                if ov > best:
                    best, cand = ov, named[i][1]
            if best >= NAME_OVERLAP:
                name, src = cand, "osm"
            # osiedle (middle level) from place polygons / nearest place node
            osiedle = None
            rp = g.representative_point()
            pl = [(gg.area, n) for gg, n in places_in if gg.contains(rp)]
            if pl:
                osiedle = min(pl)[1]
            elif nodes_in:
                d, n = min((rp.distance(p), n) for p, n in nodes_in)
                if d <= PLACE_NODE_MAX_M:
                    osiedle = n
            # street names along the block frontage
            ring = g.boundary.buffer(15)
            front = collections.Counter()
            for i in line_tree.query(ring, predicate="intersects"):
                if line_names[i]:
                    front[line_names[i]] += lines[i].intersection(ring).length
            streets = [s for s, _ in front.most_common(2)]
            if name is None:
                if len(streets) == 2:
                    name = f"Kwartał {streets[0]} / {streets[1]}"
                elif streets:
                    name = f"Kwartał {streets[0]}"
                else:
                    name = f"Kwartał {osiedle or area['name']}"
            records.append({"geom": g, "area": g.area, "name": name, "src": src,
                            "osiedle": osiedle, "msi": area, "kind": k["kind"],
                            "n_bld": k["n_bld"], "floors": k["floors"], "streets": streets})
        print(f"{area['id']}: {len(faces)} faces -> {len(kept)} blocks")

    # Simplify all blocks together (shared borders, also across MSI areas, move together), then
    # remove the few slivers where a simplified edge of a trimmed block crosses a neighbour.
    simple = shapely.coverage_simplify([r["geom"] for r in records], tolerance=SIMPLIFY_M)
    tree = shapely.STRtree(simple)
    clean = list(simple)
    for i in range(len(clean)):
        for j in tree.query(simple[i], predicate="intersects"):
            if j < i and clean[i].intersection(clean[j]).area > 0.01:
                clean[i] = polygons_only(clean[i].difference(clean[j]))
    for r, g in zip(records, clean):
        r["geom"] = g
    records = [r for r in records if not r["geom"].is_empty and r["geom"].area >= MIN_BLOCK_M2 / 4]

    # disambiguate repeated names inside one MSI area: add the osiedle, then a part number
    for key_fn, fmt in ((lambda r: r["osiedle"], "{name} ({osiedle})"), (None, "{name} · część {n}")):
        groups = collections.defaultdict(list)
        for r in records:
            groups[(r["msi"]["id"], r["name"])].append(r)
        for rs in groups.values():
            if len(rs) < 2:
                continue
            if key_fn:
                if len({key_fn(r) for r in rs}) > 1:
                    for r in rs:
                        if r["osiedle"] and r["osiedle"] not in r["name"]:
                            r["name"] = fmt.format(name=r["name"], osiedle=r["osiedle"])
            else:
                rs.sort(key=lambda r: (-r["geom"].centroid.y, r["geom"].centroid.x))  # north to south
                for n, r in enumerate(rs, 1):
                    r["name"] = fmt.format(name=r["name"], n=n)

    # ids: <msi_id>--<slug(name)>[-n]
    counts: dict[str, int] = collections.Counter()
    features = []
    for r in sorted(records, key=lambda r: (r["msi"]["id"], r["name"], -r["area"])):
        base = f"{r['msi']['id']}--{slugify(r['name'])}"
        counts[base] += 1
        fid = base if counts[base] == 1 else f"{base}-{counts[base]}"
        wgs = shapely.set_precision(to_wgs(r["geom"]), 10 ** -DECIMALS)
        wgs = polygons_only(shapely.make_valid(wgs))
        if wgs.is_empty:
            continue
        features.append({
            "type": "Feature",
            "id": fid,
            "properties": {
                "id": fid,
                "name": r["name"],
                "name_source": r["src"],
                "osiedle": r["osiedle"],
                "msi_id": r["msi"]["id"],
                "district": r["msi"]["district"],
                "area_km2": round(r["area"] / 1e6, 4),
                "residential": r["kind"] or None,
                "buildings": r["n_bld"],
                "floors_max": r["floors"],
                "source": "osm",
            },
            "geometry": mapping(wgs),
        })
    assert len({f["id"] for f in features}) == len(features), "duplicate ids"

    meta = {
        "source": SOURCE,
        "license": "ODbL 1.0, © współtwórcy OpenStreetMap; granice MSI: Urząd m.st. Warszawy",
        "method": "polygonize(OSM streets + rail + rivers + MSI borders), keep residential blocks",
        "simplify_m": SIMPLIFY_M,
        "generated": time.strftime("%Y-%m-%d"),
    }
    dumps = lambda fc: json.dumps(fc, ensure_ascii=False, separators=(",", ":"))  # noqa: E731

    if only:
        for mid in sorted(only):
            write_tile(mid, [f for f in features if f["properties"]["msi_id"] == mid], meta, dumps)
        return

    OUT_CITY.write_text(dumps({"type": "FeatureCollection", "metadata": meta, "features": features}))
    print(f"wrote {OUT_CITY.relative_to(REPO)}: {len(features)} features, "
          f"{OUT_CITY.stat().st_size / 1e6:.2f} MB")
    by_msi = collections.defaultdict(list)
    for f in features:
        by_msi[f["properties"]["msi_id"]].append(f)
    index = {}
    for old in OUT_DIR.glob("*.geojson"):
        old.unlink()
    for mid, feats in sorted(by_msi.items()):
        index[mid] = write_tile(mid, feats, meta, dumps)
    (OUT_DIR / "index.json").write_text(json.dumps(
        {"metadata": meta, "areas": index}, ensure_ascii=False, separators=(",", ":")))

    # coverage report
    city = unary_union([a["geom"] for a in msi])
    cover = unary_union([r["geom"] for r in records])
    res_all = unary_union(res_polys).intersection(city)
    print(f"coverage of city area: {cover.area / city.area:.1%}; "
          f"of OSM residential landuse: {cover.intersection(res_all).area / res_all.area:.1%}")
    print(f"named from OSM: {sum(r['src'] == 'osm' for r in records)}; "
          f"with osiedle: {sum(bool(r['osiedle']) for r in records)}")
    a = np.array([r["area"] for r in records]) / 1e6
    print("area km2 p10/p50/p90/max:", np.percentile(a, [10, 50, 90, 100]).round(4))


def write_tile(mid, feats, meta, dumps) -> dict:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"{mid}.geojson"
    path.write_text(dumps({"type": "FeatureCollection", "metadata": meta, "features": feats}))
    b = unary_union([shape(f["geometry"]) for f in feats]).bounds
    print(f"  tile {mid}: {len(feats)} features, {path.stat().st_size / 1024:.0f} KB")
    return {"count": len(feats), "bbox": [round(v, 5) for v in b], "kb": round(path.stat().st_size / 1024)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated MSI ids (writes only their tiles)")
    ap.add_argument("--no-fetch", action="store_true", help="use only cached Overpass tiles")
    args = ap.parse_args()
    global NO_FETCH
    NO_FETCH = args.no_fetch
    build(set(args.only.split(",")) if args.only else None)


if __name__ == "__main__":
    main()
