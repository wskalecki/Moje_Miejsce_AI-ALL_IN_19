#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["pyproj>=3.6", "shapely>=2.0"]
# ///
"""Fetch official Warsaw district boundaries and save them as WGS84 GeoJSON.

Source: m.st. Warszawa WFS, layer GRANICE_DZIELNIC (EPSG:2178, GML 3).
Output: data/boundaries/warszawa_dzielnice.geojson (used by generate_grid.py
to flag `in_warsaw` and assign `district` to each cell).

Run: uv run data/scripts/fetch_district_boundaries.py
"""

from __future__ import annotations

import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

from pyproj import Transformer
from shapely.geometry import MultiPolygon, Polygon, mapping
from shapely.ops import unary_union

WFS_URL = (
    "https://wfs.um.warszawa.pl/serwis?service=WFS&version=1.1.0"
    "&request=GetFeature&typeName=ns92528565:GRANICE_DZIELNIC"
)
OUTPUT = Path(__file__).resolve().parents[1] / "boundaries" / "warszawa_dzielnice.geojson"
SIMPLIFY_DEG = 0.00005  # ~5 m — keeps the file small without visible change at city zoom

NS = {
    "gml": "http://www.opengis.net/gml",
    "wfs": "http://www.opengis.net/wfs",
    "ns": "http://fdo.osgeo.org/schemas/feature/ns92528565",
}
TO_WGS84 = Transformer.from_crs("EPSG:2178", "EPSG:4326", always_xy=True)


def parse_ring(pos_list: str) -> list[tuple[float, float]]:
    nums = [float(v) for v in pos_list.split()]
    # MapGuide emits easting (~7.5e6) first, northing (~5.8e6) second
    return [TO_WGS84.transform(x, y) for x, y in zip(nums[0::2], nums[1::2])]


def parse_shape(shape: ET.Element) -> MultiPolygon:
    polygons = []
    for patch in shape.iterfind(".//gml:PolygonPatch", NS):
        exterior = patch.find("gml:exterior//gml:posList", NS)
        interiors = patch.findall("gml:interior//gml:posList", NS)
        polygons.append(
            Polygon(parse_ring(exterior.text), [parse_ring(i.text) for i in interiors])
        )
    return MultiPolygon(polygons)


def main() -> None:
    with urllib.request.urlopen(WFS_URL, timeout=120) as resp:
        root = ET.fromstring(resp.read())

    by_district: dict[str, list] = {}
    updated: dict[str, str] = {}
    for member in root.iterfind("gml:featureMember/ns:GRANICE_DZIELNIC", NS):
        name = member.findtext("ns:DZIELNICA", namespaces=NS)
        by_district.setdefault(name, []).append(parse_shape(member.find("ns:SHAPE", NS)))
        updated[name] = member.findtext("ns:AKTU_DAN", default="", namespaces=NS)

    features = []
    for name in sorted(by_district):
        geom = unary_union(by_district[name]).simplify(SIMPLIFY_DEG, preserve_topology=True)
        features.append(
            {
                "type": "Feature",
                "id": name,
                "geometry": mapping(geom),
                "properties": {"district": name, "sourceUpdated": updated[name]},
            }
        )

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as f:
        json.dump(
            {
                "type": "FeatureCollection",
                "metadata": {
                    "source": "m.st. Warszawa WFS GRANICE_DZIELNIC",
                    "url": WFS_URL,
                    "license": "Ponowne wykorzystanie bezpłatne; podać źródło: Urząd m.st. Warszawy",
                },
                "features": features,
            },
            f,
            ensure_ascii=False,
        )
    print(f"Wrote {len(features)} districts to {OUTPUT}")


if __name__ == "__main__":
    main()
