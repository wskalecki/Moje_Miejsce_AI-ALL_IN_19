#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["shapely>=2.1", "pyproj>=3.6"]
# ///
"""OSM extract (data/raw/osm3d/<msiId>.osm.geojson) → compact 3D layers for the app.

Outputs per featured area (application/public/data/3d/<msiId>/):

  buildings.geojson   footprints: id, h (m), mh (min height, m), kind, name (public
                      buildings only), poi (POI subtype found inside the footprint).
                      `id` = OSM way id (relations: 1e11 + relation id); use
                      promoteId: 'id' for feature-state.
  roads.geojson       road bodies buffered by class width, two parts per way:
                      part=curb|surface, highway, name, way_id (tunnels skipped)
  roads-lines.geojson road centre lines: way_id, name, highway, lanes, tn (tunnel)
  green.geojson       parks/gardens (kind, name)       — flat fill
  water.geojson       natural=water (name)             — flat fill

Scope: MSI polygon + 600 m buffer. Road widths and curb/surface offsets follow
feat/grid-tile-lab build_osm_roads_sample.mjs (motorway 14 … residential 5.5 m,
curb = w/2 + 0.45, surface = w/2 + 0.28); an explicit `width` or `lanes` tag wins.

`kind` precedence: building tag → amenity/shop/office tag on the building →
service campus it stands in (amenity=school|university|… area) → POI point
(data/poi education + clinics) inside the footprint → generic class.
A POI inside a residential block is recorded in `poi` but keeps kind=residential
(a kindergarten on the ground floor should not paint the whole block blue).

Run: uv run data/scripts/osm3d/build_osm3d.py   (after extract_osm.py)
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

from shapely import STRtree
from shapely.geometry import LineString, MultiLineString, Point, mapping, shape
from shapely.validation import make_valid

sys.path.insert(0, str(Path(__file__).parent))
from common import OUT_ROOT, POI_DIR, RAW_DIR, dump_geojson, featured_zones, round_coords, to_m, to_wgs  # noqa: E402

MIN_FOOTPRINT_M2 = 20
MIN_ANCILLARY_M2 = 40  # sheds, garages, outbuildings below this are dropped
ANCILLARY = {"garage", "garages", "shed", "outbuilding", "allotment_house", "greenhouse",
             "roof", "service", "farm_auxiliary", "kiosk", "guardhouse", "carport", "hut"}
POI_OVERRIDE_MAX_H = 15
LEVEL_M = 3.2
SIZE_BUDGET = 4_200_000  # "~4 MB" per area (≈1 MB gzipped)

# --- buildings -------------------------------------------------------------

PUBLIC_KINDS = {"school", "kindergarten", "university", "college", "hospital", "clinic",
                "church", "culture", "public"}

BUILDING_TAG_KIND = {
    "school": "school", "kindergarten": "kindergarten", "university": "university",
    "college": "college", "hospital": "hospital", "clinic": "clinic",
    "church": "church", "chapel": "church", "cathedral": "church", "basilica": "church",
    "religious": "church", "mosque": "church", "synagogue": "church", "temple": "church",
    "monastery": "church", "convent": "church",
    "museum": "culture", "theatre": "culture", "library": "culture",
    "government": "public", "civic": "public", "public": "public", "townhall": "public",
    "fire_station": "public", "train_station": "public", "transportation": "public",
    "sports_hall": "public", "sports_centre": "public", "stadium": "public", "palace": "public",
    "office": "office", "commercial": "office", "hotel": "office",
    "retail": "retail", "supermarket": "retail", "kiosk": "retail", "shop": "retail",
    "apartments": "residential", "residential": "residential", "house": "residential",
    "detached": "residential", "semidetached_house": "residential", "terrace": "residential",
    "bungalow": "residential", "dormitory": "residential", "villa": "residential",
}
AMENITY_KIND = {
    "school": "school", "kindergarten": "kindergarten", "university": "university",
    "college": "college", "hospital": "hospital", "clinic": "clinic", "doctors": "clinic",
    "dentist": "clinic", "place_of_worship": "church", "monastery": "church",
    "library": "culture", "theatre": "culture", "arts_centre": "culture", "cinema": "culture",
    "community_centre": "culture", "concert_hall": "culture",
    "townhall": "public", "police": "public", "fire_station": "public",
    "courthouse": "public", "post_office": "public",
}
# POI subtypes from data/poi → kind
POI_KIND = {"kindergarten": "kindergarten", "school": "school", "high_school": "school",
            "university": "university", "clinic": "clinic"}
# A campus or POI may re-label a building only when its own tags are this weak.
OVERRIDABLE = {"other", "public", "office"}

DEFAULT_H = {
    "house": 7, "detached": 7, "semidetached_house": 7, "terrace": 8, "bungalow": 4,
    "villa": 8, "apartments": 15, "residential": 12, "church": 18, "cathedral": 25,
    "garage": 3, "garages": 3, "shed": 2.5, "outbuilding": 3, "allotment_house": 3,
    "greenhouse": 3, "kiosk": 3, "service": 3.5, "guardhouse": 3, "roof": 4,
    "farm_auxiliary": 4, "construction": 6, "elevator_housing": 3,
}


def num(v) -> float | None:
    if v is None:
        return None
    m = re.match(r"^\s*(-?\d+(?:[.,]\d+)?)", str(v))
    return float(m.group(1).replace(",", ".")) if m else None


def heights(p: dict) -> tuple[float, float]:
    tag = p.get("building", "yes")
    h = num(p.get("height"))
    if h is None and (lv := num(p.get("building:levels"))) is not None:
        h = lv * LEVEL_M + (num(p.get("roof:levels")) or 0) * LEVEL_M * 0.5
    if h is None or h <= 0:
        h = DEFAULT_H.get(tag, 9)
    mh = num(p.get("min_height"))
    if mh is None and (ml := num(p.get("building:min_level"))) is not None:
        mh = ml * LEVEL_M
    if tag == "roof" and mh is None:
        mh = max(h - 1.0, 2.5)
    mh = max(0.0, min(mh or 0.0, h - 0.5))
    return compact(min(h, 240)), compact(mh)


def compact(v: float):
    """1 decimal, ints without `.0` (saves bytes over thousands of features)."""
    v = round(v, 1)
    return int(v) if v == int(v) else v


def tag_kind(p: dict) -> str:
    tag = p.get("building", "yes")
    if (k := AMENITY_KIND.get(p.get("amenity", ""))) and BUILDING_TAG_KIND.get(tag) not in (
            "school", "kindergarten", "university", "college", "hospital"):
        return k
    if k := BUILDING_TAG_KIND.get(tag):
        return k
    if p.get("tourism") == "museum":
        return "culture"
    if "shop" in p:
        return "retail"
    if "office" in p:
        return "office"
    return "other"


def load_campuses(feats: list[dict]):
    geoms, kinds, names = [], [], []
    for f in feats:
        p = f["properties"]
        k = AMENITY_KIND.get(p.get("amenity", ""))
        if "building" in p or k not in ("school", "kindergarten", "university", "college",
                                         "hospital", "clinic"):
            continue
        g = make_valid(to_m(shape(f["geometry"])))
        geoms.append(g); kinds.append(k); names.append(p.get("name"))
    return STRtree(geoms) if geoms else None, geoms, kinds, names


def load_pois(zone_m):
    pts, kinds, names = [], [], []
    for fname, cat in (("education.geojson", None), ("amenity.geojson", "clinic")):
        for f in json.loads((POI_DIR / fname).read_text())["features"]:
            sub = f["properties"].get("subtype")
            if (cat and sub != cat) or sub not in POI_KIND:
                continue
            pt = to_m(Point(f["geometry"]["coordinates"]))
            if zone_m.contains(pt):
                pts.append(pt); kinds.append(POI_KIND[sub]); names.append(f["properties"].get("name"))
    return pts, kinds, names


def build_buildings(feats, zone_m):
    ctree, cgeoms, ckinds, cnames = load_campuses(feats)
    pois, pkinds, pnames = load_pois(zone_m)
    rows = []
    for f in feats:
        p = f["properties"]
        if "building" not in p or p["building"] in ("no", "demolished", "ruins", "collapsed"):
            continue
        g = to_m(shape(f["geometry"]))
        if not g.is_valid:
            g = make_valid(g)
        if g.area < (MIN_ANCILLARY_M2 if p["building"] in ANCILLARY else MIN_FOOTPRINT_M2):
            continue
        if not zone_m.contains(g.representative_point()):
            continue
        h, mh = heights(p)
        kind = tag_kind(p)
        name = p.get("name")
        rp = g.representative_point()
        if ctree is not None and (kind in OVERRIDABLE or p.get("amenity") == "library"):
            hits = [i for i in ctree.query(rp) if cgeoms[i].contains(rp)]
            if hits:
                i = min(hits, key=lambda j: cgeoms[j].area)  # innermost campus
                if p.get("building") not in ("garage", "garages", "shed", "roof", "service"):
                    kind = ckinds[i]
                    name = name or cnames[i]
        rows.append({"g": g, "id": int(p["@id"]) + (10**11 if p["@type"] == "relation" else 0),
                     "h": h, "mh": mh, "kind": kind, "name": name, "tag": p.get("building")})

    tree = STRtree([r["g"] for r in rows]) if rows else None
    matched = 0
    for pt, pk, pn in zip(pois, pkinds, pnames):
        hits = [i for i in tree.query(pt) if rows[i]["g"].contains(pt)]
        if not hits:
            continue
        r = rows[min(hits, key=lambda j: rows[j]["g"].area)]
        matched += 1
        r.setdefault("poi", pk)
        # a tall untagged block with a POI inside is housing with a ground-floor service
        if r["kind"] in OVERRIDABLE and (r["h"] <= POI_OVERRIDE_MAX_H or r["kind"] == "public"):
            r["kind"] = pk
        if r["kind"] == pk:
            r["name"] = r["name"] or pn

    out = []
    for r in rows:
        g = to_wgs(r["g"].simplify(0.4, preserve_topology=True))
        props = {"id": r["id"], "h": r["h"], "mh": r["mh"], "kind": r["kind"]}
        if r["kind"] in PUBLIC_KINDS and r["name"]:
            props["name"] = r["name"]
        if "poi" in r:
            props["poi"] = r["poi"]
        out.append({"type": "Feature", "properties": props,
                    "geometry": {"type": g.geom_type, "coordinates": round_coords(mapping(g)["coordinates"])}})
    return out, matched, len(pois)


# --- roads -----------------------------------------------------------------

HIGHWAY_WIDTH_M = {
    "motorway": 14, "trunk": 12, "primary": 10, "secondary": 8, "tertiary": 7,
    "residential": 5.5, "living_street": 5, "unclassified": 5,
}
LINK_WIDTH_M = 6
CURB_EXTRA_M = 0.45
SURFACE_JOIN_OVERLAP_M = 0.28


def road_width(p: dict) -> float:
    hw = p["highway"]
    base = LINK_WIDTH_M if hw.endswith("_link") else HIGHWAY_WIDTH_M.get(hw, 5)
    w = num(p.get("width"))
    if w is not None and 3 <= w <= 40:
        return w
    lanes = num(p.get("lanes"))
    if lanes is not None and 1 <= lanes <= 10:
        return max(lanes * 3.2, base * 0.7)
    return base


def iter_lines(g):
    if isinstance(g, LineString):
        yield g
    elif isinstance(g, MultiLineString) or hasattr(g, "geoms"):
        for sub in g.geoms:
            yield from iter_lines(sub)


def build_roads(feats, zone_m):
    polys, lines = [], []
    for f in feats:
        p = f["properties"]
        if "highway" not in p or f["geometry"]["type"] != "LineString":
            continue
        g = to_m(shape(f["geometry"])).intersection(zone_m)
        if g.is_empty:
            continue
        way_id = int(p["@id"])
        hw = p["highway"]
        tunnel = p.get("tunnel") in ("yes", "building_passage") or p.get("covered") == "yes"
        w = road_width(p)
        for seg in iter_lines(g):
            if seg.length < 1:
                continue
            seg = seg.simplify(0.3)
            lp = {"way_id": way_id, "highway": hw}
            if p.get("name"):
                lp["name"] = p["name"]
            if (lanes := num(p.get("lanes"))) is not None:
                lp["lanes"] = int(lanes)
            if tunnel:
                lp["tn"] = 1
            lw = to_wgs(seg)
            lines.append({"type": "Feature", "properties": lp,
                          "geometry": {"type": "LineString", "coordinates": round_coords(list(lw.coords))}})
            if tunnel:
                continue
            for part, extra in (("curb", CURB_EXTRA_M), ("surface", SURFACE_JOIN_OVERLAP_M)):
                poly = to_wgs(seg.buffer(w / 2 + extra, quad_segs=2).simplify(0.25))
                pp = {"part": part, "highway": hw, "way_id": way_id}
                if p.get("name"):
                    pp["name"] = p["name"]
                polys.append({"type": "Feature", "properties": pp,
                              "geometry": {"type": poly.geom_type,
                                           "coordinates": round_coords(mapping(poly)["coordinates"])}})
    # curbs first so a single fill layer would still draw surfaces on top
    polys.sort(key=lambda f: f["properties"]["part"] != "curb")
    return polys, lines


# --- green / water ---------------------------------------------------------

def build_flat(feats, zone_m, pred, kind_of):
    out = []
    for f in feats:
        p = f["properties"]
        if "building" in p or not pred(p):
            continue
        g = make_valid(to_m(shape(f["geometry"]))).intersection(zone_m)
        if g.is_empty or g.area < 200:
            continue
        g = to_wgs(g.simplify(1.0, preserve_topology=True))
        if g.geom_type not in ("Polygon", "MultiPolygon"):
            polys = [x for x in getattr(g, "geoms", []) if x.geom_type in ("Polygon", "MultiPolygon")]
            if not polys:
                continue
            from shapely.ops import unary_union
            g = unary_union(polys)
        props = {"kind": kind_of(p)}
        if p.get("name"):
            props["name"] = p["name"]
        out.append({"type": "Feature", "properties": props,
                    "geometry": {"type": g.geom_type, "coordinates": round_coords(mapping(g)["coordinates"])}})
    return out


def main() -> None:
    summary = {}
    for z in featured_zones():
        src = RAW_DIR / f"{z['id']}.osm.geojson"
        feats = json.loads(src.read_text())["features"]
        out_dir = OUT_ROOT / z["id"]
        buildings, matched, n_poi = build_buildings(feats, z["zone_m"])
        roads, lines = build_roads(feats, z["zone_m"])
        green = build_flat(feats, z["zone_m"], lambda p: p.get("leisure") in ("park", "garden"),
                           lambda p: p["leisure"])
        water = build_flat(feats, z["zone_m"], lambda p: p.get("natural") == "water", lambda p: "water")
        sizes = {
            "buildings": dump_geojson(out_dir / "buildings.geojson", buildings),
            "roads": dump_geojson(out_dir / "roads.geojson", roads),
            "roads-lines": dump_geojson(out_dir / "roads-lines.geojson", lines),
            "green": dump_geojson(out_dir / "green.geojson", green),
            "water": dump_geojson(out_dir / "water.geojson", water),
        }
        total = sum(sizes.values())
        kinds = Counter(b["properties"]["kind"] for b in buildings)
        summary[z["id"]] = {"buildings": len(buildings), "roads_ways": len({f["properties"]["way_id"] for f in lines}),
                            "poi_matched": f"{matched}/{n_poi}", "kinds": dict(kinds.most_common()),
                            "bytes": sizes, "total_mb": round(total / 1e6, 2)}
        print(z["id"], json.dumps(summary[z["id"]], ensure_ascii=False))
        if total > SIZE_BUDGET:
            print(f"  WARNING: {z['id']} is {total / 1e6:.1f} MB > budget {SIZE_BUDGET / 1e6:.0f} MB")


if __name__ == "__main__":
    main()
