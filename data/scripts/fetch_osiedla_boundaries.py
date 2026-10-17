#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6", "shapely>=2.1"]
# ///
"""Fetch official Warsaw neighbourhood (MSI area) boundaries as WGS84 GeoJSON.

Source: m.st. Warszawa WFS, layer ns92528565:MSI ("obszary Miejskiego Systemu
Informacji", 143 areas, EPSG:2178, GML 3, fields NAZWA / DZIELNICA / AKTUALNOSC).

Outputs (same content):
  data/boundaries/warszawa_osiedla.geojson
  application/public/data/osiedla.geojson   (fetched by the frontend)

Properties: id (ascii kebab slug of name), name, district, area_km2.

Run:  uv run data/scripts/fetch_osiedla_boundaries.py
      uv run data/scripts/fetch_osiedla_boundaries.py --gml path/to/msi.gml  # offline
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

import shapely
from pyproj import Transformer
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.ops import unary_union

WFS_URL = (
    "https://wfs.um.warszawa.pl/serwis?service=WFS&version=1.1.0"
    "&request=GetFeature&typeName=ns92528565:MSI"
)
REPO = Path(__file__).resolve().parents[2]
OUTPUTS = [
    REPO / "data" / "boundaries" / "warszawa_osiedla.geojson",
    REPO / "application" / "public" / "data" / "osiedla.geojson",
]
DISTRICTS = REPO / "data" / "boundaries" / "warszawa_dzielnice.geojson"
SIMPLIFY_M = 4.0  # metres in EPSG:2178; ~1 px at zoom 15, invisible at 11-14
DECIMALS = 6  # ~0.1 m
WARSAW_BBOX = (20.85, 52.09, 21.28, 52.37)  # lon_min, lat_min, lon_max, lat_max

NS = {
    "gml": "http://www.opengis.net/gml",
    "ns": "http://fdo.osgeo.org/schemas/feature/ns92528565",
}
TO_WGS84 = Transformer.from_crs("EPSG:2178", "EPSG:4326", always_xy=True)


def slugify(text: str) -> str:
    text = text.replace("ł", "l").replace("Ł", "L")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def parse_ring(pos_list: str) -> list[tuple[float, float]]:
    nums = [float(v) for v in pos_list.split()]
    # MapGuide emits easting (~7.5e6) first, northing (~5.8e6) second
    return list(zip(nums[0::2], nums[1::2]))


def parse_shape(elem: ET.Element) -> Polygon | MultiPolygon:
    polygons = []
    for patch in elem.iterfind(".//gml:PolygonPatch", NS):
        exterior = patch.find("gml:exterior//gml:posList", NS)
        interiors = patch.findall("gml:interior//gml:posList", NS)
        polygons.append(
            Polygon(parse_ring(exterior.text), [parse_ring(i.text) for i in interiors])
        )
    geom = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
    return shapely.make_valid(geom) if not geom.is_valid else geom


def to_wgs84(geom):
    return shapely.transform(geom, lambda x, y: TO_WGS84.transform(x, y), interleaved=False)


def round_coords(geom):
    return shapely.set_precision(geom, 10 ** -DECIMALS)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--gml", type=Path, help="use a local GML dump instead of the WFS")
    args = ap.parse_args()

    if args.gml:
        raw = args.gml.read_bytes()
    else:
        with urllib.request.urlopen(WFS_URL, timeout=180) as resp:
            raw = resp.read()
    root = ET.fromstring(raw)

    records = []
    for member in root.iterfind(".//ns:MSI", NS):
        name = member.findtext("ns:NAZWA", default="", namespaces=NS).strip()
        district = member.findtext("ns:DZIELNICA", default="", namespaces=NS).strip()
        geom = parse_shape(member.find("ns:SHAPE", NS))
        aktualnosc = member.findtext("ns:AKTUALNOSC", default="", namespaces=NS).strip()
        records.append({"name": name, "district": district, "geom": geom, "akt": aktualnosc})

    # Topology-aware simplification: shared borders stay shared (no gaps/overlaps).
    simplified = shapely.coverage_simplify(
        [r["geom"] for r in records], tolerance=SIMPLIFY_M
    )

    # District check / fill via spatial join with official district polygons.
    dist_shapes = {}
    if DISTRICTS.exists():
        for f in json.loads(DISTRICTS.read_text())["features"]:
            dist_shapes[f["properties"].get("district") or f["id"]] = shape(f["geometry"])

    slugs: dict[str, int] = {}
    features = []
    for rec, geom in zip(records, simplified):
        wgs = round_coords(to_wgs84(geom))
        if dist_shapes:
            rp = to_wgs84(rec["geom"]).representative_point()
            joined = next((n for n, s in dist_shapes.items() if s.contains(rp)), None)
            if not rec["district"]:
                rec["district"] = joined or ""
            elif joined and joined != rec["district"]:
                print(f"WARN district mismatch {rec['name']}: {rec['district']} vs {joined}")
        slug = slugify(rec["name"])
        if slug in slugs:
            slug = f"{slug}-{slugify(rec['district'])}"
        slugs[slug] = 1
        features.append(
            {
                "type": "Feature",
                "id": slug,
                "properties": {
                    "id": slug,
                    "name": rec["name"],
                    "district": rec["district"],
                    "area_km2": round(rec["geom"].area / 1e6, 3),
                },
                "geometry": mapping(wgs),
            }
        )
    features.sort(key=lambda f: (f["properties"]["district"], f["properties"]["name"]))

    # Validation
    assert len({f["id"] for f in features}) == len(features), "duplicate ids"
    minx, miny, maxx, maxy = WARSAW_BBOX
    for f in features:
        g = shape(f["geometry"])
        assert not g.is_empty, f"empty geometry: {f['id']}"
        assert g.is_valid, f"invalid geometry: {f['id']}"
        bx = g.bounds
        assert bx[0] >= minx and bx[1] >= miny and bx[2] <= maxx and bx[3] <= maxy, f["id"]
    if dist_shapes:
        city = unary_union(list(dist_shapes.values()))
        cover = unary_union([shape(f["geometry"]) for f in features])
        print(f"coverage of city area: {cover.intersection(city).area / city.area:.4%}")

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "m.st. Warszawa WFS MSI (obszary Miejskiego Systemu Informacji)",
            "url": WFS_URL,
            "license": "Ponowne wykorzystanie bezpłatne; podać źródło: Urząd m.st. Warszawy",
            "aktualnosc": sorted({r["akt"] for r in records if r["akt"]}),
            "simplify_m": SIMPLIFY_M,
        },
        "features": features,
    }
    text = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    for path in OUTPUTS:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        print(f"wrote {path.relative_to(REPO)}: {len(features)} features, {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
